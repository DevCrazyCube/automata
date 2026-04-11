# Automated Token Rug Pull Flow — Claude Code Prompt

## Overview
Build a complete Node.js automation system that simulates and documents the exact mechanics of a token rug pull operation across 6 phases. The system should:
- Execute each phase sequentially with transaction simulation
- Track wallet balances and pool states
- Log all transfers, swaps, and LP removals
- Demonstrate the hidden control layer mechanics
- Calculate and output extraction totals
- **Accept parameters for all wallets, token amounts, and pool addresses (make them configurable)**

---

## Phase 1: Setup
**Goal:** Deploy token, create pool, seed liquidity with admin control

### Requirements
1. **Deployer Wallet** (parameter: `DEPLOYER_ADDRESS`)
   - Deploys TOKEN contract with:
     - `ADMIN_ROLE` capability
     - `mint()` function
     - Whitelist/transfer restriction hooks
     - Hidden admin powers (see Phase 4)
   - Creates TOKEN/STABLE_COIN pool (parameter: `POOL_ADDRESS`)

2. **Mint/Admin Wallet** (parameter: `ADMIN_WALLET`)
   - Receives TOKEN tokens (parameter: `TOTAL_MINT_AMOUNT`)
   - Automatically assigned `ADMIN_ROLE` by contract code
   - Becomes treasury/control wallet

3. **Liquidity Seeding**
   - Admin wallet adds TOKEN tokens (parameter: `INITIAL_TOKEN_SEED`)
   - Admin wallet adds STABLE_COIN (parameter: `INITIAL_STABLECOIN_SEED`)
   - Pool goes live with initial price calculated from reserves

### Output
```
Phase 1 Complete:
✓ Token deployed with admin controls
✓ Pool created: TOKEN/STABLE_COIN
✓ Liquidity seeded: [INITIAL_TOKEN_SEED] TOKEN + [INITIAL_STABLECOIN_SEED] STABLE_COIN
✓ Admin role assigned to [ADMIN_WALLET]
✓ Pool address: [POOL_ADDRESS]
```

---

## Phase 2: Market Staging
**Goal:** Distribute tokens to appear decentralized while controlling supply narrative

### Requirements
1. **Treasury spreads supply** from `ADMIN_WALLET` to distribution wallets
   - Parameter: `DISTRIBUTION_WALLETS` (array of objects: `{address, amount}`)
   - Each distribution wallet receives specified TOKEN amount
   - Updates state after each transfer

2. **Burn operations** (from same admin wallet)
   - Parameter: `BURN_AMOUNTS` (array of amounts to burn in separate transactions)
   - Each burn removes tokens from circulation
   - Tracked separately from distribution

3. **Tracking**
   - Log each transfer with timestamp
   - Update wallet balances in simulation
   - Calculate remaining circulating supply

### Output
```
Phase 2 Complete — Market Staging:
├─ Distributed wallets: [COUNT]
├─ Total distributed: [AMOUNT] TOKEN
├─ Burned supply: [AMOUNT] TOKEN
├─ Admin wallet remaining: [AMOUNT] TOKEN (in pool)
├─ Circulating: [AMOUNT] TOKEN
└─ Total issued: [AMOUNT] TOKEN
```

---

## Phase 3: Buyer Entry
**Goal:** Accept victim funds into the rigged pool

### Requirements
1. **Buyer wallet** (parameter: `BUYER_WALLETS` - array of buyer objects)
   - Each buyer sends amount of ETH/native currency (parameter: `amount_native`)

2. **Route execution** (simulated DEX Router):
   ```
   [AMOUNT] NATIVE_CURRENCY
   → Wrapped to WRAPPED_NATIVE
   → Swap WRAPPED_NATIVE → STABLE_COIN (at current market rate)
   → STABLE_COIN sent to TOKEN/STABLE_COIN pool
   ```

3. **Pool swap output**:
   - Pool sends back: TOKEN amount (calculated from reserves)
   - To buyer wallet: TOKEN amount (after fees)
   - To operator wallet (parameter: `FEE_CAPTURE_WALLET`): TOKEN fee amount
   - Fee percentage: parameter `FEE_PERCENT`

4. **Pool state after**:
   - Pool now contains more STABLE_COIN (buyer funds)
   - Pool now contains less TOKEN
   - Effective price has moved against future buyers

### Output
```
Phase 3 Complete — Buyer Entry:
├─ Input: [AMOUNT] NATIVE → [AMOUNT] STABLE_COIN
├─ Buyer receives: [AMOUNT] TOKEN
├─ Operator fee capture: [AMOUNT] TOKEN
├─ Pool balance now:
│  ├─ TOKEN: [AMOUNT] (decreased)
│  └─ STABLE_COIN: [AMOUNT] (increased with buyer funds)
└─ Price impact: 1 STABLE_COIN now gets [AMOUNT] TOKEN (price moved)
```

