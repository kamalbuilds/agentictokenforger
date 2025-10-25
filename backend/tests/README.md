# SOLTokenForger Tests

Complete test suite for uAgents, Meteora integration, and E2E flows.

## Directory Structure

```
tests/
├── uagents/              # Python uAgent tests
│   ├── test_metta_queries.py
│   └── test_agent_communication.py
├── meteora/              # Meteora integration tests
│   ├── test_presale_vault.ts
│   ├── test_bonding_curve.ts
│   └── test_damm_pool.ts
├── bridge/               # Execution bridge tests
│   └── test_execution_bridge.ts
└── e2e/                  # End-to-end tests
    └── test_token_launch.ts
```

## Quick Start

### Python uAgent Tests

```bash
cd backend/src/agents/uagents
source venv/bin/activate
python ../../tests/uagents/test_metta_queries.py
python ../../tests/uagents/test_agent_communication.py
```

### TypeScript Tests

```bash
cd backend

# Test Meteora integration
npx tsx tests/meteora/test_presale_vault.ts

# Test E2E launch
npx tsx tests/e2e/test_token_launch.ts
```

## Running All Tests

```bash
# Python tests
cd backend/src/agents/uagents
source venv/bin/activate
pytest ../../tests/uagents/ -v

# TypeScript tests
cd backend
npm test
```

## Test Coverage

- ✅ MeTTa knowledge graph queries
- ✅ uAgent message passing
- ✅ Meteora presale vault creation
- ✅ Dynamic bonding curve setup
- ✅ DAMM v2 pool configuration
- ✅ Solana execution bridge
- ✅ Complete launch E2E flow

## Mock vs Real Testing

### Mock Mode (No Real Services)
```bash
MOCK_MODE=true npx tsx tests/e2e/test_token_launch.ts
```

### Real Mode (Requires Services)
```bash
# Start services first
npm run start:uagents
npm run dev

# Then run tests
npx tsx tests/e2e/test_token_launch.ts
```

## Writing New Tests

### Python Test Template
```python
def test_new_feature():
    """Test description"""
    # Setup
    # Execute
    # Assert
    print("✅ Test passed")
```

### TypeScript Test Template
```typescript
async function testNewFeature() {
  console.log('🧪 Test: New Feature');
  // Setup
  // Execute
  // Assert
  console.log('✅ Test passed');
}
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm test
    python -m pytest tests/
```

For detailed documentation, see [TESTING_GUIDE.md](../TESTING_GUIDE.md)
