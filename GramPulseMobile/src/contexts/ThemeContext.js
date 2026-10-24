import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS as LIGHT_COLORS, SHADOWS, SIZES } from '../constants/theme';

const STORAGE_KEY_DARK_MODE = '@villagepulse_dark_mode';

const DARK_COLORS = {
  // Primary brand palette (High-contrast emerald for dark mode)
  primary: '#10B981', // Emerald 500
  primaryDark: '#059669', // Emerald 600
  primaryLight: '#064E3B', // Deep Emerald
  primarySubtle: '#022C22', // Very dark emerald
  
  // Secondary / Accent
  accent: '#FBBF24', // Amber 400
  accentLight: '#78350F', // Dark amber
  saffron: '#F97316', // Orange 500
  
  // Backgrounds & Surfaces (Dark Slate)
  background: '#0B0F19', // Deep dark slate
  surface: '#151D2F', // Elevated dark surface
  surfaceSubtle: '#1E293B', // Slate 800
  cardBorder: '#27354E', // Dark border
  
  // Typography
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  textInverse: '#0F172A',
  
  // Status colors
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  danger: '#F87171',
  dangerLight: '#450A0A',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  
  // Badges & Categories
  scBadge: '#A78BFA',
  bplBadge: '#EF4444',
  aplBadge: '#3B82F6',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_DARK_MODE);
        if (saved !== null) {
          setIsDarkMode(saved === 'true');
        }
      } catch (e) {
        console.log('Error reading theme mode:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Toggle theme mode
  const toggleDarkMode = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, String(nextMode));
    } catch (e) {
      console.log('Error saving theme mode:', e);
    }
  };

  const setDarkModeExplicit = async (val) => {
    try {
      setIsDarkMode(val);
      await AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, String(val));
    } catch (e) {
      console.log('Error setting theme mode:', e);
    }
  };

  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        isDark: isDarkMode,
        toggleDarkMode,
        setDarkModeExplicit,
        colors,
        shadows: SHADOWS,
        sizes: SIZES,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
