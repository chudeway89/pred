# Accumulator settlement and panel resolutions — 13 September 2026

## Scope

This is a research settlement audit, not a SportyBet account or payout reconciliation. It covers every accumulator configuration recommended in the 11–12 September review cycle:

1. Cross-sport core five-leg ticket — 6.13 odds
2. Cross-sport expanded seven-leg ticket — 8.30 odds
3. TUK7YZ core six-leg ticket — 4.64 odds
4. TUK7YZ expanded ten-leg ticket — 19.61 odds
5. L20FPX best-ten ticket — 15.94 odds

The published pools contained 27 listed leg exposures, 24 unique market selections and 23 unique fixtures. Dortmund to win appeared in all three pools; Athletic Club to win appeared in two. Casa Pia–Porto appeared twice with different markets and is therefore settled twice.

No claim is made that any ticket was actually placed. A hypothetical one-unit stake on each of the five published ticket configurations would have lost five units because all five accumulators failed.

## Executive outcome

| Recommended ticket | Odds | Leg outcome | Ticket result | Raw implied success probability |
|---|---:|---:|---|---:|
| Cross-sport core | 6.13 | 3W–2L | **LOST** | 16.31% |
| Cross-sport expanded | 8.30 | 5W–2L | **LOST** | 12.05% |
| TUK7YZ core | 4.64 | 5W–1L | **LOST** | 21.55% |
| TUK7YZ expanded | 19.61 | 8W–2L | **LOST** | 5.10% |
| L20FPX best ten | 15.94 | 7W–2L–1P | **LOST** | 6.27% |

Across the three non-nested published pools, the ledger was **20 wins, 6 losses and 1 push**. That apparently strong leg-level result still produced **zero winning accumulator configurations out of five**. This is the central lesson: hit rate is not ticket profitability, and multiplication makes one weak leg decisive.

## Settlement ledger

### Cross-sport pool

| Selection | Final result | Settlement |
|---|---:|---|
| Fuerza Regia to beat Santos del Potosí | Santos 74–103 Fuerza Regia | WIN |
| Dortmund to beat Paderborn | Dortmund 3–0 Paderborn | WIN |
| Liverpool to beat Fulham | Liverpool 0–0 Fulham | LOSS |
| Athletic Club to beat Elche | Athletic 1–1 Elche | LOSS |
| Arsenal to beat Sunderland | Sunderland 0–2 Arsenal | WIN |
| France women to beat Germany | France 86–64 Germany | WIN |
| Chemnitz to beat Giessen | Giessen 70–77 Chemnitz | WIN |

The two basketball additions won, but the expanded ticket inherited both football losses from the core ticket.

### TUK7YZ pool

| Selection | Final result | Settlement |
|---|---:|---|
| Racing Santander–Alavés over 1.5 | 2–1 | WIN |
| Dortmund to beat Paderborn | 3–0 | WIN |
| Hoffenheim–Stuttgart over 2.5 | 2–1 | WIN |
| Cambuur–NEC over 2.5 | 3–0 | WIN |
| Porto to beat Casa Pia | Casa Pia 1–4 Porto | WIN |
| Al-Nassr to beat Al-Khaleej | Al-Khaleej 1–1 Al-Nassr | LOSS |
| Augsburg–Leverkusen over 2.5 | 2–2 | WIN |
| Freiburg–Gladbach over 2.5 | 5–0 | WIN |
| West Brom or draw vs QPR | 1–1 | WIN |
| Athletic Club to beat Elche | 1–1 | LOSS |

The six-leg ticket was 5/6 but lost through Al-Nassr. The ten-leg version was 8/10 and lost through Al-Nassr and Athletic Club.

### L20FPX pool

| Selection | Final result | Settlement |
|---|---:|---|
| Dortmund to beat Paderborn | 3–0 | WIN |
| Sundowns to beat Chippa United | 1–1 | LOSS |
| Ghana–France U20 women Asian over 2 | 0–4 | WIN |
| South Korea–Ecuador U20 women Asian over 2 | 3–2 | WIN |
| Twente–ADO Asian over 3 | 2–0 | LOSS |
| Go Ahead Eagles–Groningen: draw or BTTS | 1–1 | WIN |
| Saint-Étienne to win either half at Dunkerque | HT 0–1; FT 2–1 | WIN |
| Connah’s Quay over 0.5 team goals at Colwyn Bay | Colwyn Bay 2–1 Connah’s Quay | WIN |
| Porto −1 Asian at Casa Pia | Casa Pia 1–4 Porto | WIN |
| Sparta Prague–Jablonec Asian over 2 | 2–0 | PUSH |

The ticket lost through Sundowns and Twente. The Sparta total pushed under standard Asian-total settlement and reduced rather than defeated the multiple.

## Outcome facts versus process assessment

A losing leg is not automatically a bad prediction, and a winning leg is not automatically a good one. The panel classified the process failures as follows:

