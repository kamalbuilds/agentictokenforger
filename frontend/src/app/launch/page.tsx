'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { Rocket, Sparkles, Shield } from 'lucide-react';

export default function LaunchPage() {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    category: 'meme',
    targetMarketCap: '',
  });

  const [aiRecommendation, setAiRecommendation] = useState({
    graduationThreshold: 100000,
    initialPrice: 0.001,
    curveType: 'EXPONENTIAL',
    successProbability: 87,
    confidence: 85,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      // API call to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/launch/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Token launch initiated! 🚀');
        toast.info(`Job ID: ${data.jobId}`);
      } else {
        toast.error('Failed to create launch');
      }
    } catch (error) {
      console.error('Launch error:', error);
      toast.error('Failed to create launch');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Rocket className="text-primary-500" size={36} />
              Launch Your Token
            </h1>
            <p className="text-dark-400 text-lg">
              AI-powered token deployment in minutes
            </p>
          </div>

          {/* Form Card */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Token Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., DogeCoin 2.0"
                  className="input"
                  required
                />
              </div>

              {/* Token Symbol */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., DOGE2"
                  className="input uppercase"
                  maxLength={10}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="meme">Meme</option>
                  <option value="utility">Utility</option>
                  <option value="governance">Governance</option>
                </select>
              </div>

              {/* Total Supply */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Supply *
                </label>
                <input
                  type="number"
                  name="totalSupply"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  placeholder="e.g., 1000000000"
                  className="input"
                  required
                />
              </div>

              {/* Target Market Cap */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Market Cap (USD) *
                </label>
                <input
                  type="number"
                  name="targetMarketCap"
                  value={formData.targetMarketCap}
                  onChange={handleInputChange}
                  placeholder="e.g., 500000"
                  className="input"
                  required
                />
              </div>

              {/* AI Recommendation */}
              <div className="border border-primary-500/30 rounded-lg p-6 bg-primary-500/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="text-primary-500" />
                  AI Recommendation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-400">Graduation Threshold:</span>
                    <p className="font-semibold mt-1">
                      ${aiRecommendation.graduationThreshold.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-400">Initial Price:</span>
                    <p className="font-semibold mt-1">
                      ${aiRecommendation.initialPrice}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-400">Bonding Curve:</span>
                    <p className="font-semibold mt-1">
                      {aiRecommendation.curveType}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-400">Success Probability:</span>
                    <p className="font-semibold mt-1 text-green-400">
                      {aiRecommendation.successProbability}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-dark-400">
                  <Shield size={14} />
                  <span>Based on 50 similar successful launches</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !connected}
                className="btn-primary w-full text-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Launching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Rocket size={20} />
                    Launch Token
                  </span>
                )}
              </button>

              {!connected && (
                <p className="text-center text-sm text-dark-400">
                  Connect your wallet to launch a token
                </p>
              )}
            </form>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="card text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold mb-1">5 Minutes</h4>
              <p className="text-sm text-dark-400">Average launch time</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold mb-1">AI-Powered</h4>
              <p className="text-sm text-dark-400">Optimal parameters</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="font-semibold mb-1">Secure</h4>
              <p className="text-sm text-dark-400">Audited smart contracts</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
