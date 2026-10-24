import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UpdateModal } from './src/components/UpdateModal';

import { ErrorBoundary } from './src/components/ErrorBoundary';

function AppContent() {
  const { isDarkMode, colors } = useTheme();

  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.cardBorder,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'light'} backgroundColor={colors.primaryDark} />
      <AppNavigator />
      <UpdateModal autoCheck={true} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <DataProvider>
                <AppContent />
              </DataProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