---

## Phase 4: Control Layer / Trap
**Goal:** Activate hidden admin restrictions to prevent exits

### Requirements
1. **Document hidden admin powers** in token contract:
   - `whitelistAddress(address)` — only whitelisted can trade
   - `setWalletLimit(address, uint limit)` — cap individual holdings
   - `setTransferRestricted(bool)` — toggle all transfers
   - `blockRouterApproval()` — prevent router-based sales in certain states
   - `setMaxTxPercent(uint percent)` — limit transaction sizes

2. **Selective enforcement**:
   - Admins stay whitelisted (parameter: `WHITELISTED_WALLETS` - array)
   - Initial distribution wallets remain whitelisted
   - Regular/new buyers are **not** whitelisted
   - When restriction is activated:
     - Insiders can still sell/transfer
     - Regular holders cannot move tokens
     - Appears the token is "stuck" for normal users

3. **Timing**:
   - Log when controls are activated
   - Track which wallets are whitelisted vs blocked
   - Calculate the "trap moment"

### Output
```
Phase 4 Complete — Control Layer Activation:
├─ Admin powers documented:
│  ├─ Whitelist system: ACTIVE
│  ├─ Transfer restrictions: ARMED
│  ├─ Wallet limits: CONFIGURABLE
│  └─ Router blocks: DEPLOYABLE
├─ Whitelisted wallets: [COUNT]
│  └─ [ADMIN_WALLET] (admin/treasury)
│  └─ [DISTRIBUTION_WALLETS] (distribution wallets)
│  └─ [FEE_CAPTURE_WALLET] (fee capture wallet)
├─ Non-whitelisted buyers: Can be restricted
└─ Trap status: READY TO ACTIVATE
```

---

## Phase 5: Extraction
**Goal:** Drain liquidity pool back to admin wallets

### Requirements
1. **Liquidity removal transactions** (parameter: `LP_REMOVAL_TXNS` - array of objects)
   - Each object contains:
     - `date`: timestamp of removal
     - `stable_coin_amount`: STABLE_COIN received
     - `token_amount`: TOKEN received
   - All removals execute from `ADMIN_WALLET`
   - Removes LP tokens from pool

2. **Net extraction analysis**:
   - Initial seeding amount (parameter: `INITIAL_STABLECOIN_SEED`)
   - Total extracted STABLE_COIN (sum of all removals)
   - Calculate profit: Total extracted - Initial seeded
   - **This includes all buyer funds that entered the pool**

3. **Pool state**:
   - Track reserves after each removal
   - Log when liquidity approaches zero
   - Final pool state should be drained

### Output
```
Phase 5 Complete — Liquidity Extraction:
├─ Removal transactions: [COUNT]
├─ Total STABLE_COIN extracted: [AMOUNT]
├─ Total TOKEN extracted: [AMOUNT]
├─ Initial STABLE_COIN seeded: [AMOUNT]
├─ Profit STABLE_COIN: [AMOUNT] ([PROFIT_PERCENT]%)
├─ ROI: [ROI_PERCENT]%
├─ Pool state after extraction:
│  ├─ Liquidity: DRAINED
│  ├─ TOKEN remaining: ~0
│  ├─ STABLE_COIN remaining: ~0
│  └─ Buyer funds: EXTRACTED
└─ Buyer position: TRAPPED (no liquidity to exit at any price)
```

---

## Phase 6: Cash Forwarding
**Goal:** Move extracted value through wallets to obscure origin

### Requirements
1. **Cash forwarding transactions** (parameter: `CASH_FORWARDING_TXNS` - array of objects)
   - Each object contains:
     - `from`: sending wallet (typically `ADMIN_WALLET`)
     - `to`: destination wallet
     - `amount`: STABLE_COIN amount
   - Multiple transfers allowed (can split amounts)
   - Creates chain of custody break

2. **Mixing/obfuscation**:
   - Multiple transfers to same wallet allowed
   - Split to secondary wallets
   - Value moves away from pool/project
   - Log each forwarding step

3. **Tracking**:
   - Log each forwarding transaction
   - Track final destination wallets
   - Calculate total extracted value by destination
   - Create forwarding map

### Output
```
Phase 6 Complete — Cash Forwarding:
├─ Total forwarding transactions: [COUNT]
├─ Forwarding map:
│  ├─ From [ADMIN_WALLET]:
│  │  ├─ To [DEST_1]: [AMOUNT] STABLE_COIN
│  │  ├─ To [DEST_2]: [AMOUNT] STABLE_COIN
│  │  └─ Subtotal: [AMOUNT] STABLE_COIN
├─ Total forwarded: [TOTAL_AMOUNT] STABLE_COIN
└─ Pool → Admin → Other wallets: COMPLETE
```

---

## Summary Output
**Total Rug Pull Economics:**

```
SETUP INVESTMENT:
├─ [INITIAL_TOKEN_SEED] TOKEN (distributed, burned, kept)
└─ [INITIAL_STABLECOIN_SEED] STABLE_COIN

VICTIM INJECTION:
├─ Buyers inject NATIVE_CURRENCY
└─ Converts to STABLE_COIN in pool

EXTRACTION RESULT:
├─ STABLE_COIN extracted: [TOTAL_EXTRACTED_STABLE]
├─ Initial STABLE_COIN: [INITIAL_STABLECOIN_SEED]
├─ Victim STABLE_COIN: [PROFIT_FROM_VICTIMS]
├─ ROI: [ROI_PERCENT]%
└─ TOKEN extracted: [TOTAL_EXTRACTED_TOKEN]

FINAL STATE:
├─ Buyers hold: TOKEN (illiquid, restricted)
├─ Operators hold: STABLE_COIN (cash out)
├─ Pool: DRAINED (no liquidity)
└─ Token: ABANDONED (control powers dormant but present)
```

---

## Technical Requirements

### Configuration Parameters
The system should accept a config file or CLI arguments with:
- `DEPLOYER_ADDRESS` — wallet that deploys token
- `ADMIN_WALLET` — wallet that becomes admin/treasury
- `POOL_ADDRESS` — DEX pool address
- `FEE_CAPTURE_WALLET` — wallet that captures swap fees
- `TOTAL_MINT_AMOUNT` — total token supply
- `INITIAL_TOKEN_SEED` — token amount for LP
- `INITIAL_STABLECOIN_SEED` — stablecoin amount for LP
- `FEE_PERCENT` — swap fee percentage
- `DISTRIBUTION_WALLETS` — array of {address, amount} objects
- `BURN_AMOUNTS` — array of burn amounts
- `BUYER_WALLETS` — array of {address, native_amount} objects
- `LP_REMOVAL_TXNS` — array of {date, stable_amount, token_amount} objects
- `CASH_FORWARDING_TXNS` — array of {from, to, amount} objects
- `WHITELISTED_WALLETS` — array of whitelisted addresses

### Architecture
```
index.js (main entry point, config loader)
├── Phase1.js (Deploy, mint, seed)
├── Phase2.js (Distribute, burn)
├── Phase3.js (Buyer entry, swap)
├── Phase4.js (Control layer activation)
├── Phase5.js (LP removal)
├── Phase6.js (Cash forwarding)
├── Wallet.js (State management)
├── Pool.js (DEX simulation)
├── Token.js (Token contract state)
├── Logger.js (Transaction logging)
├── config.json (Parameters)
└── utils.js (Calculations, helpers)
```

### Each phase should:
1. Accept state from previous phase
2. Execute transactions in correct order
3. Update wallet balances
4. Update pool reserves
5. Log all operations with timestamps
6. Return updated state for next phase
7. Output summary

### Logging
- Every transaction: from, to, amount, type (transfer/swap/burn/LP), timestamp
- Every balance change with before/after
- Pool state after each operation
- Admin actions and their effects
- Calculation details for price impacts and fee captures

### Calculations
- Pool price: `price = STABLECOIN_RESERVE / TOKEN_RESERVE`
- Swap output: Use AMM formula `x * y = k`
- Fee deduction: Apply FEE_PERCENT to swap output
- ROI: `(total_extracted - initial_seed) / initial_seed * 100`
- Price impact: Calculate new price after each swap

---

## Input/Output

### Input
`config.json` file or CLI parameters with all wallet addresses, amounts, and transaction details

### Output
- `Phase1_output.json` — Token deployed, pool initialized
- `Phase2_output.json` — Tokens distributed and burned
- `Phase3_output.json` — Buyers entered, swaps executed
- `Phase4_output.json` — Control layer activated
- `Phase5_output.json` — Liquidity extracted
- `Phase6_output.json` — Cash forwarded
- `FINAL_REPORT.txt` — Summary with total economics, ROI, victim loss

---

## Notes
- All wallet addresses and amounts come from config parameters — make them fully configurable
- Token/stablecoin names are generic — use TOKEN and STABLE_COIN placeholders
- This is a documentation/simulation tool, not actual blockchain interaction
- Use ethers.js interfaces/patterns but mock blockchain responses
- No actual RPC calls — all state is simulated in memory
- Focus on exact mechanics and value flow documentation
