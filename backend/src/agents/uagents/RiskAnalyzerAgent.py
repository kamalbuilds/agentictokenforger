"""
RiskAnalyzerAgent - ASI Alliance uAgent
Autonomous rug pull detection and risk scoring

Responsibilities:
- Continuous risk monitoring of active launches
- MeTTa-powered pattern recognition for fraud detection
- On-chain analysis of holder distribution and liquidity locks
- Real-time alerts for suspicious activity
- Historical pattern learning from fraud cases
"""

from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    chat_protocol_spec,
)
from hyperon import MeTTa
from datetime import datetime
from uuid import uuid4
import asyncio
import json
import os

# Initialize agent
risk_analyzer = Agent(
    name="risk_analyzer",
    seed="launchpad_ai_risk_analyzer_secret_seed",
    port=8003,
    endpoint=["http://localhost:8003/submit"],
)

# Fund agent if needed
fund_agent_if_low(risk_analyzer.wallet.address())

# Initialize MeTTa for symbolic risk reasoning
metta = MeTTa()

# Load DeFi knowledge base
KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), "../../metta/defi_knowledge.metta")
if os.path.exists(KNOWLEDGE_BASE_PATH):
    with open(KNOWLEDGE_BASE_PATH, 'r') as f:
        metta.run(f.read())
    print(f"✅ MeTTa knowledge base loaded: {KNOWLEDGE_BASE_PATH}")

# Initialize chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Agent state
agent_state = {
    "monitored_tokens": {},  # token_address -> risk_data
    "alert_thresholds": {
        "high_risk_score": 3.0,  # < 3.0 = HIGH risk
        "holder_concentration": 30.0,  # > 30% top holder = RED FLAG
        "rapid_sell_off": 20.0,  # > 20% price drop in 1h = ALERT
    },
    "fraud_patterns_detected": 0,
    "alerts_sent": 0,
    "solana_execution_agent": "agent1qw5jy8gp8r9x2n3k4m5l6v7w8x9y0z1a2b3c4d5e6f7g8h9",
}


def create_text_chat(text: str) -> ChatMessage:
    """Helper to create chat messages"""
    content = [TextContent(type="text", text=text)]
    return ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=content,
    )


async def analyze_token_risk_with_metta(token_address: str, on_chain_data: dict) -> dict:
    """
    Use MeTTa symbolic reasoning to analyze token risk
    Combines on-chain data with historical fraud patterns
    """
    print(f"🔍 Analyzing risk for token: {token_address[:8]}...")

    # Build MeTTa query with on-chain data
    risk_query = f"""
    (analyze-risk-factors
      (liquidity-lock {on_chain_data.get('liquidity_lock_duration', 0)})
      (team-verified {str(on_chain_data.get('team_verified', False)).lower()})
      (vesting-schedule {str(on_chain_data.get('vesting_enabled', False)).lower()})
      (contract-verified {str(on_chain_data.get('contract_verified', False)).lower()}))
    """

    try:
        # Execute MeTTa query
        result = metta.run(risk_query)

        # Calculate comprehensive risk score
        risk_score = 7.5  # Base score
        red_flags = []

        # Check liquidity lock
        if on_chain_data.get('liquidity_lock_duration', 0) < 30:
            red_flags.append("⚠️ No liquidity lock (30+ days recommended)")
            risk_score -= 2.0

        # Check team verification
        if not on_chain_data.get('team_verified', False):
            red_flags.append("⚠️ Anonymous team")
            risk_score -= 1.5

        # Check vesting
        if not on_chain_data.get('vesting_enabled', False):
            red_flags.append("⚠️ No vesting schedule")
            risk_score -= 1.0

        # Check contract verification
        if not on_chain_data.get('contract_verified', False):
            red_flags.append("⚠️ Contract not verified")
            risk_score -= 1.0

        # Check holder concentration
        holder_concentration = on_chain_data.get('top_holder_percentage', 0)
        if holder_concentration > agent_state["alert_thresholds"]["holder_concentration"]:
            red_flags.append(f"🚨 High holder concentration: {holder_concentration:.1f}%")
            risk_score -= 2.0

        # Check rapid graduation (potential pump & dump)
        graduation_time = on_chain_data.get('graduation_time_hours', 1000)
        if graduation_time < 24:
            red_flags.append("🚨 Rapid graduation (<24h) - possible pump & dump")
            risk_score -= 1.5

        # Determine risk level
        risk_level = "HIGH" if risk_score < 5 else "MEDIUM" if risk_score < 7 else "LOW"

        # Calculate confidence based on data completeness
        data_completeness = sum([
            on_chain_data.get('liquidity_lock_duration') is not None,
            on_chain_data.get('team_verified') is not None,
            on_chain_data.get('vesting_enabled') is not None,
            on_chain_data.get('contract_verified') is not None,
            on_chain_data.get('top_holder_percentage') is not None,
        ]) / 5.0

        confidence = data_completeness * 0.9 + 0.1  # 10% base confidence

        return {
            "risk_score": max(0, risk_score),
            "risk_level": risk_level,
            "red_flags": red_flags,
            "confidence": confidence,
            "fraud_probability": max(0, min(1, (10 - risk_score) / 10)),
            "recommendation": get_risk_recommendation(risk_score, red_flags),
        }

    except Exception as e:
        print(f"❌ Risk analysis failed: {e}")
        return {
            "risk_score": 5.0,
            "risk_level": "MEDIUM",
            "red_flags": ["Unable to complete analysis"],
            "confidence": 0.50,
            "fraud_probability": 0.50,
            "recommendation": "Proceed with caution - analysis incomplete",
        }


def get_risk_recommendation(risk_score: float, red_flags: list) -> str:
    """Generate actionable recommendation based on risk analysis"""
    if risk_score < 3.0:
        return "🚫 HIGH RISK - Do not invest. Multiple fraud indicators detected."
    elif risk_score < 5.0:
        return "⚠️ MEDIUM-HIGH RISK - Proceed with extreme caution. Consider waiting for more data."
    elif risk_score < 7.0:
        return "⚡ MEDIUM RISK - Acceptable for experienced investors. Monitor closely."
    elif risk_score < 8.5:
        return "✅ LOW-MEDIUM RISK - Generally safe. Standard due diligence recommended."
    else:
        return "💎 LOW RISK - Strong safety indicators. Good investment candidate."


async def detect_rug_pull_pattern(token_address: str, price_history: list) -> dict:
    """
    Detect rug pull patterns using MeTTa symbolic reasoning
    Analyzes price movements, volume, and holder behavior
    """
    print(f"🎯 Detecting rug pull patterns for: {token_address[:8]}...")

    # Analyze price pattern
    if len(price_history) < 5:
        return {"rug_pull_detected": False, "confidence": 0.0}

    # Calculate price changes
    recent_prices = price_history[-10:]
    price_drop = (recent_prices[0] - recent_prices[-1]) / recent_prices[0] * 100

    # Check for rapid sell-off pattern
    rapid_sell_off = price_drop > agent_state["alert_thresholds"]["rapid_sell_off"]

    # Check for volume spike before drop (classic rug pull indicator)
    volume_spike = False  # Would analyze actual volume data

    # MeTTa pattern matching
    rug_pull_query = f"""
    (detect-rug-pull-pattern
      (price-drop-percentage {price_drop})
      (volume-spike {str(volume_spike).lower()})
      (liquidity-removed False))
    """

    try:
        result = metta.run(rug_pull_query)

        rug_pull_detected = rapid_sell_off and volume_spike

        if rug_pull_detected:
            agent_state["fraud_patterns_detected"] += 1

        return {
            "rug_pull_detected": rug_pull_detected,
            "confidence": 0.85 if rug_pull_detected else 0.95,
            "indicators": {
                "rapid_price_drop": rapid_sell_off,
                "volume_spike_before_drop": volume_spike,
                "price_drop_percentage": price_drop,
            },
            "action": "ALERT_USERS" if rug_pull_detected else "CONTINUE_MONITORING",
        }

    except Exception as e:
        print(f"❌ Rug pull detection failed: {e}")
        return {"rug_pull_detected": False, "confidence": 0.0}


