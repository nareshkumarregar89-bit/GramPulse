import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FamiliesListScreen } from '../screens/families/FamiliesListScreen';
import { NewSurveyScreen } from '../screens/survey/NewSurveyScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom Center Elevated FAB for "New Survey"
function CustomTabBarButton({ children, onPress }) {
  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.fabButton, SHADOWS.fab]}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
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
          tabBarLabel: 'Families',
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
            <CustomTabBarButton {...props}>
              <Ionicons name="add" size={28} color={COLORS.surface} />
            </CustomTabBarButton>
          ),
        }}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
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
          tabBarLabel: 'Profile',
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
});
