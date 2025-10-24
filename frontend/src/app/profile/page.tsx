'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { User, Settings, TrendingUp, Award, Zap, Shield, Bell, Lock } from 'lucide-react';

interface UserStats {
  tokensLaunched: number;
  successRate: number;
  totalVolume: string;
  totalHolders: number;
  avgRiskScore: number;
  achievements: string[];
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [notifications, setNotifications] = useState({
    launchAlerts: true,
    riskAlerts: true,
    priceAlerts: false,
    newsletter: true,
  });

  // Mock data - replace with API call
  useEffect(() => {
    if (connected && publicKey) {
      const mockStats: UserStats = {
        tokensLaunched: 3,
        successRate: 85.5,
        totalVolume: '$4.2M',
        totalHolders: 8642,
        avgRiskScore: 8.2,
        achievements: ['First Launch', 'Risk Master', 'Volume King', 'Community Builder'],
      };

      setTimeout(() => {
        setStats(mockStats);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved:', { riskTolerance, notifications });
  };

  if (!connected) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <User className="w-20 h-20 text-primary-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Connect your Solana wallet to access your profile and settings
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
          My Profile
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your account and preferences
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Wallet Address</h3>
                  <p className="text-gray-400 text-sm mt-1 font-mono">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                  <span className="text-gray-400">Tokens Launched</span>
                  <span className="text-white font-bold">{stats?.tokensLaunched}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400 font-bold">{stats?.successRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                  <span className="text-gray-400">Total Volume</span>
                  <span className="text-white font-bold">{stats?.totalVolume}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                  <span className="text-gray-400">Total Holders</span>
                  <span className="text-white font-bold">{stats?.totalHolders.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Achievements Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Achievements</h3>
              </div>
              <div className="space-y-2">
                {stats?.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-white font-semibold">{achievement}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-primary-400" />
                <h3 className="text-2xl font-bold text-white">Performance Overview</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-900 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-gray-400">Success Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats?.successRate}%</p>
                  <div className="mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${stats?.successRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-dark-900 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-gray-400">Avg Risk Score</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats?.avgRiskScore}/10</p>
                  <div className="mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${(stats?.avgRiskScore || 0) * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-6 h-6 text-primary-400" />
                <h3 className="text-2xl font-bold text-white">Settings</h3>
              </div>

              {/* Risk Tolerance */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <label className="text-lg font-semibold text-white">
                    Risk Tolerance
                  </label>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Set your preferred risk level for AI recommendations (1 = Very Conservative, 10 = Very Aggressive)
                </p>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Conservative</span>
                    <span className="text-primary-400 font-bold text-lg">{riskTolerance}</span>
                    <span className="text-gray-400">Aggressive</span>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <label className="text-lg font-semibold text-white">
                    Notification Preferences
                  </label>
                </div>
                <div className="space-y-3">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-dark-900 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      <span className="text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <button
                        onClick={() => setNotifications({ ...notifications, [key]: !value })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-primary-500' : 'bg-dark-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                className="w-full mt-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Lock className="w-5 h-5" />
                Save Settings
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </main>
  );
}
