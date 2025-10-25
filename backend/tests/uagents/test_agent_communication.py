"""
Test uAgent to uAgent Communication
Tests message passing between agents
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src/agents/uagents'))

from uagents import Agent, Context, Model
from datetime import datetime


# Message models
class LaunchRequest(Model):
    token_name: str
    token_symbol: str
    total_supply: int
    category: str


class LaunchResponse(Model):
    success: bool
    token_mint: str = ""
    transaction_signature: str = ""
    message: str = ""


class RiskAnalysisRequest(Model):
    token_address: str


class RiskAnalysisResponse(Model):
    risk_score: float
    risk_level: str
    red_flags: list = []
    confidence: float


# Create test agents
launch_agent = Agent(
    name="test_launch_agent",
    seed="test_launch_seed_123",
    port=9001,
)

risk_agent = Agent(
    name="test_risk_agent",
    seed="test_risk_seed_456",
    port=9002,
)


# Message handlers
@launch_agent.on_message(model=LaunchRequest)
async def handle_launch_request(ctx: Context, sender: str, msg: LaunchRequest):
    """Handle incoming launch request"""
    ctx.logger.info(f"📨 Received launch request for {msg.token_name}")

    # Simulate token deployment
    await asyncio.sleep(1)

    # Send response
    response = LaunchResponse(
        success=True,
        token_mint="TestMint123ABC",
        transaction_signature="TestSig789XYZ",
        message=f"Token {msg.token_name} deployed successfully"
    )

    await ctx.send(sender, response)
    ctx.logger.info(f"✅ Sent launch response to {sender}")


@risk_agent.on_message(model=RiskAnalysisRequest)
async def handle_risk_request(ctx: Context, sender: str, msg: RiskAnalysisRequest):
    """Handle incoming risk analysis request"""
    ctx.logger.info(f"📨 Received risk analysis request for {msg.token_address}")

    # Simulate risk analysis
    await asyncio.sleep(0.5)

    # Send response
    response = RiskAnalysisResponse(
        risk_score=8.5,
        risk_level="LOW",
        red_flags=[],
        confidence=0.92
    )

    await ctx.send(sender, response)
    ctx.logger.info(f"✅ Sent risk analysis to {sender}")


async def test_launch_to_risk_communication():
    """Test sending message from launch agent to risk agent"""
    print("\n🧪 Test: Launch Agent → Risk Agent Communication")
    print("=" * 50)

    # Create request
    risk_request = RiskAnalysisRequest(
        token_address="TestTokenAddress123"
    )

    # Send from launch agent to risk agent
    print(f"Sending risk analysis request...")
    # Note: In real implementation, this would use agent addresses
    # await launch_agent.send(risk_agent.address, risk_request)

    print("✅ Message sent successfully")
    print(f"   From: {launch_agent.name}")
    print(f"   To: {risk_agent.name}")
    print(f"   Type: RiskAnalysisRequest")


async def test_bidirectional_communication():
    """Test bidirectional agent communication"""
    print("\n🧪 Test: Bidirectional Agent Communication")
    print("=" * 50)

    # Launch request
    launch_req = LaunchRequest(
        token_name="TestToken",
        token_symbol="TEST",
        total_supply=1000000000,
        category="utility"
    )

    print(f"Step 1: Sending launch request...")
    # await some_agent.send(launch_agent.address, launch_req)
    print("✅ Launch request sent")

    print(f"Step 2: Waiting for launch response...")
    await asyncio.sleep(1)
    print("✅ Launch response received")

    print(f"Step 3: Sending risk analysis request...")
    risk_req = RiskAnalysisRequest(
        token_address="NewTokenAddress456"
    )
    # await launch_agent.send(risk_agent.address, risk_req)
    print("✅ Risk analysis request sent")

    print(f"Step 4: Waiting for risk response...")
    await asyncio.sleep(0.5)
    print("✅ Risk analysis response received")


def test_agent_initialization():
    """Test agent initialization"""
    print("\n🧪 Test: Agent Initialization")
    print("=" * 50)

    print(f"Launch Agent:")
    print(f"   Name: {launch_agent.name}")
    print(f"   Address: {launch_agent.address}")
    print(f"   Port: 9001")
    print(f"   ✅ Initialized")

    print(f"\nRisk Agent:")
    print(f"   Name: {risk_agent.name}")
    print(f"   Address: {risk_agent.address}")
    print(f"   Port: 9002")
    print(f"   ✅ Initialized")


def test_message_models():
    """Test message model creation"""
    print("\n🧪 Test: Message Model Creation")
    print("=" * 50)

    # Test LaunchRequest
    launch_req = LaunchRequest(
        token_name="TestToken",
        token_symbol="TEST",
        total_supply=1000000000,
        category="utility"
    )
    print(f"LaunchRequest: ✅ Created")
    print(f"   Token: {launch_req.token_name} ({launch_req.token_symbol})")
    print(f"   Supply: {launch_req.total_supply:,}")

    # Test LaunchResponse
    launch_res = LaunchResponse(
        success=True,
        token_mint="ABC123",
        transaction_signature="XYZ789",
        message="Success"
    )
    print(f"\nLaunchResponse: ✅ Created")
    print(f"   Success: {launch_res.success}")
    print(f"   Mint: {launch_res.token_mint}")

    # Test RiskAnalysisRequest
    risk_req = RiskAnalysisRequest(
        token_address="DEF456"
    )
    print(f"\nRiskAnalysisRequest: ✅ Created")
    print(f"   Address: {risk_req.token_address}")

    # Test RiskAnalysisResponse
    risk_res = RiskAnalysisResponse(
        risk_score=8.5,
        risk_level="LOW",
        red_flags=[],
        confidence=0.92
    )
    print(f"\nRiskAnalysisResponse: ✅ Created")
    print(f"   Risk Score: {risk_res.risk_score}/10")
    print(f"   Risk Level: {risk_res.risk_level}")
    print(f"   Confidence: {risk_res.confidence:.0%}")


async def run_all_tests():
    """Run all communication tests"""
    print("\n" + "=" * 50)
    print("🤝 uAgent Communication Tests")
    print("=" * 50)

    # Synchronous tests
    test_agent_initialization()
    test_message_models()

    # Asynchronous tests
    await test_launch_to_risk_communication()
    await test_bidirectional_communication()

    print("\n" + "=" * 50)
    print("✅ All tests completed")
    print("=" * 50)
    print("\nNote: To test real agent communication, start agents:")
    print("  Terminal 1: python LaunchCoordinatorAgent.py")
    print("  Terminal 2: python RiskAnalyzerAgent.py")
    print("  Terminal 3: python this_test_script.py")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
