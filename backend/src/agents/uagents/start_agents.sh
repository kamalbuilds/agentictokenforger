#!/bin/bash

# Start all uAgents for SOLTokenForger
# This script starts the three Python agents in the background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🤖 Starting SOLTokenForger uAgents..."
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+"
    exit 1
fi

# Check if dependencies are installed
echo "📦 Checking Python dependencies..."
python3 -c "import uagents" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  uagents not installed. Installing dependencies..."
    python3 -m pip install -r "$SCRIPT_DIR/requirements.txt"
fi

echo "✅ Dependencies ready"
echo ""

# Start LaunchCoordinatorAgent
echo "🚀 Starting LaunchCoordinatorAgent..."
nohup python3 "$SCRIPT_DIR/LaunchCoordinatorAgent.py" > "$SCRIPT_DIR/logs/launch_coordinator.log" 2>&1 &
LAUNCH_PID=$!
echo "   PID: $LAUNCH_PID"
echo "   Log: $SCRIPT_DIR/logs/launch_coordinator.log"

sleep 2

# Start LiquidityOptimizerAgent
echo "💧 Starting LiquidityOptimizerAgent..."
nohup python3 "$SCRIPT_DIR/LiquidityOptimizerAgent.py" > "$SCRIPT_DIR/logs/liquidity_optimizer.log" 2>&1 &
LIQUIDITY_PID=$!
echo "   PID: $LIQUIDITY_PID"
echo "   Log: $SCRIPT_DIR/logs/liquidity_optimizer.log"

sleep 2

# Start RiskAnalyzerAgent
echo "🔍 Starting RiskAnalyzerAgent..."
nohup python3 "$SCRIPT_DIR/RiskAnalyzerAgent.py" > "$SCRIPT_DIR/logs/risk_analyzer.log" 2>&1 &
RISK_PID=$!
echo "   PID: $RISK_PID"
echo "   Log: $SCRIPT_DIR/logs/risk_analyzer.log"

echo ""
echo "✅ All agents started successfully!"
echo ""
echo "Agent PIDs:"
echo "  LaunchCoordinator: $LAUNCH_PID"
echo "  LiquidityOptimizer: $LIQUIDITY_PID"
echo "  RiskAnalyzer: $RISK_PID"
echo ""
echo "To stop agents:"
echo "  kill $LAUNCH_PID $LIQUIDITY_PID $RISK_PID"
echo ""
echo "To view logs:"
echo "  tail -f $SCRIPT_DIR/logs/*.log"

