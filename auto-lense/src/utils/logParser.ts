import { ParsedLabEvent, LiquidTransferEvent, LabEventType, EventStatus } from '../types/labEvents';

export class LogParser {
    private static eventPatterns = {
        liquidTransfer: /transfer.*?(\d+(?:\.\d+)?)\s*(μL|mL|L).*?from\s+(.+?)\s+to\s+(.+?)/i,
        plateReading: /plate.*?read.*?(\d+)\s*nm/i,
        incubation: /incubate.*?(\d+(?:\.\d+)?)\s*°C.*?(\d+)\s*min/i,
        centrifugation: /centrifuge.*?(\d+)\s*rpm.*?(\d+)\s*min/i,
        temperatureChange: /temperature.*?(\d+(?:\.\d+)?)\s*°C/i,
        pumpOperation: /pump.*?(\d+(?:\.\d+)?)\s*(mL\/min|L\/min).*?(\w+)/i,
        valveOperation: /valve.*?(\w+).*?position.*?(\w+)/i,
        sensorReading: /sensor.*?(\w+).*?(\d+(?:\.\d+)?)\s*(\w+)/i,
        error: /error.*?(\w+).*?(\w+)/i,
        systemStatus: /system.*?(online|offline|maintenance|error)/i,
    };

    static parseLogLine(line: string, timestamp: Date, instrument: string): ParsedLabEvent | null {
        const trimmedLine = line.trim();

        // Try to match liquid transfer events
        const liquidMatch = trimmedLine.match(this.eventPatterns.liquidTransfer);
        if (liquidMatch) {
            return this.createLiquidTransferEvent(liquidMatch, timestamp, instrument);
        }

        // Try to match plate reading events
        const plateMatch = trimmedLine.match(this.eventPatterns.plateReading);
        if (plateMatch) {
            return this.createPlateReadingEvent(plateMatch, timestamp, instrument);
        }

        // Try to match incubation events
        const incubateMatch = trimmedLine.match(this.eventPatterns.incubation);
        if (incubateMatch) {
            return this.createIncubationEvent(incubateMatch, timestamp, instrument);
        }

        // Try to match centrifugation events
        const centrifugeMatch = trimmedLine.match(this.eventPatterns.centrifugation);
        if (centrifugeMatch) {
            return this.createCentrifugationEvent(centrifugeMatch, timestamp, instrument);
        }

        // Try to match temperature change events
        const tempMatch = trimmedLine.match(this.eventPatterns.temperatureChange);
        if (tempMatch) {
            return this.createTemperatureChangeEvent(tempMatch, timestamp, instrument);
        }

        // Try to match pump operation events
        const pumpMatch = trimmedLine.match(this.eventPatterns.pumpOperation);
        if (pumpMatch) {
            return this.createPumpOperationEvent(pumpMatch, timestamp, instrument);
        }

        // Try to match valve operation events
        const valveMatch = trimmedLine.match(this.eventPatterns.valveOperation);
        if (valveMatch) {
            return this.createValveOperationEvent(valveMatch, timestamp, instrument);
        }

        // Try to match sensor reading events
        const sensorMatch = trimmedLine.match(this.eventPatterns.sensorReading);
        if (sensorMatch) {
            return this.createSensorReadingEvent(sensorMatch, timestamp, instrument);
        }

        // Try to match error events
        const errorMatch = trimmedLine.match(this.eventPatterns.error);
        if (errorMatch) {
            return this.createErrorEvent(errorMatch, timestamp, instrument);
        }

        // Try to match system status events
        const statusMatch = trimmedLine.match(this.eventPatterns.systemStatus);
        if (statusMatch) {
            return this.createSystemStatusEvent(statusMatch, timestamp, instrument);
        }

        return null;
    }

    private static createLiquidTransferEvent(match: RegExpMatchArray, timestamp: Date, instrument: string): LiquidTransferEvent {
        return {
            id: this.generateId(),
            timestamp,
            type: 'liquid_transfer',
            instrument,
            status: 'completed',
            details: {
                volume: parseFloat(match[1]),
                unit: match[2] as 'μL' | 'mL' | 'L',
                source: match[3].trim(),
                destination: match[4].trim(),
            }
        };
    }

    private static createPlateReadingEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'plate_reading',
            instrument,
            status: 'completed',
            details: {
                wavelength: parseInt(match[1]),
                readType: 'absorbance',
                plateId: 'Unknown',
            }
        };
    }

    private static createIncubationEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'incubation',
            instrument,
            status: 'completed',
            details: {
                temperature: parseFloat(match[1]),
                duration: parseInt(match[2]),
            }
        };
    }

    private static createCentrifugationEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'centrifugation',
            instrument,
            status: 'completed',
            details: {
                speed: parseInt(match[1]),
                duration: parseInt(match[2]),
            }
        };
    }

    private static createTemperatureChangeEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'temperature_change',
            instrument,
            status: 'completed',
            details: {
                targetTemperature: parseFloat(match[1]),
                currentTemperature: parseFloat(match[1]),
                location: 'Unknown',
            }
        };
    }

    private static createPumpOperationEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'pump_operation',
            instrument,
            status: 'completed',
            details: {
                pumpId: 'Unknown',
                flowRate: parseFloat(match[1]),
                direction: match[3] as 'forward' | 'reverse',
                duration: 0,
            }
        };
    }

    private static createValveOperationEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'valve_operation',
            instrument,
            status: 'completed',
            details: {
                valveId: match[1],
                position: match[2],
            }
        };
    }

    private static createSensorReadingEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'sensor_reading',
            instrument,
            status: 'completed',
            details: {
                sensorId: match[1],
                value: parseFloat(match[2]),
                unit: match[3],
            }
        };
    }

    private static createErrorEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'error',
            instrument,
            status: 'failed',
            details: {
                errorCode: match[1],
                message: match[2],
                severity: 'medium' as const,
            }
        };
    }

    private static createSystemStatusEvent(match: RegExpMatchArray, timestamp: Date, instrument: string) {
        return {
            id: this.generateId(),
            timestamp,
            type: 'system_status',
            instrument,
            status: 'completed',
            details: {
                status: match[1] as 'online' | 'offline' | 'maintenance' | 'error',
            }
        };
    }

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    static parseTimestamp(line: string): Date | null {
        // Common timestamp patterns
        const patterns = [
            /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
            /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
            /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/,
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return new Date(match[1]);
            }
        }

        return null;
    }

    static extractInstrumentName(line: string): string {
        // Try to extract instrument name from common patterns
        const patterns = [
            /instrument[:\s]+([^\s,]+)/i,
            /device[:\s]+([^\s,]+)/i,
            /machine[:\s]+([^\s,]+)/i,
            /([A-Z]{2,}\d+)/, // Common instrument naming like LH200, PCR01, etc.
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return 'Unknown Instrument';
    }
} 