import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FamiliesListScreen } from '../screens/families/FamiliesListScreen';
import { NewSurveyScreen } from '../screens/survey/NewSurveyScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom Center Elevated FAB for "New Survey"
function CustomTabBarButton({ children, onPress, surfaceColor, primaryColor }) {
  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.fabButton, { backgroundColor: primaryColor, borderColor: surfaceColor }, SHADOWS.fab]}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

export function BottomTabNavigator() {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.cardBorder,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('navHome', 'Home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="FamiliesTab"
        component={FamiliesListScreen}
        options={{
          tabBarLabel: t('navFamilies', 'Families'),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-group' : 'home-group'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Survey"
        component={NewSurveyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              surfaceColor={colors.surface}
              primaryColor={colors.primary}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </CustomTabBarButton>
          ),
        }}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: t('navAnalytics', 'Analytics'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('navProfile', 'Profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...SHADOWS.md,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
