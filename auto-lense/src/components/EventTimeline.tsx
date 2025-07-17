import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Flex,
    Divider,
    useColorModeValue,
} from '@chakra-ui/react';
import { ParsedLabEvent } from '../types/labEvents';
import { EventCard } from './EventCard';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

interface EventTimelineProps {
    events: ParsedLabEvent[];
    onEventClick?: (event: ParsedLabEvent) => void;
}

const groupEventsByDate = (events: ParsedLabEvent[]) => {
    const groups: { [key: string]: ParsedLabEvent[] } = {};

    events.forEach(event => {
        const dateKey = format(event.timestamp, 'yyyy-MM-dd');
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(event);
    });

    return groups;
};

const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
        return 'Today';
    } else if (isYesterday(date)) {
        return 'Yesterday';
    } else if (isThisWeek(date)) {
        return format(date, 'EEEE');
    } else {
        return format(date, 'MMM dd, yyyy');
    }
};

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, onEventClick }) => {
    const groupedEvents = groupEventsByDate(events);
    const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));
    const dividerColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <VStack spacing={6} align="stretch">
            {sortedDates.map(dateKey => {
                const dayEvents = groupedEvents[dateKey].sort((a, b) =>
                    b.timestamp.getTime() - a.timestamp.getTime()
                );

                return (
                    <Box key={dateKey}>
                        <VStack spacing={3} align="stretch">
                            <Flex align="center" spacing={3}>
                                <Box
                                    w={2}
                                    h={2}
                                    bg="brand.500"
                                    borderRadius="full"
                                    flexShrink={0}
                                />
                                <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                                    {getDateLabel(dateKey)}
                                </Text>
                                <Divider flex={1} borderColor={dividerColor} />
                                <Text fontSize="sm" color="gray.500">
                                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                                </Text>
                            </Flex>

                            <Box ml={5}>
                                <VStack spacing={3} align="stretch">
                                    {dayEvents.map(event => (
                                        <Box key={event.id} position="relative">
                                            <Box
                                                position="absolute"
                                                left={4}
                                                top={6}
                                                w={3}
                                                h={3}
                                                bg="gray.300"
                                                borderRadius="full"
                                                ml="-6px"
                                            />
                                            <Box ml={8}>
                                                <EventCard
                                                    event={event}
                                                    onClick={() => onEventClick?.(event)}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>
                );
            })}

            {events.length === 0 && (
                <Box textAlign="center" py={12}>
                    <Text fontSize="lg" color="gray.400">No events found</Text>
                    <Text fontSize="sm" color="gray.300">Load a log file to see events</Text>
                </Box>
            )}
        </VStack>
    );
}; 