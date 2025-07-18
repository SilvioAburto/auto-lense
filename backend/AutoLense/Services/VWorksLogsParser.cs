using System.Text.Json;
using System.Text.Json.Serialization;
using AutoLense.Models;

namespace AutoLense.Services;

public class VWorksLogParser : ILogParser
{
    private readonly JsonSerializerOptions _jsonOptions;

    public VWorksLogParser()
    {
        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonStringEnumConverter() }
        };
    }

    public ParsedLogData ParseLogFile(string filePath)
    {
        ArgumentException.ThrowIfNullOrEmpty(filePath);

        if (!File.Exists(filePath))
            throw new FileNotFoundException($"Log file not found: {filePath}");

        var lines = File.ReadAllLines(filePath);
        return ParseLogLines(lines);
    }

    public ParsedLogData ParseLogText(string logText)
    {
        ArgumentException.ThrowIfNullOrEmpty(logText);

        var lines = logText.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        return ParseLogLines(lines);
    }

    private ParsedLogData ParseLogLines(string[] lines)
    {
        var events = new List<LabEvent>();
        var errors = new List<LabEvent>();
        var instrumentCounts = new Dictionary<string, int>();
        var processGroups = new Dictionary<string, List<LabEvent>>();

        foreach (var line in lines.Where(l => !string.IsNullOrWhiteSpace(l)))
        {
            try
            {
                var labEvent = ParseLogLine(line);
                if (labEvent is null) continue;

                events.Add(labEvent);

                // Categorize errors
                if (labEvent.IsError || labEvent.Type == EventType.Error)
                {
                    errors.Add(labEvent);
                }

                // Count instrument events
                if (!string.IsNullOrEmpty(labEvent.Instrument))
                {
                    instrumentCounts[labEvent.Instrument] = instrumentCounts.GetValueOrDefault(labEvent.Instrument, 0) + 1;
                }

                // Group by process
                if (!string.IsNullOrEmpty(labEvent.Process))
                {
                    if (!processGroups.ContainsKey(labEvent.Process))
                        processGroups[labEvent.Process] = [];
                    processGroups[labEvent.Process].Add(labEvent);
                }
            }
            catch (Exception ex)
            {
                // Create an error event for parsing failures
                errors.Add(new LabEvent
                {
                    Timestamp = DateTime.Now,
                    Type = EventType.Error,
                    Category = EventCategory.Error,
                    Description = $"Failed to parse log line: {ex.Message}",
                    RawLogLine = line,
                    IsError = true
                });
            }
        }

        return new ParsedLogData
        {
            Events = events,
            Errors = errors,
            InstrumentEventCounts = instrumentCounts,
            ProcessGroups = processGroups
        };
    }

    private LabEvent? ParseLogLine(string line)
    {
        // Split by tabs (VWorks appears to use tab-delimited format)
        var fields = line.Split('\t');

        if (fields.Length < 3) return null;

        var timestamp = DateTime.TryParse(fields[0], out var parsedTimestamp) ? parsedTimestamp : DateTime.MinValue;
        var eventType = Enum.TryParse<EventType>(fields[1], true, out var parsedEventType) ? parsedEventType : EventType.Event;

        var instrument = fields.Length > 2 ? fields[2]?.Trim() ?? string.Empty : string.Empty;
        var location = fields.Length > 3 ? fields[3]?.Trim() ?? string.Empty : string.Empty;
        var process = fields.Length > 4 ? fields[4]?.Trim() ?? string.Empty : string.Empty;
        var step = fields.Length > 5 && int.TryParse(fields[5], out var parsedStep) ? parsedStep : 0;
        var description = fields.Length > 6 ? fields[6]?.Trim() ?? string.Empty : string.Empty;
        var protocol = fields.Length > 7 ? fields[7]?.Trim() ?? string.Empty : string.Empty;
        var filePath = fields.Length > 8 ? fields[8]?.Trim() ?? string.Empty : string.Empty;
        var processId = fields.Length > 9 && int.TryParse(fields[9], out var parsedProcessId) ? parsedProcessId : 0;

        var isCompleted = description.StartsWith("Completed:", StringComparison.OrdinalIgnoreCase);
        var isError = IsErrorEvent(eventType, description);

        var labEvent = new LabEvent
        {
            Timestamp = timestamp,
            Type = eventType,
            Instrument = instrument,
            Location = location,
            Process = process,
            Step = step,
            Description = description,
            Protocol = protocol,
            FilePath = filePath,
            ProcessId = processId,
            IsCompleted = isCompleted,
            IsError = isError,
            RawLogLine = line,
            Category = DetermineEventCategory(eventType, instrument, description, isError)
        };

        return labEvent;
    }

    private static EventCategory DetermineEventCategory(EventType eventType, string instrument, string description, bool isError)
    {
        var descriptionLower = description.ToLowerInvariant();
        var instrumentLower = instrument.ToLowerInvariant();

        return (eventType, isError, descriptionLower, instrumentLower) switch
        {
            (EventType.Error, _, _, _) or (_, true, _, _) => EventCategory.Error,
            (EventType.Script, _, _, _) => EventCategory.Script,
            (_, _, var desc, _) when desc.Contains("move") || desc.Contains("finished moving") => EventCategory.PlateMovement,
            (_, _, var desc, _) when desc.Contains("barcode") || desc.Contains("scan") => EventCategory.Barcode,
            (_, _, var desc, _) when desc.Contains("process starting") || desc.Contains("process finishing") => EventCategory.ProcessControl,
            (_, _, _, var inst) when !string.IsNullOrEmpty(inst) => EventCategory.InstrumentOperation,
            _ => EventCategory.Unknown
        };
    }

    private static bool IsErrorEvent(EventType eventType, string description)
    {
        if (eventType == EventType.Error) return true;

        var descriptionLower = description.ToLowerInvariant();

        return descriptionLower.Contains("error") ||
               descriptionLower.Contains("failed") ||
               descriptionLower.Contains("exception") ||
               descriptionLower.Contains("stack is empty") ||
               descriptionLower.Contains("timeout");
    }

    public string ExportToJson(ParsedLogData data)
    {
        ArgumentNullException.ThrowIfNull(data);
        return JsonSerializer.Serialize(data, _jsonOptions);
    }

    public async Task ExportToJsonFileAsync(ParsedLogData data, string outputPath)
    {
        ArgumentNullException.ThrowIfNull(data);
        ArgumentException.ThrowIfNullOrEmpty(outputPath);

        var json = ExportToJson(data);
        await File.WriteAllTextAsync(outputPath, json);
    }

    public async Task GenerateReportAsync(ParsedLogData data, string outputPath)
    {
        ArgumentNullException.ThrowIfNull(data);
        ArgumentException.ThrowIfNullOrEmpty(outputPath);

        await using var writer = new StreamWriter(outputPath);

        await writer.WriteLineAsync("VWorks Lab Automation Log Analysis Report");
        await writer.WriteLineAsync("=" + new string('=', 50));
        await writer.WriteLineAsync($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        await writer.WriteLineAsync($"Total Events: {data.Events.Count}");
        await writer.WriteLineAsync($"Total Errors: {data.Errors.Count}");
        await writer.WriteLineAsync();

        // Error Summary
        if (data.Errors.Count != 0)
        {
            await writer.WriteLineAsync("ERROR SUMMARY:");
            await writer.WriteLineAsync("-" + new string('-', 30));
            foreach (var error in data.Errors)
            {
                await writer.WriteLineAsync($"[{error.Timestamp:HH:mm:ss}] {error.Instrument} - {error.Description}");
            }
            await writer.WriteLineAsync();
        }

        // Instrument Activity
        await writer.WriteLineAsync("INSTRUMENT ACTIVITY:");
        await writer.WriteLineAsync("-" + new string('-', 30));
        foreach (var (instrument, count) in data.InstrumentEventCounts.OrderByDescending(x => x.Value))
        {
            await writer.WriteLineAsync($"{instrument}: {count} events");
        }
        await writer.WriteLineAsync();

        // Process Summary
        await writer.WriteLineAsync("PROCESS SUMMARY:");
        await writer.WriteLineAsync("-" + new string('-', 30));
        foreach (var (processName, processEvents) in data.ProcessGroups)
        {
            var startTime = processEvents.Min(e => e.Timestamp);
            var endTime = processEvents.Max(e => e.Timestamp);
            var duration = endTime - startTime;

            await writer.WriteLineAsync($"Process: {processName}");
            await writer.WriteLineAsync($"  Duration: {duration.TotalMinutes:F1} minutes");
            await writer.WriteLineAsync($"  Events: {processEvents.Count}");
            await writer.WriteLineAsync($"  Errors: {processEvents.Count(e => e.IsError)}");
            await writer.WriteLineAsync();
        }
    }
}