1. **Unsupported confidence inflation.** Liverpool, Athletic Club, Al-Nassr and Sundowns were short-priced favourites promoted mainly through form, table position and narrative evidence. No explicit forecast probability, draw probability or edge over the quoted price was recorded.
2. **Threshold mismatch.** Twente’s superiority case did not establish the probability of four total goals. Asian over 3 required four goals for a full win and lost at 2–0.
3. **Accumulator design failure.** Five ticket configurations lost even though 20 of 27 pool exposures won and one pushed. The ticket architecture converted a reasonably high selection hit rate into repeated total loss.
4. **False diversification.** Nested tickets and repeated Dortmund/Athletic selections created duplicated exposure, not independent evidence.
5. **Small-sample extrapolation.** Recent score sequences were given too much weight in some goal markets. The strong outcomes of the three basketball selections are also too small a sample to prove that basketball is a superior market.
6. **Price blindness.** “Likely winner” and “value at the offered odds” were not kept separate. A selection can be more likely than its opponent and still be a poor bet.
7. **Settlement-data fragility.** Live and indexed pages sometimes retained placeholders or stale scores. Final settlement must use dated result pages and market-specific facts.

## Panel resolutions — effective immediately

### Ticket construction

1. Default output: singles or two- to three-leg combinations.
2. Hard cap: five legs for an analytical accumulator. Anything longer must be labelled **entertainment-risk only**, not a principal recommendation.
3. Never add legs to reach 100, 1,000, 10,000 or “maximum” odds.
4. Display reciprocal ticket odds and corresponding raw failure probability beside every accumulator.
5. Treat repeated fixtures, closely related markets and common tactical narratives as shared exposure, not diversification.
6. Never interpret “max bet” as a maximum-stake instruction. Do not encourage chasing or stake escalation.

### Selection standard

7. Retire the unqualified label **strong**.
8. Use four grades:
   - **Verified candidate:** exact fixture and market confirmed; at least two reliable current sources; estimated probability exceeds price break-even by a documented margin.
   - **Supported lean:** directionally supported, but no proven pricing edge.
   - **Speculative:** volatile competition, weak data or compound market.
   - **Withhold:** identity, mechanics, price or evidence is inadequate.
9. Record before kickoff: timestamp, exact market wording, line, price, estimated probability, uncertainty range, break-even probability, evidence grade and sources.
10. For 1X2 favourites below 1.50, model draw risk explicitly. Do not infer safety from league position.
11. Never upgrade a win to −1 without separate margin-of-victory evidence.
12. For Asian over 3, model P(4+) and P(exactly 3) separately. Team superiority is not evidence of four total goals.
13. Add a volatility penalty for youth, reserve, lower-league, corner and half-specific markets unless dependable data are available.
14. Verify SportyBet settlement mechanics for integer Asian totals, early-payout products, “draw or BTTS”, “wins either half”, overtime and voids before recommending.

### Measurement and learning

15. Maintain an immutable recommendation ledger and a separate settlement ledger.
16. Report win, loss, push, void or pending for every leg; never collapse pushes into wins.
17. Separate outcome quality from process quality in every post-mortem.
18. Track prospective Brier score, log loss and closing-line movement by sport, league and market family.
19. Require a meaningful out-of-sample history before claiming predictive skill or a profitable edge.
20. Report ticket results and unit returns separately from leg hit rate.
21. Do not silently overwrite prior errors. Append corrections and preserve the historical record.

## Source record

- [Fuerza Regia official result](https://www.fuerzaregia.com.mx/)
- [Reuters: Dortmund 3–0 Paderborn and Bundesliga results](https://www.reuters.com/sports/soccer/dortmund-make-it-three-wins-three-with-3-0-victory-over-paderborn-2026-09-12/)
- [Reuters: Liverpool 0–0 Fulham and Arsenal 2–0 Sunderland](https://www.reuters.com/sports/soccer/liverpool-chelsea-held-wins-forest-ipswich-2026-09-12/)
- [Reuters: Racing 2–1 Alavés and Athletic 1–1 Elche](https://www.reuters.com/sports/soccer/mbappe-scores-brace-real-madrid-secure-routine-victory-over-rayo-vallecano-2026-09-12/)
- [Porto match video/result: Casa Pia 1–4 Porto](https://vsports.pt/maisf/equipa/fc-porto/v7)
- [Al-Khaleej 1–1 Al-Nassr report](https://as.com/futbol/internacional/paso-atras-para-cristiano-f202609-n/)
- [West Brom 1–1 QPR result](https://www.sofascore.com/fr/football/match/west-bromwich-albion-queens-park-rangers/bsi)
- [Netherlands results: Twente 2–0 ADO, Go Ahead 1–1 Groningen, Cambuur 3–0 NEC](https://www.besoccer.com/team/sc-cambuur-leeuwarden)
- [Chippa 1–1 Sundowns result](https://africa.espn.com/football/match/_/gameId/401000000)
- [U20 women results](https://www.footlive.com/)
- [Colwyn Bay 2–1 Connah’s Quay](https://www.skysports.com/football/colwyn-bay-vs-connahs-quay-nomads/563981)
- [Sparta Prague 2–0 Jablonec official match page](https://sparta.cz/en/zapas/5512-ac-sparta-praha-fk-jablonec)
- [Giessen 70–77 Chemnitz result](https://www.sportytrader.com/en/results-live/lti-giessen-46ers-bv-chemnitz-99-8703058/)
- [France 86–64 Germany result](https://www.espn.com/womens-basketball/game/_/gameId/401000000)

This file supersedes any provisional settlement figures or stale live-score snapshots from the same review cycle.