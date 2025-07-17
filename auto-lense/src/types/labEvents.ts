export interface LabEvent {
    id: string;
    timestamp: Date;
    type: LabEventType;
    instrument: string;
    status: EventStatus;
    details: any;
    duration?: number; // in milliseconds
}

export type LabEventType =
    | 'liquid_transfer'
    | 'plate_reading'
    | 'incubation'
    | 'centrifugation'
    | 'temperature_change'
    | 'pump_operation'
    | 'valve_operation'
    | 'sensor_reading'
    | 'error'
    | 'system_status';

export type EventStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface LiquidTransferEvent extends LabEvent {
    type: 'liquid_transfer';
    details: {
        source: string;
        destination: string;
        volume: number;
        unit: 'μL' | 'mL' | 'L';
        tipType?: string;
        speed?: number;
        aspirationHeight?: number;
        dispenseHeight?: number;
    };
}

export interface PlateReadingEvent extends LabEvent {
    type: 'plate_reading';
    details: {
        plateId: string;
        wavelength?: number;
        readType: 'absorbance' | 'fluorescence' | 'luminescence';
        wells?: string[];
    };
}

export interface IncubationEvent extends LabEvent {
    type: 'incubation';
    details: {
        temperature: number;
        duration: number; // in minutes
        plateId?: string;
        humidity?: number;
    };
}

export interface CentrifugationEvent extends LabEvent {
    type: 'centrifugation';
    details: {
        speed: number; // RPM
        duration: number; // in minutes
        temperature?: number;
        plateId?: string;
    };
}

export interface TemperatureChangeEvent extends LabEvent {
    type: 'temperature_change';
    details: {
        targetTemperature: number;
        currentTemperature: number;
        location: string;
        duration?: number;
    };
}

export interface PumpOperationEvent extends LabEvent {
    type: 'pump_operation';
    details: {
        pumpId: string;
        flowRate: number;
        direction: 'forward' | 'reverse';
        duration: number;
        pressure?: number;
    };
}

export interface ValveOperationEvent extends LabEvent {
    type: 'valve_operation';
    details: {
        valveId: string;
        position: string;
        previousPosition?: string;
    };
}

export interface SensorReadingEvent extends LabEvent {
    type: 'sensor_reading';
    details: {
        sensorId: string;
        value: number;
        unit: string;
        location?: string;
    };
}

export interface ErrorEvent extends LabEvent {
    type: 'error';
    details: {
        errorCode: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        component?: string;
    };
}

export interface SystemStatusEvent extends LabEvent {
    type: 'system_status';
    details: {
        status: 'online' | 'offline' | 'maintenance' | 'error';
        message?: string;
        uptime?: number;
    };
}

export type ParsedLabEvent =
    | LiquidTransferEvent
    | PlateReadingEvent
    | IncubationEvent
    | CentrifugationEvent
    | TemperatureChangeEvent
    | PumpOperationEvent
    | ValveOperationEvent
    | SensorReadingEvent
    | ErrorEvent
    | SystemStatusEvent;

export interface LogFile {
    id: string;
    name: string;
    path: string;
    size: number;
    lastModified: Date;
    events: ParsedLabEvent[];
}

export interface Instrument {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastSeen: Date;
    events: ParsedLabEvent[];
} 