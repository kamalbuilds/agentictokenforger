/**
 * Home Screen
 * Dashboard with active launches and stats
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to LaunchPad AI</Text>
        <Text style={styles.subtitle}>Autonomous Token Launch Platform</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Active Launches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>$2.4M</Text>
          <Text style={styles.statLabel}>24h Volume</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Launch')}
        >
          <Text style={styles.actionButtonText}>🚀 Launch New Token</Text>
        </TouchableOpacity>
      </View>

      {/* Trending Launches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Launches</Text>
        {/* Launch cards would go here */}
        <View style={styles.launchCard}>
          <Text style={styles.launchName}>Example Token</Text>
          <Text style={styles.launchInfo}>Market Cap: $50K</Text>
          <Text style={styles.launchInfo}>Progress: 45%</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    backgroundColor: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9945FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#9945FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  launchCard: {
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  launchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 5,
  },
  launchInfo: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
