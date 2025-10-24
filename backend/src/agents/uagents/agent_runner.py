"""
Agent Runner - Dynamically starts the specified uAgent
Based on UAGENT_NAME environment variable
"""

import os
import sys
import importlib.util

def main():
    agent_name = os.getenv('UAGENT_NAME', 'launch_coordinator')

    print("=" * 60)
    print(f"🚀 Starting uAgent: {agent_name}")
    print("=" * 60)

    # Map agent names to their Python files
    agent_files = {
        'launch_coordinator': 'LaunchCoordinatorAgent.py',
        'liquidity_optimizer': 'LiquidityOptimizerAgent.py',
        'risk_analyzer': 'RiskAnalyzerAgent.py',
    }

    if agent_name not in agent_files:
        print(f"❌ Unknown agent: {agent_name}")
        sys.exit(1)

    agent_file = agent_files[agent_name]
    agent_path = os.path.join(os.path.dirname(__file__), agent_file)

    if not os.path.exists(agent_path):
        print(f"❌ Agent file not found: {agent_path}")
        sys.exit(1)

    # Dynamically import and run the agent
    spec = importlib.util.spec_from_file_location(agent_name, agent_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules[agent_name] = module
        spec.loader.exec_module(module)
    else:
        print(f"❌ Failed to load agent: {agent_name}")
        sys.exit(1)

if __name__ == "__main__":
    main()
