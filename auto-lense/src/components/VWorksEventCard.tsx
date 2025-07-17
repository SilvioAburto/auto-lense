import React from 'react';
import {
    Box,
    Card,
    CardBody,
    VStack,
    HStack,
    Text,
    Badge,
    Icon,
    Divider,
} from '@chakra-ui/react';
import {
    Droplets,
    Move,
    TestTube,
    Activity,
    Clock,
    MapPin,
    Database,
    FileText,
} from 'lucide-react';
import { VWorksEvent } from '../types/events';
import { formatDistanceToNow } from 'date-fns';

interface VWorksEventCardProps {
    event: VWorksEvent;
    isSelected?: boolean;
    onClick?: () => void;
}

const operationIcons = {
    aspirate: Droplets,
    dispense: Droplets,
    mix: Activity,
    move: Move,
    place: MapPin,
    seal: FileText,
    peel: FileText,
    clamp: Activity,
    shake: Activity,
    centrifuge: Activity,
    read: TestTube,
    scan: Database,
};

const operationColors = {
    aspirate: 'blue',
    dispense: 'green',
    mix: 'purple',
    move: 'orange',
    place: 'teal',
    seal: 'cyan',
    peel: 'pink',
    clamp: 'yellow',
    shake: 'indigo',
    centrifuge: 'red',
    read: 'emerald',
    scan: 'slate',
};

export const VWorksEventCard: React.FC<VWorksEventCardProps> = ({
    event,
    isSelected = false,
    onClick,
}) => {
    const OperationIcon = event.operation ? operationIcons[event.operation] : Activity;
    const operationColor = event.operation ? operationColors[event.operation] : 'gray';

    return (
        <Card
            size="sm"
            variant={isSelected ? 'filled' : 'outline'}
            cursor={onClick ? 'pointer' : 'default'}
            onClick={onClick}
            _hover={onClick ? { bg: 'gray.50' } : {}}
            borderColor={isSelected ? 'blue.500' : undefined}
        >
            <CardBody p={3}>
                <VStack align="stretch" spacing={2}>
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                        <HStack spacing={2} flex={1}>
                            <Icon as={OperationIcon} color={`${operationColor}.500`} boxSize={4} />
                            <Badge colorScheme={operationColor} variant="subtle" size="sm">
                                {event.operation?.toUpperCase() || 'OPERATION'}
                            </Badge>
                            <Badge colorScheme={event.severity === 'error' ? 'red' : 'gray'} size="sm">
                                {event.level}
                            </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </Text>
                    </HStack>

                    {/* Description */}
                    <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                        {event.description}
                    </Text>

                    {/* Device and Location */}
                    {(event.device || event.location) && (
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                            {event.device && (
                                <HStack spacing={1}>
                                    <Icon as={Activity} boxSize={3} />
                                    <Text>{event.device}</Text>
                                </HStack>
                            )}
                            {event.location && (
                                <HStack spacing={1}>
                                    <Icon as={MapPin} boxSize={3} />
                                    <Text>{event.location}</Text>
                                </HStack>
                            )}
                        </HStack>
                    )}

                    {/* Process and Task */}
                    {(event.process || event.task) && (
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                            {event.process && (
                                <HStack spacing={1}>
                                    <Icon as={Database} boxSize={3} />
                                    <Text>{event.process}</Text>
                                </HStack>
                            )}
                            {event.task && (
                                <HStack spacing={1}>
                                    <Icon as={FileText} boxSize={3} />
                                    <Text>{event.task}</Text>
                                </HStack>
                            )}
                        </HStack>
                    )}

                    {/* Volume and Locations */}
                    {(event.volume || event.sourceLocation || event.destinationLocation) && (
                        <>
                            <Divider />
                            <VStack align="stretch" spacing={1}>
                                {event.volume && (
                                    <HStack spacing={1} fontSize="xs" color="blue.600">
                                        <Icon as={Droplets} boxSize={3} />
                                        <Text fontWeight="medium">{event.volume}</Text>
                                    </HStack>
                                )}
                                {event.sourceLocation && (
                                    <HStack spacing={1} fontSize="xs" color="gray.600">
                                        <Text>From:</Text>
                                        <Text>{event.sourceLocation}</Text>
                                    </HStack>
                                )}
                                {event.destinationLocation && (
                                    <HStack spacing={1} fontSize="xs" color="gray.600">
                                        <Text>To:</Text>
                                        <Text>{event.destinationLocation}</Text>
                                    </HStack>
                                )}
                            </VStack>
                        </>
                    )}

                    {/* Elapsed Time */}
                    {event.elapsedTime && (
                        <HStack spacing={1} fontSize="xs" color="orange.600">
                            <Icon as={Clock} boxSize={3} />
                            <Text>{event.elapsedTime}</Text>
                        </HStack>
                    )}

                    {/* Protocol and File */}
                    {(event.protocol || event.file) && (
                        <HStack spacing={2} fontSize="xs" color="gray.500">
                            {event.protocol && (
                                <Text noOfLines={1} maxW="150px">
                                    Protocol: {event.protocol}
                                </Text>
                            )}
                            {event.file && (
                                <Text noOfLines={1} maxW="150px">
                                    File: {event.file.split('\\').pop()}
                                </Text>
                            )}
                        </HStack>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
}; 