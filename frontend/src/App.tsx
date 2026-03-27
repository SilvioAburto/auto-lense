import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';
import logo from '../auto-lense-logo-square-removebg-preview.png';
import VWorksDashboard from './components/VWorksDashboard';

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
    description: "Hamilton's method manager logs.",
    icon: Activity,
    color: 'bg-green-500',
    status: 'online'
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Acoustic liquid handling technology',
    icon: AudioLines,
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

// Navbar component
const Navbar: React.FC = () => (
  <nav className="w-full bg-slate-200 border-b border-gray-900 fixed top-0 left-0 z-50">
    <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <img src={logo} alt="AutoLense Logo" className="h-8 w-8 rounded" />
        <span className="text-lg font-bold black">AutoLense</span>
      </div>
      <ul className="flex items-center gap-6 text-sm font-medium text-black">
        <li><a href="#vworks" className="hover:text-blue-500 transition-colors">VWorks</a></li>
        <li><a href="#greenbuttonGo" className="hover:text-blue-500 transition-colors">Green Button Go</a></li>
        <li><a href="#biomek" className="hover:text-blue-500 transition-colors">Biomek</a></li>
        <li><a href="https://github.com/SilvioAburto/auto-lense" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">GitHub</a></li>
      </ul>
    </div>
  </nav>
);

// Home Page Component
const HomePage: React.FC<{ onInstrumentSelect: (id: string) => void }> = ({ onInstrumentSelect }) => {

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xl text-slate-300 font-light">
              Monitor and analyze your laboratory automation logs.
            </p>

          </div>
          {/* Instruments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instruments.map((instrument) => {
              const IconComponent = instrument.icon;
              return (
                <div
                  key={instrument.id}
                  id={instrument.id}
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
    </>
  );
};



// Main App Component
const LabAutomationApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const [logData, setLogData] = useState<ParsedLogData>(sampleVWorksData);

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