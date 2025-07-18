using AutoLense.Models;
using AutoLense.Services;

var parser = new VWorksLogParser();

try
{
    // Example: Parse from file
    var data = parser.ParseLogFile("C:\\VWorks Workspace\\VWorks\\Logs\\vworks_log(3_31_2020 3_28_34 PM).log");

    // var data = parser.ParseLogText(sampleLog);

    // Export to JSON for GUI consumption
    await parser.ExportToJsonFileAsync(data, "parsed_lab_logs.json");

    // Generate human-readable report
    await parser.GenerateReportAsync(data, "lab_analysis_report.txt");

    Console.WriteLine($"Successfully parsed {data.Events.Count} events");
    Console.WriteLine($"Found {data.Errors.Count} errors");
    Console.WriteLine($"Processed {data.InstrumentEventCounts.Count} different instruments");

    // Display sample events
    Console.WriteLine("\nSample events:");
    foreach (var evt in data.Events.Take(5))
    {
        Console.WriteLine($"[{evt.Timestamp:HH:mm:ss}] {evt.Category} - {evt.Instrument}: {evt.Description}");
    }

    if (data.Errors.Count != 0)
    {
        Console.WriteLine("\nErrors found:");
        foreach (var error in data.Errors)
        {
            Console.WriteLine($"[{error.Timestamp:HH:mm:ss}] ERROR: {error.Description}");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error processing logs: {ex.Message}");
}