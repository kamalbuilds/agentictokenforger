"""
Risk Scoring Model
Random Forest classifier for rug pull detection and risk assessment

Features:
- On-chain metrics analysis
- Holder distribution patterns
- Liquidity lock detection
- Team verification status
- Historical fraud patterns
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import json
from datetime import datetime

class RiskScoringModel:
    """
    Random Forest model for risk scoring
    Predicts:
    - Risk score (0-10)
    - Rug pull probability (0-1)
    - Risk level (LOW, MEDIUM, HIGH)
    - Red flags detection
    """

    def __init__(self, model_path=None):
        """Initialize model"""
        if model_path:
            self.model = joblib.load(model_path)
        else:
            self.model = self._build_model()

        self.scaler = StandardScaler()

    def _build_model(self):
        """Build Random Forest classifier"""
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )

        return model

    def prepare_features(self, token_data):
        """
        Extract features for risk assessment

        Features:
        - Liquidity lock duration
        - Holder concentration (top 10 holders %)
        - Team verification status
        - Contract verification status
        - Vesting schedule enabled
        - Graduation time (hours)
        - Initial liquidity amount
        - Presale mode
        - Total holders count
        - Trading volume 24h
        - Price volatility
        - Wallet age of top holders
        """
        features = []

        # Binary features
        features.append(1 if token_data.get('liquidity_locked', False) else 0)
        features.append(1 if token_data.get('team_verified', False) else 0)
        features.append(1 if token_data.get('contract_verified', False) else 0)
        features.append(1 if token_data.get('vesting_enabled', False) else 0)

        # Numerical features
        features.append(token_data.get('liquidity_lock_duration', 0) / 365)  # Normalize to years
        features.append(token_data.get('top_holder_percentage', 0) / 100)
        features.append(token_data.get('graduation_time_hours', 168) / 168)  # Normalize to weeks
        features.append(token_data.get('initial_liquidity', 0) / 100000)
        features.append(1 if token_data.get('presale_mode') == 'FCFS' else 0.5)
        features.append(min(token_data.get('holder_count', 0) / 10000, 1.0))
        features.append(min(token_data.get('volume_24h', 0) / 1000000, 1.0))
        features.append(min(token_data.get('price_volatility', 0) / 0.5, 1.0))
        features.append(min(token_data.get('avg_wallet_age_days', 0) / 365, 1.0))

        return np.array(features).reshape(1, -1)

    def predict(self, token_data):
        """
        Predict risk score and rug pull probability

        Returns:
        - risk_score: 0-10 (higher = safer)
        - rug_pull_probability: 0-1
        - risk_level: LOW, MEDIUM, HIGH
        - red_flags: List of detected issues
        - confidence: Model confidence
        """
        # Prepare features
        features = self.prepare_features(token_data)

        # Make prediction (probabilities)
        # For this demo, we'll use a rule-based approach since we don't have trained model
        risk_score = 7.5  # Base score
        red_flags = []

        # Check liquidity lock
        if not token_data.get('liquidity_locked', False):
            risk_score -= 2.5
            red_flags.append("No liquidity lock")
        elif token_data.get('liquidity_lock_duration', 0) < 30:
            risk_score -= 1.5
            red_flags.append(f"Short lock duration: {token_data.get('liquidity_lock_duration')} days")

        # Check team verification
        if not token_data.get('team_verified', False):
            risk_score -= 1.5
            red_flags.append("Anonymous team")

        # Check contract verification
        if not token_data.get('contract_verified', False):
            risk_score -= 1.0
            red_flags.append("Contract not verified")

        # Check vesting
        if not token_data.get('vesting_enabled', False):
            risk_score -= 1.0
            red_flags.append("No vesting schedule")

        # Check holder concentration
        top_holder_pct = token_data.get('top_holder_percentage', 0)
        if top_holder_pct > 30:
            risk_score -= 2.0
            red_flags.append(f"High holder concentration: {top_holder_pct:.1f}%")
        elif top_holder_pct > 20:
            risk_score -= 1.0
            red_flags.append(f"Moderate holder concentration: {top_holder_pct:.1f}%")

        # Check rapid graduation
        grad_time = token_data.get('graduation_time_hours', 168)
        if grad_time < 24:
            risk_score -= 1.5
            red_flags.append("Rapid graduation (<24h)")

        # Ensure score is in valid range
        risk_score = max(0, min(10, risk_score))

        # Determine risk level
        if risk_score < 4:
            risk_level = "HIGH"
        elif risk_score < 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Calculate rug pull probability
        rug_pull_probability = max(0, min(1, (10 - risk_score) / 10))

        # Calculate confidence based on data completeness
        data_fields = [
            'liquidity_locked',
            'team_verified',
            'contract_verified',
            'vesting_enabled',
            'holder_count',
        ]
        data_completeness = sum(1 for field in data_fields if field in token_data) / len(data_fields)
        confidence = 0.6 + (data_completeness * 0.35)  # 60-95% confidence

        return {
            'risk_score': float(risk_score),
            'rug_pull_probability': float(rug_pull_probability),
            'risk_level': risk_level,
            'red_flags': red_flags,
            'confidence': float(confidence),
            'recommendation': self._get_recommendation(risk_score, red_flags),
            'timestamp': datetime.utcnow().isoformat(),
        }

    def _get_recommendation(self, risk_score, red_flags):
        """Generate recommendation based on risk score"""
        if risk_score < 3:
            return "🚫 HIGH RISK - Do not invest. Multiple fraud indicators detected."
        elif risk_score < 5:
            return "⚠️ MEDIUM-HIGH RISK - Proceed with extreme caution."
        elif risk_score < 7:
            return "⚡ MEDIUM RISK - Acceptable for experienced investors."
        elif risk_score < 8.5:
            return "✅ LOW-MEDIUM RISK - Generally safe with standard due diligence."
        else:
            return "💎 LOW RISK - Strong safety indicators."

    def train(self, training_data, labels):
        """
        Train model on historical data

        training_data: List of token data dictionaries
        labels: List of outcomes (0 = rug pull, 1 = legitimate)
        """
        print(f"Training risk scoring model on {len(training_data)} samples...")

        # Prepare features
        X_train = np.vstack([self.prepare_features(d) for d in training_data])
        y_train = np.array(labels)

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Train model
        self.model.fit(X_train_scaled, y_train)

        # Calculate accuracy
        accuracy = self.model.score(X_train_scaled, y_train)
        print(f"Training accuracy: {accuracy:.2%}")

        return accuracy

    def save(self, model_path='risk_model.joblib', scaler_path='risk_scaler.joblib'):
        """Save trained model and scaler"""
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        print(f"Model saved to {model_path}")

    def evaluate(self, test_data, labels):
        """Evaluate model on test data"""
        X_test = np.vstack([self.prepare_features(d) for d in test_data])
        y_test = np.array(labels)

        X_test_scaled = self.scaler.transform(X_test)

        accuracy = self.model.score(X_test_scaled, y_test)

        # Calculate predictions
        predictions = self.model.predict(X_test_scaled)

        # Calculate metrics
        true_positives = np.sum((predictions == 1) & (y_test == 1))
        false_positives = np.sum((predictions == 1) & (y_test == 0))
        false_negatives = np.sum((predictions == 0) & (y_test == 1))

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
        }


# Example usage
if __name__ == "__main__":
    # Initialize model
    model = RiskScoringModel()

    # Example risk assessment
    token_data = {
        'liquidity_locked': True,
        'liquidity_lock_duration': 90,
        'team_verified': True,
        'contract_verified': True,
        'vesting_enabled': True,
        'top_holder_percentage': 12.5,
        'graduation_time_hours': 72,
        'initial_liquidity': 50000,
        'presale_mode': 'FCFS',
        'holder_count': 1250,
        'volume_24h': 250000,
        'price_volatility': 0.12,
        'avg_wallet_age_days': 180,
    }

    prediction = model.predict(token_data)

    print("\n=== Risk Assessment ===")
    print(f"Risk Score: {prediction['risk_score']:.1f}/10")
    print(f"Risk Level: {prediction['risk_level']}")
    print(f"Rug Pull Probability: {prediction['rug_pull_probability']:.1%}")
    print(f"Confidence: {prediction['confidence']:.1%}")
    print(f"\nRed Flags: {len(prediction['red_flags'])}")
    for flag in prediction['red_flags']:
        print(f"  • {flag}")
    print(f"\nRecommendation: {prediction['recommendation']}")
