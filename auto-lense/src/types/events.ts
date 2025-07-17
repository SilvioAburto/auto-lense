export interface BaseEvent {
    id: string;
    timestamp: Date;
    type: string;
    category: string;
    subcategory: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    source: string;
    message: string;
    metadata?: Record<string, any>;
}

export interface LiquidTransferEvent extends BaseEvent {
    type: 'liquid_transfer';
    category: 'processing';
    subcategory: 'liquid_handling';
    volume: number;
    volumeUnit: string;
    source: string;
    destination: string;
    liquidType?: string;
    tipType?: string;
    aspirationSpeed?: number;
    dispenseSpeed?: number;
}

export interface PlateMovementEvent extends BaseEvent {
    type: 'plate_movement';
    category: 'processing';
    subcategory: 'plate_handling';
    plateId: string;
    sourceLocation: string;
    destinationLocation: string;
    plateType?: string;
    barcode?: string;
}

export interface DeviceOperationEvent extends BaseEvent {
    type: 'device_operation';
    category: 'processing';
    subcategory: 'device_control';
    deviceName: string;
    operation: string;
    parameters?: Record<string, any>;
    duration?: number;
    status: 'started' | 'completed' | 'failed';
}

export interface MeasurementEvent extends BaseEvent {
    type: 'measurement';
    category: 'analysis';
    subcategory: 'data_collection';
    instrument: string;
    measurementType: string;
    wavelength?: number;
    readTime?: number;
    plateId?: string;
    dataPoints?: number;
}

export interface ErrorEvent extends BaseEvent {
    type: 'error';
    category: 'system';
    subcategory: 'error_handling';
    errorCode?: string;
    errorType: string;
    component?: string;
    resolution?: string;
}

export interface VWorksEvent extends BaseEvent {
    type: 'vworks';
    level: 'Info' | 'Warning' | 'Error' | 'Event' | 'Script';
    device?: string;
    location?: string;
    process?: string;
    task?: string;
    description: string;
    protocol?: string;
    file?: string;
    session?: string;
    elapsedTime?: string;
    volume?: string;
    sourceLocation?: string;
    destinationLocation?: string;
    operation?: 'aspirate' | 'dispense' | 'mix' | 'move' | 'place' | 'seal' | 'peel' | 'clamp' | 'shake' | 'centrifuge' | 'read' | 'scan';
}

export interface VWorksProcessingEvent extends VWorksEvent {
    category: 'processing';
    subcategory: 'liquid_handling' | 'plate_movement' | 'device_operation' | 'measurement' | 'protocol_control';
}

export type LabEvent =
    | LiquidTransferEvent
    | PlateMovementEvent
    | DeviceOperationEvent
    | MeasurementEvent
    | ErrorEvent
    | VWorksEvent;

export interface EventFilter {
    type?: string;
    category?: string;
    subcategory?: string;
    severity?: string;
    source?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    search?: string;
}

export interface EventStats {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsBySource: Record<string, number>;
    eventsByHour: Record<number, number>;
    averageEventsPerHour: number;
    mostActiveHour: number;
    errorRate: number;
} 