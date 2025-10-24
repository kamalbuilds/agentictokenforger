'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import StatsCards from '@/components/home/StatsCards';
import TrendingLaunches from '@/components/home/TrendingLaunches';
import QuickActions from '@/components/home/QuickActions';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to{' '}
            <span className="gradient-text">SOLTokenForger</span>
          </h1>
          <p className="text-xl text-dark-400 max-w-3xl mx-auto">
            Launch tokens in minutes with AI-powered optimization.
            Autonomous liquidity management. Real-time risk analysis.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg">
              🚀 Launch Token
            </button>
            <button className="btn-secondary text-lg">
              📊 View Analytics
            </button>
          </div>
        </motion.section>

        {/* Stats Section */}
        <StatsCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Trending Launches */}
        <TrendingLaunches />

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12"
        >
          <div className="card text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
            <p className="text-dark-400">
              3 autonomous agents with MeTTa reasoning optimize every launch
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-dark-400">
              Launch tokens in 5 minutes with one-click deployment
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold mb-2">Maximum Security</h3>
            <p className="text-dark-400">
              92% rug pull detection accuracy with real-time monitoring
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
