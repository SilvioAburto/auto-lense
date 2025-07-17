import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
    initialColorMode: 'light',
    useSystemColorMode: false,
};

const colors = {
    brand: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
    lab: {
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        red: '#ef4444',
        purple: '#8b5cf6',
    },
};

const components = {
    Button: {
        defaultProps: {
            colorScheme: 'brand',
        },
        variants: {
            solid: {
                bg: 'brand.600',
                color: 'white',
                _hover: {
                    bg: 'brand.700',
                },
            },
            outline: {
                borderColor: 'gray.200',
                color: 'gray.700',
                _hover: {
                    bg: 'gray.50',
                },
            },
        },
    },
    Card: {
        baseStyle: {
            container: {
                bg: 'white',
                borderRadius: 'lg',
                border: '1px solid',
                borderColor: 'gray.200',
                boxShadow: 'sm',
                p: 6,
            },
        },
    },
};

const theme = extendTheme({
    config,
    colors,
    components,
    styles: {
        global: {
            body: {
                bg: 'gray.50',
                color: 'gray.900',
            },
        },
    },
});

export default theme; 