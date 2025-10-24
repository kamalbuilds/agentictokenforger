;;; LaunchPad AI - Liquidity Optimization Patterns
;;; MeTTa Knowledge Graph for DAMM v2 Position Management
;;;
;;; This knowledge graph stores:
;;; - Optimal liquidity range patterns
;;; - Rebalancing strategies based on volatility
;;; - Fee harvesting decision rules
;;; - Capital efficiency optimization
;;; - Historical rebalancing outcomes

;;; ============================================
;;; LIQUIDITY POOL DEFINITIONS
;;; ============================================

(: Pool Type)
(: DAMMv2 Pool)
(: UniswapV3 Pool)
(: ConcentratedLiquidity Pool)

;;; Pool characteristics
(: pool-volatility (-> Pool Float))
(: pool-volume-24h (-> Pool Float))
(: pool-fee-tier (-> Pool Int))

;;; ============================================
;;; LIQUIDITY RANGE PATTERNS
;;; ============================================

;; Historical successful liquidity ranges by volatility
(: liquidity-range-pattern (-> Volatility Volume OptimalRange))

;; Low volatility (<5%) - Narrow range for maximum capital efficiency
(liquidity-range-pattern
  (volatility low)
  (volume high)
  (range
    (width 0.10)  ;; ±5% from current price
    (efficiency 0.95)
    (expected-apr 25.0)))

;; Medium volatility (5-15%) - Balanced range
(liquidity-range-pattern
  (volatility medium)
  (volume high)
  (range
    (width 0.20)  ;; ±10% from current price
    (efficiency 0.85)
    (expected-apr 18.0)))

;; High volatility (>15%) - Wide range to avoid frequent rebalancing
(liquidity-range-pattern
  (volatility high)
  (volume high)
  (range
    (width 0.40)  ;; ±20% from current price
    (efficiency 0.70)
    (expected-apr 12.0)))

;; Low volume adjustments (reduce range width)
(liquidity-range-pattern
  (volatility medium)
  (volume low)
  (range
    (width 0.30)
    (efficiency 0.75)
    (expected-apr 8.0)))

;;; ============================================
;;; REBALANCING DECISION RULES
;;; ============================================

;; Determine if rebalancing is optimal
(: should-rebalance (-> Position CurrentPrice OptimalRange Bool))

;; Rebalance if price moved out of range
(= (should-rebalance $position $current-price $optimal-range)
   (or
     (< $current-price (get-lower-bound $optimal-range))
     (> $current-price (get-upper-bound $optimal-range))))

;; Rebalance if capital efficiency dropped significantly
(= (should-rebalance-efficiency $position)
   (< (calculate-capital-efficiency $position) 0.70))

;; Don't rebalance too frequently (minimum 24 hours between rebalances)
(= (rebalance-cooldown-satisfied $position)
   (> (time-since-last-rebalance $position) 86400))

;;; ============================================
;;; OPTIMAL RANGE CALCULATION
;;; ============================================

;; Calculate optimal liquidity range based on market conditions
(= (calculate-optimal-range
     (current-price $price)
     (volatility-24h $volatility)
     (volume-24h $volume))
   (let (
     ($volatility-level (classify-volatility $volatility))
     ($volume-level (classify-volume $volume))
     ($pattern (find-liquidity-pattern $volatility-level $volume-level)))
     (optimal-range
       (lower (* $price (- 1 (/ (get-width $pattern) 2))))
       (upper (* $price (+ 1 (/ (get-width $pattern) 2))))
       (confidence (get-confidence $pattern))
       (expected-apr (get-expected-apr $pattern)))))

;; Classify volatility level
(= (classify-volatility $vol)
   (cond
     ((< $vol 0.05) low)
     ((< $vol 0.15) medium)
     (True high)))

;; Classify volume level
(= (classify-volume $vol)
   (cond
     ((< $vol 100000) low)
     ((< $vol 1000000) medium)
     (True high)))

;;; ============================================
;;; FEE HARVESTING OPTIMIZATION
;;; ============================================

;; Determine if fee harvesting is profitable
(= (should-harvest-fees
     (unclaimed-fees $fees)
     (gas-cost $gas)
     (token-price $price))
   (let (
     ($fee-value (* $fees $price))
     ($min-profitable (* $gas 2)))  ;; Need 2x gas cost minimum
     (> $fee-value $min-profitable)))

;; Calculate optimal harvesting frequency
(= (optimal-harvest-frequency
     (average-daily-fees $avg-fees)
     (gas-cost $gas))
   (let (
     ($break-even-days (/ (* $gas 2) $avg-fees)))
     (cond
       ((< $break-even-days 1) daily)
       ((< $break-even-days 7) weekly)
       (True monthly))))

;;; ============================================
;;; CAPITAL EFFICIENCY OPTIMIZATION
;;; ============================================

;; Calculate current capital efficiency
(= (calculate-capital-efficiency
     (position $pos)
     (current-price $price))
   (let (
     ($lower (get-lower-bound $pos))
     ($upper (get-upper-bound $pos))
     ($in-range (and (>= $price $lower) (<= $price $upper)))
     ($range-width (- $upper $lower))
     ($price-position (/ (- $price $lower) $range-width)))
     (if $in-range
         ;; In range: efficiency based on proximity to center
         (* 1.0 (- 1.0 (abs (- $price-position 0.5))))
         ;; Out of range: zero efficiency
         0.0)))

;; Predict APR improvement from rebalancing
(= (predict-apr-improvement
     (current-efficiency $current-eff)
     (optimal-range $optimal))
   (let (
     ($optimal-eff (get-efficiency $optimal))
     ($current-apr (* $current-eff 15.0))  ;; Base APR
     ($optimal-apr (* $optimal-eff 15.0)))
     (- $optimal-apr $current-apr)))

;;; ============================================
;;; IMPERMANENT LOSS CALCULATION
;;; ============================================

;; Calculate impermanent loss for current position
(= (calculate-impermanent-loss
     (entry-price $entry)
     (current-price $current)
     (lower-bound $lower)
     (upper-bound $upper))
   (let (
     ($price-ratio (/ $current $entry))
     ($il-factor (/ (- (* 2 (sqrt $price-ratio)) $price-ratio 1)
                    (+ (sqrt $price-ratio) 1))))
     ;; IL is reduced in concentrated liquidity positions
     (* $il-factor (calculate-concentration-factor $lower $upper $current))))

(= (calculate-concentration-factor $lower $upper $current)
   (let (
     ($range-width (/ (- $upper $lower) $current))
     ($concentration (/ 1.0 $range-width)))
     ;; More concentrated = less IL exposure
     (min 1.0 $concentration)))

;;; ============================================
;;; HISTORICAL REBALANCING DATA
;;; ============================================

;; Store historical rebalancing outcomes for learning
(: rebalancing-outcome (-> PositionId OldRange NewRange Outcome))

;; Successful rebalancing examples
(rebalancing-outcome "pos_001"
  (old-range (lower 0.95) (upper 1.05))
  (new-range (lower 0.90) (upper 1.10))
  (outcome
    (success True)
    (apr-improvement 8.5)
    (gas-cost 0.001)
    (time-in-range-days 14)
    (fees-earned 125.50)))

(rebalancing-outcome "pos_002"
  (old-range (lower 0.98) (upper 1.02))
  (new-range (lower 0.95) (upper 1.05))
  (outcome
    (success True)
    (apr-improvement 12.3)
    (gas-cost 0.001)
    (time-in-range-days 21)
    (fees-earned 220.75)))

;; Failed rebalancing (rebalanced too frequently)
(rebalancing-outcome "pos_003"
  (old-range (lower 0.97) (upper 1.03))
  (new-range (lower 0.96) (upper 1.04))
  (outcome
    (success False)
    (apr-improvement 2.0)  ;; Too small
    (gas-cost 0.001)
    (time-in-range-days 2)  ;; Moved out of range quickly
    (fees-earned 15.20)))