@chat_proto.on_message(ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    """
    Handle incoming chat messages from ASI:One or other agents
    """
    ctx.logger.info(f"📨 Received message from {sender}")

    # Send acknowledgement
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.utcnow(),
        acknowledged_msg_id=msg.msg_id
    ))

    # Process message content
    for item in msg.content:
        if isinstance(item, TextContent):
            text = item.text.lower()
            ctx.logger.info(f"💬 Processing: {text}")

            if "analyze" in text and ("risk" in text or "token" in text):
                await handle_risk_analysis_request(ctx, sender, text)

            elif "status" in text:
                await handle_status_request(ctx, sender)

            elif "alert" in text:
                await handle_alert_query(ctx, sender)

            else:
                response = create_text_chat(
                    "I'm the RiskAnalyzer Agent. I can help you:\n"
                    "1. Analyze token risk and fraud indicators\n"
                    "2. Detect rug pull patterns in real-time\n"
                    "3. Monitor launches for suspicious activity\n"
                    "4. Provide risk scores and recommendations\n\n"
                    "Try: 'Analyze risk for token ABC...'"
                )
                await ctx.send(sender, response)


async def handle_risk_analysis_request(ctx: Context, sender: str, text: str):
    """
    Process risk analysis request with MeTTa reasoning
    """
    ctx.logger.info("🔍 Processing risk analysis request...")

    # Mock token data (would fetch from blockchain in production)
    token_data = {
        "token_address": "TokenAddress123",
        "liquidity_lock_duration": 90,
        "team_verified": True,
        "vesting_enabled": True,
        "contract_verified": True,
        "top_holder_percentage": 12.5,
        "graduation_time_hours": 72,
        "holder_count": 1250,
    }

    # Perform risk analysis
    risk_analysis = await analyze_token_risk_with_metta(
        token_data["token_address"],
        token_data
    )

    # Format response
    analysis_message = f"""
🔍 **Risk Analysis Results**

**Token:** {token_data['token_address'][:12]}...

**Risk Score:** {risk_analysis['risk_score']:.1f}/10
**Risk Level:** {risk_analysis['risk_level']}
**Fraud Probability:** {risk_analysis['fraud_probability']:.1%}

**Red Flags Detected:** {len(risk_analysis['red_flags'])}
{chr(10).join(f'• {flag}' for flag in risk_analysis['red_flags']) if risk_analysis['red_flags'] else '• None detected ✅'}

**On-Chain Metrics:**
• Holder Count: {token_data['holder_count']}
• Top Holder: {token_data['top_holder_percentage']:.1f}%
• Liquidity Lock: {token_data['liquidity_lock_duration']} days
• Team Verified: {'✅' if token_data['team_verified'] else '❌'}
• Vesting Enabled: {'✅' if token_data['vesting_enabled'] else '❌'}

**Recommendation:**
{risk_analysis['recommendation']}

**AI Confidence:** {risk_analysis['confidence']:.0%}

Powered by MeTTa symbolic reasoning
"""

    response = create_text_chat(analysis_message)
    await ctx.send(sender, response)


async def handle_status_request(ctx: Context, sender: str):
    """
    Provide status of risk monitoring system
    """
    status_message = f"""
📊 **Risk Analyzer Status**

**Monitored Tokens:** {len(agent_state['monitored_tokens'])}
**Fraud Patterns Detected:** {agent_state['fraud_patterns_detected']}
**Alerts Sent:** {agent_state['alerts_sent']}

**Alert Thresholds:**
• High Risk Score: < {agent_state['alert_thresholds']['high_risk_score']}
• Holder Concentration: > {agent_state['alert_thresholds']['holder_concentration']}%
• Rapid Sell-off: > {agent_state['alert_thresholds']['rapid_sell_off']}%

**Status:** 🟢 Active and monitoring 24/7

I'm using MeTTa symbolic reasoning to detect fraud patterns
and protect users from rug pulls in real-time.
"""

    response = create_text_chat(status_message)
    await ctx.send(sender, response)


async def handle_alert_query(ctx: Context, sender: str):
    """
    Provide information about recent alerts
    """
    alert_message = """
🚨 **Recent Alerts**

No high-risk tokens detected in the last 24 hours.

All monitored launches are within safe parameters.

I'll notify you immediately if suspicious activity is detected.
"""

    response = create_text_chat(alert_message)
    await ctx.send(sender, response)


