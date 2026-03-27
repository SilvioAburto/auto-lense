using AutoLense.Models;
using AutoLense.Services;
using System.Text.Json;

namespace AutoLense;

public class Program
{
    public static async Task Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: AutoLense <command> [options]");
            Console.WriteLine("Commands:");
            Console.WriteLine("  parse-logs <folder_path> <start_date> <end_date> - Parse logs from folder with date range");
            Console.WriteLine("  parse-single <file_path> - Parse a single log file");
            Console.WriteLine("Example:");
            Console.WriteLine("  AutoLense parse-logs \"C:\\VWorks Workspace\\VWorks\\Logs\" \"03/01/2020\" \"03/31/2020\"");
            return;
        }

        var command = args[0].ToLower();
        var parser = new VWorksLogParser();

        try
        {
            switch (command)
            {
                case "parse-logs":
                    if (args.Length < 4)
                    {
                        Console.WriteLine("Error: parse-logs requires folder_path, start_date, and end_date");
                        return;
                    }
                    await ParseLogsFromFolder(parser, args[1], args[2], args[3]);
                    break;

                case "parse-single":
                    if (args.Length < 2)
                    {
                        Console.WriteLine("Error: parse-single requires file_path");
                        return;
                    }
                    await ParseSingleFile(parser, args[1]);
                    break;

                default:
                    Console.WriteLine($"Unknown command: {command}");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }

    private static async Task ParseLogsFromFolder(VWorksLogParser parser, string folderPath, string startDateStr, string endDateStr)
    {
        if (!Directory.Exists(folderPath))
        {
            throw new DirectoryNotFoundException($"Log folder not found: {folderPath}");
        }

        if (!DateTime.TryParse(startDateStr, out var startDate))
        {
            throw new ArgumentException($"Invalid start date format: {startDateStr}. Use MM/DD/YYYY");
        }

        if (!DateTime.TryParse(endDateStr, out var endDate))
        {
            throw new ArgumentException($"Invalid end date format: {endDateStr}. Use MM/DD/YYYY");
        }

        var logFiles = Directory.GetFiles(folderPath, "*.log")
            .OrderByDescending(f => File.GetCreationTime(f))
            .ToList();

        var allEvents = new List<LabEvent>();
        var allErrors = new List<LabEvent>();
        var allInstrumentCounts = new Dictionary<string, int>();
        var allProcessGroups = new Dictionary<string, List<LabEvent>>();

        var filesProcessed = 0;
        var filesSkipped = 0;

        foreach (var logFile in logFiles)
        {
            var fileCreationTime = File.GetCreationTime(logFile);
            
            // Check if file creation date is within range
            if (fileCreationTime.Date < startDate.Date || fileCreationTime.Date > endDate.Date)
            {
                filesSkipped++;
                continue;
            }

            // Also check the first few lines of the file for timestamps
            var shouldProcessFile = false;
            try
            {
                var firstLines = File.ReadLines(logFile).Take(10);
                foreach (var line in firstLines)
                {
                    if (DateTime.TryParse(line.Split('\t').FirstOrDefault(), out var lineDate))
                    {
                        if (lineDate.Date >= startDate.Date && lineDate.Date <= endDate.Date)
                        {
                            shouldProcessFile = true;
                            break;
                        }
                    }
                }
            }
            catch
            {
                // If we can't read the file, skip it
                filesSkipped++;
                continue;
            }

            if (!shouldProcessFile)
            {
                filesSkipped++;
                continue;
            }

            try
            {
                var data = parser.ParseLogFile(logFile);
                
                // Filter events by date range
                var filteredEvents = data.Events.Where(e => e.Timestamp.Date >= startDate.Date && e.Timestamp.Date <= endDate.Date).ToList();
                var filteredErrors = data.Errors.Where(e => e.Timestamp.Date >= startDate.Date && e.Timestamp.Date <= endDate.Date).ToList();

                allEvents.AddRange(filteredEvents);
                allErrors.AddRange(filteredErrors);

                // Merge instrument counts
                foreach (var (instrument, count) in data.InstrumentEventCounts)
                {
                    allInstrumentCounts[instrument] = allInstrumentCounts.GetValueOrDefault(instrument, 0) + count;
                }

                // Merge process groups
                foreach (var (process, events) in data.ProcessGroups)
                {
                    var filteredProcessEvents = events.Where(e => e.Timestamp.Date >= startDate.Date && e.Timestamp.Date <= endDate.Date).ToList();
                    if (filteredProcessEvents.Any())
                    {
                        if (!allProcessGroups.ContainsKey(process))
                            allProcessGroups[process] = new List<LabEvent>();
                        allProcessGroups[process].AddRange(filteredProcessEvents);
                    }
                }

                filesProcessed++;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Failed to parse {logFile}: {ex.Message}");
                filesSkipped++;
            }
        }

        var combinedData = new ParsedLogData
        {
            Events = allEvents,
            Errors = allErrors,
            InstrumentEventCounts = allInstrumentCounts,
            ProcessGroups = allProcessGroups
        };

        // Output JSON to stdout for Tauri consumption
        var json = parser.ExportToJson(combinedData);
        Console.WriteLine(json);

        // Also write to files for debugging
        await parser.ExportToJsonFileAsync(combinedData, "parsed_lab_logs.json");
        await parser.GenerateReportAsync(combinedData, "lab_analysis_report.txt");

        Console.Error.WriteLine($"Processed {filesProcessed} files, skipped {filesSkipped} files");
        Console.Error.WriteLine($"Found {allEvents.Count} events, {allErrors.Count} errors");
    }

    private static async Task ParseSingleFile(VWorksLogParser parser, string filePath)
    {
        var data = parser.ParseLogFile(filePath);
        
        // Output JSON to stdout for Tauri consumption
        var json = parser.ExportToJson(data);
        Console.WriteLine(json);

        // Also write to files for debugging
        await parser.ExportToJsonFileAsync(data, "parsed_lab_logs.json");
        await parser.GenerateReportAsync(data, "lab_analysis_report.txt");

        Console.Error.WriteLine($"Successfully parsed {data.Events.Count} events");
        Console.Error.WriteLine($"Found {data.Errors.Count} errors");
    }
}