'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

export default function TrendingLaunches() {
  
  const launches = [
    {
      name: 'DogeCoin 2.0',
      symbol: 'DOGE2',
      marketCap: '$125K',
      progress: 62,
      holders: 1250,
      riskScore: 8.5,
      category: 'meme',
    },
    {
      name: 'DeFinance Token',
      symbol: 'DEFI',
      marketCap: '$89K',
      progress: 45,
      holders: 890,
      riskScore: 9.2,
      category: 'utility',
    },
    {
      name: 'MoonShot',
      symbol: 'MOON',
      marketCap: '$234K',
      progress: 78,
      holders: 2100,
      riskScore: 7.8,
      category: 'meme',
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-primary-500" />
          Trending Launches
        </h2>
        <button className="text-primary-500 hover:text-primary-400 transition-colors">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {launches.map((launch, index) => (
          <motion.div
            key={launch.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{launch.name}</h3>
                <p className="text-dark-400">${launch.symbol}</p>
              </div>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
                {launch.category}
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Market Cap</span>
                <span className="font-semibold">{launch.marketCap}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Holders</span>
                <span className="font-semibold flex items-center gap-1">
                  <Users size={14} />
                  {launch.holders}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Risk Score</span>
                <span className={`font-semibold ${
                  launch.riskScore >= 8 ? 'text-green-400' :
                  launch.riskScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {launch.riskScore}/10
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-400">Progress</span>
                <span className="font-semibold">{launch.progress}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${launch.progress}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-4 btn-secondary text-sm">
              View Details
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
