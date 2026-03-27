import React, { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
    Settings,
    Activity,
    Zap,
    Play,
    Microscope,
    ArrowLeft,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileText,
    AudioLines,
    TrendingUp,
    Monitor,
    RefreshCw,
    Folder,
    Sun,
    Sparkles,
    Search
} from 'lucide-react';

// Types for our lab data
interface LabEvent {
    timestamp: string;
    type: 'Event' | 'Script' | 'Error' | 'Warning';
    category: 'InstrumentOperation' | 'PlateMovement' | 'ProcessControl' | 'Barcode' | 'Error' | 'Script' | 'Unknown';
    instrument: string;
    location: string;
    process: string;
    step: number;
    description: string;
    protocol: string;
    filePath: string;
    processId: number;
    isError: boolean;
    isCompleted: boolean;
    rawLogLine: string;
}

interface ParsedLogData {
    events: LabEvent[];
    errors: LabEvent[];
    warnings: LabEvent[];
    instrumentEventCounts: Record<string, number>;
    processGroups: Record<string, LabEvent[]>;
    parsedAt: string;
}

// Sample VWorks data
const sampleVWorksData: ParsedLogData = {
    events: [
        {
            timestamp: '2024-07-17T11:09:11',
            type: 'Event',
            category: 'PlateMovement',
            instrument: 'Agilent Linear Translator - 1',
            location: '',
            process: 'SAMPLE 2',
            step: 1,
            description: 'Move plate from Agilent Labware Stacker - 1 to Microscan Barcode Reader - 1',
            protocol: 'Fuvmo-Dev',
            filePath: 'C:\\VWorks Workspace\\Device Files\\Fuvmo-Dev.pro',
            processId: 2,
            isError: false,
            isCompleted: false,
            rawLogLine: ''
        },
        {
            timestamp: '2024-07-17T11:09:18',
            type: 'Error',
            category: 'Error',
            instrument: 'Agilent Labware Stacker - 1',
            location: 'Stacker',
            process: '',
            step: 0,
            description: 'The stack is empty',
            protocol: '',
            filePath: '',
            processId: 2,
            isError: true,
            isCompleted: false,
            rawLogLine: ''
        }
    ],
    errors: [
        {
            timestamp: '2024-07-17T11:09:18',
            type: 'Error',
            category: 'Error',
            instrument: 'Agilent Labware Stacker - 1',
            location: 'Stacker',
            process: '',
            step: 0,
            description: 'The stack is empty',
            protocol: '',
            filePath: '',
            processId: 2,
            isError: true,
            isCompleted: false,
            rawLogLine: ''
        }
    ],
    warnings: [
        {
            timestamp: '2024-07-17T11:09:15',
            type: 'Warning',
            category: 'Unknown',
            instrument: 'Microscan Barcode Reader - 1',
            location: '',
            process: 'SAMPLE 2',
            step: 1,
            description: 'Barcode scan timeout',
            protocol: 'Fuvmo-Dev',
            filePath: 'C:\\VWorks Workspace\\Device Files\\Fuvmo-Dev.pro',
            processId: 2,
            isError: false,
            isCompleted: false,
            rawLogLine: ''
        }
    ],
    instrumentEventCounts: {
        'Agilent Linear Translator - 1': 25,
        'Microscan Barcode Reader - 1': 8,
        'Agilent Labware Stacker - 1': 12,
        'Thermo Multidrop - 1': 6
    },
    processGroups: {
        'SAMPLE 2': [],
        'ASSAY 1': [],
        'ASSAY 2': []
    },
    parsedAt: '2024-07-17T15:30:00Z'
};

interface VWorksDashboardProps {
    onBack: () => void;
}

