'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, Shield, BarChart3 } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Launch Token',
      description: 'Create a new token with AI optimization',
      icon: Rocket,
      href: '/launch',
      color: 'from-primary-500 to-purple-600',
    },
    {
      title: 'Discover Launches',
      description: 'Explore trending and new token launches',
      icon: TrendingUp,
      href: '/discover',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Risk Analysis',
      description: 'Check token safety and fraud indicators',
      icon: Shield,
      href: '/risk',
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Analytics',
      description: 'View portfolio performance and insights',
      icon: BarChart3,
      href: '/portfolio',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={action.href}>
              <div className="card hover:border-primary-500 transition-all duration-200 hover:scale-105 cursor-pointer h-full">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-dark-400 text-sm">{action.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
