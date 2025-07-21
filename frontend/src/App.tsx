import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { Sparkles, Sun } from 'lucide-react'

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
  instrumentEventCounts: Record<string, number>;
  processGroups: Record<string, LabEvent[]>;
  parsedAt: string;
}

// Instrument configuration
const instruments = [
  {
    id: 'vworks',
    name: 'VWorks',
    description: "Agilent's Lab Automation scheduler.",
    icon: Sun,
    color: 'bg-blue-500',
    status: 'online'
  },
  {
    id: 'venus',
    name: 'Venus',
    description: 'STAR liquid handling workstation control',
    icon: Activity,
    color: 'bg-green-500',
    status: 'online'
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Acoustic liquid handling technology',
    icon: Zap,
    color: 'bg-yellow-500',
    status: 'maintenance'
  },
  {
    id: 'greenbuttonGo',
    name: 'Green Button Go',
    description: 'Automated workflow execution platform',
    icon: Play,
    color: 'bg-emerald-500',
    status: 'online'
  },
  {
    id: 'biomek',
    name: 'Biomek Method Manager',
    description: 'Biomek liquid handling method development',
    icon: Microscope,
    color: 'bg-purple-500',
    status: 'offline'
  }
];

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

// Home Page Component
const HomePage: React.FC<{ onInstrumentSelect: (id: string) => void }> = ({ onInstrumentSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Lab Automation Dashboard
          </h1>
          <p className="text-xl text-slate-300 font-light">
            Monitor and control your laboratory instruments
          </p>
        </div>

        {/* Instruments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => {
            const IconComponent = instrument.icon;
            return (
              <div
                key={instrument.id}
                onClick={() => onInstrumentSelect(instrument.id)}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/20 hover:shadow-2xl group"
              >
                {/* Status Indicator */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${instrument.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}>
                    <IconComponent className={`w-8 h-8 text-white`} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${instrument.status === 'online' ? 'bg-green-400' :
                      instrument.status === 'maintenance' ? 'bg-yellow-400' : 'bg-red-400'
                      } shadow-lg`}></div>
                    <span className="text-xs text-slate-300 capitalize">{instrument.status}</span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {instrument.name}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {instrument.description}
                </p>

                {/* Action indicator */}
                <div className="flex items-center text-blue-400 text-sm font-medium">
                  <span>View Dashboard</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// VWorks Dashboard Component
const VWorksDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [logData, setLogData] = useState<ParsedLogData>(sampleVWorksData);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'errors' | 'instruments'>('overview');

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
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
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Events"
            value={logData.events.length}
            icon={Activity}
            color="bg-blue-500"
            trend="+12% from last hour"
          />
          <StatCard
            title="Active Errors"
            value={logData.errors.length}
            icon={AlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            title="Instruments"
            value={Object.keys(logData.instrumentEventCounts).length}
            icon={Monitor}
            color="bg-green-500"
          />
          <StatCard
            title="Processes"
            value={Object.keys(logData.processGroups).length}
            icon={Settings}
            color="bg-purple-500"
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
                      {logData.events.slice(0, 5).map((event, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${event.isError ? 'bg-red-500' : 'bg-green-500'}`}></div>
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
                      {Object.entries(logData.instrumentEventCounts).map(([instrument, count]) => (
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
                  {logData.events.map((event, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${event.isError ? 'bg-red-500' : event.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}></div>
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
                    {logData.errors.length} active errors
                  </span>
                </div>
                {logData.errors.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
                    <p className="text-gray-600">All systems are running normally</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logData.errors.map((error, index) => (
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

            {selectedTab === 'instruments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Instrument Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(logData.instrumentEventCounts).map(([instrument, count]) => (
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

// Main App Component
const LabAutomationApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | string>('home');

  const handleInstrumentSelect = (instrumentId: string) => {
    setCurrentView(instrumentId);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="app">
      {currentView === 'home' && (
        <HomePage onInstrumentSelect={handleInstrumentSelect} />
      )}
      {currentView === 'vworks' && (
        <VWorksDashboard onBack={handleBackToHome} />
      )}
      {currentView !== 'home' && currentView !== 'vworks' && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {instruments.find(i => i.id === currentView)?.name} Dashboard
            </h2>
            <p className="text-gray-600 mb-6">Dashboard coming soon...</p>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabAutomationApp;