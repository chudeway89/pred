# Accumulator audit controls v5

**Effective:** 16 September 2026  
**Supersedes:** accumulator-audit-controls-v4.md

This control layer supplements Accumulator Selection Policy v3 and is binding for future SportyBet code analysis and post-settlement review.

## 1. Immutable event identity

Before research, preserve an identity key containing:

- event date and kickoff time with timezone;
- competition;
- sex;
- age or reserve class;
- exact home and away team order;
- market name, line, direction and decimal price;
- SportyBet product terms such as One Cut or Flexi;
- raw text or screenshot where available.

Evidence from another sex, age class, reserve level or competition cannot be substituted. Cross-competition evidence requires an explicit, defensible reason.

## 2. Three separate ledgers

Maintain distinct records for bookmaker-account settlement, analytical settlement and recommendation settlement. Never imply that an externally derived analytical settlement is the bookmaker's account settlement.

Record wins, losses, pushes, voids and unresolved rows separately. A push is not a predictive win.

## 3. Price and probability gate

Every recommended leg must preserve:

- odds and observation time;
- break-even probability;
- estimated fair-probability range;
- uncertainty note and evidence grade;
- exact win–push–loss or win–loss settlement mechanics;
- material lineup, venue and rotation checks.

Narrative form, standings and head-to-head records do not establish value without price comparison.

## 4. Analytical-ticket ceiling

An analytical accumulator remains limited to five legs.

Any ticket above five legs or deliberately built to reach 100×, 1,000× or another headline target must be labelled **high-risk, target-constrained**. It must not be described as reliable, core or independently calibrated.

No weak leg may be added merely to cross an odds target. When the supported pool cannot reach the target, disclose the shortfall or label the additional legs as unsupported entertainment risk.

## 5. Ticket dependence

Tickets called independent must be fixture-disjoint. If a larger ticket contains a smaller ticket, disclose that it is nested and inherits every failure mode of the smaller ticket.

Evaluate ticket probability and unique-fixture exposure; do not use raw leg hit rate as a proxy for profitability.

## 6. Football market controls

- Quantify or explicitly model draw risk for 1X2 favourites.
- A −1 handicap requires margin evidence, not merely win evidence.
- Asian totals and handicaps require win–push–loss modelling.
- Cup selections settle at regulation time unless the saved contract explicitly includes qualification or extra time.
- No-draw combination markets require a separately assessed draw probability.
- Selections already live at review time are barred from pre-match recommendations.

## 7. Corner-market gate

Corner markets are barred from the analytical core unless:

1. two independent granular sources agree on the relevant data;
2. the sample contains at least ten relevant home/away matches;
3. a conservative estimate clears break-even by at least five percentage points; and
4. exact post-match corner statistics are available for settlement.

Goals form is never a proxy for corners. Head-to-head data is a cross-check, not the sole model.

## 8. Basketball and baseball controls

- Basketball: verify venue, including neutral-site status, and current roster context. Never apply a home streak to a neutral venue.
- Baseball: verify starting pitchers and whether the selected winner market includes extra innings. A regulation three-way market must be labelled clearly because a tie after nine innings loses the team selection.

## 9. Flexi and insurance products

Treat Flexi or One Cut as settlement structures, not probability evidence. Before endorsement, stress-test how many failed legs the structure tolerates against the ticket's length and market diversity. A 39/40 Flexi does not meaningfully protect a 40-leg ticket carrying broad exposure.

## 10. Outcome and process scorecards

Maintain separate outcome and process scores:

- a winning leg can be a process failure;
- a losing leg can be defensible variance;
- a winning ticket does not validate calibration from one observation;
- post-match policy changes must address pre-match information quality, not simply chase the last result.

## Resolution from HAEQW3 and 15 September target tickets

HAEQW3 settled 26 wins, 9 losses and 5 pushes; both the full accumulator and 39/40 Flexi lost. The five-leg 4.01 core won, while the 17.30 expansion failed on a corner leg. Separate 106.64 and 1,038.43 target tickets also lost despite strong raw non-loss rates. These outcomes reinforce event-identity controls, the five-leg analytical ceiling, corner restrictions, venue verification, nested-ticket disclosure and explicit draw/upset modelling.
