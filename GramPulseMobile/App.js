import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UpdateModal } from './src/components/UpdateModal';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
            <UpdateModal autoCheck={true} />
          </NavigationContainer>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
