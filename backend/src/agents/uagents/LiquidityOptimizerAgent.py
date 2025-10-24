"""
LiquidityOptimizerAgent - ASI Alliance uAgent
Deployed on Agentverse for autonomous DAMM v2 position management

Responsibilities:
- Monitor DAMM v2 positions 24/7
- Analyze optimal rebalancing opportunities using MeTTa
- Execute rebalancing via Solana Execution Agent
- Harvest and compound trading fees
- Update MeTTa knowledge graph with liquidity patterns
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from hyperon import MeTTa
from datetime import datetime, timedelta
from decimal import Decimal
import asyncio
import json

# Initialize agent
liquidity_optimizer = Agent(
    name="liquidity_optimizer",
    seed="launchpad_ai_liquidity_secret_seed",
    port=8002,
    endpoint=["http://localhost:8002/submit"],
)

# Fund agent if needed
fund_agent_if_low(liquidity_optimizer.wallet.address())

# Initialize MeTTa for symbolic reasoning
metta = MeTTa()

# Load liquidity optimization knowledge
LIQUIDITY_KB_PATH = "../../metta/liquidity_patterns.metta"
# metta.run(open(LIQUIDITY_KB_PATH).read())

# Agent state
agent_state = {
    "monitored_positions": {},  # position_id -> {pool, metrics, last_check}
    "rebalancing_history": [],
    "performance_metrics": {
        "total_fees_harvested": Decimal("0"),
        "successful_rebalances": 0,
        "failed_rebalances": 0,
        "avg_apr_improvement": 0.0,
    },
    "solana_execution_agent": "agent1qw5jy8gp8r9x2n3k4m5l6v7w8x9y0z1a2b3c4d5e6f7g8h9",
}


class DAMMPosition:
    """Represents a DAMM v2 liquidity position"""
    def __init__(self, position_id: str, pool_address: str, token_a: str, token_b: str):
        self.position_id = position_id
        self.pool_address = pool_address
        self.token_a = token_a
        self.token_b = token_b
        self.current_range = {"lower": 0.0, "upper": 0.0}
        self.liquidity_amount = Decimal("0")
        self.unclaimed_fees = Decimal("0")
        self.apr = 0.0
        self.impermanent_loss = 0.0
        self.last_rebalance = None


async def analyze_rebalancing_opportunity_with_metta(position: DAMMPosition) -> dict:
    """
    Use MeTTa symbolic reasoning to determine if rebalancing is optimal
    """
    print(f"🧠 Analyzing rebalancing opportunity for position {position.position_id}")

    # Build MeTTa query for optimal liquidity range
    query = f"""
    (predict-optimal-liquidity-range
      (pool "{position.pool_address}")
      (current-price {get_current_price(position)})
      (volatility {get_volatility_24h(position)})
      (volume-24h {get_volume_24h(position)})
      (current-range-lower {position.current_range['lower']})
      (current-range-upper {position.current_range['upper']}))
    """

    try:
        # Execute MeTTa query
        result = metta.run(query)

        # Parse optimal range (simplified for demo)
        optimal_range = {
            "lower": 0.95,  # Would come from MeTTa
            "upper": 1.05,
            "confidence": 0.89,
            "expected_apr_improvement": 12.5,  # percentage points
            "reasoning": "Based on historical volatility and volume patterns"
        }

        # Determine if rebalancing is worthwhile
        should_rebalance = (
            optimal_range["expected_apr_improvement"] > 5.0  # > 5% APR improvement
            and optimal_range["confidence"] > 0.80
            and (datetime.utcnow() - position.last_rebalance).days >= 1  # Min 1 day between rebalances
        )

        return {
            "should_rebalance": should_rebalance,
            "optimal_range": optimal_range,
            "current_efficiency": calculate_capital_efficiency(position),
            "estimated_gas_cost": 0.001,  # SOL
            "estimated_profit": optimal_range["expected_apr_improvement"] * float(position.liquidity_amount) * 0.01,
        }

    except Exception as e:
        print(f"❌ MeTTa analysis failed: {e}")
        return {
            "should_rebalance": False,
            "error": str(e)
        }


async def harvest_fees_if_profitable(position: DAMMPosition) -> bool:
    """
    Harvest trading fees if gas cost is justified
    """
    if position.unclaimed_fees < Decimal("1.0"):  # < $1
        return False

    gas_cost = Decimal("0.001")  # SOL ~$0.10
    if position.unclaimed_fees < gas_cost * 2:  # Need 2x gas cost minimum
        return False

    print(f"💰 Harvesting ${position.unclaimed_fees} in fees...")

    # Send harvest instruction to Solana Execution Agent
    await send_to_solana_agent({
        "action": "harvest_fees",
        "position_id": position.position_id,
        "pool_address": position.pool_address,
    })

    agent_state["performance_metrics"]["total_fees_harvested"] += position.unclaimed_fees
    position.unclaimed_fees = Decimal("0")

    return True


async def execute_rebalancing(position: DAMMPosition, optimal_range: dict) -> bool:
    """
    Execute position rebalancing via Solana Execution Agent
    """
    print(f"🔄 Executing rebalancing for position {position.position_id}")
    print(f"   Current range: {position.current_range['lower']:.4f} - {position.current_range['upper']:.4f}")
    print(f"   Optimal range: {optimal_range['lower']:.4f} - {optimal_range['upper']:.4f}")

    try:
        # Send rebalancing instruction
        result = await send_to_solana_agent({
            "action": "rebalance_position",
            "position_id": position.position_id,
            "pool_address": position.pool_address,
            "new_range": {
                "lower": optimal_range['lower'],
                "upper": optimal_range['upper'],
            },
            "liquidity_amount": str(position.liquidity_amount),
        })

        if result.get("success"):
            # Update position state
            position.current_range = {
                "lower": optimal_range['lower'],
                "upper": optimal_range['upper'],
            }
            position.last_rebalance = datetime.utcnow()

            # Record successful rebalance
            agent_state["performance_metrics"]["successful_rebalances"] += 1
            agent_state["rebalancing_history"].append({
                "position_id": position.position_id,
                "timestamp": datetime.utcnow().isoformat(),
                "old_range": position.current_range,
                "new_range": optimal_range,
                "expected_improvement": optimal_range.get('expected_apr_improvement', 0),
            })

            # Update MeTTa knowledge graph
            await update_metta_with_rebalancing_result(position, optimal_range, success=True)

            print(f"✅ Rebalancing completed successfully")
            return True

        else:
            agent_state["performance_metrics"]["failed_rebalances"] += 1
            print(f"❌ Rebalancing failed: {result.get('error')}")
            return False

    except Exception as e:
        agent_state["performance_metrics"]["failed_rebalances"] += 1
        print(f"❌ Rebalancing error: {e}")
        return False


async def update_metta_with_rebalancing_result(position: DAMMPosition, optimal_range: dict, success: bool):
    """
    Store rebalancing outcome in MeTTa for continuous learning
    """
    rebalancing_data = f"""
    (rebalancing-result
      (position "{position.position_id}")
      (pool "{position.pool_address}")
      (timestamp "{datetime.utcnow().isoformat()}")
      (old-range-lower {position.current_range['lower']})
      (old-range-upper {position.current_range['upper']})
      (new-range-lower {optimal_range['lower']})
      (new-range-upper {optimal_range['upper']})
      (expected-improvement {optimal_range.get('expected_apr_improvement', 0)})
      (success {str(success).lower()}))
    """
    metta.run(rebalancing_data)


@liquidity_optimizer.on_interval(period=300.0)  # Every 5 minutes
async def monitor_positions(ctx: Context):
    """
    Continuously monitor all DAMM v2 positions
    """
    ctx.logger.info("👀 Monitoring DAMM v2 positions...")

    for position_id, position_data in list(agent_state["monitored_positions"].items()):
        position = DAMMPosition(
            position_id=position_id,
            pool_address=position_data["pool_address"],
            token_a=position_data["token_a"],
            token_b=position_data["token_b"],
        )

        # Refresh position metrics
        await update_position_metrics(position)

        # Check if fee harvesting is profitable
        if position.unclaimed_fees > Decimal("1.0"):
            await harvest_fees_if_profitable(position)

        # Analyze rebalancing opportunity
        analysis = await analyze_rebalancing_opportunity_with_metta(position)

        if analysis.get("should_rebalance"):
            ctx.logger.info(f"💡 Rebalancing opportunity detected for {position_id}")
            ctx.logger.info(f"   Expected APR improvement: {analysis['optimal_range']['expected_apr_improvement']:.1f}%")

            await execute_rebalancing(position, analysis["optimal_range"])

        # Update monitoring state
        agent_state["monitored_positions"][position_id]["last_check"] = datetime.utcnow().isoformat()


@liquidity_optimizer.on_message(model=dict)
async def handle_messages(ctx: Context, sender: str, msg: dict):
    """
    Handle messages from other agents or users
    """
    action = msg.get("action")

    if action == "add_position":
        # Add new position to monitoring
        position_id = msg.get("position_id")
        agent_state["monitored_positions"][position_id] = {
            "pool_address": msg.get("pool_address"),
            "token_a": msg.get("token_a"),
            "token_b": msg.get("token_b"),
            "added_at": datetime.utcnow().isoformat(),
            "last_check": None,
        }
        ctx.logger.info(f"✅ Added position {position_id} to monitoring")

        await ctx.send(sender, {
            "action": "position_added",
            "position_id": position_id,
            "status": "monitoring",
        })

    elif action == "get_performance":
        # Return performance metrics
        await ctx.send(sender, {
            "action": "performance_report",
            "metrics": agent_state["performance_metrics"],
            "monitored_positions_count": len(agent_state["monitored_positions"]),
            "recent_rebalances": agent_state["rebalancing_history"][-10:],
        })

    elif action == "remove_position":
        # Stop monitoring a position
        position_id = msg.get("position_id")
        if position_id in agent_state["monitored_positions"]:
            del agent_state["monitored_positions"][position_id]
            ctx.logger.info(f"✅ Removed position {position_id} from monitoring")


# Helper functions
async def send_to_solana_agent(msg: dict) -> dict:
    """Send message to Solana Execution Agent"""
    # Would use actual uAgent messaging
    return {"success": True}


async def update_position_metrics(position: DAMMPosition):
    """Refresh position metrics from blockchain"""
    # Would query actual Solana blockchain
    pass


def get_current_price(position: DAMMPosition) -> float:
    """Get current pool price"""
    return 1.0  # Mock


def get_volatility_24h(position: DAMMPosition) -> float:
    """Get 24h price volatility"""
    return 0.15  # 15%


def get_volume_24h(position: DAMMPosition) -> float:
    """Get 24h trading volume"""
    return 100000.0


def calculate_capital_efficiency(position: DAMMPosition) -> float:
    """Calculate current capital efficiency"""
    return 0.75  # 75%


if __name__ == "__main__":
    print("=" * 60)
    print("💧 LaunchPad AI - Liquidity Optimizer Agent")
    print("=" * 60)
    print(f"Agent Address: {liquidity_optimizer.address}")
    print(f"Agent Name: {liquidity_optimizer.name}")
    print("")
    print("🤖 Capabilities:")
    print("  • 24/7 DAMM v2 position monitoring")
    print("  • MeTTa-powered rebalancing optimization")
    print("  • Automatic fee harvesting")
    print("  • Capital efficiency maximization")
    print("  • Continuous learning from outcomes")
    print("")
    print("📊 Current Performance:")
    print(f"  • Monitored Positions: {len(agent_state['monitored_positions'])}")
    print(f"  • Total Fees Harvested: ${agent_state['performance_metrics']['total_fees_harvested']}")
    print(f"  • Successful Rebalances: {agent_state['performance_metrics']['successful_rebalances']}")
    print("")
    print("🌐 Ready to optimize liquidity!")
    print("=" * 60)

    liquidity_optimizer.run()
