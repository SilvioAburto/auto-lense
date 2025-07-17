import React from 'react';
import {
    Box,
    Flex,
    Text,
    Badge,
    VStack,
    HStack,
    Icon,
    useColorModeValue,
} from '@chakra-ui/react';
import { ParsedLabEvent, LiquidTransferEvent } from '../types/labEvents';
import { format } from 'date-fns';
import {
    Droplets,
    Thermometer,
    RotateCcw,
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Play,
    Pause
} from 'lucide-react';

interface EventCardProps {
    event: ParsedLabEvent;
    onClick?: () => void;
}

const getEventIcon = (type: string) => {
    switch (type) {
        case 'liquid_transfer':
            return <Droplets size={20} />;
        case 'plate_reading':
            return <Activity size={20} />;
        case 'incubation':
        case 'temperature_change':
            return <Thermometer size={20} />;
        case 'centrifugation':
            return <RotateCcw size={20} />;
        case 'error':
            return <AlertTriangle size={20} />;
        default:
            return <Activity size={20} />;
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle size={16} />;
        case 'running':
            return <Play size={16} />;
        case 'pending':
            return <Clock size={16} />;
        case 'failed':
            return <XCircle size={16} />;
        case 'cancelled':
            return <Pause size={16} />;
        default:
            return <Activity size={16} />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return { bg: 'green.50', borderColor: 'green.200' };
        case 'running':
            return { bg: 'blue.50', borderColor: 'blue.200' };
        case 'pending':
            return { bg: 'yellow.50', borderColor: 'yellow.200' };
        case 'failed':
            return { bg: 'red.50', borderColor: 'red.200' };
        case 'cancelled':
            return { bg: 'gray.50', borderColor: 'gray.200' };
        default:
            return { bg: 'gray.50', borderColor: 'gray.200' };
    }
};

const getEventIconColor = (type: string) => {
    switch (type) {
        case 'liquid_transfer':
            return 'lab.blue';
        case 'plate_reading':
            return 'lab.purple';
        case 'incubation':
        case 'temperature_change':
            return 'lab.red';
        case 'centrifugation':
            return 'lab.yellow';
        case 'error':
            return 'lab.red';
        default:
            return 'gray.500';
    }
};

const getStatusIconColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'green.500';
        case 'running':
            return 'blue.500';
        case 'pending':
            return 'yellow.500';
        case 'failed':
            return 'red.500';
        case 'cancelled':
            return 'gray.500';
        default:
            return 'gray.500';
    }
};

const renderEventDetails = (event: ParsedLabEvent) => {
    switch (event.type) {
        case 'liquid_transfer':
            const transferEvent = event as LiquidTransferEvent;
            return (
                <VStack spacing={2} align="stretch">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">Transfer</Text>
                        <Text fontSize="sm" color="gray.600">
                            {transferEvent.details.volume} {transferEvent.details.unit}
                        </Text>
                    </Flex>
                    <VStack spacing={1} align="stretch">
                        <Text fontSize="xs" color="gray.500">From: {transferEvent.details.source}</Text>
                        <Text fontSize="xs" color="gray.500">To: {transferEvent.details.destination}</Text>
                        {transferEvent.details.speed && (
                            <Text fontSize="xs" color="gray.500">Speed: {transferEvent.details.speed}</Text>
                        )}
                    </VStack>
                </VStack>
            );

        case 'plate_reading':
            return (
                <VStack spacing={2} align="stretch">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">Plate Reading</Text>
                        <Text fontSize="sm" color="gray.600">
                            {event.details.wavelength}nm
                        </Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                        Type: {event.details.readType}
                    </Text>
                </VStack>
            );

        case 'incubation':
            return (
                <VStack spacing={2} align="stretch">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">Incubation</Text>
                        <Text fontSize="sm" color="gray.600">
                            {event.details.temperature}°C
                        </Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                        Duration: {event.details.duration} min
                    </Text>
                </VStack>
            );

        case 'centrifugation':
            return (
                <VStack spacing={2} align="stretch">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">Centrifugation</Text>
                        <Text fontSize="sm" color="gray.600">
                            {event.details.speed} RPM
                        </Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                        Duration: {event.details.duration} min
                    </Text>
                </VStack>
            );

        case 'error':
            return (
                <VStack spacing={2} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="red.700">
                        Error: {event.details.errorCode}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        {event.details.message}
                    </Text>
                </VStack>
            );

        default:
            return (
                <Text fontSize="sm" color="gray.600">
                    {JSON.stringify(event.details, null, 2)}
                </Text>
            );
    }
};

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
    const statusColors = getStatusColor(event.status);
    const cardBg = useColorModeValue(statusColors.bg, 'gray.700');
    const borderColor = useColorModeValue(statusColors.borderColor, 'gray.600');

    return (
        <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ shadow: 'md' }}
            onClick={onClick}
        >
            <Flex justify="space-between" align="flex-start" mb={3}>
                <Flex align="center" spacing={2}>
                    <Icon as={getEventIcon} color={getEventIconColor(event.type)} mr={2} />
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.900" textTransform="capitalize">
                            {event.type.replace('_', ' ')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{event.instrument}</Text>
                    </VStack>
                </Flex>
                <HStack spacing={1}>
                    <Icon as={getStatusIcon} color={getStatusIconColor(event.status)} />
                    <Text fontSize="xs" color="gray.500" textTransform="capitalize">{event.status}</Text>
                </HStack>
            </Flex>

            {renderEventDetails(event)}

            <Box mt={3} pt={2} borderTop="1px solid" borderColor="gray.100">
                <Flex justify="space-between" fontSize="xs" color="gray.500">
                    <Text>{format(event.timestamp, 'HH:mm:ss')}</Text>
                    <Text>{format(event.timestamp, 'MMM dd, yyyy')}</Text>
                </Flex>
                {event.duration && (
                    <Text fontSize="xs" color="gray.400" mt={1}>
                        Duration: {Math.round(event.duration / 1000)}s
                    </Text>
                )}
            </Box>
        </Box>
    );
}; 