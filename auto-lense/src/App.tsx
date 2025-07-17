import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Select,
  Grid,
  GridItem,
  useColorModeValue,
  Icon,
  Divider,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { ParsedLabEvent, LogFile } from './types/labEvents';
import { LogParser } from './utils/logParser';
import { EventTimeline } from './components/EventTimeline';
import { EventStats } from './components/EventStats';
import { VWorksEventCard } from './components/VWorksEventCard';
import { VWorksTimeline } from './components/VWorksTimeline';
import { parseVWorksLog, getVWorksLogsDirectory } from './utils/vworksParser';
import { VWorksEvent } from './types/events';
import { invoke } from '@tauri-apps/api/core';

import {
  Upload,
  FileText,
  BarChart3,
  Clock,
  Settings,
  X,
  Search,
  Filter,
  Database,
  FolderOpen
} from 'lucide-react';

function App() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [allEvents, setAllEvents] = useState<(ParsedLabEvent | VWorksEvent)[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<(ParsedLabEvent | VWorksEvent)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');
  const [vworksEvents, setVworksEvents] = useState<VWorksEvent[]>([]);
  const [vworksPage, setVworksPage] = useState(0);
  const vworksPageSize = 25;
  const [hasMoreVWorksEvents, setHasMoreVWorksEvents] = useState(true);
  const [selectedLogType, setSelectedLogType] = useState<'general' | 'vworks'>('general');
  const renderStartRef = useRef<number | null>(null);
  const [vworksTotalEvents, setVworksTotalEvents] = useState(0);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Log Files',
          extensions: ['log', 'txt', 'csv']
        }]
      });

      if (selected) {
        setIsLoading(true);
        const newLogFiles: LogFile[] = [];

        for (const filePath of selected) {
          try {
            const content = await readTextFile(filePath);
            const fileName = filePath.split(/[/\\]/).pop() || 'Unknown';

            // Check if it's a VWorks log file
            if (fileName.includes('vworks_log')) {
              // For VWorks logs, parse and insert events into SQLite, then set log type
              await invoke('parse_vworks_file', { file_path: filePath });
              setSelectedLogType('vworks');
            } else {
              // Parse as general lab events
              const lines = content.split('\n');
              const events: ParsedLabEvent[] = [];
              let instrument = 'Unknown Instrument';

              for (const line of lines) {
                if (line.trim()) {
                  const timestamp = LogParser.parseTimestamp(line) || new Date();
                  const extractedInstrument = LogParser.extractInstrumentName(line);
                  if (extractedInstrument !== 'Unknown Instrument') {
                    instrument = extractedInstrument;
                  }

                  const event = LogParser.parseLogLine(line, timestamp, instrument);
                  if (event) {
                    events.push(event);
                  }
                }
              }

              const newLogFile: LogFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: fileName,
                path: filePath,
                size: content.length,
                lastModified: new Date(),
                events
              };

              newLogFiles.push(newLogFile);
            }
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
          }
        }

        if (newLogFiles.length > 0) {
          setLogFiles(prev => [...prev, ...newLogFiles]);
          setSelectedLogType('general');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      setIsLoading(false);
    }
  };

  const handleVWorksLogLoad = async () => {
    console.log('App: Starting VWorks log load...');
    try {
      console.log('App: Opening file dialog...');
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'VWorks Log Files',
          extensions: ['log']
        }]
      });

      console.log('App: File dialog result:', selected);
      console.log('App: Selected files count:', selected?.length || 0);

      if (selected && selected.length > 0) {
        console.log('App: Files selected, starting to process...');
        setIsLoading(true);
        console.log('App: Selected VWorks files:', selected);
        // Parse and insert all selected VWorks logs into SQLite
        for (let i = 0; i < selected.length; i++) {
          const filePath = selected[i];
          try {
            await invoke('parse_vworks_file', { file_path: filePath });
          } catch (error) {
            console.error(`App: Error parsing VWorks file ${filePath}:`, error);
          }
        }
        setSelectedLogType('vworks');
        setIsLoading(false);
      } else {
        console.log('App: No files selected or selection cancelled');
      }
    } catch (error) {
      console.error('App: Error loading VWorks logs:', error);
      setIsLoading(false);
    }
  };

  const handleFileSelectForViewing = (logFile: LogFile) => {
    setSelectedFile(logFile);
    setAllEvents(logFile.events);
    setFilteredEvents(logFile.events);
  };

  const removeLogFile = (fileId: string) => {
    setLogFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
      setAllEvents([]);
      setFilteredEvents([]);
    }
  };

  // Fetch paginated VWorks events from Tauri backend
  const fetchVWorksEventsPage = async (page: number) => {
    setIsLoading(true);
    try {
      const events: VWorksEvent[] = await invoke('get_vworks_events_page', {
        offset: page * vworksPageSize,
        limit: vworksPageSize
      });
      // Only keep the current page in memory for performance
      setVworksEvents(events);
      setHasMoreVWorksEvents(events.length === vworksPageSize);
    } catch (error) {
      setHasMoreVWorksEvents(false);
      console.error('Failed to fetch VWorks events:', error);
    }
    setIsLoading(false);
  };

  const fetchVWorksStatistics = async () => {
    try {
      const stats = await invoke<{ total_events: number }>('get_vworks_statistics');
      setVworksTotalEvents(stats.total_events);
    } catch (error) {
      setVworksTotalEvents(0);
      console.error('Failed to fetch VWorks statistics:', error);
    }
  };

  // Initial load or when switching to VWorks logs
  useEffect(() => {
    if (selectedLogType === 'vworks') {
      fetchVWorksStatistics();
      fetchVWorksEventsPage(0);
      setVworksPage(0);
    }
    // eslint-disable-next-line
  }, [selectedLogType]);

  useEffect(() => {
    if (selectedLogType === 'vworks' && renderStartRef.current !== null) {
      setTimeout(() => {
        const renderEnd = performance.now();
        console.log(
          `React: Timeline render for ${vworksEvents.length} events took`,
          (renderEnd - renderStartRef.current!).toFixed(2),
          'ms'
        );
        renderStartRef.current = null;
      }, 0);
    }
  }, [vworksEvents, selectedLogType]);

  // Load more handler
  const handleLoadMoreVWorks = () => {
    const nextPage = vworksPage + 1;
    setVworksPage(nextPage);
    fetchVWorksEventsPage(nextPage);
  };

  useEffect(() => {
    let filtered = allEvents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(event.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedEventType);
    }

    // Filter by instrument
    if (selectedInstrument !== 'all') {
      filtered = filtered.filter(event => event.instrument === selectedInstrument);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    setFilteredEvents(filtered);
  }, [allEvents, searchTerm, selectedEventType, selectedInstrument, selectedStatus]);

  const eventTypes = ['all', ...Array.from(new Set(allEvents.map(e => e.type)))];
  const instruments = ['all', ...Array.from(new Set(allEvents.map(e => e.instrument)))];
  const statuses = ['all', ...Array.from(new Set(allEvents.map(e => e.status)))];

  const totalPages = Math.ceil(vworksTotalEvents / vworksPageSize);

  const handlePageChange = (page: number) => {
    setVworksPage(page);
    fetchVWorksEventsPage(page);
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Box bg={cardBg} borderBottom="1px solid" borderColor={borderColor} boxShadow="sm">
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
          <Flex align="center" justify="space-between" h={16}>
            <Flex align="center" spacing={4}>
              <HStack spacing={2}>
                <Box w={8} h={8} bg="brand.600" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                  <Icon as={BarChart3} w={5} h={5} color="white" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.900">Lab Automation Lens</Text>
              </HStack>
            </Flex>

            <HStack spacing={4}>
              <Button
                onClick={handleFileSelect}
                isLoading={isLoading}
                loadingText="Loading..."
                leftIcon={<Icon as={Upload} />}
                colorScheme="brand"
              >
                Load Log Files
              </Button>
              <Button
                onClick={handleVWorksLogLoad}
                isLoading={isLoading}
                loadingText="Loading..."
                leftIcon={<Icon as={Database} />}
                variant="outline"
                colorScheme="blue"
              >
                Load VWorks Logs
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Box>

      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8} pb={24}>
        <Grid templateColumns={{ lg: '1fr 3fr' }} gap={8}>
          {/* Sidebar */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* File List */}
              <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={6} boxShadow="sm">
                <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={4}>Log Files</Text>
                <VStack spacing={2} align="stretch">
                  {logFiles.map(file => (
                    <Box
                      key={file.id}
                      p={3}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={selectedFile?.id === file.id ? 'brand.300' : borderColor}
                      bg={selectedFile?.id === file.id ? 'brand.50' : 'transparent'}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: 'gray.300' }}
                      onClick={() => handleFileSelectForViewing(file)}
                    >
                      <Flex align="center" justify="space-between">
                        <HStack spacing={2}>
                          <Icon as={FileText} w={4} h={4} color="gray.500" />
                          <Text fontSize="sm" fontWeight="medium" color="gray.700" noOfLines={1}>
                            {file.name}
                          </Text>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogFile(file.id);
                          }}
                        >
                          <Icon as={X} w={4} h={4} />
                        </Button>
                      </Flex>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {file.events.length} events
                      </Text>
                    </Box>
                  ))}

                  {logFiles.length === 0 && (
                    <Box textAlign="center" py={8}>
                      <Icon as={FileText} w={8} h={8} color="gray.300" mx="auto" mb={2} />
                      <Text fontSize="sm" color="gray.500">No log files loaded</Text>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Filters */}
              {(selectedFile || (selectedLogType === 'vworks' && allEvents.length > 0)) && (
                <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={6} boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={4}>Filters</Text>

                  {/* Search */}
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Search
                      </Text>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search events..."
                        leftElement={<Icon as={Search} color="gray.400" />}
                      />
                    </Box>

                    {/* Event Type Filter */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Event Type
                      </Text>
                      <Select
                        value={selectedEventType}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                      >
                        {eventTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                          </option>
                        ))}
                      </Select>
                    </Box>

                    {/* Instrument Filter */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Instrument
                      </Text>
                      <Select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                      >
                        {instruments.map(instrument => (
                          <option key={instrument} value={instrument}>
                            {instrument === 'all' ? 'All Instruments' : instrument}
                          </option>
                        ))}
                      </Select>
                    </Box>

                    {/* Status Filter */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Status
                      </Text>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status}
                          </option>
                        ))}
                      </Select>
                    </Box>

                    {/* Clear Filters */}
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedEventType('all');
                        setSelectedInstrument('all');
                        setSelectedStatus('all');
                      }}
                      variant="outline"
                      w="full"
                    >
                      Clear Filters
                    </Button>
                  </VStack>
                </Box>
              )}
            </VStack>
          </GridItem>

          {/* Main Content */}
          <GridItem>
            {(selectedFile || (selectedLogType === 'vworks' && vworksEvents.length > 0)) ? (
              <VStack spacing={6} align="stretch" pb={8}>
                {/* File Info */}
                <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={6} boxShadow="sm">
                  <Flex align="center" justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xl" fontWeight="bold" color="gray.900">
                        {selectedFile ? selectedFile.name : 'VWorks Log Events'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedFile ? `${selectedFile.events.length} events • Last modified: ${selectedFile.lastModified.toLocaleDateString()}` : `${allEvents.length} VWorks events loaded`}
                      </Text>
                    </VStack>
                    <Badge colorScheme={selectedLogType === 'vworks' ? 'blue' : 'brand'} variant="subtle">
                      Showing {filteredEvents.length} of {allEvents.length} events
                    </Badge>
                  </Flex>
                </Box>

                {/* Tab Navigation */}
                <HStack spacing={1} bg="gray.100" p={1} borderRadius="lg">
                  <Button
                    onClick={() => setActiveTab('timeline')}
                    variant={activeTab === 'timeline' ? 'solid' : 'ghost'}
                    size="sm"
                    flex={1}
                    leftIcon={<Icon as={Clock} />}
                  >
                    Timeline
                  </Button>
                  <Button
                    onClick={() => setActiveTab('stats')}
                    variant={activeTab === 'stats' ? 'solid' : 'ghost'}
                    size="sm"
                    flex={1}
                    leftIcon={<Icon as={BarChart3} />}
                  >
                    Statistics
                  </Button>
                </HStack>

                {/* Tab Content */}
                {activeTab === 'timeline' ? (
                  selectedLogType === 'vworks' ? (
                    <>
                      <VWorksTimeline
                        events={vworksEvents}
                        onEventClick={(event) => {
                          console.log('VWorks event clicked:', event);
                        }}
                      />
                      <Box pt={4} pb={8} display="flex" justifyContent="center" alignItems="center">
                        {totalPages > 1 && (
                          <HStack spacing={2}>
                            <Button
                              onClick={() => handlePageChange(Math.max(0, vworksPage - 1))}
                              isDisabled={vworksPage === 0}
                              size="sm"
                            >
                              Previous
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => (
                              <Button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                variant={i === vworksPage ? 'solid' : 'outline'}
                                size="sm"
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button
                              onClick={() => handlePageChange(Math.min(totalPages - 1, vworksPage + 1))}
                              isDisabled={vworksPage === totalPages - 1}
                              size="sm"
                            >
                              Next
                            </Button>
                          </HStack>
                        )}
                      </Box>
                    </>
                  ) : (
                    <EventTimeline
                      events={filteredEvents}
                      onEventClick={(event) => {
                        console.log('Event clicked:', event);
                      }}
                    />
                  )
                ) : (
                  <EventStats events={filteredEvents} />
                )}
              </VStack>
            ) : (
              <Box textAlign="center" py={12}>
                <Box w={16} h={16} bg="gray.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center" mx="auto" mb={4}>
                  <Icon as={FileText} w={8} h={8} color="gray.400" />
                </Box>
                <Text fontSize="lg" fontWeight="medium" color="gray.900" mb={2}>
                  No log file selected
                </Text>
                <Text color="gray.500" mb={6}>
                  Load a log file to start visualizing lab automation events
                </Text>
                <Button onClick={handleFileSelect} colorScheme="brand">
                  Load Log Files
                </Button>
              </Box>
            )}
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}

export default App;
