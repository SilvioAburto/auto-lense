namespace AutoLense.Models;

public record ParsedLogData
{
    public List<LabEvent> Events { get; init; } = [];
    public List<LabEvent> Errors { get; init; } = [];
    public Dictionary<string, int> InstrumentEventCounts { get; init; } = [];
    public Dictionary<string, List<LabEvent>> ProcessGroups { get; init; } = [];
    public DateTime ParsedAt { get; init; } = DateTime.Now;
}
