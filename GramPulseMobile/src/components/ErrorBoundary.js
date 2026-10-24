import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = async () => {
    try {
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
      } else {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }
    } catch (e) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleClearCacheAndRestart = async () => {
    try {
      await AsyncStorage.clear();
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
      } else {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }
    } catch (e) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>

            <Text style={styles.title}>ऐप शुरू करने में त्रुटि आई</Text>
            <Text style={styles.titleEn}>Application Recovery Mode</Text>

            <Text style={styles.description}>
              ऐप को लोड करते समय एक अप्रत्याशित समस्या आई है। आप नीचे दिए गए बटन दबाकर ऐप को रीस्टार्ट कर सकते हैं।
            </Text>

            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={this.handleRestart} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>ऐप पुनः शुरू करें (Restart App)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleClearCacheAndRestart} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>कैश डेटा साफ़ करके रीस्टार्ट करें (Reset Cache)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 34,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleEn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34D399',
    marginTop: 2,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBox: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontFamily: 'monospace',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
});
