import { VWorksEvent, VWorksProcessingEvent } from '../types/events';

export interface VWorksLogEntry {
    timestamp: string;
    level: string;
    device?: string;
    location?: string;
    process?: string;
    task?: string;
    description: string;
    protocol?: string;
    file?: string;
    session?: string;
}

export function parseVWorksLog(content: string): VWorksEvent[] {
    console.log('VWorksParser: Starting to parse log content');
    console.log('VWorksParser: Content length:', content.length);

    const lines = content.split('\n').filter(line => line.trim());
    console.log('VWorksParser: Total lines after filtering:', lines.length);

    const events: VWorksEvent[] = [];
    let sessionId = '1';
    let parsedCount = 0;
    let relevantCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        try {
            const parsed = parseVWorksLogLine(line);
            if (parsed) {
                parsedCount++;
                const event = createVWorksEvent(parsed, sessionId);
                if (event && isRelevantEvent(event)) {
                    events.push(event);
                    relevantCount++;
                }
                // Update session ID if found
                if (parsed.session) {
                    sessionId = parsed.session;
                }
            }
        } catch (error) {
            console.warn(`VWorksParser: Failed to parse line ${i + 1}:`, line, error);
        }
    }

    console.log(`VWorksParser: Parsing complete. Parsed: ${parsedCount}, Relevant: ${relevantCount}, Total events: ${events.length}`);

    // Log first few events for debugging
    if (events.length > 0) {
        console.log('VWorksParser: First 3 events:', events.slice(0, 3));
    }

    return events;
}

function parseVWorksLogLine(line: string): VWorksLogEntry | null {
    // VWorks log format: Timestamp | Level | Device | Location | Process | Task | Description | Protocol | File | Session
    const parts = line.split('\t');

    if (parts.length < 6) {
        console.log('VWorksParser: Line has insufficient parts:', parts.length, 'Line:', line.substring(0, 100));
        return null;
    }

    const [timestamp, level, device, location, process, task, description, protocol, file, session] = parts;

    const entry = {
        timestamp: timestamp.trim(),
        level: level.trim(),
        device: device?.trim() || undefined,
        location: location?.trim() || undefined,
        process: process?.trim() || undefined,
        task: task?.trim() || undefined,
        description: description?.trim() || '',
        protocol: protocol?.trim() || undefined,
        file: file?.trim() || undefined,
        session: session?.trim() || undefined,
    };

    console.log('VWorksParser: Parsed entry:', entry);
    return entry;
}

function createVWorksEvent(entry: VWorksLogEntry, sessionId: string): VWorksEvent | null {
    const timestamp = parseVWorksTimestamp(entry.timestamp);
    if (!timestamp) {
        console.log('VWorksParser: Failed to parse timestamp:', entry.timestamp);
        return null;
    }

    const event: VWorksEvent = {
        id: generateEventId(),
        timestamp,
        type: 'vworks',
        level: entry.level as any,
        device: entry.device,
        location: entry.location,
        process: entry.process,
        task: entry.task,
        description: entry.description,
        protocol: entry.protocol,
        file: entry.file,
        session: entry.session || sessionId,
        category: determineCategory(entry),
        subcategory: determineSubcategory(entry),
        severity: determineSeverity(entry.level),
        source: 'VWorks',
        message: entry.description,
        elapsedTime: extractElapsedTime(entry.description),
        volume: extractVolume(entry.description),
        sourceLocation: extractSourceLocation(entry.description),
        destinationLocation: extractDestinationLocation(entry.description),
        operation: determineOperation(entry.description),
    };

    console.log('VWorksParser: Created event:', {
        id: event.id,
        timestamp: event.timestamp,
        description: event.description,
        operation: event.operation,
        category: event.category,
        subcategory: event.subcategory
    });

    return event;
}

function parseVWorksTimestamp(timestamp: string): Date | null {
    // VWorks format: "3/31/2020 3:28:35 PM"
    try {
        const parsed = new Date(timestamp);
        if (isNaN(parsed.getTime())) {
            console.log('VWorksParser: Invalid timestamp:', timestamp);
            return null;
        }
        return parsed;
    } catch (error) {
        console.log('VWorksParser: Error parsing timestamp:', timestamp, error);
        return null;
    }
}

