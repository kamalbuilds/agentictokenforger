/**
 * Launch Screen
 * Token creation and launch interface
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react';

export default function LaunchScreen() {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [targetMarketCap, setTargetMarketCap] = useState('');

  const handleLaunch = async () => {
    console.log('Launching token:', { tokenName, tokenSymbol, totalSupply, targetMarketCap });
    // API call would go here
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Launch Your Token</Text>
        <Text style={styles.subtitle}>AI-powered token deployment in minutes</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Token Name</Text>
          <TextInput
            style={styles.input}
            value={tokenName}
            onChangeText={setTokenName}
            placeholder="e.g., DogeCoin 2.0"
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Token Symbol</Text>
          <TextInput
            style={styles.input}
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            placeholder="e.g., DOGE2"
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Supply</Text>
          <TextInput
            style={styles.input}
            value={totalSupply}
            onChangeText={setTotalSupply}
            placeholder="e.g., 1000000000"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Market Cap (USD)</Text>
          <TextInput
            style={styles.input}
            value={targetMarketCap}
            onChangeText={setTargetMarketCap}
            placeholder="e.g., 500000"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.aiSection}>
          <Text style={styles.aiTitle}>🤖 AI Recommendation</Text>
          <Text style={styles.aiText}>
            Based on similar successful launches, we recommend:
          </Text>
          <Text style={styles.aiDetail}>• Graduation Threshold: $100,000</Text>
          <Text style={styles.aiDetail}>• Initial Price: $0.001</Text>
          <Text style={styles.aiDetail}>• Bonding Curve: Exponential</Text>
          <Text style={styles.aiDetail}>• Success Probability: 87%</Text>
        </View>

        <TouchableOpacity style={styles.launchButton} onPress={handleLaunch}>
          <Text style={styles.launchButtonText}>🚀 Launch Token</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By launching, you agree to our terms. Smart contracts will be deployed on Solana.
        </Text>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
  },
  aiSection: {
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9945FF',
    marginBottom: 10,
  },
  aiText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  aiDetail: {
    fontSize: 14,
    color: '#F9FAFB',
    marginBottom: 5,
  },
  launchButton: {
    backgroundColor: '#9945FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  launchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
