namespace AutoLense.Models;

public record LabEvent
{
    public DateTime Timestamp { get; init; } = DateTime.MinValue;
    public EventType Type { get; init; } = EventType.Event;
    public EventCategory Category { get; init; } = EventCategory.Unknown;
    public string Instrument { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public string Process { get; init; } = string.Empty;
    public int Step { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Protocol { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
    public int ProcessId { get; init; }
    public bool IsError { get; init; }
    public bool IsCompleted { get; init; }
    public string RawLogLine { get; init; } = string.Empty;
}