;;; ============================================
;;; VOLATILITY PREDICTION
;;; ============================================

;; Predict future volatility based on historical data
(= (predict-volatility-24h
     (historical-volatility $hist-vol)
     (volume-trend $vol-trend))
   (let (
     ($base-volatility $hist-vol)
     ($trend-adjustment
       (cond
         ((eq $vol-trend increasing) 1.2)  ;; +20% volatility
         ((eq $vol-trend decreasing) 0.8)  ;; -20% volatility
         (True 1.0))))
     (* $base-volatility $trend-adjustment)))

;;; ============================================
;;; MAIN PREDICTION FUNCTION
;;; ============================================

;; Generate optimal liquidity management strategy
(= (predict-optimal-liquidity-range
     (pool $pool-address)
     (current-price $price)
     (volatility $vol)
     (volume-24h $volume)
     (current-range-lower $current-lower)
     (current-range-upper $current-upper))
   (let (
     ;; Calculate optimal range
     ($optimal (calculate-optimal-range
                 (current-price $price)
                 (volatility-24h $vol)
                 (volume-24h $volume)))

     ;; Calculate current efficiency
     ($current-eff (calculate-capital-efficiency
                     (position
                       (lower $current-lower)
                       (upper $current-upper))
                     $price))

     ;; Predict APR improvement
     ($apr-improvement (predict-apr-improvement
                         $current-eff
                         $optimal))

     ;; Check if rebalancing is worthwhile
     ($should-rebalance (and
                          (> $apr-improvement 5.0)  ;; >5% APR improvement
                          (or
                            (< $price $current-lower)
                            (> $price $current-upper)
                            (< $current-eff 0.70)))))

     ;; Return complete strategy
     (strategy
       (should-rebalance $should-rebalance)
       (optimal-range $optimal)
       (current-efficiency $current-eff)
       (expected-apr-improvement $apr-improvement)
       (confidence 0.89)
       (reasoning "Based on historical volatility and volume patterns"))))

;;; ============================================
;;; HELPER FUNCTIONS
;;; ============================================

(= (find-liquidity-pattern $vol-level $volume-level)
   (filter-first
     (lambda ($pattern)
       (and
         (= (get-volatility $pattern) $vol-level)
         (= (get-volume $pattern) $volume-level)))
     all-patterns))

(= (get-width $pattern) 0.20)  ;; Default
(= (get-efficiency $pattern) 0.85)
(= (get-expected-apr $pattern) 15.0)
(= (get-confidence $pattern) 0.89)

(= (get-lower-bound $range) (- (current-price) (* (current-price) 0.10)))
(= (get-upper-bound $range) (+ (current-price) (* (current-price) 0.10)))

;;; ============================================
;;; EXAMPLE QUERIES
;;; ============================================

;; Example 1: Calculate optimal range
;; (predict-optimal-liquidity-range
;;   (pool "PoolAddress123")
;;   (current-price 1.0)
;;   (volatility 0.12)
;;   (volume-24h 500000)
;;   (current-range-lower 0.95)
;;   (current-range-upper 1.05))

;; Example 2: Check if should harvest fees
;; (should-harvest-fees
;;   (unclaimed-fees 10.5)
;;   (gas-cost 0.001)
;;   (token-price 100))

;; Example 3: Calculate capital efficiency
;; (calculate-capital-efficiency
;;   (position (lower 0.95) (upper 1.05))
;;   (current-price 1.02))

;;; ============================================
;;; CONTINUOUS LEARNING
;;; ============================================

;; New rebalancing outcomes are added automatically by the
;; LiquidityOptimizer agent after each operation.
;; This enables continuous improvement of predictions.

;; Format for adding new outcomes:
;; (rebalancing-outcome "position-id"
;;   (old-range (lower X) (upper Y))
;;   (new-range (lower A) (upper B))
;;   (outcome
;;     (success <bool>)
;;     (apr-improvement <float>)
;;     (gas-cost <float>)
;;     (time-in-range-days <int>)
;;     (fees-earned <float>)))