function generateEventId(): string {
    return `vworks_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function determineCategory(entry: VWorksLogEntry): string {
    const desc = entry.description.toLowerCase();

    if (desc.includes('protocol') || desc.includes('process') || desc.includes('scheduler')) {
        return 'processing';
    }
    if (desc.includes('error') || desc.includes('warning')) {
        return 'system';
    }
    if (desc.includes('read') || desc.includes('scan') || desc.includes('measure')) {
        return 'analysis';
    }

    return 'processing';
}

function determineSubcategory(entry: VWorksLogEntry): string {
    const desc = entry.description.toLowerCase();

    if (desc.includes('aspirate') || desc.includes('dispense') || desc.includes('mix')) {
        return 'liquid_handling';
    }
    if (desc.includes('move plate') || desc.includes('place plate') || desc.includes('downstack') || desc.includes('upstack')) {
        return 'plate_movement';
    }
    if (desc.includes('clamp') || desc.includes('shake') || desc.includes('centrifuge') || desc.includes('seal') || desc.includes('peel')) {
        return 'device_operation';
    }
    if (desc.includes('read') || desc.includes('scan')) {
        return 'measurement';
    }
    if (desc.includes('protocol') || desc.includes('process') || desc.includes('scheduler')) {
        return 'protocol_control';
    }

    return 'device_operation';
}

function determineSeverity(level: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (level.toLowerCase()) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'script':
            return 'info';
        default:
            return 'info';
    }
}

function extractElapsedTime(description: string): string | undefined {
    const match = description.match(/After (\d+ minutes? \d+ seconds?)/);
    return match ? match[1] : undefined;
}

function extractVolume(description: string): string | undefined {
    const match = description.match(/(\d+(?:\.\d+)?)\s*(?:μL|uL|ul|mL|ml)/i);
    return match ? match[0] : undefined;
}

function extractSourceLocation(description: string): string | undefined {
    const moveMatch = description.match(/from ([^,]+)/);
    const aspirateMatch = description.match(/from ([^,]+)/);
    return moveMatch ? moveMatch[1].trim() : aspirateMatch ? aspirateMatch[1].trim() : undefined;
}

function extractDestinationLocation(description: string): string | undefined {
    const moveMatch = description.match(/to ([^,]+)/);
    const dispenseMatch = description.match(/to ([^,]+)/);
    return moveMatch ? moveMatch[1].trim() : dispenseMatch ? dispenseMatch[1].trim() : undefined;
}

function determineOperation(description: string): VWorksEvent['operation'] {
    const desc = description.toLowerCase();

    if (desc.includes('aspirate')) return 'aspirate';
    if (desc.includes('dispense')) return 'dispense';
    if (desc.includes('mix')) return 'mix';
    if (desc.includes('move plate')) return 'move';
    if (desc.includes('place plate')) return 'place';
    if (desc.includes('seal')) return 'seal';
    if (desc.includes('peel')) return 'peel';
    if (desc.includes('clamp')) return 'clamp';
    if (desc.includes('shake')) return 'shake';
    if (desc.includes('centrifuge')) return 'centrifuge';
    if (desc.includes('read')) return 'read';
    if (desc.includes('scan')) return 'scan';

    return undefined;
}

function isRelevantEvent(event: VWorksEvent): boolean {
    // Filter out non-processing events
    const irrelevantPatterns = [
        /dll loaded/i,
        /plugin loaded/i,
        /file (loaded|saved|unloaded)/i,
        /logged (in|out)/i,
        /system (startup|shutdown)/i,
        /compile complete/i,
        /diagnostics (opened|closed)/i,
        /profile changed/i,
        /changed.*parameter/i,
        /added.*task/i,
        /deleted.*task/i,
        /added.*device/i,
        /deleted.*device/i,
    ];

    const isRelevant = !irrelevantPatterns.some(pattern => pattern.test(event.description));

    if (!isRelevant) {
        console.log('VWorksParser: Filtered out irrelevant event:', event.description);
    }

    return isRelevant;
}

export function getVWorksLogFiles(): string[] {
    // This would be implemented to scan the VWorks logs directory
    // For now, return the sample file we have
    return ['vworks_log(3_31_2020 3_28_34 PM).log'];
}

export function getVWorksLogsDirectory(): string {
    return 'C:\\VWorks Workspace\\VWorks\\Logs';
} 