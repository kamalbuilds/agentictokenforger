'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

export default function StatsCards() {
  const stats = [
    {
      label: 'Active Launches',
      value: '24',
      change: '+12%',
      icon: Activity,
      color: 'text-green-400',
    },
    {
      label: '24h Volume',
      value: '$2.4M',
      change: '+23%',
      icon: DollarSign,
      color: 'text-blue-400',
    },
    {
      label: 'Total Users',
      value: '12.5K',
      change: '+18%',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      label: 'Success Rate',
      value: '87%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-primary-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card hover:border-primary-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className={`text-sm ${stat.color} mt-1`}>{stat.change}</p>
            </div>
            <stat.icon className={`${stat.color}`} size={32} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
