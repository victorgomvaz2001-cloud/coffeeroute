import { useColorScheme } from 'react-native';

/** Raw colours for props that can't take a className (icons, placeholders, navigators). */
const palette = {
  light: {
    background: '#fbf8f4',
    surface: '#ffffff',
    border: '#e8dccd',
    text: '#2b1a12',
    muted: '#5a4234',
    accent: '#a4522b',
    onAccent: '#ffffff',
  },
  dark: {
    background: '#15100d',
    surface: '#221a15',
    border: '#3a2c23',
    text: '#f4ece2',
    muted: '#c9b8a8',
    accent: '#e3a17c',
    onAccent: '#2b1a12',
  },
} as const;

export function usePalette() {
  return palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
