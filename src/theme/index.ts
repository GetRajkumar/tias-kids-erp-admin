import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#E0E7FF',
    100: '#C7D2FE',
    200: '#A5B4FC',
    300: '#818CF8',
    400: '#6366F1',
    500: '#4F46E5',
    600: '#4338CA',
    700: '#3730A3',
    800: '#312E81',
    900: '#1E1B4B',
  },
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  success: { 500: '#22C55E' },
  warning: { 500: '#F59E0B' },
  danger: { 500: '#EF4444' },
};

const fonts = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
};

const components = {
  Button: {
    defaultProps: { colorScheme: 'brand' },
  },
};

export const theme = extendTheme({ config, colors, fonts, components });
