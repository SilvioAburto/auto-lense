import React from 'react';
import {
    SimpleGrid,
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Icon,
    useColorModeValue,
} from '@chakra-ui/react';
import { ParsedLabEvent, LabEventType } from '../types/labEvents';
import {
    BarChart3,
    Clock,
    AlertTriangle,
    CheckCircle,
    Activity,
    Droplets,
    Thermometer,
    RotateCcw
} from 'lucide-react';

interface EventStatsProps {
    events: ParsedLabEvent[];
}

const getEventTypeIcon = (type: LabEventType) => {
    switch (type) {
        case 'liquid_transfer':
            return <Droplets size={16} />;
        case 'plate_reading':
        case 'sensor_reading':
            return <Activity size={16} />;
        case 'incubation':
        case 'temperature_change':
            return <Thermometer size={16} />;
        case 'centrifugation':
            return <RotateCcw size={16} />;
        default:
            return <Activity size={16} />;
    }
};

const getEventTypeColor = (type: LabEventType) => {
    switch (type) {
        case 'liquid_transfer':
            return { color: 'lab.blue', bg: 'blue.50' };
        case 'plate_reading':
            return { color: 'lab.purple', bg: 'purple.50' };
        case 'incubation':
        case 'temperature_change':
            return { color: 'lab.red', bg: 'red.50' };
        case 'centrifugation':
            return { color: 'lab.yellow', bg: 'yellow.50' };
        case 'error':
            return { color: 'lab.red', bg: 'red.50' };
        default:
            return { color: 'gray.600', bg: 'gray.100' };
    }
};

export const EventStats: React.FC<EventStatsProps> = ({ events }) => {
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const failedEvents = events.filter(e => e.status === 'failed').length;
    const runningEvents = events.filter(e => e.status === 'running').length;

    const eventTypeCounts = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const instrumentCounts = events.reduce((acc, event) => {
        acc[event.instrument] = (acc[event.instrument] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topInstruments = Object.entries(instrumentCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const totalDuration = events.reduce((sum, event) => sum + (event.duration || 0), 0);
    const avgDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;

    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            {/* Total Events */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">Total Events</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="gray.900">{totalEvents}</Text>
                    </VStack>
                    <Box p={2} bg="brand.100" borderRadius="lg">
                        <Icon as={BarChart3} w={6} h={6} color="brand.600" />
                    </Box>
                </Flex>
            </Box>

            {/* Completed Events */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">Completed</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">{completedEvents}</Text>
                    </VStack>
                    <Box p={2} bg="green.100" borderRadius="lg">
                        <Icon as={CheckCircle} w={6} h={6} color="green.600" />
                    </Box>
                </Flex>
            </Box>

            {/* Failed Events */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">Failed</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.600">{failedEvents}</Text>
                    </VStack>
                    <Box p={2} bg="red.100" borderRadius="lg">
                        <Icon as={AlertTriangle} w={6} h={6} color="red.600" />
                    </Box>
                </Flex>
            </Box>

            {/* Running Events */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">Running</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.600">{runningEvents}</Text>
                    </VStack>
                    <Box p={2} bg="blue.100" borderRadius="lg">
                        <Icon as={Clock} w={6} h={6} color="blue.600" />
                    </Box>
                </Flex>
            </Box>

            {/* Event Types Breakdown */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
                gridColumn={{ md: 'span 2' }}
            >
                <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={4}>Event Types</Text>
                <VStack spacing={3} align="stretch">
                    {Object.entries(eventTypeCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => {
                            const colors = getEventTypeColor(type as LabEventType);
                            return (
                                <Flex key={type} justify="space-between" align="center">
                                    <HStack spacing={2}>
                                        <Box p={1} borderRadius="md" bg={colors.bg}>
                                            <Icon as={getEventTypeIcon} color={colors.color} />
                                        </Box>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.700" textTransform="capitalize">
                                            {type.replace('_', ' ')}
                                        </Text>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">{count}</Text>
                                </Flex>
                            );
                        })}
                </VStack>
            </Box>

            {/* Top Instruments */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
                gridColumn={{ md: 'span 2' }}
            >
                <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={4}>Top Instruments</Text>
                <VStack spacing={3} align="stretch">
                    {topInstruments.map(([instrument, count]) => (
                        <Flex key={instrument} justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">{instrument}</Text>
                            <Text fontSize="sm" color="gray.500">{count} events</Text>
                        </Flex>
                    ))}
                </VStack>
            </Box>

            {/* Average Duration */}
            <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">Avg Duration</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                            {Math.round(avgDuration / 1000)}s
                        </Text>
                    </VStack>
                    <Box p={2} bg="yellow.100" borderRadius="lg">
                        <Icon as={Clock} w={6} h={6} color="yellow.600" />
                    </Box>
                </Flex>
            </Box>
        </SimpleGrid>
    );
}; 