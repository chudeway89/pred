# Accumulator selection policy v3

Version: 3.0  
Effective: 13 September 2026  
Supersedes: v2 and any older conflicting 8–12-leg guidance.

## Purpose

This policy prevents target-odds contamination, false diversification, unsupported confidence labels, market-definition errors and hindsight-driven learning.

## Canonical rules

### Ticket construction

1. Default to singles or two- to three-leg combinations.
2. Five legs is the hard ceiling for an analytical accumulator.
3. Six or more legs are entertainment-only and must never be called principal, evidence-led or high-confidence recommendations.
4. Admission standards never relax to reach 100×, 1,000×, 10,000× or any requested headline odds. If the qualified pool cannot reach the target, say so.
5. A synthetic lottery example is not a recommendation and is excluded from analytical performance claims.
6. “Independent tickets” must share no fixture or selection. Overlapping slips must be labelled nested or overlapping variants.
7. Publish a leg-by-ticket exposure matrix. By default, one fixture may appear in only one analytical ticket.
8. Count duplicate legs once for calibration and once per ticket for bankroll exposure.

### Value admission gate

Every recommended leg must record:

- bookmaker, exact odds and capture time;
- exact event, competition, market ID/specifier and selection;
- scheduled start time and settlement rule;
- reciprocal offered-odds break-even benchmark;
- de-vigged consensus market probability;
- independent probability estimate with uncertainty interval;
- expected value (p 	imes odds - 1);
- evidence grade under a published rubric;
- dependency and portfolio exposure group.

Admit a leg only when the conservative probability bound exceeds break-even by a predeclared safety buffer. “Likely winner” is not equivalent to “positive-value bet.”

Do not call (1/odds) an implied success probability. It is an offered-odds break-even benchmark constructed from already-margined prices.

### Draw and dependence controls

- Every football 1X2 favourite requires an explicit win/draw/loss estimate.
- Compare 1X2, draw-no-bet and double chance using price and expected value.
- Exact duplicate legs represent one underlying event, not independent probability.
- Same-fixture markets are correlated.
- Shared league, model, provider and tactical narratives are factor exposures.
- Do not multiply probabilities into a single precise ticket forecast until dependence is assessed.
- If dependence cannot be quantified, report a range or stress test.

### Evidence bundle

Require, where applicable:

- confirmed lineup/active roster;
- injuries and suspensions;
- rest, travel and schedule context;
- opponent-adjusted current metrics;
- venue and weather;
- market consensus and closing movement;
- sport-specific inputs.

MLB additionally requires a confirmed starter, expected batting order, bullpen availability, weather and an explicit regulation-tie probability when the market is three-way.

Basketball additionally requires active roster, likely rotation and overtime settlement.

H2H, streaks, standings, one recent score and a preview’s predicted score are contextual evidence only. They cannot determine the probability estimate.

### Caveat-to-gate rule

A material unverified input—high-impact lineup, starting pitcher, event identity, thin-data friendly/lower-tier fixture, market mechanics or settlement condition—means exclude until verified. A warning cannot coexist with an unchanged principal recommendation.

### Best-contract rule

Compare all available equivalent contracts on price, expected value and settlement risk. For baseball, prefer an extra-innings moneyline or robust run line when it offers superior risk-adjusted value. Use a three-way regulation result only after pricing the tie risk and demonstrating an edge.

### Pre-start execution

Freeze an immutable pre-match ledger containing event ID, market ID/specifier, team/league identity, selection, odds, timestamp, start time and source.

Run a mandatory final validation near start. A material price, lineup, pitcher, weather, identity or market-status change triggers removal and recomputation. Never silently substitute a different market or fixture.

### Provider and thin-data uncertainty

No provider is labelled reliable without rolling out-of-sample calibration. When independent verification is unavailable, widen uncertainty or abstain; missing evidence is not permission to trust a proprietary probability.

### Settlement and learning

1. Settle every leg as win, loss, push, void, postponed or pending under the exact bookmaker contract.
2. Report unique-leg calibration separately from ticket results and unit return.
3. Track probability-bin calibration, Brier score, log loss, closing-line value and ROI by sport, league, market family and evidence grade.
4. Use minimum sample sizes and confidence intervals before promoting a league/market observation into permanent policy.
5. Treat small-sample patterns as hypotheses until replicated.
6. A loss is variance unless an ex-ante input, price gap, market misunderstanding or process breach identifies a preventable error.
7. A win does not validate a process breach.
8. Append corrections; never silently overwrite historical recommendations or errors.

### Error taxonomy

Every post-mortem classifies issues as one or more of:

- market-definition error;
- event/team identity error;
- lineup/news omission;
- probability/calibration error;
- price/value error;
- portfolio/correlation error;
- execution/timing error;
- irreducible variance.

### Automation

Begin final settlement after the latest expected finish plus a buffer. If any event is postponed or unsettled, retry and list the blockers. Preserve regulation-versus-extra-innings, overtime, push and void rules exactly.

## Canonical workflow

Capture exact contracts → de-vig the market baseline → produce an independent estimate with uncertainty → apply the conservative edge gate → verify lineups and market state → build at most five legs under exposure caps → freeze the ledger → settle unique legs and tickets separately → score calibration, closing-line value and ROI → promote only replicated findings to permanent policy.

## 13 September trigger

The 13 September tickets demonstrated the need for this version:

- one Sporting draw defeated all four tickets;
- one Milwaukee loss defeated all three headline tickets;
- three thin-data basketball additions used in the 10,501.22 construction lost;
- acknowledged “price-building selections” contradicted the no-target-padding rule;
- the tickets called independent shared extensive exposure;
- several winning selections still failed the process-quality standard.

See `audits/2026-09-13-todays-ticket-review-checkpoint.md`.
