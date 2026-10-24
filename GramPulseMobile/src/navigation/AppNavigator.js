import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { FamilyDetailScreen } from '../screens/families/FamilyDetailScreen';
import { EditSurveyScreen } from '../screens/survey/EditSurveyScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { NewSurveyScreen } from '../screens/survey/NewSurveyScreen';
import { DataPrintScreen } from '../screens/print/DataPrintScreen';
import { AdminUserManagementScreen } from '../screens/admin/AdminUserManagementScreen';
import { QrScannerScreen } from '../screens/qr/QrScannerScreen';
import { DeletedRecordsScreen } from '../screens/admin/DeletedRecordsScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {currentUser ? (
        // Authenticated Stack
        <>
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen
            name="FamilyDetail"
            component={FamilyDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="EditSurvey"
            component={EditSurveyScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="NewSurveyModal"
            component={NewSurveyScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="DataPrint"
            component={DataPrintScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="AdminUserManagement"
            component={AdminUserManagementScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="QrScanner"
            component={QrScannerScreen}
            options={{ animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="DeletedRecords"
            component={DeletedRecordsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