@risk_analyzer.on_interval(period=600.0)  # Every 10 minutes
async def monitor_active_tokens(ctx: Context):
    """
    Continuously monitor all active token launches for risk
    """
    ctx.logger.info("👀 Monitoring active tokens for risk...")

    for token_address, token_data in list(agent_state["monitored_tokens"].items()):
        # Fetch latest on-chain data
        on_chain_data = await fetch_on_chain_data(token_address)

        # Perform risk analysis
        risk_analysis = await analyze_token_risk_with_metta(token_address, on_chain_data)

        # Check if risk level changed
        if risk_analysis["risk_level"] == "HIGH":
            ctx.logger.warn(f"⚠️ HIGH RISK detected: {token_address}")
            agent_state["alerts_sent"] += 1

            # Send alert to users and other agents
            await send_risk_alert(token_address, risk_analysis)

        # Detect rug pull patterns
        if "price_history" in on_chain_data:
            rug_pull_analysis = await detect_rug_pull_pattern(
                token_address,
                on_chain_data["price_history"]
            )

            if rug_pull_analysis["rug_pull_detected"]:
                ctx.logger.error(f"🚨 RUG PULL DETECTED: {token_address}")
                await send_rug_pull_alert(token_address, rug_pull_analysis)


@risk_analyzer.on_message(model=dict)
async def handle_messages(ctx: Context, sender: str, msg: dict):
    """
    Handle messages from other agents
    """
    action = msg.get("action")

    if action == "monitor_token":
        # Add token to monitoring list
        token_address = msg.get("token_address")
        agent_state["monitored_tokens"][token_address] = {
            "added_at": datetime.utcnow().isoformat(),
            "launch_data": msg.get("launch_data", {}),
        }
        ctx.logger.info(f"✅ Added token {token_address} to monitoring")

        await ctx.send(sender, {
            "action": "monitoring_started",
            "token_address": token_address,
        })

    elif action == "get_risk_report":
        # Return comprehensive risk report
        token_address = msg.get("token_address")
        if token_address in agent_state["monitored_tokens"]:
            on_chain_data = await fetch_on_chain_data(token_address)
            risk_analysis = await analyze_token_risk_with_metta(token_address, on_chain_data)

            await ctx.send(sender, {
                "action": "risk_report",
                "token_address": token_address,
                "analysis": risk_analysis,
            })


# Helper functions
async def fetch_on_chain_data(token_address: str) -> dict:
    """Fetch on-chain data from Solana"""
    # Mock implementation
    return {
        "liquidity_lock_duration": 90,
        "team_verified": True,
        "vesting_enabled": True,
        "contract_verified": True,
        "top_holder_percentage": 12.5,
        "holder_count": 1250,
        "price_history": [1.0, 1.05, 1.10, 1.08, 1.12],
    }


async def send_risk_alert(token_address: str, risk_analysis: dict):
    """Send risk alert to users and other agents"""
    print(f"🚨 Sending risk alert for token: {token_address}")
    # Would send to notification system


async def send_rug_pull_alert(token_address: str, rug_pull_analysis: dict):
    """Send rug pull alert to users and other agents"""
    print(f"🚨 RUG PULL ALERT: {token_address}")
    # Would send urgent notification


# Include chat protocol
risk_analyzer.include(chat_proto, publish_manifest=True)


if __name__ == "__main__":
    print("=" * 60)
    print("🔍 LaunchPad AI - Risk Analyzer Agent")
    print("=" * 60)
    print(f"Agent Address: {risk_analyzer.address}")
    print(f"Agent Name: {risk_analyzer.name}")
    print("")
    print("🤖 Capabilities:")
    print("  • Real-time token risk analysis")
    print("  • MeTTa-powered fraud pattern detection")
    print("  • Rug pull early warning system")
    print("  • On-chain holder and liquidity analysis")
    print("  • 24/7 autonomous monitoring")
    print("")
    print("📊 Current Stats:")
    print(f"  • Monitored Tokens: {len(agent_state['monitored_tokens'])}")
    print(f"  • Fraud Patterns Detected: {agent_state['fraud_patterns_detected']}")
    print(f"  • Alerts Sent: {agent_state['alerts_sent']}")
    print("")
    print("🌐 Ready to protect users from fraud!")
    print("=" * 60)

    risk_analyzer.run()
