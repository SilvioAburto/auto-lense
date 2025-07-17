import React, { useState } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    Code,
    useToast,
    HStack,
} from '@chakra-ui/react';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { parseVWorksLog } from '../utils/vworksParser';
import { VWorksEvent } from '../types/events';

export const VWorksTest: React.FC = () => {
    const [testResult, setTestResult] = useState<string>('');
    const [events, setEvents] = useState<VWorksEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const testVWorksParser = async () => {
        try {
            setIsLoading(true);
            console.log('VWorksTest: Starting test...');

            // Use file dialog to select the VWorks log file
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'VWorks Log Files',
                    extensions: ['log']
                }]
            });

            console.log('VWorksTest: File dialog result:', selected);

            if (!selected || selected.length === 0) {
                setTestResult('No file selected');
                return;
            }

            const filePath = selected[0];
            console.log('VWorksTest: Selected file path:', filePath);
            console.log('VWorksTest: File path type:', typeof filePath);
            console.log('VWorksTest: File path length:', filePath.length);

            // Use the raw path as returned by the dialog
            console.log('VWorksTest: Using raw path:', filePath);

            const content = await readTextFile(filePath);
            console.log('VWorksTest: File content length:', content.length);

            if (content.length === 0) {
                setTestResult('Error: File is empty');
                return;
            }

            // Parse the content
            console.log('VWorksTest: Parsing content...');
            const parsedEvents = parseVWorksLog(content);
            console.log('VWorksTest: Parsed events:', parsedEvents.length);

            setEvents(parsedEvents);
            setTestResult(`Success! Parsed ${parsedEvents.length} events from ${content.length} characters`);

            toast({
                title: 'VWorks Test Successful',
                description: `Parsed ${parsedEvents.length} events`,
                status: 'success',
                duration: 3000,
            });

        } catch (error) {
            console.error('VWorksTest: Error during test:', error);
            setTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);

            toast({
                title: 'VWorks Test Failed',
                description: error instanceof Error ? error.message : String(error),
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const testParserWithSampleData = () => {
        try {
            console.log('VWorksTest: Testing parser with sample data...');

            // Sample VWorks log content
            const sampleContent = `3/31/2020 3:28:35 PM	Info					Simulation mode toggled on			0	
3/31/2020 3:28:36 PM	Info		VWorks		Main protocol starting		Protocol1	file1.txt	1
3/31/2020 3:28:37 PM	Info		VWorks		Process starting		Process1	file1.txt	1
3/31/2020 3:28:38 PM	Info		VWorks		Task starting		Task1	file1.txt	1
3/31/2020 3:28:39 PM	Info		VWorks		Liquid Handler		Aspirate 100 μL from A1	Protocol1	file1.txt	1
3/31/2020 3:28:40 PM	Info		VWorks		Liquid Handler		Dispense 100 μL to B1	Protocol1	file1.txt	1
3/31/2020 3:28:41 PM	Info		VWorks		Plate Handler		Move plate from Position 1 to Position 2	Protocol1	file1.txt	1
3/31/2020 3:28:42 PM	Info		VWorks		Plate Handler		Place plate at Position 3	Protocol1	file1.txt	1
3/31/2020 3:28:43 PM	Info		VWorks		Sealer		Seal plate	Protocol1	file1.txt	1
3/31/2020 3:28:44 PM	Info		VWorks		Reader		Read plate at 450 nm	Protocol1	file1.txt	1
3/31/2020 3:28:45 PM	Info		VWorks		Task finishing		Task1	file1.txt	1
3/31/2020 3:28:46 PM	Info		VWorks		Process finishing		Process1	file1.txt	1
3/31/2020 3:28:47 PM	Info		VWorks		Main protocol complete		Protocol1	file1.txt	1`;

            const parsedEvents = parseVWorksLog(sampleContent);
            console.log('VWorksTest: Parsed sample events:', parsedEvents.length);

            setEvents(parsedEvents);
            setTestResult(`Success! Parsed ${parsedEvents.length} events from sample data`);

            toast({
                title: 'VWorks Parser Test Successful',
                description: `Parsed ${parsedEvents.length} events from sample data`,
                status: 'success',
                duration: 3000,
            });

        } catch (error) {
            console.error('VWorksTest: Error testing parser:', error);
            setTestResult(`Parser Error: ${error instanceof Error ? error.message : String(error)}`);

            toast({
                title: 'VWorks Parser Test Failed',
                description: error instanceof Error ? error.message : String(error),
                status: 'error',
                duration: 5000,
            });
        }
    };

    return (
        <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="lg">
            <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">VWorks Parser Test</Text>

                <HStack spacing={4}>
                    <Button
                        onClick={testVWorksParser}
                        colorScheme="blue"
                        isLoading={isLoading}
                        loadingText="Testing..."
                    >
                        Test with File
                    </Button>

                    <Button
                        onClick={testParserWithSampleData}
                        colorScheme="green"
                    >
                        Test with Sample Data
                    </Button>
                </HStack>

                {testResult && (
                    <Box p={3} bg="gray.50" borderRadius="md">
                        <Text fontWeight="medium">Test Result:</Text>
                        <Text fontSize="sm">{testResult}</Text>
                    </Box>
                )}

                {events.length > 0 && (
                    <Box p={3} bg="gray.50" borderRadius="md">
                        <Text fontWeight="medium">Sample Events ({events.length} total):</Text>
                        <VStack spacing={2} align="stretch" mt={2}>
                            {events.slice(0, 5).map((event, index) => (
                                <Box key={event.id} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                                    <Text fontSize="xs" color="gray.500">Event {index + 1}</Text>
                                    <Text fontSize="sm" fontWeight="medium">{event.description}</Text>
                                    <Text fontSize="xs" color="gray.600">
                                        {event.timestamp.toLocaleString()} | {event.operation || 'unknown'} | {event.category}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}; 