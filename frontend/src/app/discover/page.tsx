'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Shield, Users, Target } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  riskScore: number;
  marketCap: string;
  holders: number;
  progress: number;
  category: string;
  verified: boolean;
  liquidityLocked: boolean;
  launchedAt: string;
}

export default function DiscoverPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('marketCap');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    const mockTokens: Token[] = [
      {
        id: '1',
        name: 'SolanaDoge',
        symbol: 'SDOGE',
        address: 'A1B2C3D4E5F6G7H8I9J0',
        riskScore: 8.5,
        marketCap: '$1.2M',
        holders: 2543,
        progress: 85,
        category: 'meme',
        verified: true,
        liquidityLocked: true,
        launchedAt: '2025-10-20',
      },
      {
        id: '2',
        name: 'AI DegenDAO',
        symbol: 'AIDAO',
        address: 'K9L8M7N6O5P4Q3R2S1T0',
        riskScore: 9.2,
        marketCap: '$850K',
        holders: 1876,
        progress: 72,
        category: 'ai',
        verified: true,
        liquidityLocked: true,
        launchedAt: '2025-10-21',
      },
      {
        id: '3',
        name: 'MetaverseQuest',
        symbol: 'MVQUEST',
        address: 'U0V1W2X3Y4Z5A6B7C8D9',
        riskScore: 7.8,
        marketCap: '$620K',
        holders: 1342,
        progress: 58,
        category: 'gaming',
        verified: false,
        liquidityLocked: true,
        launchedAt: '2025-10-22',
      },
      {
        id: '4',
        name: 'DeFi Innovation',
        symbol: 'DEFI',
        address: 'E9F8G7H6I5J4K3L2M1N0',
        riskScore: 9.5,
        marketCap: '$2.1M',
        holders: 4231,
        progress: 95,
        category: 'defi',
        verified: true,
        liquidityLocked: true,
        launchedAt: '2025-10-18',
      },
      {
        id: '5',
        name: 'Solana Shiba',
        symbol: 'SSHIB',
        address: 'O0P1Q2R3S4T5U6V7W8X9',
        riskScore: 6.5,
        marketCap: '$340K',
        holders: 892,
        progress: 42,
        category: 'meme',
        verified: false,
        liquidityLocked: false,
        launchedAt: '2025-10-23',
      },
      {
        id: '6',
        name: 'DAO Governance Token',
        symbol: 'DAOGOV',
        address: 'Y9Z8A7B6C5D4E3F2G1H0',
        riskScore: 8.9,
        marketCap: '$1.5M',
        holders: 3124,
        progress: 88,
        category: 'defi',
        verified: true,
        liquidityLocked: true,
        launchedAt: '2025-10-19',
      },
    ];

    setTimeout(() => {
      setTokens(mockTokens);
      setFilteredTokens(mockTokens);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and sort tokens
  useEffect(() => {
    let filtered = [...tokens];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((token) => token.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return parseFloat(b.marketCap.replace(/[$KM,]/g, '')) - parseFloat(a.marketCap.replace(/[$KM,]/g, ''));
        case 'holders':
          return b.holders - a.holders;
        case 'riskScore':
          return b.riskScore - a.riskScore;
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    setFilteredTokens(filtered);
  }, [searchQuery, categoryFilter, sortBy, tokens]);

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 8) return 'Low Risk';
    if (score >= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
          Discover Tokens
        </h1>
        <p className="text-gray-400 text-lg">
          Explore AI-powered token launches with real-time risk analysis
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tokens by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="meme">Meme</option>
              <option value="defi">DeFi</option>
              <option value="ai">AI</option>
              <option value="gaming">Gaming</option>
              <option value="utility">Utility</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="marketCap">Market Cap</option>
              <option value="holders">Holders</option>
              <option value="riskScore">Risk Score</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Token Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No tokens found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token, index) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-500 transition-all cursor-pointer"
            >
              {/* Token Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">{token.name}</h3>
                    {token.verified && (
                      <Shield className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">${token.symbol}</p>
                </div>
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold uppercase">
                  {token.category}
                </span>
              </div>

              {/* Risk Score */}
              <div className="mb-4 p-3 bg-dark-900 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Risk Score</span>
                  <span className={`text-lg font-bold ${getRiskColor(token.riskScore)}`}>
                    {token.riskScore}/10
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        token.riskScore >= 8
                          ? 'bg-green-400'
                          : token.riskScore >= 6
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${token.riskScore * 10}%` }}
                    />
                  </div>
                  <span className={`text-xs ${getRiskColor(token.riskScore)}`}>
                    {getRiskLabel(token.riskScore)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Market Cap</p>
                  <p className="text-white font-semibold">{token.marketCap}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Holders</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {token.holders.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Launch Progress</span>
                  <span className="text-sm text-white font-semibold">{token.progress}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-400"
                    style={{ width: `${token.progress}%` }}
                  />
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {token.liquidityLocked && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    🔒 Liquidity Locked
                  </span>
                )}
                {token.verified && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* View Button */}
              <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Target className="w-4 h-4" />
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
