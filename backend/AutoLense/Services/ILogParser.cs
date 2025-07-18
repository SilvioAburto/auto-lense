using AutoLense.Models;

namespace AutoLense.Services;

public interface ILogParser
{
    ParsedLogData ParseLogFile(string filePath);
    ParsedLogData ParseLogText(string logText);
    string ExportToJson(ParsedLogData data);
    Task ExportToJsonFileAsync(ParsedLogData data, string outputPath);
    Task GenerateReportAsync(ParsedLogData data, string outputPath);
}