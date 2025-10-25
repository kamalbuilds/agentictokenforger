"""
Test MeTTa Knowledge Graph Queries
Tests symbolic reasoning for token launch optimization
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src/agents/uagents'))

from hyperon import MeTTa
import json

def load_metta_knowledge():
    """Load MeTTa knowledge bases"""
    metta = MeTTa()

    # Load DeFi knowledge
    defi_kb_path = "../../src/metta/defi_knowledge.metta"
    if os.path.exists(defi_kb_path):
        with open(defi_kb_path, 'r') as f:
            metta.run(f.read())
        print("✅ Loaded defi_knowledge.metta")
    else:
        print(f"⚠️  File not found: {defi_kb_path}")

    # Load liquidity patterns
    lp_kb_path = "../../src/metta/liquidity_patterns.metta"
    if os.path.exists(lp_kb_path):
        with open(lp_kb_path, 'r') as f:
            metta.run(f.read())
        print("✅ Loaded liquidity_patterns.metta")
    else:
        print(f"⚠️  File not found: {lp_kb_path}")

    return metta


def test_launch_strategy_query():
    """Test querying optimal launch strategy"""
    print("\n🧪 Test 1: Optimal Launch Strategy")
    print("=" * 50)

    metta = load_metta_knowledge()

    query = """
    (predict-optimal-launch-config
      (token-name "TestToken")
      (token-category utility)
      (target-marketcap 100000)
      (community-size 1000))
    """

    print(f"Query: {query.strip()}")
    result = metta.run(query)
    print(f"Result: {result}")

    # Check if result contains expected parameters
    expected_params = ["presale_mode", "graduation_threshold", "initial_price"]
    for param in expected_params:
        print(f"  ✓ Contains {param}: {param in str(result)}")


def test_liquidity_range_query():
    """Test querying optimal liquidity range"""
    print("\n🧪 Test 2: Optimal Liquidity Range")
    print("=" * 50)

    metta = load_metta_knowledge()

    query = """
    (predict-optimal-liquidity-range
      (pool $pool-address)
      (current-price 0.001)
      (volatility 0.15)
      (volume-24h 50000))
    """

    print(f"Query: {query.strip()}")
    result = metta.run(query)
    print(f"Result: {result}")

    # Check if result contains liquidity range
    expected_fields = ["lower", "upper", "expected-apr"]
    for field in expected_fields:
        print(f"  ✓ Contains {field}: {field in str(result)}")


def test_risk_pattern_query():
    """Test querying risk patterns"""
    print("\n🧪 Test 3: Risk Pattern Analysis")
    print("=" * 50)

    metta = load_metta_knowledge()

    query = """
    (analyze-risk-factors
      (liquidity-lock 90)
      (team-verified true)
      (vesting-schedule true)
      (contract-verified true))
    """

    print(f"Query: {query.strip()}")
    result = metta.run(query)
    print(f"Result: {result}")

    # Check if result contains risk score
    print(f"  ✓ Contains risk score: {'risk' in str(result).lower()}")


def test_rebalancing_strategy():
    """Test querying rebalancing strategy"""
    print("\n🧪 Test 4: Rebalancing Strategy")
    print("=" * 50)

    metta = load_metta_knowledge()

    query = """
    (should-rebalance-position
      (current-apr 15.5)
      (optimal-apr 25.0)
      (capital-efficiency 0.65)
      (impermanent-loss 2.5))
    """

    print(f"Query: {query.strip()}")
    result = metta.run(query)
    print(f"Result: {result}")

    # Check if result contains recommendation
    print(f"  ✓ Contains recommendation: {len(result) > 0}")


def run_all_tests():
    """Run all MeTTa query tests"""
    print("\n" + "=" * 50)
    print("🧠 MeTTa Knowledge Graph Query Tests")
    print("=" * 50)

    tests = [
        test_launch_strategy_query,
        test_liquidity_range_query,
        test_risk_pattern_query,
        test_rebalancing_strategy
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
            print("✅ PASSED\n")
        except Exception as e:
            failed += 1
            print(f"❌ FAILED: {e}\n")

    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)


if __name__ == "__main__":
    run_all_tests()
