# Accumulator audit controls v4

**Effective:** 15 September 2026

This control layer supplements Accumulator Selection Policy v3 and is binding for future SportyBet code analysis.

## 1. Immutable intake

Before analysis, preserve for every leg:

- exact home and away team order;
- market name and line;
- selected outcome;
- decimal price;
- kickoff time and timezone;
- product features such as One Cut or Flexi;
- a screenshot or raw text snapshot where available.

No later recommendation may use a manually retyped team/market without checking it against this intake record.

## 2. Three separate ledgers

Maintain distinct records for:

1. **Bookmaker account settlement** — only when visible in the authenticated account.
2. **Analytical settlement** — derived from verified scores/statistics and the saved contract.
3. **Recommendation settlement** — the exact selections actually recommended, not a reconstructed substitute.

Never imply that analytical settlement is SportyBet's account settlement.

## 3. Exact-market gate

Do not recommend or finally settle a custom market unless its contract is preserved. This includes Asian handicaps and totals, excluded totals, goal bands, combination markets, second-half 12, corners and regulation-only baseball.

If the contract or required period statistic is missing, label the row unresolved. Do not guess.

## 4. Transcription controls

- Repeat the selection as “team + line + direction” (example: Newcastle +1).
- Cross-check the first and last leg and every handicap twice.
- A team reversal invalidates any derived accumulator odds or later settlement.
- Corrections must be explicit and permanent in the audit trail.

## 5. Evidence admission

An analytical ticket remains limited to five legs. Each leg requires a price timestamp, break-even probability, evidence grade, uncertainty note, material lineup/rotation check and settlement-mechanics note.

Target-odds constructions above five legs must be labelled **high-risk, target-constrained**, never reliable or core.

## 6. Market-specific requirements

- Football favourite: quantify or explicitly discuss draw risk.
- −1 handicap: require evidence for a two-goal margin, not merely a win.
- Goal total: distinguish over 2.5 from Asian over 3.
- Corners: require corner data; goals form is not a proxy.
- Reserve/youth: default exclude unless official results and stable squad/data coverage exist.
- Basketball: verify venue and roster context.
- Baseball: verify extra-innings treatment and starting pitchers.

## 7. Ticket independence

Tickets described as independent must be fixture-disjoint. If one ticket contains another, state the shared-failure exposure prominently.

## 8. Post-settlement review

- Record wins, losses, pushes, voids and unresolved rows separately.
- Ticket outcome is determined by its first confirmed losing leg, but the full ledger remains useful for calibration.
- A winning leg does not validate a weak process.
- A losing leg is not automatically an analytical error; compare the pre-match case with the result.
- Update the knowledge base only after correcting conflicting sources and recording unresolved markets honestly.

## Resolution from LMM7Y7

LMM7Y7 demonstrated that a 40-leg, roughly 216,971-odds structure can contain many individually successful legs and still fail decisively. More importantly, a single team-direction transcription error corrupted the later shortlist. Future work must prioritise immutable market capture and exact settlement over speed or headline odds.
