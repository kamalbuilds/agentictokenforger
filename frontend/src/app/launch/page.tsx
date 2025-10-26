'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { 
  Rocket, Sparkles, Shield, Zap, TrendingUp, Bot, 
  Lock, AlertTriangle, CheckCircle2, Activity, Brain,
  LineChart, Waves, DollarSign, Clock, Target
} from 'lucide-react';

interface AIRecommendation {
  presaleMode: string;
  curveType: string;
  initialPrice: number;
  depositLimit: number;
  graduationThreshold: number;
  feeSchedule: Array<{ duration: number; feeRate: number }>;
}

interface AIResponse {
  recommendations: AIRecommendation;
  reasoning: string;
  confidence: number;
  agentName: string;
}

export default function LaunchPage() {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [launchStage, setLaunchStage] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    category: 'meme',
    targetMarketCap: '',
    riskTolerance: 'medium',
  });

  const [aiRecommendation, setAiRecommendation] = useState<AIResponse | null>(null);

  // Features showcase
  const meteoraFeatures = [
    {
      icon: Shield,
      title: 'Anti-Sniper Protection',
      description: 'Dynamic fees, Alpha Vault, Rate Limiter',
      color: 'text-blue-400',
    },
    {
      icon: Waves,
      title: 'DLMM Pools',
      description: 'Zero-slippage bins with concentrated liquidity',
      color: 'text-purple-400',
    },
    {
      icon: TrendingUp,
      title: 'Dynamic Bonding Curve',
      description: 'ML-optimized graduation thresholds',
      color: 'text-green-400',
    },
    {
      icon: Lock,
      title: 'DAMM v2 NFT Positions',
      description: 'Tradeable LP positions with fee claiming',
      color: 'text-yellow-400',
    },
  ];

  const agentCapabilities = [
    {
      icon: Brain,
      title: 'MeTTa Symbolic Reasoning',
      description: 'Hypergraph knowledge for optimal configurations',
    },
    {
      icon: Bot,
      title: 'Multi-Agent Coordination',
      description: 'Launch, Liquidity & Risk agents working together',
    },
    {
      icon: Activity,
      title: '24/7 Autonomous Management',
      description: 'Auto-rebalancing, fee optimization, risk monitoring',
    },
  ];

  // Fetch AI recommendations when form data changes
  useEffect(() => {
    if (formData.symbol && formData.targetMarketCap && formData.category) {
      fetchAIRecommendations();
    }
  }, [formData.symbol, formData.targetMarketCap, formData.category, formData.riskTolerance]);

  const fetchAIRecommendations = async () => {
    if (!formData.symbol || !formData.targetMarketCap) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/launch/ai-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenSymbol: formData.symbol,
          category: formData.category,
          targetMarketCap: parseFloat(formData.targetMarketCap) || 100000,
          riskTolerance: formData.riskTolerance,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendation(data);
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      toast.error('Please connect your wallet first');
      // Trigger wallet connection
      try {
        await connect();
      } catch (err) {
        console.error('Wallet connection error:', err);
      }
      return;
    }

    setLoading(true);
    setLaunchStage('Initializing...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/launch/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.jobId);
        toast.success('🚀 Token launch initiated!');
        toast.info(`Job ID: ${data.jobId}`);
        setLaunchStage('Processing...');
        
        // Poll for job status
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'Failed to create launch');
        setLaunchStage('');
      }
    } catch (error) {
      console.error('Launch error:', error);
      toast.error('Failed to create launch');
      setLaunchStage('');
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 60 seconds timeout
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/launch/${jobId}/status`);
        const data = await response.json();

        if (data.state === 'completed') {
          clearInterval(poll);
          setLaunchStage('Completed!');
          toast.success('✅ Token launch completed successfully!');
          
          // Show results
          if (data.data) {
            toast.success(`Token: ${data.data.tokenMint}`);
          }
        } else if (data.state === 'failed') {
          clearInterval(poll);
          setLaunchStage('Failed');
          toast.error('Launch failed. Check logs for details.');
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setLaunchStage('Timeout');
          toast.warning('Launch taking longer than expected. Check job status manually.');
        } else {
          // Update stage based on progress
          if (data.progress) {
            if (data.progress >= 75) setLaunchStage('Creating bonding curve...');
            else if (data.progress >= 50) setLaunchStage('Creating presale vault...');
            else if (data.progress >= 20) setLaunchStage('Initializing Meteora...');
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 1000); // Poll every second
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <motion.div 
              className="flex items-center justify-center gap-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <Rocket className="text-primary-500" size={48} />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                Launch Your Token
              </h1>
            </motion.div>
            
            <p className="text-dark-400 text-xl max-w-3xl mx-auto">
              First <span className="text-primary-400 font-semibold">autonomous AI-powered</span> token launchpad on Solana
              <br />
              <span className="text-sm">Powered by Meteora DLMM, DBC, DAMM v2 + Fetch.ai uAgents + MeTTa Reasoning</span>
            </p>

            {/* Wallet Connection */}
            {!connected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4"
              >
                <WalletMultiButton className="!bg-primary-500 hover:!bg-primary-600 !rounded-xl !h-12 !px-8 !text-base !font-semibold transition-all" />
              </motion.div>
            )}
          </div>

          {/* Innovation Showcase */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {meteoraFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card border border-dark-700 hover:border-primary-500/50 transition-all"
              >
                <feature.icon className={`${feature.color} mb-3`} size={32} />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-dark-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Form */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Launch Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="text-primary-500" />
                  Token Configuration
                </h2>

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
                      placeholder="e.g., Super Doge"
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
                      placeholder="e.g., SDOGE"
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
                      <option value="meme">🎭 Meme - EXPONENTIAL curve, FCFS presale</option>
                      <option value="utility">⚙️ Utility - LINEAR curve, PRO_RATA presale</option>
                      <option value="governance">🏛️ Governance - LOGARITHMIC curve, PRO_RATA</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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
                        placeholder="1000000"
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
                        placeholder="100000"
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* Risk Tolerance */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Risk Tolerance (Affects Anti-Sniper Settings)
                    </label>
                    <select
                      name="riskTolerance"
                      value={formData.riskTolerance}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="low">🛡️ Low - Maximum protection (5% initial fees)</option>
                      <option value="medium">⚖️ Medium - Balanced (3% initial fees)</option>
                      <option value="high">⚡ High - Fast launch (2% initial fees)</option>
                    </select>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-2"
                  >
                    <Zap size={16} />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Meteora Settings
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 border-t border-dark-700 pt-4"
                      >
                        <h3 className="font-semibold text-primary-400 flex items-center gap-2">
                          <Shield size={20} />
                          Meteora Anti-Sniper Suite
                        </h3>
                        
                        <div className="grid gap-3 text-sm">
                          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
                            <CheckCircle2 className="text-green-400 mt-0.5" size={18} />
                            <div>
                              <div className="font-medium">Fee Scheduler</div>
                              <div className="text-dark-400">Dynamic fees decay from {formData.riskTolerance === 'low' ? '5%' : formData.riskTolerance === 'medium' ? '3%' : '2%'} → 1% over 60 minutes</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
                            <CheckCircle2 className="text-green-400 mt-0.5" size={18} />
                            <div>
                              <div className="font-medium">Alpha Vault (Pre-Launch Access)</div>
                              <div className="text-dark-400">Early supporters get priority before public trading starts</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg">
                            <CheckCircle2 className="text-green-400 mt-0.5" size={18} />
                            <div>
                              <div className="font-medium">Rate Limiter</div>
                              <div className="text-dark-400">Large trades incur higher fees to prevent manipulation</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Launch Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !connected}
                    className={`w-full btn-primary h-14 text-lg font-bold flex items-center justify-center gap-3 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: connected ? 1.02 : 1 }}
                    whileTap={{ scale: connected ? 0.98 : 1 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Activity size={24} />
                        </motion.div>
                        {launchStage || 'Processing...'}
                      </>
                    ) : !connected ? (
                      <>
                        <Shield size={24} />
                        Connect Wallet to Launch
                      </>
                    ) : (
                      <>
                        <Rocket size={24} />
                        Launch Token with AI Agents
                      </>
                    )}
                  </motion.button>

                  {/* Launch Progress */}
                  <AnimatePresence>
                    {launchStage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-dark-800 border border-primary-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            <Bot className="text-primary-400" size={24} />
                          </motion.div>
                          <div>
                            <div className="font-semibold">AI Agents Working...</div>
                            <div className="text-sm text-dark-400">{launchStage}</div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-dark-400">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            LaunchCoordinator: Configuring presale vault
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            LiquidityOptimizer: Setting up DLMM pool
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-yellow-400 animate-pulse" />
                            RiskAnalyzer: Analyzing market conditions
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Agent Capabilities Showcase */}
              <div className="card bg-gradient-to-br from-primary-900/20 to-purple-900/20 border border-primary-500/30">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="text-primary-400" />
                  Autonomous AI Agent System
                </h3>
                
                <div className="space-y-3">
                  {agentCapabilities.map((capability, i) => (
                    <motion.div
                      key={capability.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <capability.icon className="text-primary-400 mt-1" size={20} />
                      <div>
                        <div className="font-medium">{capability.title}</div>
                        <div className="text-sm text-dark-400">{capability.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: AI Recommendations */}
            <div className="space-y-6">
              {/* AI Recommendation Card */}
              <motion.div
                className="card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-purple-400" size={24} />
                  <h3 className="text-xl font-bold">AI Recommendation</h3>
                  {aiLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Activity className="text-purple-400" size={18} />
                    </motion.div>
                  )}
                </div>

                {aiRecommendation ? (
                  <div className="space-y-4">
                    {/* Recommendations */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-800 p-3 rounded-lg">
                        <div className="text-xs text-dark-400 mb-1">Graduation Threshold</div>
                        <div className="text-lg font-bold text-green-400">
                          ${aiRecommendation.recommendations.graduationThreshold.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-dark-800 p-3 rounded-lg">
                        <div className="text-xs text-dark-400 mb-1">Initial Price</div>
                        <div className="text-lg font-bold text-blue-400">
                          ${aiRecommendation.recommendations.initialPrice.toFixed(6)}
                        </div>
                      </div>

                      <div className="bg-dark-800 p-3 rounded-lg">
                        <div className="text-xs text-dark-400 mb-1">Bonding Curve</div>
                        <div className="text-sm font-bold text-purple-400">
                          {aiRecommendation.recommendations.curveType}
                        </div>
                      </div>

                      <div className="bg-dark-800 p-3 rounded-lg">
                        <div className="text-xs text-dark-400 mb-1">Presale Mode</div>
                        <div className="text-sm font-bold text-yellow-400">
                          {aiRecommendation.recommendations.presaleMode}
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-dark-800 p-4 rounded-lg border border-purple-500/20">
                      <div className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-2">
                        <Brain size={14} />
                        MeTTa Reasoning Engine
                      </div>
                      <p className="text-sm text-dark-300">{aiRecommendation.reasoning}</p>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">AI Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-dark-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-green-500 to-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${aiRecommendation.confidence * 100}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <span className="font-bold text-green-400">
                          {(aiRecommendation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Agent Badge */}
                    <div className="text-xs text-dark-500 flex items-center gap-2">
                      <Bot size={12} />
                      Generated by {aiRecommendation.agentName} Agent
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-500">
                    <Brain className="mx-auto mb-3 opacity-50" size={48} />
                    <p>Fill in token details to get AI-powered recommendations</p>
                    <p className="text-xs mt-2">Powered by MeTTa symbolic reasoning</p>
                  </div>
                )}
              </motion.div>

              {/* Meteora Features Card */}
              <div className="card border border-primary-500/30">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Target className="text-primary-400" />
                  What You Get
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Waves className="text-blue-400 mt-0.5" size={16} />
                    <div>
                      <div className="font-medium">DLMM Presale Vault</div>
                      <div className="text-dark-400">Vesting schedules + anti-bot protection</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <LineChart className="text-green-400 mt-0.5" size={16} />
                    <div>
                      <div className="font-medium">Dynamic Bonding Curve</div>
                      <div className="text-dark-400">Auto-migration to DAMM v2 at threshold</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="text-yellow-400 mt-0.5" size={16} />
                    <div>
                      <div className="font-medium">Dynamic Fee Sharing</div>
                      <div className="text-dark-400">Creator fees + automated management</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="text-purple-400 mt-0.5" size={16} />
                    <div>
                      <div className="font-medium">Automated Liquidity</div>
                      <div className="text-dark-400">AI agents manage post-launch optimization</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Innovation Badge */}
              <div className="card bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <Zap className="text-green-400" size={24} />
                  <div>
                    <h4 className="font-bold text-green-400 mb-1">Industry First</h4>
                    <p className="text-sm text-dark-300">
                      First platform combining <span className="font-semibold text-primary-400">Fetch.ai uAgents</span> multi-agent coordination with <span className="font-semibold text-purple-400">Meteora's October 2025 release</span> (Presale Vaults, DBC, DAMM v2, Dynamic Fees)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Live Agent Dashboard */}
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="text-primary-400" />
                Live Agent Status
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-dark-800 p-4 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    <div className="font-medium">LaunchCoordinator</div>
                  </div>
                  <div className="text-xs text-dark-400">
                    Ready to configure Presale Vaults & DBC
                  </div>
                </div>

                <div className="bg-dark-800 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                    <div className="font-medium">LiquidityOptimizer</div>
                  </div>
                  <div className="text-xs text-dark-400">
                    Monitoring DAMM v2 positions for rebalancing
                  </div>
                </div>

                <div className="bg-dark-800 p-4 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse" />
                    <div className="font-medium">RiskAnalyzer</div>
                  </div>
                  <div className="text-xs text-dark-400">
                    Using MeTTa to assess market risks
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
