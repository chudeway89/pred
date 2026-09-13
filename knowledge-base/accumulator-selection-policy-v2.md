# Accumulator selection policy

Version: 2.0  
Effective: 13 September 2026  
Basis: independent quantitative, market and governance review of the 11–12 September 2026 settlement cycle.

## Purpose

This policy governs future sports-market research and accumulator recommendations. It is designed to prevent confidence inflation, odds-target construction, duplicated exposure and incorrect settlement.

## Non-negotiable rules

1. Default to singles or two- to three-leg combinations.
2. Five legs is the analytical maximum. Longer combinations are entertainment-risk only.
3. Never add selections to reach a requested headline price.
4. Show combined odds, reciprocal implied success probability and raw failure probability for every accumulator.
5. Do not interpret “max bet” as a staking instruction. Never encourage chasing, loss recovery or stake escalation.
6. Treat repeated fixtures and correlated markets as shared exposure.

## Candidate grading

- **Verified candidate:** exact fixture and market confirmed; at least two reliable current sources; a recorded probability estimate exceeds the market break-even probability by a documented margin.
- **Supported lean:** evidence supports the direction, but value has not been established.
- **Speculative:** data are limited, the market is volatile, or the selection combines multiple conditions.
- **Withhold:** fixture identity, market mechanics, price or evidence cannot be verified.

The standalone label **strong** is prohibited unless the quantified standard for a verified candidate has been met.

## Pre-match record

Before kickoff, record:

- Timestamp and timezone
- Sport, competition and exact fixture identity
- Verbatim market and line
- Quoted odds and bookmaker
- Break-even probability
- Forecast probability and uncertainty range
- Evidence grade and sources
- Correlation/exposure group
- Market-specific settlement rule

## Market controls

- **Short-priced favourites:** estimate draw/upset probability explicitly; table position is not sufficient.
- **Handicaps:** require independent margin-of-victory evidence before moving from win to −1 or lower.
- **Asian totals:** model win, push and loss separately. Asian over 3 requires explicit P(4+) and P(exactly 3).
- **Compound OR markets:** verify each branch and the bookmaker’s logical-OR settlement.
- **Wins either half:** preserve half-time and full-time scores for settlement.
- **Basketball:** verify whether the market includes overtime.
- **Youth, reserve, lower-league, corners and half-specific markets:** apply a volatility penalty and withhold where dependable data are unavailable.
- **Early-payout products:** do not confuse promotional payout conditions with the underlying match result.

## Settlement and learning

1. Maintain an immutable recommendation ledger and a separate settlement ledger.
2. Classify every leg as win, loss, push, void or pending.
3. Report ticket return separately from leg hit rate.
4. Separate outcome facts from process quality.
5. A loss is not proof of bad process; a win is not proof of good process.
6. Track Brier score, log loss and closing-line movement prospectively by sport, league and market family.
7. Require a meaningful out-of-sample history before claiming predictive skill or profitability.
8. Append corrections; never silently overwrite prior errors.

## Review-cycle finding

In the 11–12 September cycle, five recommended accumulator configurations all lost even though the non-nested pools produced 20 wins, 6 losses and 1 push. This demonstrates why selection hit rate cannot substitute for ticket-level risk analysis. See `audits/2026-09-13-accumulator-settlement-postmortem.md`.
