'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TokenHolding {
  id: string;
  name: string;
  symbol: string;
  address: string;
  balance: number;
  valueUSD: number;
  change24h: number;
  avgBuyPrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
}

export default function PortfolioPage() {
  const { connected, publicKey } = useWallet();
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalProfitLossPercent, setTotalProfitLossPercent] = useState(0);

  // Mock data - replace with API call
  useEffect(() => {
    if (connected && publicKey) {
      const mockHoldings: TokenHolding[] = [
        {
          id: '1',
          name: 'SolanaDoge',
          symbol: 'SDOGE',
          address: 'A1B2C3D4E5F6G7H8I9J0',
          balance: 15000,
          valueUSD: 2250,
          change24h: 12.5,
          avgBuyPrice: 0.12,
          currentPrice: 0.15,
          profitLoss: 450,
          profitLossPercent: 25,
        },
        {
          id: '2',
          name: 'AI DegenDAO',
          symbol: 'AIDAO',
          address: 'K9L8M7N6O5P4Q3R2S1T0',
          balance: 5000,
          valueUSD: 1850,
          change24h: -5.2,
          avgBuyPrice: 0.42,
          currentPrice: 0.37,
          profitLoss: -250,
          profitLossPercent: -11.9,
        },
        {
          id: '3',
          name: 'DeFi Innovation',
          symbol: 'DEFI',
          address: 'E9F8G7H6I5J4K3L2M1N0',
          balance: 2000,
          valueUSD: 3200,
          change24h: 8.3,
          avgBuyPrice: 1.20,
          currentPrice: 1.60,
          profitLoss: 800,
          profitLossPercent: 33.3,
        },
      ];

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'buy',
          token: 'SDOGE',
          amount: 10000,
          price: 0.12,
          total: 1200,
          timestamp: '2025-10-20T14:30:00Z',
        },
        {
          id: '2',
          type: 'buy',
          token: 'AIDAO',
          amount: 5000,
          price: 0.42,
          total: 2100,
          timestamp: '2025-10-21T09:15:00Z',
        },
        {
          id: '3',
          type: 'buy',
          token: 'SDOGE',
          amount: 5000,
          price: 0.12,
          total: 600,
          timestamp: '2025-10-22T16:45:00Z',
        },
        {
          id: '4',
          type: 'buy',
          token: 'DEFI',
          amount: 2000,
          price: 1.20,
          total: 2400,
          timestamp: '2025-10-23T11:20:00Z',
        },
      ];

      setTimeout(() => {
        setHoldings(mockHoldings);
        setTransactions(mockTransactions);

        const total = mockHoldings.reduce((sum, h) => sum + h.valueUSD, 0);
        const totalPL = mockHoldings.reduce((sum, h) => sum + h.profitLoss, 0);
        const totalPLPercent = (totalPL / (total - totalPL)) * 100;

        setTotalValue(total);
        setTotalProfitLoss(totalPL);
        setTotalProfitLossPercent(totalPLPercent);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Wallet className="w-20 h-20 text-primary-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Connect your Solana wallet to view your portfolio and track your token holdings
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
          My Portfolio
        </h1>
        <p className="text-gray-400 text-lg">
          Track your token holdings and performance
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${totalProfitLoss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {totalProfitLoss >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Holdings</p>
                  <p className="text-2xl font-bold text-white">{holdings.length} Tokens</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Holdings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Token Holdings</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Token</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Balance</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Value</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">24h Change</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">P&L</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-semibold">{holding.name}</p>
                          <p className="text-gray-400 text-sm">${holding.symbol}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {holding.balance.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-white font-semibold">
                        ${holding.valueUSD.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${holding.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holding.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {Math.abs(holding.change24h)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={holding.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {holding.profitLoss >= 0 ? '+' : ''}${Math.abs(holding.profitLoss).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-semibold ${holding.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-dark-900 rounded-lg hover:bg-dark-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {tx.type === 'buy' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.token}
                      </p>
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {tx.amount.toLocaleString()} tokens
                    </p>
                    <p className="text-gray-400 text-sm">
                      @ ${tx.price} = ${tx.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </main>
  );
}