const VWorksDashboard: React.FC<VWorksDashboardProps> = ({ onBack }) => {
    const [logData, setLogData] = useState<ParsedLogData>({
        ...sampleVWorksData,
        warnings: sampleVWorksData.warnings || []
    });
    const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'errors' | 'warnings' | 'instruments'>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [directory, setDirectory] = useState<string>('C:\\VWorks Workspace\\VWorks\\Logs');

    // Set default dates: start date 1 month ago, end date today
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState<string>(formatDateForInput(oneMonthAgo));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(today));

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        if (isToday) {
            return `Today at ${timeString}`;
        } else if (isYesterday) {
            return `Yesterday at ${timeString}`;
        } else {
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const day = date.getDate();
            const suffix = getDaySuffix(day);
            return `${month} ${day}${suffix} at ${timeString}`;
        }
    };

    const getDaySuffix = (day: number) => {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const handleFolderClick = async () => {
        try {
            const selected = await open({ directory: true, multiple: false });
            if (Array.isArray(selected)) {
                setDirectory(selected[0] || directory);
            } else if (selected === null) {
                // User cancelled the selection
            } else {
                setDirectory(selected as string);
            }
        } catch (e) {
            console.error('Error selecting folder:', e);
        }
    };

    const testBackendConnection = async () => {
        try {
            const result = await invoke<string>('test_backend_connection');
            setError(`Backend test: ${result}`);
        } catch (e: any) {
            setError(`Backend test failed: ${e?.toString()}`);
        }
    };

    const handleParseLogs = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Convert HTML date format (YYYY-MM-DD) to MM/DD/YYYY format for C# backend
            const formatDateForBackend = (dateString: string) => {
                const date = new Date(dateString);
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            };

            const result = await invoke<string>('parse_vworks_logs', {
                request: {
                    folder_path: directory,
                    start_date: formatDateForBackend(startDate),
                    end_date: formatDateForBackend(endDate)
                }
            });

            if (result) {
                const parsed: ParsedLogData = JSON.parse(result);
                // Ensure warnings property exists
                setLogData({
                    events: parsed.events || [],
                    errors: parsed.errors || [],
                    warnings: parsed.warnings || [],
                    instrumentEventCounts: parsed.instrumentEventCounts || {},
                    processGroups: parsed.processGroups || {},
                    parsedAt: parsed.parsedAt || new Date().toISOString()
                });
            }
        } catch (e: any) {
            setError(e?.toString() || 'Failed to parse logs');
        } finally {
            setLoading(false);
        }
    };

    const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; trend?: string }> =
        ({ title, value, icon: Icon, color, trend }) => (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        {trend && (
                            <p className="text-sm text-green-600 mt-1 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${color}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="p-3 rounded-lg bg-blue-500">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">VWorks Dashboard</h1>
                                    <p className="text-gray-600">Real-time monitoring and log analysis</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Search className="w-5 h-5 mr-2 text-blue-500" />
                        Log Analysis Configuration
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Directory Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Log Directory
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={directory}
                                    readOnly
                                    className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Select log directory..."
                                />
                                <button
                                    onClick={handleFolderClick}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center"
                                    title="Select Directory"
                                    disabled={loading}
                                >
                                    <Folder className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleParseLogs}
                                disabled={loading || !startDate || !endDate}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                <span>{loading ? 'Parsing...' : 'Parse Logs'}</span>
                            </button>

                            <button
                                onClick={testBackendConnection}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Test Backend
                            </button>

                            {error && (
                                <div className="text-red-600 text-sm flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="text-sm text-gray-500">
                            {(logData.events?.length || 0) > 0 && logData.parsedAt && (
                                <span>Last parsed: {new Date(logData.parsedAt).toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                        title="Total Events"
                        value={logData.events?.length || 0}
                        icon={Activity}
                        color="bg-blue-500"
                        trend="+12% from last hour"
                    />
                    <StatCard
                        title="Errors"
                        value={logData.errors?.length || 0}
                        icon={AlertTriangle}
                        color="bg-red-500"
                    />
                    <StatCard
                        title="Warnings"
                        value={logData.warnings?.length || 0}
                        icon={AlertTriangle}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="Instruments"
                        value={Object.keys(logData.instrumentEventCounts || {}).length}
                        icon={Monitor}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Processes"
                        value={Object.keys(logData.processGroups || {}).length}
                        icon={Settings}
                        color="bg-blue-500"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: 'overview', label: 'Overview', icon: Monitor },
                                { id: 'events', label: 'Recent Events', icon: Activity },
                                { id: 'errors', label: 'Errors', icon: AlertTriangle },
                                { id: 'warnings', label: 'Warnings', icon: AlertTriangle },
                                { id: 'instruments', label: 'Instruments', icon: Settings }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id as any)}
                                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {selectedTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Recent Activity */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <Clock className="w-5 h-5 mr-2 text-blue-500" />
                                            Recent Activity
                                        </h3>
                                        <div className="space-y-3">
                                            {(logData.events || []).slice(0, 5).map((event, index) => (
                                                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                                                    <div className={`w-2 h-2 rounded-full ${event.type === 'Error' ? 'bg-red-500' :
                                                        event.type === 'Warning' ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{event.description}</p>
                                                        <p className="text-xs text-gray-500">{event.instrument} • {formatTimestamp(event.timestamp)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Instrument Status */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <Monitor className="w-5 h-5 mr-2 text-blue-500" />
                                            Instrument Activity
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(logData.instrumentEventCounts || {}).map(([instrument, count]) => (
                                                <div key={instrument} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900 truncate">{instrument}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-600">{count} events</span>
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedTab === 'events' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
                                <div className="space-y-2">
                                    {(logData.events || []).map((event, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className={`w-3 h-3 rounded-full ${event.type === 'Error' ? 'bg-red-500' :
                                                event.type === 'Warning' ? 'bg-yellow-500' :
                                                    event.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                                }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900">{event.instrument}</span>
                                                    <span className="text-xs text-gray-500">•</span>
                                                    <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                                                {event.process && (
                                                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-2">
                                                        {event.process}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTab === 'errors' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Error Log</h3>
                                    <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                                        {logData.errors?.length || 0} active errors
                                    </span>
                                </div>
                                {(logData.errors?.length || 0) === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
                                        <p className="text-gray-600">All systems are running normally</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(logData.errors || []).map((error, index) => (
                                            <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-start space-x-3">
                                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-sm font-medium text-red-900">{error.instrument}</span>
                                                            <span className="text-xs text-red-600">•</span>
                                                            <span className="text-xs text-red-600">{formatTimestamp(error.timestamp)}</span>
                                                        </div>
                                                        <p className="text-sm text-red-800">{error.description}</p>
                                                        {error.location && (
                                                            <p className="text-xs text-red-600 mt-1">Location: {error.location}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTab === 'warnings' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Warning Log</h3>
                                    <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                                        {logData.warnings?.length || 0} active warnings
                                    </span>
                                </div>
                                {(logData.warnings?.length || 0) === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No warnings found</h3>
                                        <p className="text-gray-600">All systems are running normally</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(logData.warnings || []).map((warning, index) => (
                                            <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex items-start space-x-3">
                                                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-sm font-medium text-yellow-900">{warning.instrument}</span>
                                                            <span className="text-xs text-yellow-600">•</span>
                                                            <span className="text-xs text-yellow-600">{formatTimestamp(warning.timestamp)}</span>
                                                        </div>
                                                        <p className="text-sm text-yellow-800">{warning.description}</p>
                                                        {warning.location && (
                                                            <p className="text-xs text-yellow-600 mt-1">Location: {warning.location}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTab === 'instruments' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Instrument Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(logData.instrumentEventCounts || {}).map(([instrument, count]) => (
                                        <div key={instrument} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">{instrument}</h4>
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Events Today</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Status</span>
                                                    <span className="text-green-600 font-medium">Online</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Last Activity</span>
                                                    <span className="text-gray-500">2 min ago</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VWorksDashboard;
