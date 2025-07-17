import React, { useState } from 'react';
import {
    Box,
    VStack,
    Text,
    Icon,
} from '@chakra-ui/react';
import { Activity } from 'lucide-react';
import { VWorksEvent } from '../types/events';
import { VWorksEventCard } from './VWorksEventCard';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
// If you see a type error for 'react-window', run: npm i --save-dev @types/react-window
// Temporary fix for missing types:
declare module 'react-window';

interface VWorksTimelineProps {
    events: VWorksEvent[];
    onEventClick?: (event: VWorksEvent) => void;
}

export const VWorksTimeline: React.FC<VWorksTimelineProps> = ({
    events,
    onEventClick,
}) => {
    const [selectedEvent, setSelectedEvent] = useState<VWorksEvent | null>(null);

    const handleEventClick = (event: VWorksEvent) => {
        setSelectedEvent(event);
        onEventClick?.(event);
    };

    if (events.length === 0) {
        return (
            <Box textAlign="center" py={12}>
                <Icon as={Activity} w={8} h={8} color="gray.300" mx="auto" mb={4} />
                <Text fontSize="lg" fontWeight="medium" color="gray.900" mb={2}>
                    No VWorks events found
                </Text>
                <Text color="gray.500">
                    Load VWorks log files to see processing events
                </Text>
            </Box>
        );
    }

    // Estimate the height of each event card (adjust as needed)
    const ITEM_HEIGHT = 120;
    const LIST_HEIGHT = ITEM_HEIGHT * Math.min(events.length, 5); // Show up to 5 items tall, let parent scroll

    return (
        <Box pr={2}>
            <List
                height={LIST_HEIGHT}
                itemCount={events.length}
                itemSize={ITEM_HEIGHT}
                width="100%"
            >
                {({ index, style }: ListChildComponentProps) => {
                    const event = events[index];
                    // Add extra bottom padding to the last item
                    const isLast = index === events.length - 1;
                    return (
                        <Box
                            style={style}
                            key={event.id}
                            px={2}
                            py={1}
                            pb={isLast ? 8 : 1} // Extra bottom padding for last item
                        >
                            <VWorksEventCard
                                event={event}
                                isSelected={selectedEvent?.id === event.id}
                                onClick={() => handleEventClick(event)}
                            />
                        </Box>
                    );
                }}
            </List>
        </Box>
    );
}; 