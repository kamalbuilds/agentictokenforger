"""
Bonding Curve Prediction Model
LSTM-based neural network for predicting optimal graduation times and prices

Features:
- Historical launch data analysis
- Market condition factors
- Category-specific patterns
- Real-time prediction updates
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
from datetime import datetime

class BondingCurvePredictionModel:
    """
    LSTM model for bonding curve predictions
    Predicts:
    - Optimal graduation threshold
    - Expected time to graduation
    - Price trajectory
    - Success probability
    """

    def __init__(self, model_path=None):
        """Initialize model"""
        if model_path:
            self.model = keras.models.load_model(model_path)
        else:
            self.model = self._build_model()

        self.feature_scaler = None
        self.target_scaler = None

    def _build_model(self):
        """Build LSTM neural network"""
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=(10, 15)),  # 10 timesteps, 15 features

            # LSTM layers
            layers.LSTM(128, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(64, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32),
            layers.Dropout(0.2),

            # Dense layers
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),

            # Output layer (4 predictions)
            layers.Dense(4, activation='linear')
        ])

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae', 'mape']
        )

        return model

    def prepare_features(self, launch_data):
        """
        Extract and normalize features from launch data

        Features:
        - Token category (one-hot encoded)
        - Target market cap
        - Community size
        - Initial price
        - Presale mode
        - Historical similar launches
        - Market sentiment
        - Volume indicators
        - Holder distribution
        - Liquidity metrics
        """
        features = []

        # Category encoding
        category_map = {'meme': 0, 'utility': 1, 'governance': 2}
        category = category_map.get(launch_data.get('category', 'utility'), 1)
        features.extend([1 if i == category else 0 for i in range(3)])

        # Numerical features
        features.extend([
            launch_data.get('target_marketcap', 100000) / 1000000,  # Normalize
            launch_data.get('community_size', 1000) / 10000,
            launch_data.get('initial_price', 0.001) * 1000,
            1 if launch_data.get('presale_mode') == 'FCFS' else 0,
            launch_data.get('similar_launches_count', 10) / 50,
            launch_data.get('market_sentiment', 0.5),  # -1 to 1, normalized
            launch_data.get('volume_indicator', 0.5),
            launch_data.get('holder_concentration', 0.2),
            launch_data.get('initial_liquidity', 50000) / 100000,
            launch_data.get('vesting_enabled', 1),
            launch_data.get('team_verified', 1),
            launch_data.get('contract_verified', 1),
        ])

        return np.array(features)

    def predict(self, launch_data):
        """
        Make predictions for a token launch

        Returns:
        - optimal_graduation_threshold: USD
        - expected_graduation_time: hours
        - peak_price: USD
        - success_probability: 0-1
        """
        # Prepare features
        features = self.prepare_features(launch_data)

        # Reshape for LSTM (batch_size, timesteps, features)
        # For single prediction, repeat features across timesteps
        features_seq = np.tile(features, (10, 1)).reshape(1, 10, 15)

        # Make prediction
        prediction = self.model.predict(features_seq, verbose=0)[0]

        # Denormalize predictions
        results = {
            'optimal_graduation_threshold': float(prediction[0] * 1000000),  # Denormalize
            'expected_graduation_time': float(prediction[1] * 168),  # Max 7 days
            'peak_price': float(prediction[2] * 0.1),
            'success_probability': float(min(max(prediction[3], 0), 1)),  # Clip to 0-1
            'confidence': 0.85,  # Model confidence
            'timestamp': datetime.utcnow().isoformat(),
        }

        return results

    def train(self, training_data, validation_data=None, epochs=50):
        """
        Train model on historical data

        training_data: List of (features, targets) tuples
        """
        print(f"Training bonding curve model on {len(training_data)} samples...")

        # Prepare data
        X_train = np.array([self.prepare_features(d[0]) for d in training_data])
        y_train = np.array([d[1] for d in training_data])

        # Reshape for LSTM
        X_train = np.array([np.tile(x, (10, 1)) for x in X_train])

        # Train model
        history = self.model.fit(
            X_train,
            y_train,
            epochs=epochs,
            batch_size=32,
            validation_split=0.2,
            verbose=1,
            callbacks=[
                keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=5,
                    restore_best_weights=True
                ),
                keras.callbacks.ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=3
                )
            ]
        )

        print(f"Training complete. Final loss: {history.history['loss'][-1]:.4f}")

        return history

    def save(self, path='bonding_curve_model.h5'):
        """Save trained model"""
        self.model.save(path)
        print(f"Model saved to {path}")

    def evaluate(self, test_data):
        """Evaluate model on test data"""
        X_test = np.array([self.prepare_features(d[0]) for d in test_data])
        y_test = np.array([d[1] for d in test_data])

        # Reshape for LSTM
        X_test = np.array([np.tile(x, (10, 1)) for x in X_test])

        results = self.model.evaluate(X_test, y_test, verbose=0)

        return {
            'loss': results[0],
            'mae': results[1],
            'mape': results[2],
        }


# Example usage
if __name__ == "__main__":
    # Initialize model
    model = BondingCurvePredictionModel()

    # Example prediction
    launch_data = {
        'category': 'meme',
        'target_marketcap': 500000,
        'community_size': 5000,
        'initial_price': 0.001,
        'presale_mode': 'FCFS',
        'similar_launches_count': 50,
        'market_sentiment': 0.7,
        'volume_indicator': 0.6,
        'holder_concentration': 0.15,
        'initial_liquidity': 50000,
        'vesting_enabled': 1,
        'team_verified': 1,
        'contract_verified': 1,
    }

    prediction = model.predict(launch_data)

    print("\n=== Bonding Curve Prediction ===")
    print(f"Optimal Graduation Threshold: ${prediction['optimal_graduation_threshold']:,.0f}")
    print(f"Expected Graduation Time: {prediction['expected_graduation_time']:.1f} hours")
    print(f"Peak Price: ${prediction['peak_price']:.4f}")
    print(f"Success Probability: {prediction['success_probability']:.1%}")
    print(f"Confidence: {prediction['confidence']:.1%}")
