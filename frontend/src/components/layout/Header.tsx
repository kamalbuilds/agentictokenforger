'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, X, Rocket, TrendingUp, BarChart3, User } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connected } = useWallet();

  const navigation = [
    { name: 'Home', href: '/', icon: Rocket },
    { name: 'Launch', href: '/launch', icon: Rocket },
    { name: 'Discover', href: '/discover', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl">🚀</div>
            <span className="text-xl font-bold gradient-text">
              SOLTokenForger
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-dark-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <WalletMultiButton className="!bg-primary-500 hover:!bg-primary-600" />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-dark-800">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="pt-4">
              <WalletMultiButton className="!bg-primary-500 hover:!bg-primary-600 !w-full" />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
