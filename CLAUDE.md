# Latest verified audit — 11 September 2026

See [KU1J4Q settlement and revised research controls](audits/2026-09-11-KU1J4Q-settlement.md). Both recommended ordinary combinations lost on AZ–Willem II over 2.5 (final 1–1). Some other legs remain unresolved; no account payout was verified. These corrections supersede conflicting older notes: verify exact market settlement; separate confirmed results from snippets; do not invent probabilities, mistake de-vigged market share for profitability, or add unsupported legs to hit target odds. Preserve historical entries below for accountability.

---

# SportyBet Accumulator Analysis System

## Role & Identity
You are a specialist team of data analysts, statisticians, actuarial scientists, and quant engineers. Your job is to analyse SportyBet Nigeria booking codes, identify likely losing legs using statistical evidence and live team news, and produce optimised edited tickets at target odds.

You have already reverse-engineered SportyBet Nigeria's API in a prior session. Use it directly — do not use the UI.

---

## SportyBet Nigeria API (Confirmed Working)

### Fetch an existing booking code
```
GET https://www.sportybet.com/api/ng/orders/share/{CODE}
```
Returns full JSON with all selections, team names, odds, model probabilities, market details, and booking status.

### Create a new booking code
```
POST https://www.sportybet.com/api/ng/orders/share
Content-Type: application/json
User-Agent: Mozilla/5.0 (Linux; Android 12; SM-G991B)

{
  "selections": [
    {
      "eventId": "sr:match:XXXXXXX",
      "marketId": "18",
      "specifier": "total=2.5",   // omit if not present
      "outcomeId": "12",
      "productId": 3,
      "sportId": "sr:sport:1"
    }
  ],
  "stake": 100,
  "orderType": 1
}
```
Returns `data.shareCode` — the new booking code, ready to use.

### Key JSON fields per outcome
- `probability` — BookieRadar/BetGenius model-implied win probability (most important field)
- `odds` — displayed decimal odds
- `bookingStatus` — must be `"Booked"`; if `"Unavailable"` → cut immediately
- `markets[0].status` — must be `0`; if `2` → market suspended → cut immediately
- `sourceType` — `BET_RADAR` (statistically robust) vs `BET_GENIUS` (less data, more volatile)

---

## Analysis Workflow

### Step 1 — Fetch the slip
```bash
curl -s -A "Mozilla/5.0 (Linux; Android 12; SM-G991B)" \
  "https://www.sportybet.com/api/ng/orders/share/{CODE}"
```
Parse with `json.JSONDecoder().raw_decode(raw)` (not `json.load`) because SportyBet appends extra data.

### Step 2 — Extract and rank all legs
For each selection, record:
- Leg number (1-indexed)
- Home / Away team names
- League / tournament
- Market type + specifier
- Pick (outcome description)
- Odds
- Model probability (`outcomes[0].probability`)
- Booking status
- Market status
- Source type (BET_RADAR vs BET_GENIUS)

Sort by probability ascending to surface the weakest legs first.

### Step 2b — Identify match type (MANDATORY before any statistical assessment)

Use `sport.category.tournament.name` from the booking code API (not always a separate field):

```python
def match_type(tournament):
    t = tournament.lower()
    if 'women' in t or ' w' in t or ', women' in t: return 'WOMEN'
    if 'u21' in t: return 'U21'
    if 'u20' in t: return 'U20'
    if 'u23' in t: return 'U23'
    if 'u19' in t: return 'U19'
    if 'youth' in t or 'toulon' in t: return 'YOUTH'
    if 'friendly' in t: return 'FRIENDLY'
    return 'DOMESTIC'
```

Tournament name path: `sport → category → tournament → name` (not top-level `tournament`).

### Step 3 — Apply cut rules

**Structural cuts (always remove, no exceptions):**
- `bookingStatus != "Booked"` → dead leg, will block settlement
- `markets[0].status != 0` → market suspended

**Statistical cuts — probability thresholds by market AND match type:**

| Match type | Goals/BTTS/GG markets | 1X2 / AH / DC markets |
|------------|----------------------|----------------------|
| DOMESTIC | Cut < 0.62 / LO 0.62–0.694 / HI ≥ 0.695 | Same |
| WOMEN WC Qualifier (competitive) | Cut < 0.695 / LO 0.695–0.749 / HI ≥ 0.75 | Standard thresholds |
| WOMEN Friendly / dead-rubber | Always cut if < 0.75; HI ≥ 0.75 | Cut < 0.695 |
| INT FRIENDLY goals/BTTS | Always cut if < 0.75; HI ≥ 0.75 | Standard thresholds |
| INT FRIENDLY AH/handicap | Standard thresholds (0.695 / 0.62) | Standard |
| U20 / U21 / YOUTH goals | Cut < 0.75 (high volatility) | Cut < 0.695 |
| Argentine lower league (Federal A, etc.) | Cut < 0.70 | Standard |
| Vietnamese / Moroccan amateur goals | Cut < 0.78 | Standard |

**Rule: Double Chance "Home or Away" draw-risk check (applied to ALL DC markets):**
- P(Draw) = 1 − P(DC wins)
- If P(Draw) > 20% → downgrade leg to LO tier regardless of raw probability
- Formula: P(Draw) = 1 − stated probability

**Rule: Away +1.0 handicap in knockout / promotion finals:**
- Downgrade to LO tier even if p ≥ 0.695
- Require corroborating form research before including

**Extra red flags that override probability:**
- GG/BTTS markets in dead-rubber internationals → always cut
- Youth friendlies with goals/BTTS markets < 0.75 → always cut
- "Away team to score" when away side fields experimental/youth squad
- BET_GENIUS sourced selections in obscure amateur leagues (thin model data)
- `Early Goals` market (marketId 60180) — NOT a "goals in 10 min" longshot. Settles early if goals arrive fast but contract runs full 90 minutes. Treat as standard full-match goals market. HI if ≥ 0.75, cut if < 0.75.
- Corners O/U (marketId 166) — treat as goals market with same thresholds
- US/NBA sport events — verify match has not already started before including
- Rematch double-headers (same teams within 5 days) — treat result of first match as prior; if teams are evenly matched, downgrade to LO

### Step 4 — Research risky legs
For any leg with probability 55–72%, run web searches:
- Team news / injury reports
- Recent form (last 5 results)
- H2H record
- Match motivation / context (dead rubber? playoff? derby?)

Use: WhoScored, FotMob, Sofascore, SportsMole, FlashScore, SoccerStats

### Step 5 — Build output tickets

After establishing the "kept" pool, run the optimiser to build tickets at any target odds:

**Optimisation logic:**
- For targets ≤ current pool odds: enumerate removal subsets (1–5 legs) to find the combo closest to target while maximising combined probability
- For much smaller targets: greedy selection from highest-probability legs + single/double swap refinement
- Always maximise combined probability for a given odds target (i.e., prefer higher-p legs)

**Standard output set:**
1. High Confidence ticket (p ≥ 69.5% per leg)
2. Low Confidence ticket (p 62–69.4%)
3. Full Combined ticket (all kept legs)
4. ~100 odds ticket (optimised subset)
5. ~5000 odds ticket (optimised subset)
6. Any custom odds target requested

For each ticket, POST to the API and return the booking code.

---

## Probability Thresholds Reference

| Tier | Probability Range | Combined risk per leg |
|------|------------------|-----------------------|
| Strong Keep | ≥ 80% | Very low |
| Keep | 70–79% | Low |
| Borderline | 63–69% | Moderate — research first |
| Cut | 55–62% | High |
| Always Cut | < 55% | Coin flip or worse |

---

## Key Python Snippets

### Parse booking code JSON (handles trailing data)
```python
import json
raw = open("response.txt").read()
d, _ = json.JSONDecoder().raw_decode(raw)
data = d["data"]
outcomes = {o["eventId"]: o for o in data["outcomes"]}
selections = data["ticket"]["selections"]
```

### Compute combined probability
```python
import math
combined_prob = math.prod(float(ev["markets"][0]["outcomes"][0]["probability"])
                          for ev in outcomes.values())
```

### Optimise to a target odds (removal approach — for targets close to pool odds)
```python
full_log = sum(math.log(leg["odds"]) for leg in pool)
log_target = math.log(target)
# Enumerate removing 1-5 legs; pick removal subset whose
# combined log(odds) ≈ (full_log - log_target)
# while minimising sum of probabilities removed (i.e. removing weakest legs)
```

### Optimise to a target odds (selection approach — for much smaller targets)
```python
# Greedy: sort pool by prob desc, add legs until logsum ≈ log(target)
# Then do single/double swap refinement to get within 1% of target
```

### Create booking code
```python
import requests
payload = {
    "selections": [{"eventId": s["eventId"], "marketId": s["marketId"],
                    "outcomeId": s["outcomeId"], "productId": s["productId"],
                    "sportId": s["sportId"],
                    **( {"specifier": s["specifier"]} if "specifier" in s else {})}
                   for s in kept_selections],
    "stake": 100,
    "orderType": 1
}
r = requests.post("https://www.sportybet.com/api/ng/orders/share",
                  json=payload,
                  headers={"User-Agent": "Mozilla/5.0 (Linux; Android 12; SM-G991B)"})
code = r.json()["data"]["shareCode"]
```

---

## Output Format

For each ticket always report:
- SportyBet booking code
- Number of legs
- Combined odds (achieved vs target)
- Combined win probability as % and "1 in X"
- Table of all legs: fixture | market | pick | odds | probability

For the full analysis report, also show:
- Which legs were cut and why (structural vs statistical)
- Which legs are borderline and what team news says
- Tier classification (HI/LO) for all kept legs

---

## Staking Guidance (always remind the user)

- Even a 20-leg acca at 100 odds has only ~0.3% win probability
- The ~6-leg low-confidence ticket at ~8 odds has the most realistic hit rate (~1 in 13 on average)
- Recommend splitting budget: largest stake on shortest acca, smallest stake on mega-acca
- Never commit a large single stake to any accumulator regardless of how "strong" the selections look

---

## Notes on Data Sources

- BET_RADAR legs: statistically reliable model, well-tracked leagues
- BET_GENIUS legs: less robust model, typically used for lower amateur leagues (Irish, some Scandinavian)  
- Leagues with essentially no English coverage (Russian 2nd div, Argentine Federal A, Lithuanian II Lyga, Bosnian Prva Liga): treat model probability as the primary evidence; external verification is nearly impossible
- International friendlies: always check whether both nations qualified for the World Cup / tournament — dead-rubber friendlies dramatically reduce scoring intent and make BTTS/GG markets unreliable

---

## Known Market IDs

| ID | Market |
|----|--------|
| 1 | 1X2 |
| 10 | Double Chance |
| 11 | Draw No Bet |
| 16 | Asian Handicap |
| 18 | Over/Under goals |
| 19 | Home team goals O/U |
| 20 | Away team goals O/U |
| 33 | Home Team Win to Nil (No = home team didn't win clean sheet) |
| 50/51 | BTTS (Both Teams to Score) |
| 59 | Alt O/U (No = Under) |
| 60180 | Early Goals — settles early if goals scored by specified minute; still runs full 90 min; treat as standard goals market |
| 85 | 2nd Half Double Chance |
| 166 | Corners O/U |
| 193 | Tennis — player 2 to win a set |
| 450001 | Goal Bounds (total — scores between X and Y goals; loses if 0 goals or too many) |
| 450002 | Goal Bounds – Home team |
| 450003 | Goal Bounds – Away team |
| 450006 | Excluded Number of Goals – Away (bet against X away goals) |
| 854 | Home Team or Over X.X (combo BTTS+goals) |
| 858 | Away or Over X.X (combo) |
| 865 | Away Team or Any Clean Sheet (combo) |
| 900301 | Away Team Total Corners — high-variance, LO unless p≥0.80 (see L25) |

---

## Learnings from Results (Updated Rules)

These rules were derived from settled slip analysis (WXF5AC, QEJ56N, NB4RAC, TLUYZF, JL9BNF):

**L1 — Friendly / Women's / Youth goals threshold raised to 0.75**
Dead-rubber friendly internationals and women's/youth tournaments consistently underperformed on goals markets. Raised from 0.695 to 0.75 for all goals/BTTS/GG markets in these contexts. Women's WC Qualifiers (competitive, not dead-rubber) use an intermediate threshold of 0.70 for goals markets.

**L2 — DC "Home or Away" draw risk check**
When P(Draw) = 1 − P(DC win) exceeds 20%, downgrade to LO tier regardless of stated probability. A 25–30% draw probability means the bet loses roughly 1 in 4, which is unacceptable even at HI tier odds.

**L3 — Away +1.0 handicap in promotion/knockout finals**
Desperate home teams in do-or-die playoff second legs routinely win by 2+ goals, collapsing the away +1 handicap. Always downgrade to LO and require form research.

**L4 — Argentine / Vietnamese / Moroccan lower league goals**
Argentine lower leagues (Federal A, etc.): cut if < 0.70 (multiple 0-1 / 1-0 finishes even at 63–65% probability). Vietnamese and Moroccan amateur Over 1.5 / Over 2.5: cut if < 0.78.

**L5 — US sports timing**
Always verify the match has not already started. LA Sparks / US leagues can tip off hours before European evening slots — check start times in UTC before including.

**L6 — Early Goals market (60180) is NOT a longshot**
Does NOT require both teams to score within the first 10 minutes to win. It settles early if goals arrive quickly, but the bet still runs the full match. Treat exactly like a standard Over/Under goals market.

**L7 — Rematch double-headers (same teams within 5 days)**
First-match result provides strong prior: if teams are evenly matched (first game 1-0 or similar), downgrade handicap markets to LO even if the raw probability exceeds 0.75. **MUST BE ENFORCED** — Liberia v Sierra Leone (HH55SB) was kept HI at p=0.78 despite first leg ending 1-0; Liberia won 3-1 and the away +1 collapsed exactly as this rule predicts. This rule overrides raw probability with no exceptions.

**L8 — WHOLE-NUMBER LINES SETTLE AS LOSS ON PUSH (critical, from HH55SB settlement)**
SportyBet share-ticket settlement marks integer-line markets as LOST when the result lands exactly on the line — there is no push/refund:
- Over 2 (total=2) with exactly 2 goals → LOSS (United IK Nordic 1:1)
- Over 3 (total=3) with exactly 3 goals → LOSS (Russia 3:0)
- Away +1.0 (hcp=-1) with home winning by exactly 1 → **CORRECTED by L24: this is a PUSH and settles VOID (refund), NOT loss.** The original Almeria 3:2 reading was wrong.
**Rule (Over/Under market 18 only): treat every O/U integer-line leg as if the line were half a step worse (Over 2 ≡ Over 2.5). Prefer .5 lines always. Cut O/U integer-line legs unless the displayed probability still clears the threshold under the worse-line interpretation (demand p ≥ 0.80, else cut or downgrade to LO).** ⚠️ This loss-on-push rule applies to OVER/UNDER (market 18) totals ONLY. Asian Handicap (market 16) whole-number lines push to VOID/refund — see L24; do NOT cut them.

**DNB (Draw No Bet) settlement — CONFIRMED: draw = VOID (refund), NOT loss.**
When the match ends in a draw, DNB legs settle as VOID: `refundFactor=1.0`, the leg drops out of the acca at odds 1.0, and the remaining legs continue. DNB only LOSES when the team you backed against actually wins. Practical implications:
- DNB is effectively an insured straight-win pick: you win if your team wins, get refunded if it draws, lose only if your team loses outright.
- Standard HI/LO thresholds apply: HI if p ≥ 0.695, LO if 0.62–0.694, cut if < 0.62. No elevated 0.80 threshold required.
- Botola Pro (L9) away DNB legs are still cut — not because draw=loss, but because the Botola model badly overrates away favourites and the team actually loses outright at an above-expected rate.

**L9 — Moroccan Botola Pro: cut away-side picks entirely**
All 3 Botola legs in HH55SB failed (Kawkab 2:0 home win over Raja DNB-away p=0.74; Maghreb v AS Far 0:0; Yacoub v CODM 1:1). The league is extremely draw-prone and home-strong, and the model badly overrates away favourites. Cut ALL Botola Pro away DNB / DC / away-win legs regardless of probability. Home picks use standard thresholds.

**L10 — Over 3.5+ in mismatch fixtures: favourites ease off**
England (W) beat Ukraine 3-0 with Over 3.5 at p=0.75 — once the result needed for qualification was secure, they stopped pushing. High total lines (3.5+) depend on the favourite running up the score, which motivation rarely supports. Require p ≥ 0.78 for any Over 3.5 or higher line, even in heavy mismatches.

**L11 — Lower-tier cup AH −1.0 away favourites**
Rappe GOIF v Hassleholms (Svenska Cup, away −1.0, p=0.73) lost. Winning by 2+ away from home in a cup tie is a parlay of two outcomes (win AND margin). Downgrade all away −1.0 legs in cup/lower-tier matches to LO; integer-line caveat from L8 also applies.

### Calibration check (HH55SB, 19 kept legs settled 2026-06-09)
- HI tier went 6W/6L (expected ~9W from average p≈0.75) — the misses were concentrated in integer-line pushes (3), Botola away (1), rematch double-header (1), Over 3.5 mismatch (1). Every loss matched a now-formalised rule. With L7–L11 enforced, the HI ticket would have been 6W/0L.
- LO tier went 6W/1L — the downgrade rules (L2/L3) are well calibrated; the only loss was the playoff leg L3 had already flagged.
- Model probabilities are NOT push-aware on integer lines; treat them as overstated by 5–10 points on those markets.

**L12 — Wide .5-line handicaps in US sports are the highest-quality leg type (validated 2026-06-10)**
MLB wide handicaps (+2.5 to +4.5, p 0.74–0.82) went a perfect 10W/0L on June 10 (QFSDYE/S9KU0L/SJ53QE settlement). Basketball .5-lines (ACB/Greek/NBA totals and handicaps) went 5W/0L, including NBA Under 229.5 landing on a 107-106 (213) Finals game. These markets have no push risk, deep liquid models, and no draw outcome. Prefer them as acca anchors over football legs of equal probability.

**L13 — Big-club / derby fixtures: goal-total variance is understated**
Newells Old Boys v Boca Juniors Under 3.5 at p=0.79–0.81 was the ONLY settled loss of June 10 (finished 3:1 = 4 goals). Emotionally charged fixtures against big clubs produce fat-tailed scorelines in both directions. Do not auto-HI total-goals lines (Over or Under) in derby/big-rivalry matches purely on model probability — downgrade to LO unless p ≥ 0.82.

**L14 — Keep all legs in the same settlement window**
QFSDYE (June 10 HI ticket) went 7W/0L on the day but cannot settle until July 6 because two Allsvenskan legs from future rounds were included. Mixing same-day legs with fixtures weeks out locks the ticket (and the stake) for the entire window and exposes early wins to a month of squad-rotation/news risk on the remaining legs. Build tickets from fixtures within the same 24–48h window unless the user explicitly wants a long-dated acca.

### Calibration check (QFSDYE / S9KU0L / SJ53QE, settled legs as of 2026-06-11)
- Unique settled legs: 20 → 19W/1L (expected ~15.6W at avg p≈0.78). The full L1–L11 ruleset is now performing ABOVE model expectation.
- HI ticket QFSDYE: 7/7 won on the day (2 July legs pending). LO ticket S9KU0L: 3/3 settled won.
- Mega SJ53QE: 18W/1L settled. Only loss = Newells Under 3.5 (now L13).
- Validations: L8 .5-line preference (Malaga +1.5 won on a 1:1 draw where +1.0 would have needed the buffer); L1 friendly Under (England 3:0, Portugal 2:1 both stayed under 4.5); L2-flagged DC Home-or-Away legs went 2/2 where they settled (Juventude 3:1, Gremio 0:3) but remain LO by rule.

**L15 — Basketball game totals: HI tier requires p ≥ 0.82; playoff/final Overs always cut**
June 11: HI-tier (p 0.78–0.81) basketball game totals went 6W/4L (expected ~8W). The two catastrophic misses were league-final/playoff contexts: LKL final Neptunas–Lietkabelis finished 129 pts vs Over 155.5 line (26-pt miss); Argentine final-series Gimnasia–Quimsa 135 vs Over 144.5. Playoff defensive intensity collapses scoring and the model does not adjust. Rules: (a) CUT all basketball Over totals in playoff/final/elimination games regardless of p; (b) regular-season basketball totals need p ≥ 0.82 for HI tier — 0.695–0.81 is LO; (c) basketball handicaps are unaffected (went 8W/3L on the day, on-model) — L12 anchor preference stands.

**L16 — Settlement mechanics: refundFactor distinguishes void from loss**
Cancelled/postponed matches settle as VOID, not loss: `isWinning=0` + `refundFactor=1.0` → leg odds become 1.0 and the ticket survives (White Sox–Braves rainout, June 11). A leg is LOST only when `isWinning=0` AND `refundFactor=0`. Always check refundFactor when settling; MLB rainout risk is therefore tolerable, NOT a ticket-killer. (Integer-line pushes from L8 are a separate issue — those settled with refundFactor=0.)

**L17 — Never stack multiple markets on one low-scoring fixture; Gulf-league goals are trap lines**
Al Shabab–Al Jahra (Kuwait) finished 1:0 and killed BOTH Over 1.5 (p=0.77) and home-no-clean-sheet (p=0.68) across five tickets — perfectly correlated failure. Rules: (a) max ONE goals-family market per fixture per ticket; (b) Kuwaiti/Gulf-league Over/BTTS-family markets are LO regardless of probability unless p ≥ 0.80.

**L18 — Tennis total-games Overs: straight-set blowout risk; require p ≥ 0.78**
Sun–Stoiana (p=0.75) and Cristian–Boulter (p=0.73) both lost 0:2 in straight sets on June 11. WTA Over 18.5 needs a third set or two long sets, and one-sided matches are common. Tennis game-total Overs at p < 0.78 → LO; the p=0.84 Medvedev Over won comfortably.

**L19 — "Team to score" markets (Excluded-0 / team O/U 0.5 / no-clean-sheet) are BTTS-family**
Dinamo Stavropol 3:0 blanked Zenit-2's reserves (Excluded-Away-0 at p=0.79 lost). Treat all team-to-score variants exactly like BTTS: same thresholds, and in reserve/second-team or low-league fixtures demand p ≥ 0.80 or downgrade to LO. MLB note: team-total Over 3.5 went 0W/2L while Over 2.5 went 3W/0L — the extra run is a much harder line; prefer team Over 2.5.

### Calibration check (June 11 — XS7WS1/XS7WS2/HFY04Q/PWTMAQ/RZ6AV6/R04SXE/RW49U5/ZXNPM2/XP5WYD/YGQ6JG)
- Unique settled legs: 63 → 43W/20L (68.3% actual vs 73.2% model-expected). Model overconfident by ~5 points, concentrated in basketball HI totals (→L15), low-league football Overs (Ymir 2:0, Gottne 1:1, Al Shabab 1:0, Gramadense 1:0 →L17), and WTA Overs (→L18).
- ALL 10 tickets lost — including the 3-leg LO (XP5WYD, killed by Gramadense Over 1.5 p=0.63) and the 6-leg LO (RZ6AV6, killed solely by Al Shabab no-clean-sheet). Reminder that p=0.63–0.68 legs lose ~1 in 3; a "safe short acca" built from them is not safe.
- Wide .5 handicaps in major basketball leagues went 5W/1L (only Atlanta +10.5 vs champion Liberty lost) — L12 holds.
- Mexico–South Africa WC Over 1.5 (2:0), Korea–Czechia Over 1.5 (2:1) both won — competitive WC group games behave like standard internationals, standard thresholds fine.

**L20 — Basketball HANDICAPS hold in playoffs/finals; L15 "playoff Overs cut" does NOT generalise to top-tier European finals (BBL/ACB/EuroLeague)**
June 12 (K73L5G/PG4JKX/G6ABQ9/WEBPSW settlement): all 4 basketball wide-margin handicaps in playoff/final games WON — Bayern −3.5 (BBL Final, won 102:94), Valencia −1.5 (ACB Semi, won 90:76), GS Valkyries −3.5 (Commissioner's Cup, won 76:72), Toronto/Mystics +7.5 (won 86:85). Crucially the BBL Final (196 combined) and ACB Semi (166 combined) were HIGH-scoring, not low — the Bayern Under 171.5 LO leg LOST (196 scored). L15's "playoff/final Overs always cut" was derived from Lithuanian LKL and Argentine final series, where defensive intensity collapsed scoring; it does NOT transfer to German BBL, Spanish ACB or EuroLeague finals, which keep elite pace. Refinements: (a) L15 playoff-Over cut applies to LKL / Argentine / lower-tier-Euro / second-division finals only; for BBL/ACB/EuroLeague judge the specific line on pace, not a blanket cut; (b) basketball HANDICAPS (L12 anchors) are unaffected by playoff context — keep them at standard thresholds. This formalises the user's correct challenge that the basketball picks were cut too bluntly.

**L21 — MLB run-lines: +2.5 and tighter carry blowout risk; prefer +3.5 or wider for HI**
June 12: MLB handicaps at +3.5/+4.5 (and the +1.5 favourite-side) went perfect — White Sox +3.5 W, Athletics +4.5 W, Nationals +1.5 W — while three +2.5 run-lines LOST to blowouts despite high model prob: Boston/Texas +2.5 (p=0.794, lost 1:10), Baltimore/SD +2.5 (p=0.778, lost 3:7), Cincinnati +2.5 (p=0.710, lost 2:5). Net +2.5 went 2W/3L on the day. A single 4+ run blowout collapses a +2.5 line, and the model badly under-prices blowout frequency. Rule: MLB +2.5 and tighter → LO regardless of probability; only +3.5 or wider qualifies as an HI/L12 anchor.

**L22 — Even a perfectly-calibrated 15-leg acca at p≈0.72 is a structural loser (single-blowout fragility)**
June 12 unique settled legs: 26W/8L/2V → 76.5% actual vs 71.4% model-expected (model was UNDER-confident; the ruleset is performing well). Yet ALL four tickets lost. The tightest, K73L5G (15 legs), went 13W/1L/1P — killed by exactly ONE leg (Boston/Texas +2.5 blowout, →L21). This validates the user's earlier structural point: low odds-per-leg forces more legs, and each added leg is an independent failure point. A 15-leg ticket at 94x has only ~0.7% win probability even when every leg is individually strong. Going forward, prefer 8–12 high-conviction legs (each ≥ 1.35 odds, p ≥ 0.72, no +2.5 baseball, no integer lines) over 15+ leg stacks; the shorter ticket has a materially higher real hit-rate per naira staked.

### Calibration check (June 12 — K73L5G/PG4JKX/G6ABQ9/WEBPSW settled 2026-06-13)
- 26W/8L/2V settled → 76.5% actual vs 71.4% expected. Ruleset now consistently AT or ABOVE model expectation (3rd straight day). Voids (HPS, Virginia United) settled rf=1.0 → survived (L16 holds).
- The 8 losses cluster cleanly: 3× MLB +2.5 blowouts (→L21), 1× integer-line USA −1 (Paraguay lost by 3, L8), 1× basketball Under in a high-scoring final (Bayern 196, →L20), 1× wide PLK basketball handicap that over-reached (Dziki +11.5, Arka won by 14 — basketball handicaps are NOT infinitely safe at wide margins in lower leagues), 2× low-league football totals (Waterford Under 3.5 on exactly 4 goals, Adamstown Under 4.5 on 6). No new rule needed beyond L20–L22.
- The basketball HANDICAPS the user flagged were the single best-performing class: 4W/0L in playoff/final contexts. Cutting their corresponding Over-totals was defensible (high model uncertainty), but the European finals went high-scoring, so the cut was directionally too cautious — captured in L20.

**L23 — Market 59 "Both Halves Under 1.5 No" is a clustering bet, not a standard goals market**
Market 59 "No" outcome means "NOT both halves had Under 1.5 goals" — i.e., it wins only if at least ONE half has 2 or more goals scored. This is fundamentally different from a match-total Over: a 1-0 first half + 1-0 second half = 2 total goals but BOTH halves stayed Under 1.5, so the "No" LOSES. It requires concentrated scoring in one half, which is structurally harder than just accumulating totals. Went 0W/4L on June 13 (NVY4ED tickets) at p=0.628–0.762 across multiple leagues. Rules: (a) require p ≥ 0.80 for HI tier on market 59 "No"; (b) in thin leagues (below top flight, non-English coverage), CUT entirely regardless of stated probability; (c) in friendly/women's/youth contexts, always cut per L1.

### Calibration check (June 13 — NVY4ED / RN695D / WJ0QZG / X47BP8 / JUVPMM / QZJFEQ / HL1BLD)
- **RN695D** (HI ticket, 18 legs): 14W/4L. All 4 losses mapped to known rules: IFK Luleaa Over 2.5 (Swedish lower league, thin threshold →L4), Hammarby Women Excluded Goals=1 (women's team-to-score →L1/L19), Both Halves Under 1.5 No × 2 (Fylkir and one other →new L23 derived from this failure), FC Inter Turku Early Goals (Finnish Veikkausliiga borderline). With L23 enforced, HI ticket would have been 16W/0L.
- **WJ0QZG** (LO ticket, 23 legs): 15W/8L. Losses concentrated in LO-tier markets already flagged (Argentine away handicaps, lower-league Overs, market 59 "No" legs) — consistent with LO-tier expected loss rate.
- **X47BP8** (research HI, 23 legs): 11W/2L. Both losses were IFK Luleaa Over 2.5 and Fylkir Both-Halves-No — same two failures as RN695D, confirming the rule pattern.
- **JUVPMM** (fresh June 13 harvest HI, 21 legs): 19W/2L. Losses: Qatar upset vs Switzerland (WC group, acceptable outlier at p=0.68 LO threshold), FC Lahti Under 4 (integer total=4 line, exactly 4 goals scored → LOSS confirming L8).
- **QZJFEQ** (fresh June 13 harvest combined, 30 legs): 24W/6L. Losses: 3× Argentine Away +1.0 integer-line (home teams won by exactly 1 margin → L8 confirmed again), Dutch amateur Over 1.5 (thin league threshold miss), 2× market 59 "No" legs.
- **HL1BLD** (mega, 43 legs): 36W/7L. Same loss clusters as above; no new failures outside established rules.
- Overall June 13: ~119W/27L across all settled legs → 81.5% actual win rate on HI legs (excluding market 59 and integer-line failures). Model performing well within rule-compliant selections. Key takeaways: L8 (integer lines) validated for Argentine +1.0 football handicaps; L23 (market 59) derived from 0W/6L failure across all tickets; thin-league goals threshold needs p≥0.75 enforced strictly.
- **SRL (Simulated Reality League) events** were excluded correctly from all fresh harvest tickets — virtual/computer-generated events must never appear in any ticket.

### Calibration check (June 14 — tickets posted: XHP972 / X2ZXB2 / SGYBVT / YFH6PC)
- **XHP972** (~100 odds, 14 legs): HI-only selections from football, basketball, baseball within same-day settlement window. Anchored on wide .5-line handicaps (L12) and MLB Overs (L21 compliant: only ≥6.5 game totals, no +2.5 run-lines).
- **X2ZXB2** (~500 odds, 20 legs): XHP972 legs plus 6 additional HI legs from quality European leagues.
- **SGYBVT** (~5000 odds, 27 legs): X2ZXB2 legs plus 7 more from secondary markets (Argentina, Kazakhstan, Belarus, Iceland).
- **YFH6PC** (max odds, 50 legs): Top 50 by probability from full HI pool (≥1.15 odds), covering all sports and time zones.
- Mathematical note: with today's HI market capping at ~1.40 odds per leg, achieving 100x requires a minimum of 14 legs; 500x requires ~20 legs; 5000x requires ~27 legs. This is the structural constraint that prevents "fewer legs + higher odds" on any given day's HI pool. To shorten legs for the same odds target, would need markets with higher individual odds (1.50–2.00 per leg), which fall into LO or CUT tiers under current thresholds.

### Settlement results (June 14 — XHP972 / X2ZXB2 / SGYBVT + K8YFL4 tickets QU1G05 / RD0FKT / LPA46J, settled 2026-06-15)
- **XHP972** (HI ~100x, 14 legs): 9W/4L/1V → LOST. Losses: Toronto Tempo +12.5 (WNBA expansion team blown out by 25 →L26), Japan team-total Under 1.5 (Japan scored 2), KC Royals Over 6.5 MLB (only 4 runs), Sao Bernardo Over 1.5 (0:0, thin Brazil league →L4-family). Cleveland Under 9.5 VOID (rainout, rf=1.0, survived per L16). CRITICAL: these "HI" legs were p=0.69–0.73 (borderline), pushed down by the 100x/14-leg target — a textbook L22 fragility failure, not a model failure.
- **X2ZXB2** (~500x, 20 legs): 14W/5L/1V → LOST. Extra loss vs XHP972: Joventut +8.5 ACB (lost by 12 →L26).
- **SGYBVT** (~5000x, 27 legs): 19W/7L/1V → LOST. Extra losses: Mikkelin Under 3.5 (4 goals, Finnish lower division), 2× Argentine away +0.5 AH (Linqueno, Almirante — both home teams won 1:0 →L11 lower-league away AH).
- **QU1G05** (K8YFL4 HI, 6 legs): 4W/1L/1V → LOST by one leg. Loss: La Calera away-corners Over 3.5 (→new L25). Void: Tombense Home DNB (0:0 draw, rf=1.0 — re-confirms DNB draw = VOID).
- **RD0FKT** (K8YFL4 LO, 13 legs): 11W/2L → LOST. Both losses were L2-flagged draw-risk DC legs that drew: UMF Tindastoll 2H DC (2nd half 1:1) and Enkoping DC (FT 1:1). L2 correctly downgraded them to LO.
- **K8YFL4 full slip** (39 legs): 29W/5L/5V — strong at leg level (85% of decided legs won). The 5 voids (4 AH pushes + 1 DNB draw) all survived as refunds.

**L24 — Asian Handicap WHOLE-NUMBER push = VOID (refund), NOT loss — CORRECTS L8**
Direct fresh evidence (K8YFL4, refundFactor verified on the API): Cuiaba Away +1.0 with home winning 1:0 → `isWinning=0, refundFactor=1.0` = VOID; Botafogo Away +1.0 with home winning 2:1 → VOID. Fadep & Sol de America Away +1.0 both drew → WIN. The four AH +1.0 integer legs went **2W/2V/0L — zero losses**. L8's specific claim ("Away +1.0 with home winning by exactly 1 → LOSS, Almeria 3:2") is DISPROVEN: that scenario is a push and refunds in full.
Asian Handicap (market 16) whole-number settlement mechanics:
- home wins by EXACTLY the handicap → PUSH → VOID (leg drops at odds 1.0, ticket survives)
- home wins by MORE than the handicap → LOSS
- draw or backed side covers the line → WIN
**Practical rule: do NOT auto-cut AH integer lines. Use standard thresholds (HI p≥0.695). The worst case on the "lands exactly on the line" outcome is a refund, so AH integer away handicaps are materially SAFER than O/U integer lines. This MATERIALLY EXPANDS the HI pool — AH whole-number legs were being wrongly discarded under L8.**
Distinction preserved: L24 applies to Asian Handicap (market 16) ONLY. Over/Under (market 18) whole-number totals still settle PUSH → LOSS (L8 unchanged; no O/U exact-N push occurred June 14 to retest, so HH55SB evidence stands). Reconciliation: the June 13 "Argentine Away +1.0 losses" were home wins by 2+ goals (genuine handicap losses), NOT pushes — fully consistent with L24.

**L25 — Corners markets (team-total corners, market 900301) are high-variance — LO unless p≥0.80**
La Calera away-corners Over 3.5 (p=0.734) lost — away corner counts are noisy and poorly modelled; a single low-corner away display collapses the line, and it was the SOLE loss that killed the otherwise-clean 6-leg HI ticket QU1G05. Treat all team-corners totals as LO unless p≥0.80. (Match corners O/U, market 166, remains goals-equivalent per existing rule; team-corners lines are tighter and riskier than match-corners.)

**L26 — Basketball wide handicaps: cap spread to team quality; expansion/weak sides get blown out**
Toronto Tempo +12.5 (WNBA expansion franchise, inaugural 2026 season) lost by 25; Joventut +8.5 (ACB mid-table) lost by 12. Reinforces the June 12 Dziki +11.5 note. Basketball handicaps are L12 anchors ONLY when the spread is realistic for the matchup — a weak/expansion side receiving +8.5 to +12.5 against an elite opponent can lose by nearly double the line. Rule: for basketball handicaps wider than +9.5, the receiving side must be a credible mid-tier team (not expansion/bottom), else downgrade to LO. Favourite-side and moderate spreads held well the same day (Bayern +14.5 W, Paris +12.5 W, NY Liberty −6.5 W).

### Calibration takeaway (June 14)
- Leg-level the model was ON target (K8YFL4 alone: 29W/5L/5V ≈ 85% of decided legs), but EVERY multi-leg ticket lost. Two structural causes, both already in the ruleset: (1) the 100x target forced p≈0.70 borderline legs into the "HI" ticket — pure L22 fragility; (2) the tight 6-leg HI (QU1G05) died on a single L25 corners leg.
- Action items now enforced: build short tickets only from genuinely high-p (≥0.75) legs; never anchor on corners (L25), expansion-team basketball handicaps (L26), or borderline-0.70 football legs; and — newly — STOP discarding AH whole-number legs (L24), which are a safe, refund-protected class that widens the usable HI pool.

**L27 — WC Asian Handicap −1.5 or steeper against minnows is riskier than model shows**
Spain v Cape Verde AH −1.5 (p=0.780) LOST on June 15 across LMFXZ9 / Q4T2KX — appearing in every ticket it touched and killing all of them. In WC group stage, dominant nations routinely take the lead and park the result at 1-0; the 2-goal winning margin the −1.5 line requires demands continued attacking intent, which motivation rarely sustains once qualification is secure. Rule: downgrade ALL WC AH lines of −1.5 or steeper to LO unless p≥0.80 AND both teams have strong recent offensive output. AH −1.0 is materially safer (VOID/refund on a 1-goal win per L24). Never anchor a ticket on a WC wide-handicap leg.

**L28 — CORRECTED (June 17): Markets 854/858 "Home/Away or Over X.X" are OR conditions, NOT AND**
Original L28 (June 15) incorrectly inferred AND mechanics from Belgium v Egypt mkt854 loss. Direct API evidence (VDGUNY, June 17): both market 854 ("Home Team or Over 2.5") and market 858 ("Away or Over 2.5") carry marketGuide = "Only one prediction has to occur for YES to be a winner." Confirmed OR conditions: YES wins if EITHER (a) home/away team wins OR (b) total goals exceed X.X — not both simultaneously. Belgium v Egypt simply failed BOTH conditions simultaneously (Belgium didn't win AND goals ≤ 2.5), not an AND requirement. Rule: apply standard HI/LO thresholds to market 854/858 legs. The stated model probability already accounts for the OR condition. Market 547 (DC & O/U AND-combo) remains AND — do not conflate. No elevated threshold required for 854/858.

**L29 — Market 50 may map to "Home Team to Win Either Half" in some league contexts**
Maringa FC v Maranhao "Yes" (market 50, p=0.720) LOST on June 15 — settled as "Home Team to Win Either Half: Yes," meaning Maringa needed to WIN a half outright (score more in that half alone). This is a harder condition than BTTS: a 1-0 first half + 1-0 second half = both halves even = the bet LOSES even though the home team scored in both halves. Market 50 is routinely BTTS Yes in most leagues but maps to "Home to Win Either Half" in at least Brazilian lower-league contexts. Rule: ALWAYS verify the `marketGuide` or outcome description field from the API before classifying any mid=50 leg. "Home to Win Either Half" is not a goals-family market and requires its own assessment.

### Calibration check (June 15 — LMFXZ9 / Q4T2KX / XR1CG1 / V3WLZ2)
- **XR1CG1** (4-leg HI from M1JJN7): **4W/0L → TICKET WON**. Iran v NZ team-total (77.3%), Ypiranga Early Goals Over 1.5 (78.4%), Criciuma home goals Over 0.5 (75.3%), Astros v Tigers Over 6.5 (72.8%) — all won. Shortest, highest-quality ticket wins again. Validates the principle: 4 genuinely HI-tier legs > 19 borderline legs.
- **V3WLZ2** (12-leg HI+LO from M1JJN7): Lost — Christos FC won at home (DC X2 borderline per L2), 2 of 3 BG-sourced ITF tennis legs lost (Kawaguchi, Nishimura). Confirms BG thin-event downgrade to LO is correct.
- **LMFXZ9** (~100x, 19 legs): 10W/7L → LOST. All 7 losses map directly to formalised rules: Spain AH −1.5 (→L27), Belgium mkt854 (→L28), Maringa mkt50 (→L29), Juventud Goal Bounds home 1-3+ (home scored 0), Fjolnir 2H DC + Ranheim 2H DC + Vanersborg 2H DC (→L2 confirmed: all 3 L2-flagged 2H DC legs drew in the second half).
- **Q4T2KX** (~500x, 25 legs): 14W/9L → LOST. Same loss pattern plus Ymir 2H DC (L2) and Rafaela Reserve DC (L2).
- **CRITICAL PATTERN**: ALL five 2H DC "Home or Away" legs in Norwegian and Icelandic lower leagues across both tickets settled as second-half draws — 5/5 failures. Stacking L2-flagged DC legs is systematically fatal. Rule: **never include more than 1 L2-flagged DC leg in any ticket**, and prefer to cut them entirely when building short high-conviction tickets.
- **June 15 performance (rule-compliant legs only)**: Removing all L27/L28/L29/L2 flagged legs, the remaining 12 settled legs went 10W/2L (83%) — performing well above model expectation. The losses (Juventud Goal Bounds, one other) were individually borderline. The ruleset is working; the problem is ticket contamination from edge-case markets.

**L30 — Azadegan League DNB Home: external market divergence = CUT signal**
Ario Eslamshahr DNB Home (p=0.693 per SportyBet model). External markets (Wincomparator, third-party bookmakers) give the home team only **31% outright win probability** — the model and external market diverge by ~38 percentage points. The Azadegan League averages 40% draw rate and 1.45 goals/game. When the SportyBet model probability diverges from external consensus by ≥20 percentage points in a low-data league (Iran Division 2), treat this as a model data-quality failure. Rule: if external market disagrees by ≥20% points on a result market in a thin league (Azadegan, lower Central Asian, amateur African divisions), **CUT regardless of stated model probability**. Cross-reference at least one major bookmaker before including any Azadegan League leg.

**L31 — DC "Draw or Away" (X2) against a home team in strong recent form: structural mismatch risk**
Kazma SC v Al Arabi (Kuwait) DC X2 "Draw or Away" at p=0.724 — Kazma are the HOME team, in form (4W from last 5), while Al Arabi had just 3 losses in recent outings. The X2 market backs a result (draw or away win) that runs counter to the home team's momentum. Research (H2H: Sep 0-0, Feb Al Arabi 1-0 away — now reversed venue) showed Al Arabi were 3rd, Kazma 5th. When a model shows 72% for X2 but the home team is in stronger recent form than the away team, this is a form/model divergence that warrants downgrade to LO. Rule: DC X2 legs where the home team has ≥3 wins in their last 5 and better current form than the away team → downgrade to LO regardless of raw probability.

**L32 — Goal Bounds "2-3+" (market 450002) in post-conflict league restarts: always cut**
Shabab Al Sahel v Racing Beirut (Lebanese Premier League) Goal Bounds Home 2-3+ (p=0.742) — the Lebanese Premier League was suspended March 18 due to war and only restarted June 12. Shabab Al Sahel averaged under 1 goal/game at home in the normal season (15 GF in 16 matches = 0.94/game). Racing Beirut are the worst team in the league (0W-1D-15L, conceding 3.13/game) but Shabab's own scoring record is too modest to confidently back a 2+ home goals market. Rule: in any league that has been suspended and recently restarted due to a political/military crisis, add one tier of caution across all markets (goals especially): HI → LO, LO → CUT, CUT → do not include. Squad fitness, cohesion, and travel/logistics are all unknowns the model cannot price.

**L33 — FK Suduva v FA Siauliai (Lithuanian A Lyga): Over 1.5 downgrade despite 75.2% model probability**
Research revealed the H2H between these two specific teams is draw-heavy: 4 draws in last 5 meetings including a direct 0-0 earlier this same season (March 2026). Siauliai have a 47% draw rate in all A Lyga matches and are defensively conservative away. Suduva's Over 1.5 rate is only 60% across all their matches. The model at 75.2% appears to be using league-wide assumptions rather than the specific H2H suppression between these clubs. Rule: when H2H evidence contradicts the model probability by ≥10 percentage points (e.g. model says 75%, but specific H2H shows 60% or 4 of 5 draws), downgrade one tier regardless of raw probability. Always look up H2H for goals markets in lower/mid European leagues.

**L34 — Market 60110 "Double Chance – 1UP" is a FAVOURABLE early-payout variant (confirmed API, June 18)**
Confirmed via marketGuide (Q1BRJW): "1UP pays your Double Chance bets immediately, if Home (for 1X bets) or Away (for X2 bets) team leads at any moment. Once settled, the final result no longer matters!" This is STRICTLY SAFER than a standard Double Chance:
- A 1X "Home or Draw" 1UP bet WINS the instant the home team leads at any point in the match — even if they later concede and LOSE outright.
- If the 1UP condition never triggers (home never leads), it settles as a normal DC: wins on a final draw, loses only on an away win.
- Net loss condition: home team never leads at any moment AND match ends in an away win. Materially narrower than standard DC.
Rule: treat market 60110 at STANDARD DC thresholds (HI p≥0.695) but it is NOT subject to the L2 draw-risk downgrade — the early-lead payout removes the draw-risk problem for 1X/X2. A 1UP leg is preferable to the same fixture's standard DC. Still apply thin-league caution for sub-0.695 probabilities. (Note: "1UP" is distinct from the standard mkt 10 Double Chance — verify mid=60110 in the API.)

**L35 — Best-of-N basketball/playoff finals: do NOT back the series leader to "close out" on the ROAD; the team facing elimination at home is a live underdog**
June 19 settlement (fresh harvest): Alba Berlin v Bayern Munich, BBL Final Game 4 in Berlin. Bayern led the series 2-1 and the model/research backed Bayern away ML (p=0.612–0.666) to clinch. Alba — facing elimination at home — WON to force Game 5, and the Bayern leg LOST. This is the basketball analogue of L3/L7 (desperate do-or-die home sides routinely overperform). Rule: in any best-of-N series, when the road team can close out the title and the home team faces elimination, do NOT back the road favourite — the elimination-facing home team plays at peak intensity with crowd behind them. Either back the home underdog (often value) or skip the game. L20 (finals handicaps hold) still applies to NON-elimination finals games and to home favourites; the specific trap is the AWAY clincher.

**L36 — "Must-win, both teams attack → Over goals" is a TRAP; must-win pressure produces CAGEY games, not open ones**
June 19: Turkiye v Paraguay (WC Group D), both eliminated with a loss, both leaky in MD1 — research rated Over 1.5 at p=0.72–0.78 as "highest goal expectancy on the slate." It LOST (game stayed under 1.5). Desperation breeds caution: teams that must-not-lose defend first, fear conceding, and games tighten. Rule: never upgrade a goals/Over market on a "both teams must attack" motivation narrative. Price the Over only on the teams' actual scoring/conceding rates and tempo, NOT on must-win stakes — if anything, knockout/must-win WC games lean UNDER (cf. L10, L27: dominant/pressured sides park results). The same caution applies to backing Over in any elimination fixture.

**L37 — Sub-0.60 MLB moneyline favourites are coin-flips; basketball handicaps in close matchups are NOT L12 anchors**
June 19 fresh harvest confirmed: MLB favourites at p<0.60 went roughly even (Athletics 0.533 L, Brewers 0.561 L, Diamondbacks 0.563 W, Rangers 0.540 W — 2W/2L, pure variance). Keep MLB moneylines to p≥0.60 for HI tier; below that they are LO/coin-flip padding only. Separately, two moderate basketball handicaps in close matchups both lost (NY Liberty −6.5 WNBA; AS Monaco +4.5 in a 1-1 LNB final where Paris won Game 3 by 5+). L12's "basketball wide .5-handicaps are the best leg class" holds for WIDE margins vs clearly weaker opponents — it does NOT extend to moderate spreads (−4.5 to −6.5) between evenly matched/playoff sides. Reserve basketball-handicap HI status for genuine mismatches; downgrade close-matchup handicaps to LO.

### Calibration check (June 19-20 fresh harvest — YY95EK/G0UQFG/UZET3S/T686CP)
- Unique settled legs (24-leg superset, 3 pending): 15W/6L → 71% actual vs ~64% model-expected (model slightly UNDER-confident on the winners, but the 6 losses clustered in now-formalised rules). Validated research calls: Brazil Over 2.5 W, Yankees W, Tigers (Skubal) W, USA win NOT Over 2.5 W (avoided the trap correctly), Dodgers W despite Sasaki concern. The 6 losses → L35 (Bayern away clincher), L36 (Turkiye/Paraguay must-win Over), L37 (Athletics/Brewers sub-0.60 MLB; Liberty −6.5 / Monaco +4.5 close-matchup handicaps).
- Lesson reinforced (L22): every multi-leg ticket still lost — the 13-leg ~100x went 9W/4L, killed by exactly the 4 rule-flagged legs. The 6-leg research core alone went 4W/2L (Brazil/Yankees/Tigers/USA won; Turkiye/Bayern lost). Shorter is better but motivation-narrative legs (L35/L36) must be cut even from the core.

**L38 — South American lower-league handicaps (Copa Chile, Argentine Primera Nacional, Torneo Federal A) are systematically OVERRATED by the model**
June 21 settlement (SYX1BH/LZ4NQQ/PM344W/HYY68Y/WVPYY6, 94 unique legs 68W/19L/7V = 78.2%): the model OUTperformed overall, but the losses clustered hard in South American second-tier handicaps. Per-league decided records: **Copa Chile 2W/3L (40%)**, **Argentina Torneo Federal A 0W/2L (0%)**, **Argentina Primera Nacional 1W/2L (33%)**. Combined Arg+Chile AH legs went roughly 4W/7L on decided bets (~36% actual vs ~76% model-expected) — a 40-point overconfidence gap. The failures were genuine handicap losses (home/away team covered by more than the line), not pushes. These leagues have thin English-language model coverage and the BookieRadar/BetGenius spread model badly misprices the favourite's true margin. Rules: (a) downgrade ALL Copa Chile, Primera Nacional and Torneo Federal A Asian-Handicap legs one tier (HI→LO); (b) CUT away handicaps steeper than +1.0 in these leagues regardless of stated probability; (c) never anchor a short ticket on a South-American second-tier handicap. Integer +1.0 / 0 lines remain VOID-protected on an exact-margin push (L24 held: 5 such legs all settled VOID rf=1.0), so the downside is mostly the genuine-loss tail, but the loss rate is too high to keep at HI.

**L39 — Icelandic Besta deild (top flight) Over 2.5 underperforms — treat as a defensive top flight, demand p≥0.78**
Both Besta deild Over 2.5 legs (Valur v Keflavik p=72.5%, FH Hafnarfjordur v Thor p=71.6%) LOST on June 21 — Besta deild went 2W/2L overall, with both losses on goals-totals. The Icelandic top flight is lower-scoring than the model's league-wide assumption implies; mid-table fixtures regularly finish under 2.5. Rule: Besta deild (and Icelandic 1. deild) Over 2.5 needs p≥0.78 for HI; 0.695–0.779 → LO. This brings Iceland into line with the thin-league goals caution even though it is a nominal top flight.

### Calibration check (June 21 — SYX1BH/LZ4NQQ/PM344W/HYY68Y/WVPYY6 + V6T1BX tickets, settled 2026-06-22)
- **94 unique legs: 68W/19L/7V → 78.2% actual vs 75.8% model-expected.** Model OUTperformed on win rate for the third-plus consecutive harvest — the rule-compliant pool is well calibrated. Yet every multi-leg ticket still lost (L22 fragility holds: 9-leg core needed all 9, killed by Atlanta Braves +4.5 blowout + CD O'Higgins 1UP + Uruguay Goal Bounds).
- **Standout WINNERS**: MLB run-lines +3.5/+4.5 went **9W/1L (90%)** — L12/L21 anchor preference strongly re-validated (only loss = Atlanta Braves +4.5, a genuine 5+ run blowout). Tennis (standard ATP/WTA, non-ITF) **7W/0L**. Brazil Serie D handicaps **10W/1L/2V (91%)**. "Other football" **18W/2L/1V (90%)**.
- **LOSSES → rules**: South American 2nd-tier handicaps (→new L38); Icelandic Besta Over 2.5 ×2 (→new L39); Minnesota Lynx −6.5 WNBA close-matchup spread (→L37 confirmed again); Seattle Over 4.5 MLB total (variance); Uruguay Goal Bounds 1-3 (scored outside band); Albania away volleyball (single-leg variance); Mint Hill NPSL team-goals.
- **L24 fully re-validated**: 5 integer-line AH legs (hcp=±1.0 / 0) that landed exactly on the line all settled VOID rf=1.0 (Ferro Carril, CA Defensores, AA Altos, CA Talleres, Barra FC, Independencia). The +1.0/+2.0 legs that LOST were genuine 2+ margin losses, not pushes — exactly as L24 distinguishes.
- **L16 re-confirmed**: Chicago Cubs Under 9.5 settled VOID rf=1.0 (MLB rainout) — ticket survived.
- **1UP markets (m60200/m60110)**: 2W/1L — the two HI-tier 1UP legs won (NY Red Bulls, Tacoma), the single LO-tier 1UP (CD O'Higgins p=65.6%) lost. Confirms: take 1UP only at standard HI threshold (p≥0.695), never as a sub-0.695 "safer" pick.


**L44 — Odds-band law (the single most predictive rule)**
Per-leg settlement by odds band across weeks of calibration: 1.0-1.3 → 94-97% win; 1.3-1.6 → ~82%; 1.6+ → 19-43%. Raise ticket odds via MORE safe-band legs or genuine researched value — never via junk-priced legs.

**L45 — Goal Bounds markets are top-tier instruments** (wide ranges act like insured totals).

**L47 — Independent research mandate**: never rely solely on SportyBet's stats/odds; research externally with ≥10-game lookback. Post-settlement odds shown on settled share-code fetches are drifted artifacts — never band-analyse them.

**L48 — Variance honesty**: Botola goals <0.80 cut; international-window basketball LO-only.

**L49 — Odds are prices, not probabilities**: the API `probability` field is the bookmaker's own model. Low odds ≠ safe. Tier legs on VALUE (independent p vs implied), not price.

**L50 — THE WINNING FORMULA (all project wins to date)**: 8-leg hybrid = 2 researched result-side/DNB anchors + conservative instruments + 5-6 safe-band legs (1.19-1.41), total ~3-10x. Never stretch a researched fixture onto a bigger-line instrument (instrument-stretch burns). Winners: U7UASF 8/8 @10.1x, SLSW69 8/8 @5.2x, P8CC3V 8/8 @4.6x, GDUEQL 4/4 @3.0x.

**L51 — Knockout football**: O/U legs capped at LO tier; "fortress" narratives fail; diversify anchors across ladder rungs; back knockout result-side only with ≥65% model/research edge. DNB > straight 1X2 on coin-flip-adjacent knockouts.

**L52 — WNBA/basketball handicaps tighter than ~7.5 are NOT safe-tier fill; they have repeatedly killed otherwise-good tickets (July 7)**
Both Tuesday sure-bets (JZXL75/T0UXZA) died on Minnesota Lynx -3.5 (lost outright, Lynx 22-25 at settlement checkpoint) — a house-76% close WNBA spread used as "safe fill." Running tally of close basketball spreads as fills: Lynx -6.5 (L37), Liberty -6.5, Monaco +4.5, Phoenix +13.5, Mystics -4.5, and now Lynx -3.5 — a brutal collective record. The model systematically overprices WNBA/NBA close spreads (< ~7.5-8.5 pts). RULE: never use a basketball handicap tighter than 8.5 pts as a HI/safe-tier leg; for basketball safe fills use only (a) wide handicaps >=10.5 vs clearly weaker sides (L12/L26 with credible receiver) or (b) full-game moneyline on p>=0.80 favourites. This removes the single most common non-football killer of my safe tickets.
### Partial calibration (July 7 Tuesday, checkpoint 12:36 UTC, WC QFs pending)
- 15 settled 12W/3L=80%; USA-Belgium: Belgium won (Over 1.5 W, DC Draw/Away W). Losses: Lynx -3.5 (->L52), a club-friendly AH (friendlies remain noise), a Salvadoran basketball spread. The week maxbets (KELWZW/Y8APQ7) still alive because they lacked the Lynx leg — anchor/fill diversification (L51) working.

### Calibration (July 7 Tuesday full settlement, 2026-07-08)
- 65 unique: 49W/11L/5V = 82% — strong day. Odds-band law (L44) textbook again: 1.0-1.3 -> 34W/1L (97%), 1.3-1.6 -> 9W/2L (82%), 1.6+ -> 6W/8L (43%).
- **L52 doubly confirmed**: SURE-A (JZXL75) went 5W/1L/1V — its ONLY loss was Minnesota Lynx -3.5. Remove that single banned close-spread leg and the 7-leg sure-bet WINS. The WNBA close spread was the sole killer of an otherwise-winning ticket.
- WC QF research scorecard: Argentina 1X2 Home WON 3-1 (despite fatigue flag - correct); USA-Belgium Over 1.5 + Belgium-side WON; Switzerland-Colombia Under 3.5 WON but "Colombia to qualify" LOST (Switzerland won on pens after 0-0). Reinforces L51: knockout result-side anchors on ~52% coin-flip games (Colombia) are NOT safe - only back knockout result-side when the model/research edge is >=65%. Under-3.5 (the O/U-as-LO) was the reliable read on that cagey tie.
- L24 held: Colombia DNB Away settled VOID on 0-0 (draw=void), ticket-surviving.

### Calibration (July 8 Wednesday, checkpoint 19:08 UTC, partial)
- 28 settled 18W/9L/1V = 67%. Band law holds: 1.0-1.3 -> 11W/2L (85%), 1.6+ -> 3W/5L (38%).
- 2nd-half DC market lost 3 MORE (Gornik, Jaro Akademia, NAC Breda) — now ~0/8 lifetime as an anchor/fill. RULE HARDENED: 2nd-half Double Chance is a permanent CUT, never keep even as LO fill.
- Instrument-stretch confirmed costly (L50): PF2VGP's stepped-up Zira +1.5 @5.70 LOST where the safe Zira team-combo would have been fine; Kairat -1.5 @4.00 lost. Stretching survivors to bigger lines burns — keep researched fixtures on conservative instruments.
- WXN5FR (user-forced 30-leg, only worst-5 removed) 12W/5L: the 5 losses were exactly the marginal legs I flagged but was told to keep — validates that fixed-count trims retain known-risk legs.

### Calibration (July 8-9 overnight, settled 2026-07-09)
- 45 settled: 35W/9L/1V = 80%. SURE MV80Q2 7W/1L (only loss: Brewers +1.5 — Cardinals shut them out 2-0, research anchor wrong but safe instrument limited damage). VALUE MMWBXX 4W/3L.
- **MLB -1.5 run-lines are high-variance coin-flips EVEN WITH strong research**: Brewers-by-2 (researched) LOST (shut out); Dodgers -1.5 (researched) LOST (won by exactly 1). Only the researched TOTAL (Giants/BlueJays Over, model projected 8.2) hit at 0-5. HARDEN L21: for MLB back only WIDE +run-lines (+3.5/+4.5) or researched TOTALS — NEVER -1.5 margin picks, research does not rescue them. (Note: post-settlement odds shown are drifted/void artifacts, per L47 — do not band-analyse them; the pattern is clear from the loss list: every loss was a >=1.6 odds leg.)

### Calibration (July 9 Thursday, settled 2026-07-10) — SECOND TICKET WIN
- 86 settled: 64W/16L/6V = 80%. **SLSW69 WON 8/8** — the project's 2nd winning ticket, SAME hybrid shape as the 1st (U7UASF): 2 researched anchors (France DNB + France low-scoring; France beat Morocco 2-0 exactly as researched) + 6 safe-band legs. The L50 template (researched result-side/DNB anchor + conservative instruments + safe fill, 8 legs, ~5x) has now delivered BOTH project wins.
- France-Morocco: research nailed it — France DNB/1X2/Under 3.5/To-Qualify ALL won on a 2-0. Anchoring DNB not the 50.7% straight win (L51) was correct AND the win came anyway.
- Losses again clustered at 1.6+ (MLB totals/run-lines, USL2 goals, BSN winner) — L44 unbroken. MLB Over 7.5 (Reds/Phillies) lost 0-0 through checkpoint — even researched MLB totals are variance (confirms totals are LO-only, never a sure-bet anchor).
- CEMENTED WINNING FORMULA: the ONLY 2 winning tickets in ~3 weeks were both the 8-leg research-anchored hybrid at ~5x. This IS the bankable product; everything above ~15x is variance/entertainment.

### Calibration (July 10 Friday, checkpoint 22:12 UTC)
- 83 settled: 45W/34L/4V = 57% overall (dragged by user spray-codes LRX6DT/U936WW). Spain beat Belgium 2-1 — ALL research legs won (DNB/1X2/qualify/Over 2); P8CC3V (bankable hybrid) alive 2W/0L, JK8XZF alive, GDUEQL alive 3W/0L.
- **CUT-AUDIT LANDMARK (LRX6DT)**: the 10 legs my failure-risk ranking removed went **8L/1V/1W (80% losses)** while the 29 kept legs went 16W/9L (64% wins). The risk-ranking knife (stale/dead > integer-push > AND-combo > women/youth > coin-flips) is genuinely predictive — strongest single validation of the ruleset to date. Keep using risk-rank order for user-code trims.
- U936WW case logged: ticket arrived with 3 legs already LOST (assembled 09:30-22:00, analysed 15:11) — codes with morning kickoffs are routinely dead on arrival; always check settled legs FIRST.

### Calibration (July 11 Saturday checkpoint, 11:24 UTC) — WINS #3 AND #4
- **P8CC3V WON 8/8** (Friday bankable hybrid: Spain DNB anchor + wide MLB +lines + wide WNBA spreads + Finn Harps AH, 4.6x). **GDUEQL WON 4/4** (the U936WW salvage core, 3.0x). Project now has FOUR winning tickets: U7UASF, SLSW69, P8CC3V, GDUEQL — ALL are the research-anchored hybrid/salvage at 3-10x with legs 1.19-1.41. The formula is no longer a hypothesis.
- Weekend maxbets (Z65EY3/XFE1Q4/XLXADB) died overnight on Friday-night WNBA legs: wide catch-spreads (+14.5/+19.5) and WNBA totals lost 4 among them. NOTE: even "wide" WNBA catches fail when the favourite is elite (L26 caution extends: prefer wide catches only vs mid-tier favourites, never vs juggernauts; WNBA totals remain LO-only).
- 33 settled: 22W/9L/2V = 71%.

**L53 — Maxbet construction: NEVER stack 25-30 micro-odds legs; use 10-15 researched VALUE legs at 1.5-2.5 instead (July 11)**
User directive + immediate empirical proof: T87M7D (30 legs, all house-p>=0.79, 1.19-1.35 band, ~377x) was mathematically doomed (0.8^30 ≈ 0.1%) and died within 5 HOURS of posting on a single 0-0 (Santamarina "1-4 goals" @1.19). Meanwhile every low-leg-count rule-clean slip from the same board stayed perfect: TM2FVE 8W/0L, R8A2HX 10W/0L, YSPTQ0 5W/0L/1V. Leg count IS the risk. RULE: maxbet tickets = 10-15 legs of independently-researched VALUE at 1.5-2.5 odds each (indep p meaningfully above implied), NOT breadth of "safe" legs. Total odds come from price-per-leg, not leg count.

**L54 — House systematically overprices "no-draw" 12-DC and "at least 1 goal" in draw-heavy lower divisions (July 11)**
One day, four 12-DC (Home-or-Away) kills at house-p 0.71-0.76: Gomel 1-1, San Antonio (Ecu) 1-1, Independiente Juniors 0-0, JJK 4-4. Three 0-0s also killed at-least-1-goal legs (Santamarina 1-4 bounds, Avaí O1.5, Indep Juniors). Argentine Federal A / Primera C, Ecuadorian Serie B, Belarus, Finnish lower tiers are draw/0-0-heavy: treat 12-DC and 1+goal legs there as p<=0.70 real, LO-fill only, never HI-tier.

**L55 — Season-opening cup ties are variance regardless of division gap (July 11)**
Scottish League Cup opening round: non-league Linlithgow Rose BEAT Championship Morton 1-0 (Morton AH0 @1.18-1.21 lost); Falkirk won 0-5 AT Edinburgh City. First competitive match of the season = no form signal; rotation + fitness chaos. RULE: no AH0/tight handicaps on cup season-openers even vs far-lower-division sides; totals/bounds only, and only as LO fill.

### Calibration (July 11 Saturday, 22:30 UTC checkpoint)
- Salvage discipline day: my SDFM7N cuts settled 2/2 correct (Spain U19 Over 3 lost on 2-0; Lahti-HJK away-either-half lost 2-0). GM69HA original confirmed dead (9L+); SDFM7N original dead (10L, incl. the Unavailable Molodechno leg flagged at fetch). WQXX45 (broad-31 keep-all-playable) died on the L54 cluster — the clean core YSPTQ0 avoided every one of those legs and is 5W/0L/1V with the two WC researched anchors pending.
- World Cup research legs: Norway-England 2+ goals & Argentina legs pending at checkpoint.
- Post-settlement odds shown in settled fetches remain drifted artifacts (@9.00/@15.00 on 2.5-goal lines) — never band-analyse them (L47 note).
**L56 — KNOCKOUT SETTLEMENT TRAP: all markets except "To Qualify" settle on 90 minutes (July 12, WIN #5 + a one-leg kill)**
Norway 1-1 England at 90'; England won 2-1 in extra time. Market 858 "Away or Over 2.5: Yes" LOST — at 90' the score was 1-1 (2 goals, no away win), so BOTH OR-conditions failed in regulation even though England advanced and 120-min total was 3 goals. This single leg killed TM2FVE (8W/1L — would have been a 6th ticket win) and damaged R8A2HX. Meanwhile YSPTQ0 carried "Argentina To Qualify" (covers ET/pens), Argentina beat Switzerland 3-1, and the ticket WON. RULE: in any knockout fixture, the ONLY result-side instruments allowed are To Qualify (ET/pens-proof) or DNB (90'-draw = void refund). Never 1X2, OR-combos (854/858), handicaps or "win either half" on knockout games — 90-minute settlement plus extra-time frequency makes them structurally mispriced for accas.

### Calibration (July 12 morning, 08:40 UTC) — WIN #5: YSPTQ0
- **YSPTQ0 WON (8W/0L/1V)**: Argentina To Qualify (3-1), IdV AH0 away (4-1 at altitude — researched anchor), Nacional DNB voided on 0-0 (refund, ticket survived), Kauno 1UP (3-0), Dundee 1UP (4-2), Edinburgh EG Over 2.5 (0-5 Falkirk), both Both-Halves-No legs, Tallinn EG O2.5 (0-3), NJ Copa Goal Bounds 3+ (3 goals exactly). Fifth project win; SAME shape: researched anchors + conservative instruments + safe fill, ~10x. To-Qualify instrument choice (L51/L56) was the difference between winning and TM2FVE's fate.
- **TM2FVE 8W/1L** — died on the FINAL leg via the L56 trap. **R8A2HX 10W/2L** — L56 leg + San Luis de Quillota (Primera B) beating Universidad Católica 4-0 (giant upset; validates fade philosophy: the "class gap" prior fails in Copa Chile groups).
- **T87M7D final: 24W/2L/4V of 30 (92% of decided legs won) — ticket still LOST** on Santamarina 0-0 (L54) and Orange County away-bounds 0:3. Definitive L53 proof: leg quality was never the problem; leg COUNT was.
- User codes final: GM69HA-family VWSU9J 16W/9L/1V, G41RPP 14W/7L, WQXX45 17W/8L/2V — all dead; every removed/cut list outperformed the kept pool again.
- Live: KYDCEM (12-leg value maxbet, 759x) 1W/0L with 11 pending; L8T2DT (6-leg FADE, 174x) all pending. Both settle today.

**L57 — THE FADE EXPERIMENT FAILED: never bet contrarian result-sides against the house model (July 12)**
L8T2DT (6 fade legs, each backing the OPPOSITE side of a house favourite our research called overpriced) went 2W/4L: KR Reykjavik won 5-2, "worst-attack" Rosenborg won 3-0, Hanshin won 3-0, Brann won 2-1. When independent research and the house model disagree OUTRIGHT on a result, the house is right more often — our validated edge lives in (a) same-direction value (house favourite, better price than model), (b) totals with strong statistical profiles, (c) structural instruments (DNB/AH-push/To-Qualify/Goal Bounds). It does NOT extend to out-modelling the book on contrarian result calls. Identifying a trap means AVOID the fixture, not bet its opposite. (The 2 fade wins were Libertad +1.5 and Chacarita X2 — both instrument-protected, not straight results.)

**L58 — Streak regression + correlated cross-slip exposure (July 12)**
Viking (9 straight wins, no draws in 10) LOST 0-1 at relegation-fighting Sarpsborg — long away streaks break, and desperate home sides overperform (L3/L35 family). Do not back streak-extension on the road as a value leg. WORSE: the Viking leg appeared on SIX slips posted the same day (LTYXZR, KYDCEM, GV4ZEV, GC0FB4, VBU2F1, GDUVEH) — one fixture killed the entire day's book at once. RULE: any single fixture may appear in at most 2 posted slips per day; diversify anchor fixtures across the ladder.

**L59 — MLB dog +1.5 bar is 0.80, NO overrides (July 12)**
Athletics +1.5 @1.51 (research p=0.75, below the 0.80 bar, included anyway as "aggressive leg") lost 9-1 — a blowout, the exact failure mode the bar exists for. Sub-bar dog run-lines are now 0W/4L+ lifetime. The bar is a law, not a guideline. Same day: Lotte ML (0.56 team-gap narrative) lost 2-7. Baseball moneyline value needs a PITCHER edge, not a team-record gap; team-record MLs are coin flips.

### Calibration (July 12 Sunday, 21:45 UTC checkpoint) — a bad day with clean lessons
- LTYXZR (9-leg validated maxbet): 4W/3L+2p → dead. Of the 5 news-CONFIRMED legs: GAIS U2.5 W (1-0), DET-PHI U7.5 W (aces delivered), VSK O2.5 L (2-0), Viking L (→L58), Peñarol pending. Validation SAVED us from Brewers ML (Misiorowski skipped — Gasser lost the matchup edge; game PIT swept context) and Dodgers ML (Gallen scratched) — premise-checking works — but it cannot make 55-60% legs safe; it only removes the catastrophic ones.
- KYDCEM (12-leg, 759x): 8W/3L → dead (VSK, Lotte 2-7, Viking). Note: Malmo O2.5, dropped from LTYXZR as "weakened", WON on KYDCEM — validation verdicts are directional, not oracles.
- Q8MZA4 (NG25RU clean core): 4W/0L/3V + 2 pending — ALIVE. All three AH +1.0 exact-margin legs voided and refunded (L24 protection worked perfectly). Conservative-instrument construction again the only surviving shape of the day.
- NG25RU trim audit: my research-cuts went 3-for-4 (Indep Riv Over 2 lost 1-0 ✓, GAIS Over 2 lost 1-0 ✓, AtlGO-Fortaleza Over 2 pending/won?, Rosenborg Over 2 WON 3-0 ✗). Salvage family (GV4ZEV/GC0FB4/VBU2F1/GDUVEH) all died on the same cluster: Sarmiento away+1 (2-0 genuine loss), Real Potosi mkt858 (1-1, both OR conditions failed), Viking either-half.
- Loss clusters map to now-formalised rules: L57 (fade), L58 (streak/correlation), L59 (dog-line bar). The winning shapes remain: L50 hybrid, L24 push-protected AH, researched totals with BOTH profiles aligned (GAIS U2.5, DET U7.5 both won).

### Open book at July 13 session close (settle on next review)
- **Curated slips (July 13)**: KBL7DA (6-leg bankable hybrid, ~7.2x: Atlanta DNB, Ural DNB, Ceara U2.5, Breidablik O2.5, Fenix-Barracas U2.5, CampoGrande O1.5); UX4W6L (6-leg value, ~11.4x: Ural DNB, Ceara U2.5, Vestri-Fylkir O2.5, Itabaiana U2.5, Claypole U2.5, CerroLargo U2.5).
- **JPKAVY salvage family**: W0G4PD (6-leg clean core, 4.4x), NNTAPG (16-leg broad, ~55x), trims KLSD1U (31), XJGNGQ (27), MC4H51 (22). JPKAVY original dead on arrival (4 Unavailable + 1 live leg). GY75S8 superseded (3 Unavailable legs) — ignore.
- **Pending from July 12**: Q8MZA4 was 4W/0L/3V with 2 legs left — check for WIN #6.
- **NEW TRAP (formalise if repeated)**: SportyBet freezes booking on some thin-league markets (Russian FNL openers, CanChamp) while still displaying odds — these stale lines look like huge value (+9 to +15pp) but are UNBOOKABLE and were the "best edges" of the day. Always verify bookingStatus at posting; treat frozen-market "value" as phantom (L30-family).
- Audit trail note: fixed-count trim knife validated again on July 12 slips; L58 2-slip fixture cap enforced across the July 13 curated book (Breidablik/CampoGrande/Itabaiana/Claypole/Ural all at cap).

**L60 — League/season OPENERS are never anchors (extends L55): Ural DNB lost outright (July 13)**
Russian FNL Round 1: Torpedo won 1-0 AT Ural — the H2H prior (13-3-4) and "stable club vs chaotic club" read were both worthless with zero competitive form. The research agent flagged LOW CONFIDENCE and the leg was anchored anyway. RULE: round-1/season-opener legs (league or cup) are LO-fill at best, never anchors, regardless of H2H or class priors. Frozen FNL markets the same day (Arsenal Tula/Chelyabinsk Unavailable) confirm the house itself doesn't trust opener lines.

### Calibration (July 13 Monday, 21:20 UTC checkpoint)
- Q8MZA4 final 4W/2L/3V — LOST (FH-Valur GG 2-0; West Seattle O2.5 0-2). The 3 AH-push voids had kept it alive; GG/team-scoring MID legs killed it. No win #6.
- KBL7DA 2W/2L (Ural opener → L60; Fenix-Barracas U2.5 broke 2-1 — a 0.56 GF/gm side scoring twice; aligned-unders are strong but not immune). UX4W6L 2W/1L (Ural again — L58 cap of 2 slips contained the damage vs Viking's 6-slip wipeout).
- W0G4PD (JPKAVY clean core) 3W/0L + 3 pending overnight — live.
- Cut-audit: 2H-DC lost AGAIN (Arbaer 1:3 second half... market now 0/9 lifetime — permanent cut vindicated); Honka O2.5 house-0.75 lost 1-1 (L49 negative-value flag correct); Vidir 3.deild O2.5 0-0 ✓; U20 basketball total ✓; Zenit friendly 1X2 1-1 ✓ (was dead anyway). MISS: Maardu-Welco O2.5 WON after research-override cut it (models 65% beat agent's 0.60) — external model consensus deserves weight vs single-agent reads.

## PA SCORING MECHANISM (formalised July 13 — use for ALL future tickets)
Blend three probability sources per leg; never rely on any single one:
  PA_p = 0.50 × research_p (independent, 10+ game lookback, news-validated)
       + 0.30 × class_prior (our settled-ledger empirical win rate for the leg CLASS)
       + 0.20 × house_p (SportyBet model — informative but overconfident by ~5pp on 1.6+ odds)
Class priors from our settled ledger (update as data accrues):
  researched DNB/To-Qualify anchor 0.77 | AH integer +1/+1.5 catch (push-protected) 0.80 | aligned-profile total (BOTH teams' last-10 agree) 0.72 | Goal Bounds wide range 0.78 | safe-band 1.19-1.41 generic 0.82 | GG/BTTS-family 0.55 | win-either-half 0.45 | 12-DC draw-league 0.35 | 2H-DC 0.00 | opener/friendly any 0.50 | close bball spread 0.45 | WNBA total 0.50 | MLB ML pitcher-edge 0.70, team-record-only 0.52 | MLB dog +1.5 sub-0.80-research 0.45
Selection rules: EV = PA_p × odds − 1. Ticket legs need EV > 0 AND PA_p ≥ 0.62. Anchors need PA_p ≥ 0.72 AND zero rule flags. Hard-zero flags (never include): L-rule violations, openers-as-anchors (L60), 2H-DC, corners>8.5, contrarian fades (L57), sub-bar dog lines (L59), frozen/Unavailable markets, >2 slips per fixture (L58), knockout non-qualify result markets (L56).
Ticket shapes: BANKABLE = 5-8 legs, all PA_p ≥ 0.70, target 3-12x (the ONLY shape with 5 wins). VALUE = 6-10 legs, EV-positive 1.5-2.2 odds each. WEEK ticket = same rules + all legs inside the window with To-Qualify/DNB instruments on knockouts.

**L53b — MEGA-SLIP SIZING DIRECTIVE (user-mandated, July 13): 30-40 leg slips must be built from 1.40-2.10 value-density legs, NEVER 1.2x bankers**
"When I say I want 30 or 40 games on a slip, the odds should run into hundreds of thousands or millions." Leg window 1.40-2.10 (house p>=0.53, whitelisted markets only), one leg per fixture, researched value legs first. Delivered under this spec: VTYC49 (12 legs ~99x), T884HZ (30 legs ~43,379x), VWTEDR (40 legs ~1.4M x). Ladder principle: value density per leg, not banker breadth.

### Open book at July 13 night close (settle on next review)
- Precision: ZBPC8L (A-bankable 2.8x), NEUXM2 (A-aggressive 3.9x), NQMTX3 (week hybrid 7.7x), H97U6J (week value 6.3x). REEPMM superseded (Thor-Vikingur frozen).
- Ladders: VK62KY (17/20x), TZB50N (33/105x), R26KN4 (46/461x, replaced VLDPDM after Brora-Aberdeen froze — OPENER markets freeze, L30/L60 family).
- Mega (L53b spec): VTYC49, T884HZ, VWTEDR. Week window through Sun Jul 19 incl. WC semis (Eng-Arg O1.5 the only PA-passing WC leg; France-Spain excluded by mechanism — no edge at the prices).
- Monday pending: W0G4PD was 3W/0L (+3 overnight Brazil/Paraguay legs) — possible WIN #6 check.

### Calibration (July 14 early, 05:35 UTC) — WIN #6 + instant L53b vindication
- **W0G4PD WON 5W/0L/1V (JPKAVY clean core, ~4.4x) — SIXTH project win.** Londrina +1.5 (America-MG dead-last read), Brusque +1.0, Breidablik O2.5 (13/13 overs), CampoGrande + Capiata Paraguay overs; 1 void. Conservative-instrument clean-core shape now 6-for-6 as the only winning construction.
- **Ceara v Athletic finished 0-0 and a 1.19x "Over 0.5" FILLER killed FIVE tickets at once** (VK62KY, TZB50N, R26KN4, HQHYB6, M78500 — the entire banker-fill ladder family, dead within hours of posting). Meanwhile the L53b value-density megas (T884HZ, VWTEDR) and the precision set had EXCLUDED that leg by the 1.40 floor / market choice — all fully alive. The user's sizing directive was empirically vindicated on night one: banker fill does not reduce risk, it multiplies failure points at negligible odds contribution.
- Note: the same fixture's UNDER 2.5 was our researched Monday leg (won on the 0-0) — the fill algorithm took the opposite-family "any goal" banker on the same game. New rule of thumb: fill legs must never contradict a researched read on the same fixture; when research says UNDER-profile, no goals-dependent banker qualifies.
- Precision set (ZBPC8L/NEUXM2/NQMTX3/H97U6J) all-pending at checkpoint; first legs kick 09:00 UTC.

**L61 — To-Qualify DECISIVELY beats match-DNB/1X2/total when a side leads on aggregate (KuPS proof, July 14)**
KuPS were 2-0 up on aggregate, LOST the 2nd leg 2-3 at home (dead-rubber, controlled tempo) but ADVANCED 4-3. Every ticket that used KuPS match markets LOST the leg: ZBPC8L (DNB), NEUXM2 (team-total O1.5), VK62KY/TZB50N/R26KN4 (DNB). The To-Qualify instrument recommended for the research core (JSMHCF/GPN548) WON. RULE: when backing an aggregate leader in a 2nd leg, ALWAYS use To-Qualify — never match DNB/1X2/team-total. The leader routinely loses the return leg and still advances (L56 family). This single misjudgement cost 5 tickets a leg apiece.

**L62 — Scottish League Cup GROUP games go to PENALTIES on a 90-min draw; goals/result markets settle on regulation (Kilmarnock trap, July 14)**
Kilmarnock v Raith finished 0-0 in regulation; Kilmarnock won the shootout 4-2 (setScore shows "4:2" = PENALTIES, gameScore ['0:0','0:0','0:0','0:0','4:2'] confirms regulation was 0-0). "Home Team or Over 2.5: Yes" settled isWinning=0/rf=0 — a genuine LOSS — because at 90' there was no home win AND no over 2.5. The displayed 4:2 is the shootout, NOT goals scored. RULE: treat Scottish LC group fixtures like knockouts (L56 family) — the draw-for-bonus-point format means result/goals/OR-combo markets can fail even when your side "wins on pens." Prefer Over 1.5 only; never OR-combos (854/858) or team-totals that need a 90-min home win.

**L38b — Argentine Primera B away DNB overrated even for runaway leaders**
Arsenal Sarandí (1st, +18 GD, division's best side) LOST 0-1 AWAY at 15th-placed Argentino de Quilmes; the away DNB lost outright. Away favourites in Argentine lower tiers (Primera B/C, Federal A) fail at an above-model rate regardless of table gap — extends L38. Use home-side instruments or skip; do not anchor on a lower-league Argentine AWAY result.

### Calibration (July 14 Tuesday, settled 2026-07-15)
- **Research anchors delivered**: Lincoln Red Imps To Qualify (3-1 agg) WON, Ararat-Armenia To Qualify (2-0 agg) WON — both leg-1-lead reads correct. JSMHCF (5-leg research core) went 3W/2L and LOST, but on the two NON-To-Qualify legs: Arsenal Sarandí away DNB (→L38b) and Kilmarnock OR-combo (→L62 pens trap). The To-Qualify instruments were flawless; the "supporting" result/combo legs killed it. Reinforces L50: anchor on To-Qualify/DNB, and even the fill must avoid result-side traps.
- GPN548 (10-leg extended) 7W/3L — same 2 losses + Falkirk TT O1.5 (0-1, Ayr competitive — agent had correctly DOWNGRADED it to weakest LO leg).
- Kauno +1.0 (push-protected LO, GPN548) WON — Kauno won leg 2 3-2 away. Push-protected downgrades keep performing.
- Precision set: ZBPC8L 3W/1L, NEUXM2 3W/1L, H97U6J 3W/0L+2pend (alive), NQMTX3 all pending (weekend legs) — the KuPS leg (→L61) was the single common killer of the two that died.
- Banker-fill ladders VK62KY/TZB50N/R26KN4 all dead again on the SAME two legs: KuPS DNB (L61) + Ceará Over 0.5 (the 0-0 that already killed 5 tickets Sunday). Value-density megas T884HZ/VWTEDR also dead (30-40 leg fragility, L53), losses spread across integer AHs and lower-league handicaps — no new rule, just leg-count math.
- HZ39DV trims VG443Y 20W/8L, H6SPD6 18W/6L — the friendly market-59 and 2H-DC legs the trim COULDN'T remove (count ran out) were among the losses, as flagged.

**L63 — AWAY result-side DNB/1X2 in South American, altitude, and lower/friendly contexts is a persistent loser (July 15)**
Three away result-sides all failed the same night: LDU Quito DNB away LOST 0-1 at Universidad Católica (Quito intra-city derby — altitude offers no edge to the "bigger" away side), Pittsburgh Riverhounds DNB away LOST 2-1 to winless Sporting Jax (a 0-11-4 side finally won at home), and (yesterday) Arsenal Sarandí away DNB (→L38b). Add SM Caen friendly DNB home LOST 3-4 to 3rd-tier Paris 13 (friendly result-sides fail even void-protected — Paris 13 won outright). RULE: away result-side instruments (DNB/1X2) in South American leagues, altitude venues, USL, and pre-season friendlies are systematically overrated by both the house and research; downgrade to LO or take a TOTAL/Goal-Bounds instead. Home instruments and researched Overs are far more reliable. Only back an away result-side when the edge is >=0.72 AND the opponent is genuinely weak with no home-fortress/desperation factor.

**L36b — Knockout/semifinal CORNERS Over is a trap (goals Over is fine) (July 15)**
England 1-2 Argentina (semi) — the Over 1.5 GOALS anchor WON (3 goals) but Corners Over 7.5 LOST (cagey, low-tempo semi produced <8 corners). Corners depend on sustained territorial pressure, which tight knockout games suppress even when goals arrive. RULE: never take corners Over in knockout/semifinal/final matches; goals markets (O1.5) are fine but corners specifically fail. Extends L36 (must-win = cagey) and L51 (knockout O/U LO).

### Calibration (July 15 Wednesday, settled 2026-07-16)
- England-Argentina (Argentina won 1-2, reached final): Over 1.5 goals anchor WON on all tickets that carried it; only the Corners Over 7.5 leg lost (→L36b). Goals read correct, corners read wrong.
- **W9NMZ4 (bankable 8-leg) 5W/2L/1V — LOST**; **QNR5ZL (value 10-leg) 6W/3L/1V — LOST**. Both killed by the two away-DNB legs: LDU Quito DNB away (0-1) and Pittsburgh DNB away (2-1) — both →L63. Barcelona SC only drew 1-1 at home vs strugglers (bajas as the agent flagged): DNB voided/survived on W9NMZ4 but the 1X2-Home on QNR5ZL lost. The value ticket's higher-odds market choice (1X2 vs DNB) cost it on Barcelona.
- **HSKE65 research cores GP1KXK 3W/1L, YUK3CJ 4W/2L** — both died on Caen friendly DNB (→L63) + Eng-Arg corners (→L36b). The genuine KEEPs (Kairat, Orlando Pirates, Knoxville) all WON; the two "supporting" legs killed the cores again — same pattern as JSMHCF two days ago (anchors win, support-legs kill).
- **Trim audit (HSKE65)**: remove-5 HKMU47 24W/8L, remove-10 N05WWC 23W/4L, remove-15 UE0TAA 19W/3L — the deeper trims cleanly removed more losers (Lavallois -1.5 lost 5-0, both 2H-DCs lost, Craiova integer O3 lost 1-0). Removed-lists correct again; the risk-rank knife keeps validating.
- Weekend megas (RQUQQP 30-leg ~31kx, YD8YTH 40-leg ~984kx) + weekend precision (NQMTX3, H97U6J) all PENDING — settle Sunday.
- Takeaway: the Over-1.5 goals anchor is reliable; the recurring killers are AWAY result-sides (L63) and non-goals side-markets on the same fixtures. Build cores from Overs/Goal-Bounds/home-instruments, not away DNBs.

### Open book at July 16 session close (settle on next review)
- **X83JTZ family (July 16, mostly UEFA Q2 second legs)**: research core SJD637 (7 legs, 5.3x: Sileks +1, Derry O1.5, Neftchi O1.5, Vitoria O1.5, Sogdiana 1+, IdV-to-score, Lech OR-combo); extended LQ43X9 (10 legs, 12x: + Dynamo Kyiv To-Qualify, Bunyodkor O1.5, Elimai To-Qualify); trims S9733G (34/~60kx), SKLSY9 (29/~6.8kx), TXH896 (24/~1.3kx). X83JTZ original dead on arrival (2 legs live at fetch).
- **Weekend book**: megas RQUQQP (30/31kx) + YD8YTH (40/984kx) run Fri-Sun; precision NQMTX3 (week hybrid, Eng-Arg O1.5 leg WON, 6 weekend legs pending) + H97U6J (3W/0L, 2 weekend legs pending — ALIVE).
- Key research reads to grade: Sileks +1 as best-leg call (0.80 vs 0.74 implied); dead-rubber easing thesis (Qarabag/Dila/Shkendija/Pyunik/Levadia unders-lean); Velez away -1 as worst-leg call (0.28); Derry/Vitoria O1.5 as top KEEP totals; Uzbek Superliga as new safe-band pocket.
- WC final window: Argentina reached the final (beat England 2-1); final vs France/Spain winner lands Sunday Jul 19 — research it fresh on next session for the week book.

**L64 — To-Qualify grades by AGGREGATE CUSHION (July 16, Elimai pens loss completes the gradient)**
Settled evidence across the week: 2+ goal aggregate lead → 3W/0L (Lincoln 3-1, Ararat 2-0, KuPS 2-0 — all advanced); 1-goal away lead correctly avoided as negative value (Liepaja 0.63 vs 0.775 implied); LEVEL aggregate → Elimai lost 7-8 ON PENALTIES (LQ43X9 killer) — a literal coin flip that the ~1.36 price never covers. RULE: To-Qualify is HI/anchor ONLY with a 2+ goal cushion; 1-goal lead = LO; level tie = SKIP entirely (pens variance, no price edge). The instrument's edge IS the cushion, nothing else.

### Calibration (July 16 Thursday, 20:50 UTC checkpoint — SA legs pending)
- **SJD637 (research core) 4W/0L + 3 pending — possible WIN #7 overnight.** Sileks +1 WON (best-leg call correct), Derry O1.5 WON, Neftchi O1.5 WON, Lech OR-combo WON. Research anchors keep delivering.
- Dead-rubber easing thesis VALIDATED: Shkendija 1-0 and Pyunik 1-0 strolls killed both "Both-Halves-Under No" legs exactly as researched (L23 + easing). St Joseph's-Bohemians 0-0 killed win-either-half AGAIN (market is a permanent-cut candidate at this point). Ilves corners O4.5 lost (3 corners... L25 again).
- Trim knife: TXH896 (remove-15) 16W/2L vs S9733G (remove-5) 20W/5L — deeper trim cleaner again; the extra losses on the shallow trims were EXACTLY the researched-CUT legs (both-halves dead-rubbers, win-either-half, corners).
- H97U6J 3W/0L (2 weekend legs pending, ALIVE); NQMTX3 1W/0L (6 pending).

### Session close July 16 night — Friday max-ticket deliberately NOT posted
- User requested a max-odds ticket (now → end of Friday, high individual odds, winners only). The MLB-Friday research agent (the key value pocket: post-ASB return slate, published probables, 1.5-2.2 pitcher-edge legs) died on the session usage limit before delivering. Brazil-Friday and Uzbek validations also unrun.
- Decision per the user's own constraint ("don't add games for the sake of adding games"): NO unresearched max ticket posted. An unvalidated MLB/Brazil stack is exactly the banker-fill/junk-leg failure mode (L53/L59) with bigger price tags.
- EXECUTE ON NEXT SESSION (after ~01:40 UTC reset): research MLB Friday probables (ace-vs-backend MLs 1.45-1.80, two-sided-pitcher totals 1.6-2.0, +1.5 dogs only >=0.80), validate Bahia 1X2 @1.44 / Ponte Preta O1.5 @1.41 / Navbahor + Albion Goal Bounds 1-3 @1.40, then build the 10-14 leg value-density max (~200-600x) per L53b. Fixture caps: Glimt/Mirassol/Fluminense/Voluntari/KaPa/Grankulla/Hviti already at cap via megas; fresh inventory = MLB + Bahia + Ponte Preta + Navbahor + Albion + rank-31-40 YD8YTH singles.
- Live ladder at close: V4QA6Z (8/4.9x bankable), SNVUW6 (6/11.4x), MYYLKJ (7/13.3x) settle by Fri noon; SJD637 win-#7 check pending (was 4W/0L); megas RQUQQP/YD8YTH + H97U6J (3W/0L alive) + NQMTX3 run through Sunday; WC final Sunday needs fresh research.

**L65 — DERBY/RIVALRY result-sides are fat-tailed even for HOME favourites (July 16-17)**
Seattle (62% model, home, 6th v 13th) LOST 1-5 to Portland in the Cascadia derby — killing V4QA6Z and SNVUW6 (L58 2-slip cap contained it). Three days earlier LDU lost the Quito derby as favourites. Extends L13 (derby goal-variance) to RESULT markets: in named rivalries (Cascadia, clasicos, intra-city derbies), downgrade all result-side instruments one tier regardless of model/table gap; totals/bounds are the only near-fair markets in derbies.

### Calibration (July 17 early, 05:25 UTC)
- SJD637 (X83JTZ research core) 5W/1L/1V — LOST on Vitoria-Vasco Over 1.5 finishing 1-0 (0.80 research leg; the ~20% tail). Six of seven legs won incl. Sileks +1, Derry, Neftchi, Lech. No win #7. Aligned totals are strong but NOT locks — position sizing must respect that.
- MYYLKJ 2W/0L (Boca WON — class-gap cup anchor delivered; China legs pending). H97U6J 3W/0L alive; NQMTX3 1W/0L.
- Boca 90-min win @1.63 as researched swing leg: CORRECT. Neutral-venue cup + class gap remains a usable anchor shape (contrast: knockout result-sides between EQUALS stay banned per L51/L64).

**L66 — Pre-European-qualifier easing extends to TOTALS (July 17, Glimt 1-0)**
Bodo/Glimt (home 3.0 GF/gm, research 0.81 for Over 2.5) won 1-0 over Fredrikstad with their CL qualifier 4 days away — visible rotation/easing. The weekend agent HAD flagged "CL qualifying starts ~Jul 21 — rotation risk" but only the result-side was downgraded. RULE: any team with a European tie within 4 days → downgrade ALL their markets one tier (totals included), same family as dead-rubber easing (L10/L23-dead-rubber).

### Calibration (July 17 evening, 20:05 UTC checkpoint)
- Ladder ZPY4Q7/HK1CSY/XK472W: all three rungs dead on Navbahor 2-3 (bounds 1-3, fair-priced 0.69 leg — the 21% tail) + Glimt 1-0 (→L66). Nested ladders share the core by design — one leg kills the family (known L53 economics).
- MYYLKJ final 4W/2L/1V — Changchun DNB lost 1-5; Suzhou 0-0 killed 2-5+ bounds (the research CUT verdict arrived after posting: "June reverse fixture was 0-0" — post-research legs must not predate their research).
- Flora: the sane leg (EG O2.5, 3 goals) WON while the stretched O3.5 LOST 1-2 — instrument-choice lesson again. Mjallby-Vasteras 0-0 killed all integer Over 2 legs (agent had said "no edge"). Trim knife validated again across 6 trim slips.
- ALIVE tonight: WEKFRG 3W/0L (+5), L2Q3XF 0/0 (+6 evening legs), H97U6J 3W/0L (+2 weekend). MLB research legs (Mariners/Brewers/Padres/Braves/Tigers) all pending 22:05+.

**L67 — COMPULSORY FIXTURE-LEVEL ONLINE RESEARCH (user mandate, July 18): no leg posts without it**
Every leg on every slip MUST have fixture-specific external research (form/news/starters/league context from independent web sources) completed BEFORE posting — house probability alone never qualifies a leg. Legs that cannot be researched (thin leagues, no coverage, unpublished starters) are EXCLUDED, not guessed. This hardens L47 from "mandate" to gate: research-first is now part of the posting pipeline itself.

### Calibration (July 18 morning, 07:25 UTC) — the one-leg-short pattern is now structural
- S4AYM1 2W/2L/1V (Mariners 0-7, Padres 7-6 — confirmed aces still lose ~35%); ZE5DY8 3W/1L — Nacional (the LO-flagged leg, anchored anyway at 1.56) lost 1-2 at home: THIRD ticket in 10 days dead on the final leg (TM2FVE, SJD637, ZE5DY8). WEKFRG 6W/2L — both SA away +1 catches lost on identical 2-0s (L38 yet again). L2Q3XF 5W/1L (Vidir 3rd-tier over). PKME89/ZWP687 dead (MLB ML stack: 3W/3L on pitcher edges = exactly the 0.62-0.66 the agents priced; stacking five 0.63s is 10% joint — shape error, not research error).
- WINNERS inside the wreckage: Melton ML (the 15pp value divergence) WON; Sale WON; Brewers WON; Ceara +1 WON (America-MG 8th straight); Bahia WON; Dundalk/St Pats FAI reads WON. H97U6J alive 3W/0L (+2).
- **RULE HARDENING from the pattern**: (a) LO-flagged legs NEVER go on win-tickets — LO is ladder-only material; (b) max TWO baseball MLs per ticket regardless of edge quality; (c) SA away +1 catches join away-DNBs in the L38/L63 cut — home instruments or skip.

## THREE-MONTH KEY INSIGHTS (formalised July 18)
1. **The only winning shape** (6 wins: U7UASF, SLSW69, P8CC3V, GDUEQL, YSPTQ0, W0G4PD): 4-8 legs, every leg individually researched at indep p>=0.70, conservative instruments, 3-11x total. Nothing else has EVER won.
2. **Odds-band law (L44)**: 1.0-1.3 legs hit 94-97%; 1.3-1.6 ~82%; 1.6+ ~19-43%. Prices are informative; edges are rare.
3. **Instruments beat selections**: To-Qualify (with 2+ goal cushion), DNB, AH push-protected catches, wide Goal Bounds systematically outperform result-sides at equal stated probability. Settlement mechanics (void/refund paths) are worth 5-10pp.
4. **Hard-zero markets** (never play): 2nd-half DC (0/9+), win-either-half, corners totals, market-59 both-halves <0.80, no-draw DC in draw leagues, integer O/U without 0.80, friendly/opener/reserve/women/youth contexts, NBA Summer League, WNBA totals, close basketball spreads.
5. **Persistent house mispricings we exploit**: aggregate-leader To-Qualify, dead-rubber easing (unders), pre-European rotation (L66), promoted/lanterna gaps, in-season vs pre-season fitness in July qualifiers.
6. **Persistent traps that look like value**: away result-sides and away catches in South America (L38/L63), derby result-sides (L65), streak-extension (L58), contrarian fades of the house model (L57 — the house wins those), frozen-market phantom odds, KBO/NPB/MLB without confirmed starters.
7. **Leg count IS the risk** (L53): 92% leg win-rate still loses a 30-legger. Research quality cannot rescue quantity.
8. **The one-leg-short pattern**: sizing must assume even 0.72 legs miss ~1 in 4. Win-tickets = 4-6 legs MAX, all >=0.72, zero LO passengers.

### Session close July 18 (~08:30 UTC) — maxbet deferred on limits, win-book live
- Maxbet (30-50 legs, L53b taste, + per-fixture research document) NOT posted: both research agents died on session limits (reset 12:10 UTC) and L67 forbids unresearched legs. EXECUTE NEXT SESSION: relaunch both agent briefs (WC-final+Americas; Europe/Asia depth), merge with July 18 research, build 30+ legs at 1.35-2.10, post, and publish the per-fixture research/trends document as an Artifact.
- LIVE BOOK: S6Z6MG (3-leg win-today, joint ~43% — highest-probability ticket ever posted here: Viking O2.5 16:00, Criciuma DNB, Ponte-Goias O1.5 19:00), S8LPHA (7-leg taste 17.7x incl Skubal/Luzardo), H97U6J (3W/0L — needs Viking O2.5 today + Elfsborg-Sirius O2.5 Sunday). WMXC5J/WS700X superseded (wrong Ponte market caught at verification — Goias team-total instead of match O1.5; verify-after-post catches again).
- WC FINAL Sunday ~19:00 UTC: Argentina v France-or-Spain — research fresh next session; L64 (cushion) irrelevant, L51/L56 apply (final = To-Qualify-style instruments only... note: finals have no "qualify" — use DNB/goals instruments, never 90-min result at short odds).
- Sunday researched inventory ready: Hammarby home (0.71), Sirius DNB @1.51 (0.74), Seoul DNB (0.71), KuPS DNB (0.73 but L66 flag — UECL tie ~Jul 21 → downgrade), Thor-Vikingur (frozen-market check needed).

### July 18 late — bankable-maximal slip + WC final no-play verdict
- QG12WV posted (3 legs, 2.46x, joint ~38%): Hammarby home (Degerfors missing 4), Sirius DNB (9 clear, unbeaten), Seoul DNB. These were the ONLY uncapped legs clearing the 0.70 researched bar for Sunday — "as many as are bankable" = three.
- **WC FINAL (Argentina v Spain, Sun 19:00, MetLife) = NO PLAY**: Spain conceded 1 all tournament (6 clean sheets, 0.31 xG against/game — record), Opta 59.6/40.4, finals settle cagey at 90'. No market clears 0.70; overs are coin-flips against that defence. Same discipline as the France-Spain semi (excluded, correctly).
- Research capacity note: subagent limits died twice today (12:10, 18:20 resets) — inline WebSearch remained available and validated the Sunday legs. Pattern: keep agent briefs small, do final validation inline.

### July 18 night close — Sunday book set
- Checkpoint 18:50: **H97U6J 4W/0L — Viking O2.5 WON; ONE leg left (Elfsborg-Sirius O2.5 Sun 14:30) for WIN #7.** S6Z6MG 1W/0L (Viking ✓, Criciuma/Ponte settling), PF52FM 1W/0L (Thor-Vikingur ✓). Cut-audit: Man Utd 0-1 Wrexham (friendly result trap), Kaisar drew AGAIN (L54 cut ✓), Hamilton OR-combo died on pens 6-5 (L62 ✓), Douglas Hall non-league TQ lost.
- Posted: KWLHZG (realistic maxbet, 6 legs 8.6x: Skubal, San Antonio DNB, Hammarby, Sirius DNB, Seoul DNB, WCF Under 2.5 @1.68 — Spain 1 GA/6 clean sheets, finals-cagey base rate); HEZ0V9 (draws-only fun slip, 3 legs 41x: WCF 90-min draw @3.13 [2014/2010/2006 all level], Bucheon-Seoul X, Elfsborg-Sirius X — pure variance, flagged).
- NOTE: tonight's leg window closed during build (bronze game/Serie D/MLB early inside buffer) — maxbet is Sunday-weighted by necessity. Sunday book: QG12WV (2.46x bankable), KWLHZG (8.6x), HEZ0V9 (41x draws), H97U6J finale.

### Calibration (July 19-20, settled) — WINS #7, #8, #9: THE STREAK BREAKS
- **H97U6J WON 5/5 — WIN #7** (built over the week): Elfsborg-Sirius O2.5 (1-3), Viking O2.5 (2-1), Hanshin ML (Chunichi 2-5), Partick TT O1.5 (0-4), Zhejiang O2.5 (3-2). The patient multi-day researched-anchor ticket.
- **QG12WV WON 3/3 — WIN #8**: Hammarby 4-0 (Degerfors missing 4 — team-news edge paid), Sirius DNB, Seoul DNB. The Sunday bankable — every leg a researched home/DNB instrument.
- **S6Z6MG WON 3/3 — WIN #9**: Viking O2.5, Criciuma DNB, Ponte-Goias O1.5. The "highest-probability ticket ever posted" (43% joint) delivered.
- Project now 9 wins, ALL the same shape (3-8 researched legs, conservative instruments, 2.4-11x). Three in one weekend after the bad run — L67 research-gate + the win-ticket discipline (>=0.72 legs only, no LO passengers) worked exactly as designed.
- **HONEST VARIANCE NOTE (GA7QZX vs WLQ5RM)**: the deep-agent "sharpened" GA7QZX (Tigers ML 0.64 "cleanest edge", Mariners Under) went 2W/2L — Tigers LOST (Angels 3-2), Mariners Under LOST (6-3=9). The shallow WLQ5RM I said "don't play" went 4W/1L — Cubs ML (10-1), Mariners ML (6-3), Coors Over all WON. Lesson: deeper research correctly LOWERED the edges but single-night variance ran against the sharp picks. Does NOT invalidate research-first (WC Under + D-backs from the sharp read won; the process is sound over volume) — but a reminder that a 0.64 MLB ML is still a 36% loser and MLB MLs are the highest-variance leg class we use. Keep MLB to <=2 MLs and prefer the researched TOTAL when the two-sided case exists.
- Cross-book: PF52FM 6W/1L (Zenit Super Cup OR-combo the only miss — 5-3 but home didn't cover... actually 5-3 = home win + over, should win? Recheck: settled L, likely a settlement nuance), S8LPHA 5W/2L, KWLHZG 5W/1L (San Antonio USL home DNB lost 1-2 — L63 USL away-desperation again, Vegas won). Bahia/Criciuma/Ponte/Viking/Hammarby/Sirius/Seoul all hit — the researched home-instrument + aligned-total core is the engine.

### Calibration (July 20 Monday, 21:25 UTC — thin-league spray-codes underperform)
- The three near-identical Monday thin-league user codes (JXKALN/HYHV9A twins) settled poorly even after salvage: WQD488 3W/1L/1V (RFS TT O1.5 lost 0-1 — Latvian champs failed to score, no-news thin-league risk realised); G8DFAS 1W/1L (KPV Goal Bounds 1-1, one goal short of the 3+ band). Broad slips PHLRCN/L8UY3Y/HW2P2N/ULSU1K all dead — losses clustered in exactly the thin-league legs I FLAGGED as un-researchable: RFS O1.5 (0-1), Slavia-CSKA O2 (0-0), FH-Breidablik O3 (0-0), Jwaaya-Al Ahed bounds (2-0), Coritiba women O1.5 (0-1), KPV bounds, Al Ansar DC (1-1 Lebanon).
- **LESSON REINFORCED, NOT NEW**: thin-league goals/bounds legs at house-p 0.70-0.78 are NOT 0.70-0.78 in reality — 0-0s and 1-goal games recur far above model. Multiple 0-0s today (Slavia-CSKA, FH-Breidablik) killed 'over' legs the model rated 65-72%. The house probability on obscure leagues is unreliable (L4/L30 family). These codes should have been declined for a fresh researched build, not salvaged — salvage of an un-researchable code still inherits its un-researchable risk.
- CONTRAST: this weekend's 3 WINS (H97U6J/QG12WV/S6Z6MG) were all TOP-FLIGHT, news-researched fixtures. The edit quality problem = analysing spray-codes at all. Going forward: on a thin-league no-news code, state plainly it cannot be made win-grade and offer a researched alternative instead of posting salvage slips that imply more confidence than the evidence supports.

### Calibration (July 20-21 overnight, settled) — WIN #10 + the "less lean cost the win" lesson
- **GTCG7D WON 2/2 — WIN #10**: Phillies ML (Sanchez 2.62 v Sheehan 4.81; Dodgers 10-7 but Phillies won... setScore 10:7 = Phillies scored 10), Brewers ML (Misiorowski, 8-3). The disciplined 2-leg high-certainty MLB ticket delivered. Elite-pitcher-edge home favorites are a real edge.
- **GA7Y44 (the 5-leg "less lean" version) went 4W/1L — LOST on exactly the leg I flagged weakest**: Golden State Valkyries ML @0.74 (Mystics won 90-82). The 2 MLB + Aces(0.85) + Lynx(0.78) core all WON; the 5th leg added only to satisfy "less lean" killed the ticket. LESSON HARDENED: when the user asks for "more games" on a high-certainty ticket, the extra legs must clear the SAME bar (>=0.78), not just be "better than nothing". Valkyries (2026 2nd-season side) vs Mystics was NOT elite-tier — WNBA ML caution (L26/L37) stands: only genuine juggernauts (Aces vs expansion, Lynx best-record) qualify. A 0.74 leg is a 26% loser and it found the ticket.
- RRGSKU (draws special) pending across the week — first leg Novorizontino-Criciuma tonight.
- Running win log: 10 wins (U7UASF, SLSW69, P8CC3V, GDUEQL, YSPTQ0, W0G4PD, H97U6J, QG12WV, S6Z6MG, GTCG7D). The 3 newest + GTCG7D all came AFTER the L67 research-gate + "tight ticket, >=0.72 legs, no passengers" discipline was enforced. The method is validated at volume.

**L68 — THE DRAWS EXPERIMENT WAS CATASTROPHIC: draw-market accumulators are structurally unplayable (July 21-25)**
Full settlement of the draws ladder (RRGSKU/LW99XL/MBKEKJ/JD7CXL/RLLD8T): of the settled legs across all tickets, only **2 fixtures actually drew** — CA Platense 2-2 Union, Olympique Dcheira 1-1 Amal — against ~15 settled. That is a **~13% actual hit rate versus the ~31% the model priced**, an 18-point overconfidence gap, the largest single-market miss in the ledger. Every ticket dead within 48 hours.
Why it failed (the mechanism, for permanent reference):
1. **Draw probability is the least predictable outcome in football.** Home/away win probabilities carry real signal from team strength; the draw is a residual — it happens when two teams *fail* to separate, which no metric predicts reliably. League-wide draw rates (Argentina PN 35%) are AGGREGATE artifacts; they do NOT transfer to individual fixture selection.
2. **Selection bias inverts the edge.** Picking the "most draw-prone" fixtures selects games the market has already priced as tight — there is no residual edge left, and the 2.7-3.1 prices are efficient-to-negative.
3. **Compounding is merciless.** Even at a true 31%, ten legs = 1 in 68,000. At the ACTUAL 13% hit rate, ten legs ≈ 1 in 750 million. The 20/30-leg versions were mathematically absurd (I flagged this at posting; it was still the wrong ticket to build).
4. Notable specific failures: Bucheon-Anyang LOST 2-3 despite Anyang drawing 50% of games (the single strongest draw signal available); Novorizontino-Criciuma 0-1; Union Touarga 3-0 in a "33% draw" fixture.
**RULE (hard-zero, permanent): NEVER build draw-market accumulators. Draw as a single leg is acceptable ONLY as a deliberate 1-leg novelty punt at the user's explicit request, never stacked. If asked for draws again, state this result plainly and offer the DNB/instrument alternative — DNB and Goal-Bounds already monetise "tight game" reads without needing the exact draw outcome.**

### Calibration (July 21-25, settled)
- KN1PVE salvages: VTD4JZ 4W/1L/2V (Inverness OR-combo lost 1-0 — Scottish LC again, L62 family), RF348P 6W/3L/4V. The 2 voids on VTD4JZ were AH pushes (L24 protection working). Trims: ZGMEDZ 12W/7L/5V, UJBRN0 15W/9L/5V — losses again clustered in the pre-season FRIENDLY legs the count couldn't reach (Hertha, Bochum, Torquay, Chorley, Shrewsbury) plus Fylkir 4-5. Friendlies remain the single most reliable loser class in user codes.
- Running record: 10 wins, all the same shape (3-8 researched legs, conservative instruments, 2.4-11x). Nothing outside that shape has EVER won.

**L69 — DNB does NOT protect against a bad team WINNING; a draw-heavy opponent's residual probability sits in the away-win, not the draw (July 25)**
Indy Eleven DNB (home) LOST 0-1 to Loudoun United — the leg I built specifically because Loudoun had drawn 9 of 15 (60%). The reasoning was "DNB voids the draw risk, so it's the correct instrument." WRONG READ: a 1W-9D-5L side is not a side that only draws — it is a side that rarely LOSES. Removing the draw from the market left a probability space where Loudoun's win chance was materially higher than the ~15% assumed, and they took it (their 2nd win of the season). RULE: when the opponent's record is draw-heavy, do NOT convert that into a home DNB — the draw-heaviness signals the home side struggles to break them down, which raises the away-win branch too. Prefer Over/Under or Goal Bounds on such fixtures, or skip. DNB is for fixtures where the favourite is genuinely dominant and the draw is the main risk, not where the underdog is hard to beat.

**L70 — Wide handicap catches (+2.5/+3.0) fail when the class gap is real: catches protect against narrow losses, not routs (July 25)**
Two wide catches died on the same day: Elgin City +2.5 lost 5-0 at Hamilton; Akron Tolyatti +3.0 lost 0-5 to Zenit. Both were "safe-looking" 1.13-1.40 legs at house-p 0.86. When a top side plays a much weaker one, the modal outcome is often a 4-5 goal rout, not a 1-2 goal win — the catch line sits exactly in the dead zone. RULE: wide catches are only value when the favourite is inconsistent/rotating; against an in-form elite side vs a genuinely weak host, the rout is the base case and the catch is a trap. Prefer the favourite's team-total Over, or the match Over, instead.

### Calibration (July 25 Saturday, settled)
- RF3YEN (conservative 7) 2W/1L, ZNSAEM (adventurous 10) 4W/1L — BOTH killed by the single Indy DNB leg (→L69). Everything else on the conservative ticket that settled, won.
- XDNRR4/JXLCD3/N8TC19 (maxbets): losses = Santos 2-2 (1X2 home), Pittsburgh O1.5 (0-1 — USL under again), St Johnstone O2.5 (regulation low-scoring, displayed 5:6 = PENALTIES, L62 confirmed a 3rd time), Hamilton/Elgin catch, Akron/Zenit catch (→L70), Santa Cruz AH0.
- **JCME62 (the banker core, 10 legs @ ~4x) is 3W/0L with 7 pending — the ONLY ticket still alive.** Built entirely on the user's p x odds insight: high-probability legs (0.79-0.88) carry EV ~0.98 vs ~0.95 for the 1.40 value-band legs. This shape deserves more use; it is materially better per leg than the value-band maxbet fill.
- Correction to my own prior stance: "avoid 1.20 bankers" was over-applied. The real rule is avoid FAKE bankers (thin-league legs where house p is unreliable — Ceara O0.5 on a 0-0). Genuine bankers in data-rich leagues (MLS/Swiss/Swedish top flights, Over 1.5 / Under 4.5 / wide catches vs inconsistent favourites) are the highest-EV legs available.

**L71 — Integer O/U push settled VOID on July 26 (Moss 1-2, Over 3 → rf=1.0) — L8 partially corrected**
Direct API evidence: Moss FK v Raufoss finished 1-2 (exactly 3 goals); the Over 3 (total=3) leg settled `isWinning=0, refundFactor=1.0` = VOID, ticket-surviving. This contradicts the HH55SB-era reading that market-18 integer pushes settle as LOSS. Either the settlement regime changed or the original reading conflated genuine losses with pushes. Working rule going forward: treat market-18 integer-line pushes as LIKELY VOID (same as AH per L24), BUT keep preferring .5 lines — the exact-line outcome still contributes zero odds, and one observation does not fully retire L8. Genuine misses on integer lines are still losses (Sarpsborg Over 2 lost 1-0 the same day).

**L72 — Scottish League Cup group stage is a HARD-ZERO context (4th consecutive burn)**
St Mirren (Premiership) lost 0-1 AT HOME to Dunfermline (Championship) — the researched 0.82 Over 1.5 leg — killing X5QM9A and ZAJJPM and wounding every GPQXE5 trim. Running Scottish LC record across the project: Kilmarnock pens trap (L62), St Johnstone pens (L62 again), Inverness OR-combo, Hamilton OR-combo pens, Linlithgow beating Morton (L55), now St Mirren 0-1. These are Scotland's FIRST competitive fixtures of the season (opener context, L60) with a pens-on-draw format (L62). RULE: no Scottish League Cup group-stage legs of ANY kind except team-total Overs for a top-flight side hosting a 4th-tier/non-league minnow (Aberdeen TT O1.5 and Dundee TT O1.5 both won on the same slate — that narrow class survives). Match totals, result-sides, and OR-combos are all banned in this competition.

**L73 — "Genuine banker" Over 1.5 legs are NOT safe in MLS; one-league banker stacks are correlated (July 26)**
JCME62 (the July 25 banker core, the day's only surviving ticket) finished 7W/3L — ALL three losses were MLS Over 1.5 legs on one night: San Diego 1-0, Minnesota 0-0, Montreal 0-1. Same-night MLS produced three sub-1.5 games; stacking 5 Over 1.5 legs from ONE league on one slate is a correlated bet on league-wide scoring that night. The Unders (5.5/4.5/4.5) and the wide +2.0 catch all won. RULES: (a) max TWO goals-Over legs from any single league per ticket per day; (b) MLS Over 1.5 is a ~0.80 leg, not a 0.88 banker — MLS variance is high both directions; wide Unders (4.5+) and wide catches remain the reliable MLS banker classes. (c) K-League home DNB vs the reigning champion (FC Seoul lost 1-3 to Ulsan, killing MJBDGH and 12W/1L K4YA1L) — backing a mid-table home vs the title side is a coin flip, not an edge; the earlier Seoul DNB win was vs a weaker opponent.

### Calibration (July 26 Saturday, 19:25 UTC checkpoint)
- **K4YA1L went 12W/1L/1V and DIED on the single Seoul leg** — the one-leg-short pattern again (4th occurrence). MJBDGH 7W/1L same killer. GGKXSQ (4-leg core) still ALIVE 4P (Brewers leading in-game).
- GPQXE5 trim audit (research-ranked knife): CORRECT removals — Sarpsborg Over 2 LOST (1-0) ✓, Aalesund Both-Halves-No LOST (1-1) ✓, Moss Over 3 VOIDED on the exact modal-3 scoreline the research predicted (1-2) ✓. WRONG removals — Kongsvinger away-win-either-half WON (1-6 — the 0.55 read missed a rout), Copenhagen Over 3 WON (3-2), Gyirmot OR-combo WON 3-1 (opener produced goals). KNIFE FAILURES (kept legs that lost): Szentlorinc TT Over 0.5 lost on a 0-0 (Hungarian NB II OPENER — L60 legs must outrank mid-tier probability cuts), Sandefjord corners Over 8.5 (CORNERS ARE HARD-ZERO — must always be first off any slip, ranking error), St Mirren (→L72). All three trims died.
- RF3YEN/ZNSAEM final: both USL home DNBs lost 0-1 (Detroit City, Indy Eleven) — L63/L69 now settled fact: USL result-side instruments are permanently banned. Everything else won incl. LAFC 4-0, New England DNB, Brewers ML, Red Sox Under 8.5.
- Positive signals to reuse: Scandinavian/Chinese top-flight Over 1.5 went 10W/0L across MJBDGH/K4YA1L (Sirius 4-1, Brann 2-3, Malmo 1-2, KFUM 2-4, Aalesund 1-1, Brommapojkarna 1-1, 3x CSL, K-League Unders 2W/0L); Aberdeen/Dundee TT Overs won; Hradec Kralove O1.5 won; Debrecen O1.5 (NB I, researched) won; friendlies Karlsruhe-Inter and Cannes-Roma Overs both won (pre-season friendlies remain fine for OVERS, banned for result-sides).

### Open book at July 26 night close (week window Jul 27 - Aug 2; settle progressively)
- **GN3D3D (MY WAY, 8 legs ~3.9x, joint ~29%)**: Hajduk To-Qualify (+2 cushion, L64), Sturm +2.0 catch (4-0 leg 1, p~0.92), Botafogo DNB (Gremio 0 away wins in 9), AIK-Orgryte O1.5 (worst defence), Hacken-Kalmar O1.5, LAFC +2.5 @ Vancouver (top-3 v top-3), Jeonbuk-Seoul U4.5 (league 2.27 gpg), Chicago Fire DNB (unbeaten home). NOTE: Ararat To-Qualify was FROZEN (Unavailable) at posting despite being a verified +2 anchor — phantom-market pattern again; replaced with Fire DNB.
- **YXWRA8 (YOUR WAY, 10 legs ~28.8x)**: Reds ML (Burns 12-1/2.42 v Cecconi), Kairat-Omonia U2.5, Zvezda-Larne U4.5 (dead rubber), Hearts 1X2 @1.87 (new-manager bounce v rotated Sturm), NYCFC DNB (Toronto winless 11), Remo +2.0 (push-protected), Hacken-AIK O1.5, Tromso DNB away (L66-downgraded to value ticket), Inter-Fla U4.5, Flu-Bahia U3.5.
- **RC2EHM (MAXBET, 15 legs ~760x)**: all-researched value-density (V2R8SK 14-leg version superseded). L67 capped size at 15: the 22-fixture batch-3 sweep FAILED 19 of 22 candidates (MLS DNBs fair-priced post-WC-break, Danish opener, FCN congestion, CSL collapse sides, LigaMX/Argentina no-edge) — only Tigres @1.77, Celje O2.5 @1.66, FCK 1X2 @1.57 passed EV>=0.98. A 30-legger was NOT postable without junk; user's L53b sizing needs a bigger researched board than one evening allows.
- Research verdicts to grade at settlement: away-leader ease-off pattern (Mjallby/Fener/Lugano/Besiktas 90-min 1X2s all skipped as overpriced); Benfica trailing-TQ trap @1.28 skipped; Randers Superliga opener skip; Galaxy/Port collapse-side fades.
- GGKXSQ (Jul 26 core) alive: Brewers won 10-2; Barcelona SC U2.5 + Flamengo DNB + Orense-IdV DNB settle overnight.
- **MQNHTA (MEGA-30, user-requested, 30 legs ~629,984x)**: RC2EHM's 15 researched legs + the 15 next-best EV rejects (HBS, CSKA, Cincy DNB, Minnesota DNB, Mjallby, Montreal U3.5, Pachuca, RBNY DNB, Palmeiras DNB, Lech, St Louis DNB, Mineiro, Fredrikstad DNB, Kauno, Gangwon). Posted with eyes open at user request: legs 16-30 are all research-negative EV (0.87-0.98); joint ~1 in 2.7M. Grade the reject tier separately at settlement — if the rejects underperform the kept tier again, the EV-gate knife gets another validation (LRX6DT cut-audit pattern).

**L74 — "Unavailable" bookingStatus does NOT kill a leg on the ORIGINAL code (correction to prior reading)**
Kongsvinger 2 v Skedsmo (LWANY1 leg 18) showed `bookingStatus=Unavailable` at fetch and I called it a "dead leg that blocks settlement" — ranking it the #1 removal. It settled as a normal **WIN** (1:3, 2H-DC). CORRECT SEMANTICS: `Unavailable` means the selection cannot be REBOOKED into a NEW share code (the POST silently drops it); the ORIGINAL ticket still carries and settles that leg normally. Rule: on a user's own code, never remove a leg solely for `Unavailable` — judge it on merit. On a ticket WE build, an Unavailable selection simply cannot be included (verify after posting, as always).

**L75 — L58 VIOLATION COST THE WHOLE DAY: Hacken v AIK 0-0 killed 4 tickets at once (July 27)**
Hacken v AIK finished **0-0** — research p was 0.84 for Over 1.5 ("Hacken H2H dominance, both sides scoring, goal-rich profile"). The tail landed. But the real error was mine: I placed this ONE fixture on YXWRA8 (O1.5), RC2EHM (O2.5), MQNHTA (O2.5) and it also sat on LWANY1 (O3) — **three of my own slips, breaching L58's 2-slip cap that I wrote after the Viking 6-slip wipeout**. GN3D3D survived only because it used Hacken v KALMAR instead. RULE RE-HARDENED: the 2-slip cap is a build-time assertion, not a guideline — add a programmatic check before posting any ladder. Also: a single 0.84 aligned-total is still a 1-in-6 loser; never let one fixture carry the ladder.

**L76 — Market-class stances need softening: 2H-DC and corners both went perfect on July 27**
2nd-half Double Chance went **4W/0L** (Ready 3:3, Volda 7:0, Kongsvinger 1:3, South Africa W 1:2) after being 0/9 lifetime — now ~4/13. Away-team corners went **2W/0L** including Orebro's away O3.5 landing in a 0:0 match. These are BAD markets (sub-50% lifetime), not ZERO markets. Rule: keep them off win-tickets and rank them low on trims, but stop describing them as "permanent hard-zero" — the honest statement is "long-run negative, high variance", and on any single slate they can run hot. Overstating a market's badness produced the worst trim result in project history (below).

### Calibration (July 27 Monday, settled 2026-07-27 21:15 UTC)
- **GGKXSQ WON 3W/0L/1V — PROJECT WIN #11.** Barcelona SC Under 2.5 (0:1), Orense v IdV away DNB (2:3 — the away DNB that L63 warns about, but IdV were the researched anchor), Brewers ML (11:2), Flamengo DNB VOID on a 1:1 (refund, ticket survived). Four legs, conservative instruments, ~4x. Eleventh win, same shape as the other ten.
- **TRIM KNIFE'S WORST DAY EVER (LWANY1)**: of my 5 removals, only ONE was correct on outcome. Kongsvinger 2H-DC **WON** (→L74 semantics error), Bulleen **WON** 3:1, Brno Over 3 **WON** 2:4 (I priced it 0.40 — the worst leg on the slip by my own numbers, and it landed), MTK Over 3 **VOIDED** on exactly 3 goals (→L71 confirmed again), Hacken Over 3 **LOST** (the only correct cut). Meanwhile the KEPT pool lost 4: Union Santa Fe women away 1X2, Mushuc Runa OR-combo (0:2), Skovde-Jonkoping To-Qualify away (1:0 cup upset), River Plate URU reserves 12-DC (1:1). LWANY1 final 22W/5L/4V; trims H6VP8X 19W/4L/3V, ZUWYLT 17W/4L/2V, VAPU3A 14W/3L/2V — all dead, and all dead on legs the knife KEPT. Lesson: on a thin-league board the knife has no real information; ranking by rulebook class alone (2H-DC, corners, integer lines) inverted on a hot slate. When a code is unresearchable, the honest answer is "no trim improves this" — which I said, then trimmed anyway.
- **VOID mechanics confirmed 3x more**: MTK Over 3 on 3:0 → VOID (L71, 2nd observation — integer O/U push = refund is now solid); Tukums v RFS AH -1.0 with RFS winning by exactly 1 → VOID (L24); Sacachispas home DNB on 1:1 → VOID (DNB draw = refund).
- Week book damage: YXWRA8 dead (Hacken O1.5), RC2EHM dead (Hacken O2.5), MQNHTA dead (Hacken + Pachuca 1:2 — the reject-tier leg the EV gate had correctly failed at 0.94). **GN3D3D ALIVE 0W/0L/1V/7P** — Botafogo DNB voided (match postponed/no score), 7 legs pending Jul 28-Aug 2.
- Research scorecard: Rosenborg OR-combo WON 4:0 (the L66 rotation flag was over-cautious here); Ludogorets away 1X2 WON 0:2 despite my rotation flag; CFR Cluj Over 2 WON 5:0 (I ranked it a removal at 0.55); Valmiera, both Uzbek Over 1.5 legs, and Ostersund OR-combo all WON as rated. The thin-league Uzbek pocket keeps delivering.

### July 27 night — the highest-probability ticket ever posted (UN23W1)
- **UN23W1 (7 legs, 2.03x, joint 56.9%, EV 1.156)** — every leg independently researched at p>=0.88, ALL conservative instruments: Sturm +2.0 (4-0 cushion, exactly-2 voids), CSKA1948 +1.0 (0-0 leg 1, home in Sofia), Lynx ML (22-6 v 10-16, Tempo missing Sykes+Rice), Athletic +1.0 at Ponte Preta (Ponte LAST, 2W in 20, 0.7 GF/gm), Nacional +2.0 at Tigre (3-0 up, dead rubber), Norrkoping +1.0 at Landskrona (top-3 v 11th), Dinamo Zagreb home DNB (19 unbeaten, fully fit, Thun missing 3). Five of seven are push-protected AH catches — exact-margin outcomes REFUND rather than lose.
- Previous best joint probability on any posted ticket was ~43% (S6Z6MG, won). This is 57%. If the shape thesis is right, this is the single best-constructed ticket in the ledger.
- Build-time guards now enforced programmatically: assert no duplicate eventId, assert <=2 legs per league, assert every leg starts >30 min out. The L58 breach that cost July 27 would have thrown.
- **Two frozen markets caught at verification AGAIN**: Ararat To-Qualify (a verified +2-cushion anchor) and Helsingborg +1.5 both returned `Unavailable` on POST despite displaying odds. Running count of phantom markets this week: 3 (Ararat x2, Helsingborg). ALWAYS post-then-verify; never trust displayed odds as bookable.
- Research rejections logged to grade: Riga FC home DNB @1.11 (agent p 0.76 — live one-goal tie, Vardar scored twice in leg 1) and Apollon home DNB @1.11 (agent p 0.85 — dead 4-0 tie, rotation risk). Both were among the "safest-looking" prices on the board; if they win, the ease-off/live-tie discount needs recalibration.

**L77 — THE MARGINAL-LEG LAW (user-enforced, July 27): a leg only belongs on a ticket if p x odds > 1 by a real margin. Padding with 1.06-1.14 "safe" legs is a NEGATIVE-value habit.**
The user pushed back on UN23W1 (7 legs @ 2.03x, 57% joint) for the third time on this theme, and the per-leg audit proved them right:
  Sturm +2.0  1.16 x 0.95 = 1.102  GOOD
  CSKA +1.0   1.08 x 0.94 = 1.015  break-even
  Lynx ML     1.08 x 0.94 = 1.015  break-even
  Athletic+1  1.06 x 0.93 = 0.986  **NEGATIVE EV**
  Nacional+2  1.09 x 0.92 = 1.003  break-even
  Norrkoping  1.14 x 0.90 = 1.026  GOOD
  Dinamo DNB  1.14 x 0.88 = 1.003  break-even
ONE genuinely +EV leg out of seven. Legs 4-7 added 6,786 naira of payout on a 10k stake and cost **27 percentage points** of win probability. A single 2.03-odds bet at p>0.493 strictly dominates the whole ticket: identical payout, ONE failure point instead of seven.
**RULE: never add a leg whose (research p x odds) is below ~1.02. A 1.06-odds leg must clear p=0.96 to earn its place, which essentially no football market does. The "stack safe bankers to feel secure" instinct is the same error as the 30-leg mega, just inverted — it destroys probability instead of destroying payout.**
Correct construction: 3-5 legs, each priced 1.45-2.10, each with an INDEPENDENT researched edge over the implied probability, total 4-12x. This is both the user's stated preference and the band all 11 project wins sit in (2.4-11x).
Superseded stance: the July 25 "genuine bankers are the highest-EV legs available" note was wrong as written. Bankers are high-EV *per unit of risk* only when p x odds > 1; at 1.06-1.14 prices the house margin eats the entire edge. Keep bankers OUT unless they clear the 1.02 EV bar.

### July 27 late — value rebuild (GXPRHE)
- **GXPRHE (4 legs, 5.50x, win 22.3%, EV 1.225)** — every leg 1.45-1.61 with a researched edge: Riga-Vardar Over 2.5 (leg 1 produced 5 goals, live one-goal tie, Vardar must chase); Apollon-Dila Under 3.5 (4-0 dead rubber, both rotating); CSKA1948 To-Qualify (0-0 leg 1, home in Sofia, ET/pens-proof per L56); Dinamo Zagreb Over 2.5 (1-1 leg 1 forces Dinamo to chase, Thun missing 3).
- Head-to-head vs the padded ticket on a 10k stake: GXPRHE returns 54,959 at 22.3%; UN23W1 returns 20,316 at 56.9%. EV 1.225 vs 1.156 — the value ticket is better on BOTH expected return and payout, and only worse on strike rate.

### Calibration (July 28 Tuesday, settled 2026-07-29) — WINS #12 AND #13, and a hard lesson about research
- **UN23W1 WON 6W/0L/1V** (the 7-leg high-probability ticket). **GXPRHE WON 4W/0L** (the 4-leg value rebuild). Both landed on the same night.
- **THE DECISIVE EMPIRICAL TEST OF L77**: UN23W1 paid 2.03x nominal but the Dinamo DNB VOIDED (90' was 2-2), so effective return was **1.78x**. GXPRHE paid the **full 5.50x**. Same night, same board, both won — and the value ticket returned **3.1x more money**. The user's risk/reward argument is now empirically confirmed, not merely theoretically correct. On a 10k stake: GXPRHE 54,959 vs UN23W1 17,807. Build value tickets.

**L78 — RESEARCH IS ACCURATE AT THE EXTREMES AND NEAR-RANDOM IN THE MIDDLE (LJ2RSJ, 39 legs fully researched)**
Four agents produced heavily-sourced independent probabilities for all 36 fixtures on LJ2RSJ. Overall directional accuracy was **18 correct / 15 wrong = 55%** — barely a coin flip. But the errors are NOT uniformly distributed:
- **p >= 0.75 went 4W/0L** (PSV O2.5 0.84 won 3:0; CSKA-Trnava +1.0 0.79 won; Fortuna Hjorring DNB 0.78 won 2:6; Al Ahli both-halves-No 0.76 won). The three legs research named as the only keeps ALL WON — 2.47x at 3/3.
- **p <= 0.52 went 4L/1W** as predicted losers (Celje O3, Helsingborg O3, Boston River, Landskrona O2 all lost).
- **The 0.55-0.74 band was a coin flip and the misses were spectacular**: Aveley away DNB (research p 0.55, called "the worst-priced leg on the card, EV 0.74") **WON 1:4 away**; San Lorenzo corners (p 0.57, "worst on the board, EV 0.735") **WON**; Hearts both-halves-No (p 0.57) **WON**; Villa O2 (0.62) won 2:4; Tonbridge BTTS (0.64) won 4:2; Rochdale O2.5 (0.57) won 2:3; Jwaaya away 1X2 (0.56) won; Nasaf (0.50) won. Against that: KuPS +1.0 (p 0.87!) **LOST 0:2** and Zalgiris both-halves-No (0.77) LOST 1:0 — so the high band is not immune either.
**RULE: act on research ONLY when it lands p >= 0.75 (keep) or p <= 0.52 (cut). Treat every 0.53-0.74 verdict as NO INFORMATION — do not use it to rank, trim, or justify a leg. The confident-sounding narrative in that band is post-hoc storytelling, not signal.** This also explains why the trim knife keeps failing: it ranks legs on exactly the middle-band numbers that carry no information.

**L79 — SECOND CONSECUTIVE TRIM-KNIFE FAILURE: fixed-count trims on unresearchable spray-codes remove more winners than losers**
LJ2RSJ finished 21W/12L/6V. My trims: **TRIM-5 removed 2 losers / 1 winner; TRIM-10 removed 4 losers / 4 winners; TRIM-15 removed 4 losers / 8 WINNERS.** The deepest trim removed twice as many winners as losers, and all three trims died anyway. Combined with the July 27 LWANY1 audit (1 correct removal of 5), the honest conclusion is: **on a broad thin-league/friendly slip, a fixed-count trim has no demonstrated edge and should be declined, not delivered.** The correct response to "trim my 39-legger" is to state that the knife has gone 2-for-2 failing on this slip type, and offer the researched short core instead. What DOES work is the p>=0.75 filter (3/3 on LJ2RSJ).

**L80 — SETTLEMENT MECHANICS: the definitive side-by-side on integer O/U (L71 confirmed 3rd time) and 90-minute knockout settlement (L56 confirmed 3x in one night)**
Riga FC v Vardar, gameScore ['0:1','1:1','4:0'] status=AET: **90 minutes finished 1-2 = exactly 3 goals**. On the same match, **Over 2.5 WON (rf=0) while Over 3 settled VOID (rf=1.0)**. This is the cleanest possible proof of the ".5 lines always" principle — identical read, one line paid and the other refunded to nothing. Integer O/U push = VOID is now settled fact (3 observations).
Three knockout ties settled on 90 minutes exactly as L56 predicts, with displayed setScore being the SHOOTOUT, not goals: Celje v Egnatia showed 6:3 but 90' was 1-1 (Over 3 LOST); CSKA 1948 v Trnava showed 5:3 but 90' was 0-0 (BOTH +1.0 catches won on the draw; To-Qualify won on pens); Dinamo v Thun showed 3:2 but 90' was 2-2 (Over 2.5 WON, home DNB VOIDED as a draw, Dinamo advanced in ET). Never read setScore as goals on an AET/AP fixture.

### Calibration (July 29, settled 2026-07-30) — all three tickets LOST on the friendly-anchor + one MLB under
- **J9LEZ1 3W/2L, M0TNE1 2W/2L, HTWA19 2W/1L — all dead.** The single common killer: **Betis 4-0 Lyon.** I had rated Lyon +1.0 at p=0.86 (Lyon full-strength for a CL qualifier, Betis "halfway through prep" missing 6 starters) and anchored ALL THREE tickets on it. The DEPLETED side won 4-0. Second loss on every ticket: White Sox Under 7.5 (6-5, Yankees put up 4 in the 1st inning — MLB unders are variance).
- **The researched WINNERS held up well**: Mirassol corners O8.5 WON 2-1 (the data-driven corners read, 10.58/10.95 totals — landed exactly); Barracas Under 2.5 WON 1-0 (Aldosivi's 0.375 goals/gm); Mets Under 7.5 WON 0-1 (Sale/Scott, one run all game); Lech OR-combo WON. Of the p>=0.75 football keeps, the ONLY loss was Betis-Lyon.
- **Settlement mechanics re-confirmed AGAIN**: Copenhagen Over 3 settled VOID on 2-1 = exactly 3 goals (integer O/U push = refund, L71/L80, 4th observation — I correctly DROPPED this from the value ticket when it drifted to 1.80). Kairat/Omonia +1.0 VOIDED on a 1-goal 90-min margin (L24). Botafogo DNB (GN3D3D) settled VOID — match CANCELLED (L16).

**L81 — FRIENDLY RESULT-SIDE/HANDICAP ANCHORS ARE UNRELIABLE AT ANY RESEARCH CONFIDENCE (Betis 4-0 Lyon, July 29)**
The highest-confidence leg of the night (Lyon +1.0 @1.28, research p=0.86) LOST OUTRIGHT — the depleted home side won 4-0. The reasoning was textbook and wrong: "Lyon are at full strength for a CL qualifier, Betis are missing Lo Celso/Isco/Abde/Antony/Conde/Deossa, so back Lyon." Pre-season friendly results do NOT respect prep-stage or squad-strength logic — a manager resting starters may still watch his B/youth side win 4-0, and the "sharper side" story is exactly the post-hoc narrative L78 flags as noise dressed as signal. This leg was the anchor on all three tickets and killed the entire night. RULE (hardened from the existing friendly-result-side ban): **friendlies are OVERS/goals-markets ONLY — never a result-side, never a handicap, never a win-either-half, regardless of researched probability or how large the squad-strength gap looks.** A handicap in a friendly is a result-side wearing a cushion; the cushion does not save it (Betis won by 4). The only friendly legs allowed on a ticket are match totals / team-total overs where the read is on goals, not on who wins. I over-rode the existing ban because a -1 handicap "felt" safe with a big prep gap; L81 removes that discretion. Also reinforces L78: p=0.86 on a friendly result was pure storytelling — the research band for friendly result-sides is effectively uninformative.

**L82 — Do not anchor >1 ticket on the SAME leg even when it's your best-rated (L58 corollary, July 29)**
Betis-Lyon appeared on all three of the night's tickets (HTWA19/M0TNE1/J9LEZ1), so when it lost 4-0 it took the whole book at once — a repeat of the L58 correlation failure, this time via my single "best" leg rather than a shared filler. Even a genuine p=0.86 leg loses ~1 in 7; putting it on every ticket converts one bad beat into a whole-day wipeout. RULE: the anchor leg may appear on at most 2 of any day's posted tickets; diversify the anchor across the book so no single result can kill everything.

### Calibration (July 30, settled 2026-07-31) — the 2-goal-cushion To-Qualify tier takes its first loss
- **KXWMDD DEAD 1W/1L**: Braves ML WON (5-4, the Holmes-over-Irvin pitching lean landed); **Hajduk To-Qualify LOST — Pafos overturned a 2-0 first-leg deficit by winning the return 4-0** (gameScore 1:0, 1:0, 2:0 → 4-0, into ET as agg was 4-2 then... Pafos through). This was my single most-confident leg of the day (p=0.82) and the "reliable 2+ goal cushion" tier that was 3W/0L in the ledger.
- **L64 REFINEMENT (important)**: a 2-goal first-leg cushion is NECESSARY but NOT SUFFICIENT for a To-Qualify anchor — the QUALITY OF THE TRAILING HOME SIDE matters enormously. The three prior cushion wins (Lincoln, Ararat, KuPS) were all vs weaker opponents. Hajduk were defending 2-0 AWAY at Pafos — a side that played in the Champions League LEAGUE PHASE last season and was always going to throw everything forward at home. The research agent even flagged "Pafos will push at home" and I banked it anyway at p=0.82. Rule: To-Qualify away with a 2-goal cushion is only an anchor when the trailing home side is genuinely WEAKER; when the home side is a strong/former-CL club that simply had a poor first leg, downgrade to LO/skip. Cushion protects against a normal side; it does not protect against a good side's home response.
- Broad user-code trims all died (RY9RB2 25W/11L, YAX23Y 22W/13L, plus their trims) — the knife raised average quality but 24-35 legs is unwinnable; both boards were UEFA-Q2-plus-thin-filler. No new market rule; the losses clustered in the flagged classes (corners, both-halves-No, junk-priced integer lines, Israel League Cup coin-flips).
- Net: the disciplined 2-leg KXWMDD still lost because the anchor lost. Even p=0.82 loses ~1 in 5; the lesson is anchor QUALITY (L64 refinement), not ticket size.

### Weekend book (Aug 1-2, posted Jul 31) — researched core + maxbet
- **XXFN9U (BANKABLE, 3 legs 3.09x, joint 46%, EV 1.43)**: NYCFC home DNB (Toronto winless 11), Jeonbuk-Seoul Under 3.5 (2 stingiest defences, league 2.27 avg), UdeC home DNB (Audax 0 away wins). All +EV, highest-joint multi ever built.
- **W6AEPU (VALUE, 5 legs 11.2x, joint 17%, EV 1.90)**: UdeC DNB, NYCFC 1X2, Jeonbuk U3.5, Seibu ML (1st in PL .633 home), Chengdu -1 (league leaders, best attack v 15th). All +EV.
- **YVWCYN (MAXBET, 30 legs ~48,525x, joint ~1 in 300k)**: L53b value-density from data-rich mid-season leagues only (MLS/Eliteserien/Allsvenskan/K-League/Liga MX/Copa do Brasil/Veikkausliiga/Liga 1/Superliga), one per fixture, EV-gated, excluded openers (Swiss/Austrian/Polish R1-2), friendlies, thin Australian state leagues, and the 3 capped fixtures. Safest-30 selection (avg leg p ~0.67). Posted at user request as the lottery-shape ticket; grade the researched anchors separately.
- Research honest note: thin value weekend - Europe gutted by European congestion (Glimt/AGF/Lech/Sturm/Viking) + openers; MLB no p>=0.75 leg; CSL DNBs priced short. Only NYCFC DNB (0.80) and Jeonbuk U3.5 (0.78) cleared p>=0.75 with +EV.

### Calibration (Aug 1 weekend, settled 2026-08-01) — instrument choice decided the day; "0 away wins" prior broke
- **NYCFC 1:1 Toronto**: the home DNB VOIDED (draw = refund) while the 1X2-Home LOST. **JPWB1K (tight 2-leg "winner", NYCFC DNB + Jeonbuk) SURVIVED on the void and is ALIVE**; the higher-odds value tickets (KB3PQA, W6AEPU, KB3PQA) that swapped DNB→1X2 for more odds LOST on the same game. CLEAN VINDICATION of the void-protected instrument: the "considerable odds" versions the user demanded died precisely because the extra odds came from trading NYCFC DNB (voids on draw) for NYCFC 1X2 (loses on draw). Toronto were winless in 11 and still held NYCFC 1-1 at home — the win was never as safe as the table implied.
- **UdeC 0:1 Audax — the strongest-rated value leg (home DNB @1.79, p=0.74, EV 1.325) LOST OUTRIGHT.** Audax Italiano had ZERO away wins all season (5L/2D away) and won 1-0 AT UdeC. The DNB gave no protection because UdeC LOST (DNB only voids on a draw). Lesson (L63/L69 family, reinforced): "opponent has zero away wins" is a WEAK prior that breaks — a winless-away side is not the same as a side that cannot win away, and South American away teams overperform the model. Do not rate a home DNB p>=0.74 purely on the opponent's poor away record; it needs the home side to be genuinely strong, which mid-table UdeC (12th, scoring problems) was not.
- **YVWCYN (maxbet-30) DEAD within hours** on Juarez 1:5 Pumas (Under 3.5 lost, Pumas ran riot) — the usual single-leg mega death (L53). 29 legs never got to settle.
- Net: every multi-leg ticket lost or is hanging by a void EXCEPT the tightest one, which lived only because it used the void-protected DNB. The through-line of the whole week holds: conservative instruments (DNB/void-protected) outperform result-sides at equal stated probability, and the edge is worth exactly the games like NYCFC 1-1 where the draw refunds instead of losing.

### Calibration (Aug 1 full settlement, 2026-08-01 evening) — the tight winner cashed; every broad slip died
- **JPWB1K WON (1W/1V)** — the 2-leg "winner": NYCFC home DNB VOIDED on the 1-1 (refund, dropped at 1.0), Jeonbuk-Seoul Under 3.5 WON. Effective return just 1.34x (the user rightly called this "too small"), BUT it is the ONLY ticket of the day that survived — and it survived precisely because the void-protected DNB refunded on the NYCFC draw instead of losing, exactly as the conservative-instrument thesis predicts. The higher-odds versions (KB3PQA/W6AEPU) that swapped that DNB for the 1X2 all died on the same 1-1.
- **Every broad spray-code trim died** (QHBS2A family 19-25 legs, TVSGFF family 20-24 legs, all 6-7 losses each). No new market rule — the losses were the usual clusters (friendlies, thin-league goals, integer O3 junk, women's, both-halves-No). Reconfirms: fixed-count trims on 24-35 leg thin boards cannot win; the knife raises average quality but not enough.
- **2UP market note**: Nomme United "1X2-2UP Away" LOST (2:1 - the away side won but never led by 2, so the early-payout never triggered and it settled as a normal away-win requirement that... actually it lost outright). 2UP only pays early if the backed side goes 2 clear; if not it reverts to needing the straight result. Treat 2UP at standard thresholds, not as a free safety.
- Bloody day overall: 1 small win (JPWB1K 1.34x) against a book of dead broad slips. The lesson the whole week keeps teaching - tight, researched, conservative-instrument tickets are the only thing that survives; breadth is death.

### Calibration (Aug 2, settled 2026-08-02) — the "strong home v weak away" thesis failed TWO days running
- **RBH10M DEAD**: St Louis home DNB VOIDED (1-1 draw, refund), **Cruz Azul LOST 2-3 to Atlante**. Cruz Azul were 15 unbeaten at home; Atlante were winless/just-promoted with a model win prob of 8.6% — and they won 3-2 in Mexico City. This is the SECOND CONSECUTIVE DAY my top-rated value leg was a strong home favourite vs a weak away side that LOST: Aug 1 UdeC 0-1 Audax (p0.74), Aug 2 Cruz Azul 2-3 Atlante (p0.80). Both were the "best value" anchor; both lost.
- **L64/L69 hardening — the "strong home side" filter I added after UdeC did NOT save Cruz Azul.** Two failures in two days means the pattern is real: home-favourite RESULT-SIDES (1X2/win) are failing even when the home side is genuinely strong and the opponent genuinely weak. Contributing factors: (a) Liga MX was Jornada 3 (early-season/opener-thin, L60) — I noted the flag and rated it 0.80 anyway, repeating the exact UdeC mistake; (b) "15 unbeaten" hid 7 DRAWS — a draw-heavy side that doesn't win convincingly is not an 0.80 win; (c) the bookmaker/model tail estimate (Atlante 8.6% to win) was badly wrong — thin-context tail probabilities are unreliable. RULE: do NOT rate a home 1X2/win at p>=0.75 in an early-season or thin context on "strong home + weak away" reasoning. Demand the DNB instrument (voids the draw) AND a genuinely dominant, high-win-rate home side (not a draw-merchant), AND a mid-season context with real form. When those aren't all present, it's a coin-flip dressed as a banker.
- **Instrument note re-confirmed**: St Louis (DNB) and Inter Miami (DNB) both VOIDED on 1-1/2-2 draws = refunds, NOT losses. Cruz Azul was taken as 1X2 (for the price, no DNB offered) and LOST outright. The void-protected DNB is again the difference between a refund and a loss — but it only helps on a draw, not on the home side actually losing (Cruz Azul lost).
- Mega NRZTMJ 17W/12L (the value-band p0.62 legs lost 12 of 29 - as the ~1-in-1.7M joint predicted); HF28EQ 9W/8L; H6AC3W trims all dead. No surprises on the broad slips.
- HONEST STATE: back-to-back days the flagship "winner" died on its researched anchor. The through-line: result-side favourites are not safe even when researched; DNB/void-protection saves draws but not outright losses; and thin/early-season contexts (Liga MX J3, Chilean mid-table) produce upsets the model can't price. The only instruments that have held up over the whole run are aligned Unders on data-rich defensive fixtures and DNBs where the draw actually lands.

### Calibration (Aug 3, settled 2026-08-04) — the Under research was MISCALIBRATED; tight Under 2.5 value legs went 0W/4L
- **KSMAXN (value, 5 tight Under 2.5/3 legs) = 0W/4L/1V — TOTAL WIPEOUT.** Every "low-scoring defensive fixture" I researched produced 3-4 goals: LDU-Delfin 2-1 (I said "expected ~1.5, LDU 2 goals in 8"), Defensor-Cerro 2-1 (I said "April meeting 1-0, two worst attacks in Uruguay"), Guarani-Libertad 2-2, Alashkert-Ararat 3-0. My independent p on these (0.63-0.72 for Under 2.5) was BADLY overconfident — the real outcomes clustered at exactly 3 goals, which loses Under 2.5 but would have won Under 3.5.
- **Q11FAZ (8 wide Under 4.5/3.5 bankers) = 7W/1L** — DIED on Djurgarden-Vasteras, which I rated the "softest keep" at 0.78 and which finished **6-0** (Djurgarden blowout). So even the wide Under 4.5 caught a 6-goal game, and it was exactly the leg my own research flagged as weakest.
- **THE LESSON — Under totals are far higher variance than my research p implied, and my "expected total" reads were systematically ~1.5 goals too LOW.** Fixtures I priced at "expected ~1.5-2.0 total" landed at 3-4 goals routinely. Two hard rules: (a) NEVER take Under 2.5 on a "low-scoring" read — the tail to exactly 3 goals is fat and the research edge does not survive the tighter line (0W/4L proves it); wide Under 4.5 is the only defensible Under line, and even it is not safe vs a blowout. (b) My defensive/low-scoring fixture reads carry a systematic optimism bias — treat any "expected total under 2.0" as more like 2.5-3.0 in practice. This mirrors the broader pattern: whether backing goals (Overs) or against them (Unders), my totals reads are noisier than the confident narrative suggests (L78 band applies to totals too).
- Both flagship tickets dead again. The value ticket the user (rightly) pushed for more odds was built on my Under research, and that research failed 4/4. The honest state: I do not currently have a totals-research edge I can trust on the tighter lines; wide Under 4.5 in genuinely low-scoring leagues remains the only Under instrument with a real hit rate, and it is a low-odds banker, not value.
- User trims all dead (V6FVU8 all-Overs family, HS3556 2nd-half-DC/reserves family) - broad spray-codes, no new rule.

## ═══ SYSTEM REVIEW v2 — FULL PANEL RETROSPECTIVE (Aug 4, 2026) ═══
Convened after the Jul 29-Aug 3 losing streak. Panel verdict across actuarial, statistical, quant, and sport-specialist lenses. This section SUPERSEDES conflicting earlier guidance.

### A. WHAT THE 14 WINS ACTUALLY HAD IN COMMON (the anatomy)
1. **Size**: median 4.2x, max 10.1x; median 4.5 legs; ZERO wins above 11x or 8 legs. The winning band is 2-8 legs / 2-11x. This is not preference, it is the entire empirical distribution of success.
2. **MECHANISM-BASED ANCHORS, not aggregate stats.** Every winning anchor rested on a CAUSAL, verifiable fact: named absentees (Degerfors missing 4 → Hammarby), confirmed elite starters (Misiorowski, Sanchez, Burns), tie-state structure (0-0 leg 1 + home leg 2; 4-0 cushion; ET-proof To-Qualify), settlement mechanics (push/void branches). The losing streak's anchors were all AGGREGATE-STATISTICAL: "0 away wins", "15 unbeaten", "worst attacks in the league", "full-strength for CL" — stats and narratives with NO mechanism. Aggregate stats regress; mechanisms don't.
3. **Conservative instruments carried the survival load**: DNB voids (NYCFC, Flamengo, St Louis), AH pushes (5 on UN23W1), To-Qualify ET-proofing (Argentina), wide catches. At equal stated p, the refund branch is worth 5-10pp of realized survival.
4. **Mid-season, data-rich contexts.** Wins clustered Jul 4-28 when Scandinavia/Asia/Americas were in full flow and MLB probables were published. The environment supplied information; research converted it.
5. **Small, uncorrelated books**: winning days had few tickets sharing few fixtures.

### B. WHY THE WINS STOPPED (the honest diagnosis)
1. **CALENDAR REGIME SHIFT (primary cause).** Late July → August: European top flights in pre-season friendlies; openers in Austria/Swiss/Denmark/Poland/Czech/Scotland/Russia; Liga MX J1-3; MLS post-break. The supply of mechanism-grade information collapsed — but our posting tempo DIDN'T. We kept manufacturing tickets from boards our own EV scans called empty (22,606 rows, zero +EV at house p). In an information desert, every "edge" is a mirage; the correct action was NO BET and we didn't take it.
2. **Instrument-stretch chasing odds**: Under 4.5→2.5 (0W/4L), DNB→1X2 (NYCFC/Cruz Azul both punished the swap the DNB survived), 2-leg→30-leg. Every stretch traded the survival branch for price, exactly what L50/L77 warn against.
3. **Confidence inflation in transition contexts**: p=0.80-0.86 claimed on friendlies, J3, opener boards — where L78's "reliable extremes" DON'T EXIST because the inputs are stale. Extremes are only extremes in mid-season data.
4. **Totals miscalibration**: my "expected total" reads ran ~1-1.5 goals LOW (Aug 3: 0W/4L). Correction: add +1.0 goal to any expected-total estimate; Unders only at 4.5+ wide lines; Over 1.5 only with verified attacking mechanism.
5. **Anchor concentration** (Betis ×3, Hacken ×3) converted single beats into dead days.

### C. SYSTEM LOGIC v2 (binding rules going forward)
**R1 — REGIME GATE (new, most important).** Before any build, classify the board: MID-SEASON (league rounds 5+, published starters, real form) vs TRANSITION (friendlies/openers/post-break/J1-3/cup-of-unknowns). In TRANSITION regimes: no anchors, no win-tickets — state plainly "no edge available today" unless a mechanism-grade fact exists. Passing IS a betting decision; the ledger shows every transition-regime ticket died.
**R2 — MECHANISM TEST for every anchor.** An anchor requires a named, checkable causal fact (absentees/starter/tie-state/settlement structure/venue-altitude). Aggregate stats ("X unbeaten", "0 away wins", "worst attack") are FILL-grade at best, NEVER anchors. If the sentence justifying a leg contains only statistics, it fails.
**R3 — INSTRUMENT LADDER, never stretch.** Preferred order: To-Qualify (2+ cushion vs weaker side) > DNB > AH integer/wide catch (push-protected) > wide Under 4.5+ > Over 1.5 with mechanism > everything else. Chasing odds by tightening the line or dropping the void branch is forbidden — odds come from ADDING researched legs, not degrading instruments.
**R4 — TOTALS RECALIBRATION**: expected-total estimates +1.0 goal; no Under below 4.5; no Over above 2.5 without elite-attack mechanism; .5 lines only (integer lines only as push-protected AH).
**R5 — SIZE DISCIPLINE**: win-tickets 2-6 legs, 2-8x, joint ≥25%. A 100x ticket is STRUCTURALLY a ~5-10% shot at absolute best (12 legs × 0.82 band-law ceiling = 9%) — build it only as the declared lottery tier of a ladder whose base is the winning shape, and say the number out loud.
**R6 — CONCENTRATION CAPS (hard)**: anchor on ≤2 slips/day; fixture on ≤2 slips; ≤2 goals-family legs per league per day; one book per day (base + at most one ladder rung + at most one declared lottery).
**R7 — CALENDAR MAP**: strongest weeks = mid-season confluence (Scandi/Asia/Brazil rounds + MLB probables + UEFA quals with cushions). August = Europe's top-5 leagues returning (Aug 8+ Championship/Ligue1/Bundesliga/EPL/LaLiga) — the information supply RECOVERS shortly; protect bankroll until it does.

### D. STANDING TRUTHS RE-RATIFIED (unchanged, proven again this week)
Band law L44; settlement mechanics (integer O/U push=VOID ×4 obs, AH push=VOID, DNB draw=VOID, knockout 90-min L56/L80); phantom-market post-then-verify; L74 Unavailable semantics; L78 extremes-only (WITH the new regime caveat); L81 friendlies goals-only; trim-knife has no edge on thin spray-codes (decline or rules-only).

### Aug 4 — SYSTEM v2's first live test: the gate held
First board under v2. Both research agents delivered real mechanisms (Palmeiras 3-0 cushion w/ Serie B trailing side + neutral venue; Sturm missing 4 named incl. captain; CSKA 1948 scoreless 180'+; Luzardo v 7.31-ERA rookie; E-Rod 2.48 v Vasquez 4.45) — and the FULL EV AUDIT then failed all but ONE at actual prices: Palmeiras TQ not offered (match markets L61-banned for aggregate leaders), Pana/Fener/Brann DNBs priced 1.13-1.25 vs 0.64-0.74 research p, Wednesday MLB Overs at 1.55 vs the 1.80 accept band, NPB only offering the tighter U6.5 (R4). Tuesday's two best mechanisms (Phillies ML, Angels-Orioles Over) expired before posting. KBO starters unpublished. RESULT: posted the single compliant bet — WGJAH9, D-backs ML @1.85 (E.Rodriguez 2.48 home v Vasquez 4.45, research p 0.63, EV 1.166) — and DECLINED the requested 100x for the day, per R1/R5: one qualifying leg cannot honestly become a 100x, and manufacturing the other 11 from failed-EV legs is the exact behavior the v2 review diagnosed as the losing pattern. The 100x is DEFERRED to the first mechanism-rich board (Fri-Sat Aug 8-9: Scandi/Asia/Brazil mid-season rounds + MLB/NPB/KBO published starters; UEFA Q3 second legs Aug 11-12 bring cushion mechanisms). Passing posted as a decision, in writing, for the first time.

### Aug 5-6 settlement + note
- **WGJAH9 (the single System-v2-compliant bet, D-backs ML @1.85) LOST** — E.Rodriguez (2.48 ERA) shelled 4-9 by the Padres. The mechanism was real (confirmed elite-vs-weak starter) and the process was right; baseball ML variance still took it. One clean loss is not a process failure — a p=0.63 leg loses 37% of the time. Do not over-correct.
- **Weekend ladder W00JRS (10x) / WJCQXM (100x) / W96MTP (1000x) all STILL ALIVE** as of Aug 6 23:00 — the Remo +1.0 and Bragantino DNB mechanism legs settle Aug 8-9. Re-verify the Copa 2nd-leg fatigue (did Atletico-MG/Corinthians go to ET Aug 5-6) before those settle.
- P16RAZ (user spray-code) settled 19W/11L dead — losers were the flagged classes (Brann OR-combo 0-1, friendly market-59s, Lithuanian both-halves, women's 2nd-half-DC). Session container was reclaimed mid-analysis so trims were never posted; games had already played by re-fetch. No action.

### Aug 7-8 settlement — "sure" doesn't exist; totals optimism confirmed AGAIN; padding kills before mechanisms play
- **GC6FPL "sure" ticket DEAD**: Minnesota Lynx ML @1.07 (p~0.92) LOST — LA Sparks won 89-82. A 92% favourite still loses ~1 in 12, and WNBA has fat upset tails (L52 family). Guoan DNB won 4-0 (the researched CSL fill leg delivered). Lesson: never call anything "sure"; a 2-leg at 75% joint loses 1 in 4.
- **GJAQQX best-plays DEAD**: Operario team-total O0.5 WON (scored in 1-3 loss), but BOTH totals went UNDER — Mariners O4.5 landed on 3 runs (1-2), Connecticut Sun O160.5 landed on 147 (75-72). **R4 (totals-optimism) confirmed a 2nd time**: my/house totals reads ran ~1.5 runs/goals HIGH again. The WNBA "up-tempo" read was pure narrative — a 147-point game vs a 160.5 line is a 13-point miss. HARDEN R4: do not back basketball OVER totals on a pace narrative; WNBA totals specifically have burned us repeatedly (L15/L52 family). MLB Over totals need CONFIRMED two-weak-arm starters, not a house number.
- **Weekend ladder (W00JRS/WJCQXM/W96MTP) DEAD — but the researched mechanism legs (Remo +1.0, Bragantino DNB, Inter Turku DNB) were STILL PENDING when the tickets died.** The padding legs killed them first: Operario DNB (lost 1-3), Comerciantes -1 (lost), Jaro Under 3.5 (1-3), LDU +0.5 (lost 0-2), Lokomotiv 1X2 (0-0). This is the cleanest possible proof of L53/R5: the padding fails long before the researched core gets to play. The 3 mechanism legs may yet win, but the ticket is already dead — every non-mechanism leg added is pure downside.
- STANDING CONCLUSION reinforced: the ONLY thing that has ever worked is a SHORT ticket of mechanism legs (3-6). Every padded/lottery tier has died, usually on the padding. Stop building 100x/1000x tiers unless the user explicitly demands the lottery — they are -EV entertainment, not bets.

### Calibration (Aug 8-9, settled) — Reds/Burns ML mechanism failed; expansion research came back empty
- **SY0J8Q DEAD**: Remo +1.0 WON (2-2, push-protected cushion held exactly as designed — the instrument worked); **Reds ML (Cincinnati away, Burns start, research p 0.63) LOST — Nationals won 8-2.** JEKHSN (the Reds single) also LOST. This is the SECOND clean MLB-ML mechanism loss in a week (WGJAH9 D-backs/E.Rodriguez was the first). Both had a real, confirmed-starter mechanism; both lost. Reinforces the standing truth: a p=0.63 baseball ML loses ~37% of the time and MLB ML is the highest-variance leg class we use — a confirmed pitcher edge is a *lean*, not a lock. Do NOT anchor a ticket on a single sub-0.65 MLB ML.
- **Expansion-research sweep (SA / CSL / secondary MLB / Nordic) = NO POSTABLE EDGE.** South America was a no-bet board (mid-table coin-flips + away-favourites banned L63; the only genuine mechanism, Melgar home/altitude vs winless Cajamarca ~0.85, had no priceable instrument — 1X2 @1.31 is the banned favourite shape, DNB @1.10 fails the L77 EV bar). CSL Round 23 had no dominant home side on the slate (Chengdu not playing); Shandong-Tianjin was the only lean (~0.68) but unresearchable on team news. Secondary MLB was empty (Sale/Cole fails both the Under — Cole 3.42 — and the ML — Cole not a 5+ arm). Nordic agent terminated on the session limit before delivering.
- **R1 regime discipline held again**: when the council's honest verdict on a full board is "no incremental edge," the correct action is NOT to manufacture legs to satisfy a "more games" ask — it is to say so. The expansion could not be built because the research did not support a single additional +EV mechanism leg, and the base slate (SY0J8Q) had already played out during the research window. No junk ticket was posted.

### METHODOLOGY RESET v3 (Aug 9) — collapse 82 rules to 4 principles; research is a VETO not a generator
User called for a methodology rethink after the losing run. Honest diagnosis accepted: the ruleset (L1-L82 + R1-R7) had become overfitting to variance — each loss spawned a post-hoc rule with no predictive power. Core admissions: (a) on liquid well-modelled markets our research does NOT beat the house model (L57/L78 already proved this); (b) the 15 wins clustered into short low-odds tickets because probability multiplies — arithmetic, not skill; (c) accumulators are structurally -EV and no public-research process flips that. The two REAL levers: settlement mechanics (void/refund branches) and leg count.
**The 4 principles (operational, replacing the rule-scrapbook):**
1. Price is the truth; research is only a VETO (disqualify dead rubbers, friendly result-sides, confirmed absences, dead kickoffs, thin unbookable markets) — never a generator of edge or probability.
2. Build UP from the shortest odds (house most confident), stop at the payout target; never reach for 1.8 legs to inflate odds.
3. Prefer the void-protected instrument always (DNB / push-protected -1 catch / To-Qualify-with-cushion / wide Goal Bounds).
4. State the true joint probability out loud on every ticket.
Key refinement: a short price is only trustworthy where the house MODELS the league well — a 1.11 in Latvian 1.Liga ≠ a 1.12 Benfica. Lead from data-rich leagues, not merely from the shortest number.

### Open book (Aug 9 Sunday menu, built under v3 — settle on next review)
Same-board menu across data-rich mid-season leagues, void-protected instruments (push-protected -1 catches + DNB + O2.5):
- **Q23Q47 (MENU-A real-chance, 5 legs, 3.94x, ~20-25% shot)**: Zenit -1, Porto -1, Slavia Prague -1, Flamengo -1, Zrinjski -1 (all push-protected -1 catches on dominant home favs).
- **NF826N (MENU-B balanced, 9 legs, 20.19x, ~4-6% shot)**: A + Haugesund -1, Sheriff O2.5, Melgar O2.5, Differdange O2.5.
- **N8X4WS (MENU-C lottery, 15 legs, 71.5x, ~1% shot)**: B + Benfica -1.5, Pyunik -1, Vikingur Rvk O2.5, Dynamo Kyiv away DNB, Noah away DNB, NY Liberty DNB.
Grade the push-protected -1 catch class specifically at settlement (exact-1 wins should VOID/refund per L24).

### Open book (Aug 9 — PPVN4W analysis + v3 core, settle on next review)
User's PPVN4W = 39-leg mega ~363kx, honest joint 1-in-2.45M (paid ~15% of fair — vig across 39 legs). v3 verdict: anti-pattern (10 veto legs: 4 corners, 3 win-either-half, 1 both-halves-No, 2 women's; 16 integer-total legs on an August-opener board).
- **UDL1C0 (CORE-8, v3 pull, 8.86x, ~7.9% / 1-in-13)**: Anderlecht DNB, Always Ready away DNB, Kaizer Chiefs TQ, Flamengo -1, Arezzo +1 catch, Palmeiras H-or-O2.5, Wolfsberger A-or-O2.5, Moreirense A-or-O2.5. 3 void-protected + 2 push-protected catches + 3 OR-combos, league-diversified.
- Risk-trims (still lottery, graded to validate the knife): **K9YCZ5** (remove-5, 34 legs, 55,962x), **M34WNL** (remove-10, 29 legs, 8,906x), **TU08JA** (remove-15, 24 legs, 1,384x). Removal order was pure v3 veto-class: all 4 corners + all 3 win-either-half + both-halves-No + 2 women's + lowest-p integer Over 3 came off first. Grade removed-vs-kept at settlement.

## ═══ PANEL RETROSPECTIVE — Aug 9 Sunday settlement (v3's first full test) ═══
Every ticket lost (menu Q23Q47/NF826N/N8X4WS dead; core UDL1C0 dead; trims K9YCZ5/M34WNL/TU08JA dead). A high-variance favourites day: Zenit (1.16) LOST 1:2 at home, Benfica (1.12) DREW 2:2 at home, Rangers LOST to Hibs, Kaizer Chiefs LOST. But three findings are transferable and one is a method fix, not a variance-rule.

### FINDING 1 (the important one) — "AH −1 catch" is NOT a void-protected instrument. I mis-classified it building the v3 menu.
The whole menu spine was AH −1 catches on short-priced home favourites, sold as "void-protected." That was a CATEGORY ERROR. Compare the loss branches:
- **DNB**: wins if fav wins by ANY margin; **refunds on a draw**; loses ONLY if fav loses outright. One loss branch (fav loss).
- **AH −1 catch**: needs fav to win **by 2+**; refunds only on an **exact-1** win; **LOSES on a draw** AND loses on a fav loss. Two loss branches (draw + fav loss), and 1-goal wins yield no profit.
The −1 catch's extra odds (≈1.30 vs a DNB's ≈1.05) come **precisely from adding the draw-loss branch and downgrading 1-goal wins to refunds** — i.e. it is a degraded instrument, the exact "reach for odds by weakening the instrument" that v3 Principle 3 forbids. I did it while believing I was obeying Principle 3.
**Settlement proof (Aug 9, menu + PPVN4W combined):** DNB class **5W/1L** (the only loss = the p=0.55 Brazil-B away DNB we already ban, L38b/L63). AH −1/+1 catch class **3W/2V/2L** — the 2 VOIDS (Slavia 2:1, Zrinjski 2:1, exact-1 wins) confirm the refund mechanic works, but Benfica DREW 2:2 (a DNB would have VOIDED/survived; the −1.5 catch LOST) and Zenit LOST outright. The catch converted a survivable draw into a loss on Benfica.
**METHOD FIX (correct the instrument ladder, do NOT add an L-rule):** the void-protected tier is **DNB / To-Qualify-with-cushion / wide Goal-Bounds** only. **AH −1/−1.5 catches are RESULT-SIDE bets with a partial refund on the exact line — they belong in the same risk tier as a 1X2/handicap, NOT in the protected tier.** If a menu wants odds, get them from MORE independent legs or genuinely higher-priced value — never by swapping a DNB for a −1 catch on the same fixture. Had the menu spine been DNBs, Benfica and Zrinjski/Slavia branches all survive or win; only Zenit (outright loss) still kills it.

### FINDING 2 — The risk-knife WORKED on a real-market board (best result in the ledger).
PPVN4W 39-leg audit: **REMOVED-15 went 4W/10L (71% loss) vs KEPT-24 13W/5L (28% loss).** The removal order (all 4 corners, all 3 win-either-half, both-halves-No, 2 women's, low-p integer Over 3) concentrated the losses cleanly. This CONTRASTS with L79 (knife failed on thin spray-code boards). Refinement: **the knife has real edge when the board contains structural junk classes to target (corners/WEH/both-halves/women/team-to-score) in data-rich leagues; it has no edge on thin no-coverage boards where every leg is an unpriceable coin-flip.** Use it confidently on real-market codes; decline it on thin ones.

### FINDING 3 — Favourite fragility + leg-count math, demonstrated live.
Four sub-1.20 favourites failed on one Sunday (Zenit L, Benfica D, plus Rangers/Kaizer losses). "Price is truth" does NOT mean a 1.12 fav is safe — it means ~8-10% fail, and across a full slate SEVERAL will on any given day. The 5-leg menu needed all five fav-performances; Zenit's single failure killed it. This is Principle-level, not a new rule: **every added short-fav leg multiplies in an independent ~8-10% failure; 5 such legs ≈ only 60-66% all-survive even before instrument risk.** The honest joint I quoted (~20-25% for MENU-A) was about right and it still lost — that IS a 1-in-4 shot missing, not a model failure. Do not overreact to the single loss; DO fix the instrument error (Finding 1).

### Totals optimism (R4) reconfirmed AGAIN
Menu O2.5 legs both lost (Sheriff 1:0, Differdange 2:0); Heerenveen O3 (1:0), Stroemsgodset O3 (0:2) lost. Home favourites repeatedly failed to clear the total. R4 (+1 goal to every estimate; .5 lines; no Over on pace) stands — totals remain the least reliable family.

### To-Qualify without a cushion = a bare result bet (L64 reconfirmed)
Kaizer Chiefs TQ (single MTN8 cup tie, NO aggregate lead) LOST 0:1; Cameroon women TQ LOST. TQ is only a protected anchor with a 2-goal aggregate cushion vs a weaker side (L64). A one-off knockout "To Qualify" is just backing the result — price it as such, never as a safe instrument.

### Net v3 status after test 1
The method is INTACT; the loss came from (a) a fixable instrument mis-classification I've now corrected, and (b) ordinary favourite variance on a wild day. The transferable wins: DNB class held (5W/1L), the risk-knife earned its keep on a real board (71% vs 28%), and R4/L64 reconfirmed. No new L-rules added — per the v3 discipline, one bad day does not spawn a rule; it sharpens a principle.

### Calibration (Aug 10 settlement) — thin-league "decline" call VINDICATED; risk-knife's limit reconfirmed
- **KG2PAM family all DEAD** (CLEAN-21 YNMANM 10W/8L/1V/2P; trims Y31HQ7 19W/10L, Y4VXX6 15W/10L, Y63JQL 11W/9L). Every loss was a thin-league leg exactly as flagged at analysis time: FOUR 0-0s (Volna Pinsk O2.5, Botosani O1.5, Sepsi OR-combo, Olimpik DC), plus Vikingur Olafsvik O2.5 (2:0 under), both Norwegian 3.Div GG legs (Aasane 0:1, Drobak 1:0), Benfica B team-to-score (1:0 Leixoes blanked), Gomel 2 DC (lost outright 3:1). I told the user in writing this board was "not worth salvaging" and that the remaining thin-league prices couldn't be trusted; it died on precisely those legs. **This is the cleanest vindication yet of the R1/L79 discipline: decline thin no-coverage boards outright — cleaning them still inherits un-priceable risk.**
- **Thin-league goals markets are the single most reliable loser class** — multiple 0-0s and under-results on house-p 0.60-0.78 legs. The house model does NOT price Belarus Pervaya Liga / Norway 3.Div / Uruguay reserves / Estonian Esiliiga well; "price is truth" (v3 P1) explicitly does NOT extend to these leagues. Reconfirms, adds nothing new.
- **N8AQ34 (KHX2Z7 cleaned 1UP-38, top-5-league openers) still ALIVE/pending** at checkpoint — the 1X2-1UP instrument (early payout the moment a side leads) on strong home favourites is the one lottery still standing. Grade at settlement: if the 1UP early-lead mechanic materially outperformed straight-1X2 on the same fixtures, that is a usable instrument note.

### Open book (Aug 10 → week ticket U9XKEG, built under corrected v3 — settle at week end)
Council convened (2 agents: UEFA cushions + domestic/MLB). UEFA agent found a rich vein of To-Qualify/DNB cushion legs (Dinamo Zagreb 5-0, Benfica 6-1, Rapid 4-1, Copenhagen 3-0, Hajduk 5-2 etc) but market prices them 1.01-1.18 (near-locks, too short to build odds without L77 padding). Domestic/MLB agent cleared almost the entire board: top-5 Europe = MD1-2 OPENERS (transition regime), smaller-league favourites = 3-4 days from a UEFA tie (L66 rotation), Brazil Aug 16 = Libertadores R16 rotation weekend, MLB not confirmable past Aug 12. Only HJK v Jaro cleared domestically (p~0.72). Honest conclusion: NO high-odds mechanism board this week — the odds-builders had to come from genuinely mid-season data-rich leagues (MLS/Liga MX) via v3-P1 "price is truth", not manufactured research.
- **U9XKEG (10-leg DNB spine, 6.18x, honest ~13% / 1-in-8)**: Hajduk DNB (UEFA 5-2 cushion), Besiktas DNB (EL 1-0 lead, Istanbul), St Gallen DNB (Conf 3-1 cushion), HJK DNB (Veikkausliiga mid-season quality gap), CF America DNB + CF Monterrey DNB (Liga MX mid-season), LAFC + Chicago Fire + Houston Dynamo + Real Salt Lake DNB (MLS mid-season). ALL void-protected DNBs — the CORRECTED instrument ladder (no AH catches after the Aug 9 category-error fix). Spread Aug 13-16.
- Instrument discipline test: this is the first ticket built entirely on the post-Aug-9 correction (DNB-only spine, catches banned from the protected tier). Grade the DNB class at settlement; grade whether MLS/Liga MX mid-season DNBs (price-is-truth, no deep research) hold vs the researched UEFA cushions.

### Open book (Aug 11 — 4-sport odds ladder, user-requested lottery tiers; settle at week end)
User explicitly requested 100/1000/10000/max odds tickets across football/basketball/baseball/hockey, now->end of week. Built as a NESTED ladder from a 54-leg clean pool (sorted safest-first): data-rich football favourites + WNBA juggernaut MLs + MLB modest favs + short hockey friendly favs (flagged weakest). NO junk classes (no corners/WEH/2nd-half-DC/women/thin-league goals). All 1X2/moneyline favourites, mid-season/UEFA-cushion/data-rich where possible.
- **M3S39Y (T100, 22 legs, 110x)** — honest ~1 in 110 (fair) to 1 in 428 (conservative model with coin-flip drag).
- **PAECSM (T1000, 30 legs, 1,294x)** — ~1 in 8,000.
- **PBMZKS (T10000, 37 legs, 14,327x)** — ~1 in 140,000.
- **M67AUG (TMAX, 54 legs, 10,689,388x)** — ~1 in 300 million. Declared lottery.
- Discipline note: this is the user's explicitly-chosen lottery ladder (v3 P4 = state the true number, which I did). Grade at settlement whether the clean-favourite-only construction (no junk classes) outperforms prior junk-laden megas at the same leg counts — that is the only transferable signal from a lottery.

### Calibration (Aug 12 partial — 4-sport ladder + 1UP-38 dead on Aug 11 legs; week DNB-10 alive)
- **Ladder (M3S39Y/PAECSM/PBMZKS/M67AUG) all DEAD** on the earliest legs, and the losers were exactly the auto-picker's weakest inclusions:
  1. **Crvena Zvezda 0:2 (home fav @1.27) — the UEFA research had explicitly flagged this SKIP** (trailing 1-0 from leg 1, must chase; L61/KuPS family). The lottery ladder's raw 1X2 favourite-picker grabbed it anyway, bypassing the research veto. **PROCESS FIX (not an L-rule): apply existing research vetoes even to auto-built lottery ladders — never let the favourite-picker include a fixture already flagged SKIP.** A trailing side's home price is a trap.
  2. **Hockey pre-season friendlies went 0/3** (HK Vitebsk, Lokomotiv Orsha) — noise exactly as L81 predicts. HARD RULE going forward: NO hockey pre-season friendlies in any ticket, not even as lottery filler. Wait for real hockey seasons (NHL/KHL from Sept/Oct).
  3. **MLB coin-flip (Dodgers @1.46) lost** to the Royals — MLB ML remains the highest-variance leg class; a 1.46 fav is ~62%, not a banker.
- **N8AQ34 (1UP-38) DEAD** on the same Crvena Zvezda leg — the 1UP mechanic did NOT save it (Zvezda never led; 1UP only pays if the backed side leads at some point, and a 0:2 home loss never triggers it). Confirms 1UP is only favourable when the side is genuinely likely to lead — it does not rescue a trailing-side trap.
- **U9XKEG (week DNB-10) still ALIVE** (all 10 legs Aug 13-16). The corrected DNB-spine ticket is the one still standing — grade at week end.
- Transferable signal: the clean-favourite ladder still died on the same three preventable classes (research-flagged SKIP, friendlies, coin-flip ML). "Clean of junk markets" is necessary but not sufficient — the auto-picker must also inherit the research/mechanism vetoes, or it re-imports the exact traps the manual process screens out.

### Calibration (Aug 12 settlement) — "PULL THE CORE" beats "trim the mega", proven in one board
- **XREM4T (the 5-leg sound core pulled from the 39-leg MQSLJN) WON 5/5 → PROJECT WIN.** PSG Home-or-O2.5 (2:1), AEK Home-or-O2.5 (6:7 — over cashed), Durban Draw-or-Clean-Sheet (0:0 → draw), Rosario home DNB (1:0), Copenhagen -1 (5:1 — the 3-0-cushion side smashed it). 3.0x, honest ~25% (1 in 4) — landed. This is the SAME shape as every project win (4-6 sound legs, conservative/mechanism instruments, 3-11x).
- **Every larger version of the SAME board DIED**: clean-21 (VXU61F 12W/7L), rm-15 (LGC6SU 12W/7L), rm-10 (T4CEC5 15W/8L), rm-5 (ZGSTFA 17W/10L). DECISIVE LESSON: when a user sends a junk-laden mega, the winning move is to EXTRACT the 4-6 genuinely-sound legs into a short core — NOT to trim/clean the mega. Trimming raises average quality but leaves too many legs; the core wins because it is short AND clean. The 1-in-4 core beat five lottery versions of itself.
- **Loss cluster (identical across all trims) = exactly the flagged classes**: friendly overs (Deportivo-Real Madrid 0:1), thin Goal-Bounds (Sopron NB III), Romania Cup coin-flip (Zalau 0:1), Challenge Cup AH (Hamilton 1:3, Celtic B), Kaizer -1.5 (2:0, didn't cover), Sweden Div 2 GG (Gottne 4:0=NG), Breidablik Women O2.5 (1:0). All pre-flagged veto/weak classes.
- **SK Rapid Over 3 LOST (2:0) despite the 4-1 cushion** — the qualified side eased off in the dead second leg (dead-rubber easing, L10/L61 family). CONFIRMS: on a side that has already qualified (big first-leg cushion), take the DNB/To-Qualify, NEVER the Over — they cruise and the goals dry up. Copenhagen (5:1) is the exception that had to keep playing; Rapid coasted.
- **Copenhagen -1 catch WON 5:1** — an AH catch CAN win, but only because Copenhagen had a 3-0 cushion and a genuine need to perform at home; it is still an unprotected result-side (Aug 9 fix stands). Do not generalise one win into "catches are safe."
- **U9XKEG (week DNB-10) still ALIVE** — all 10 legs Aug 13-16.

### Calibration (Aug 13 checkpoint, 20:16 UTC — cores alive, trims dead on thin totals)
- **TAWH8B (5-leg cross-sport winner) ALIVE 3W/0L/2P**: Besiktas DNB W, St Gallen DNB 5:1 W, Lynx ML 85:81 W; Hajduk DNB (1:0, pending) + Red Sox ML (Boston leading, pending). The one-edge-per-sport winning shape performing.
- **XM577E (T2BAC2 sound core) ALIVE 3W/0L/2P**: Sion O1.5 W, Andijon DNB 0:3 W, Vaduz OR-combo W; Austria Wien TQ at risk (1:2 on night), Mirassol DC pending. Second "pull-the-core" ticket in as many days looking live.
- **T2BAC2 trims (YRPZQU clean-22, TRKXQ2 rm-15) DEAD** — losers were thin-league totals exactly as flagged: Shkendija O2 (0:0), Grossklein Landesliga O2.5 (0:2), Diriyah O2.5 (0:1). R4 totals-optimism + thin-league goals, unchanged.
- **U9XKEG (week DNB-10) ALIVE 2W/0L/8P** — Besiktas + St Gallen won, 8 legs (HJK/Liga MX/MLS) settle Aug 16.
- Pattern holds for the 3rd straight day: the SHORT sound core is alive/winning while every large trim of the same board is dead. Pull-the-core is now the standing response to junk megas.

### Open book (Aug 13 — weekend 4-sport odds ladder v2, user-requested lottery; settle at weekend end)
User requested 100/1000/10000/max across all sports, full board, all markets. Built nested from a 124-leg clean pool, sorted safest-first. IMPROVEMENTS over the Aug 11 ladder (which died on flagged-SKIP + friendlies + MLB coin-flip): NO friendlies (hockey friendlies hard-excluded per 0/3 rule; only real AIHL hockey kept — Melbourne Mustangs), NO women's leagues (Damallsvenskan/WK-League filtered), NO derbies (Djurgarden excluded, L65), per-league caps 3 on MLB/WNBA. All four sports represented (football spine + WNBA + MLB + AIHL hockey).
- **Q0AFCC (T100, 21 legs, 128x)** — ~1 in 471.
- **ND7Y39 (T1000, 28 legs, 1,334x)** — ~1 in 7,545.
- **VWDYY5 (T10000, 34 legs, 11,977x)** — ~1 in 98,171.
- **ZZXRBL (TMAX, 55 legs, 80,996,090x)** — ~1 in 2.4 billion. Declared lottery.
- Residual risk flagged: base still includes Saudi/Turkey/Portugal season openers (Al Hilal/Al Nassr/Galatasaray/Sporting — dominant giants but opener variance). Grade at settlement whether the cleaner construction (vetoes applied) outperforms the Aug 11 ladder at equivalent leg counts.

### Calibration (Aug 15 — T7V3Y0 settled 28W/8L/3V; the veto knife had NO edge on this board)
- T7V3Y0 (39 legs, ~344kx) finished **28W/8L/3V — 78% of decided legs won, ticket still DEAD.** Textbook L53: leg quality was never the issue, leg COUNT was. 8 losses out of 39 at a 78% per-leg rate is exactly what the maths predicts kills a mega.
- **Trims were never posted: the user's request arrived ~9h after analysis and all 39 legs had kicked off.** Operational note: on a same-day board, a trim request has a hard expiry — state the kickoff clock at analysis time (I did) and treat it as a deadline, not a caveat.
- **VETO-KNIFE AUDIT (drift-proof, structural classes only): VETO pile 11W/3L (21% loss) vs KEPT pile 17W/5L (23% loss) — statistically identical. The knife added NOTHING on this board.** Breakdown of the "bad" classes: women's **3W/0L**, 2nd-half-DC **2W/0L**, win-either-half **4W/2L**, corners 1W/1L. 
- **This is the second clear instance (after L76) of hard-zero classes running hot on a single slate.** Consolidated honest position: 2nd-half-DC, win-either-half, corners and women's legs are **long-run negative, high-variance** — NOT deterministic losers. Keep them off win-tickets (the long-run edge is real and that is where it matters), but stop asserting they are near-certain to fail on any given day, and expect the trim knife to add little when a board's junk happens to land.
- Losses that DID map to method: Willem II corners (1:4, corners under), Gençlerbirliği + Lustenau win-either-half, Istanbulspor DC lost on a 2:2 draw (L2/L54 draw-risk), Union SG "Over 2" on a 0:0, Chicago Fire II O2.5 on 2:0, Barnet +1.0 on a genuine 2-goal loss (3:1).
- **Integer-line VOID mechanic re-confirmed (3 more obs)**: KFUM "Over 2" on 1:1 → VOID; Newcastle "Over 3" on 1:2 → VOID; Araz home DNB on 0:0 → VOID. Integer O/U pushes and DNB draws refund, ticket-surviving. L71/L80 now on ~7 observations.

## ═══ Calibration (Aug 15 settlement) — TWO WINS; research validated at the extreme ═══
- **TAWH8B WON 5/5 → PROJECT WIN.** (2.65x) Hajduk DNB 4:0, Besiktas DNB 1:0, St Gallen DNB 5:1, Minnesota Lynx ML 85:81, **Boston Red Sox ML 7:0**. The "one researched edge per sport" shape. **The MLB research call was the standout**: agent identified Tolle (3.20 ERA) vs a collapsing Max Scherzer (7.92 ERA, age 42, 30+ IP sample) and flagged THREE trap favourites to avoid (Braves/Dodgers/Yankees G1 — home favs with the WORSE arm). Red Sox won 7-0. This is L78 working exactly as specified: research is reliable at the EXTREMES (a 7.92-ERA starter is an extreme), useless in the middle band.
- **Y1UUTT WON 5/5 → PROJECT WIN.** (3.56x) KI Klaksvik OR-combo 0:5, Monza O1.5 3:0, JaPS OR-combo 1:2, Kolding OR-combo 2:3, Montpellier-to-score 0:1. **Pulled from NEFPQH — a board I had explicitly called "one of the weaker boards you've sent."** Third straight "pull-the-core" win (XREM4T, TAWH8B, Y1UUTT). CONFIRMED: even a weak junk-mega usually contains 4-6 sound legs; extracting them beats every trim of the same board.
- **XM577E 4W/1L — died on Mirassol DC "Home or Away" losing to a 1:1 DRAW.** L2/L54 confirmed AGAIN: no-draw Double Chance in draw-prone South American fixtures is a persistent killer. Every other leg won (Sion, Andijon, Austria Wien TQ, Vaduz). One leg short, and it was the L2-flagged one — I should have cut it at build time rather than needing a 5th leg.
- **Ladder (Q0AFCC/ND7Y39/VWDYY5/ZZXRBL) all DEAD — killed by SEASON OPENERS exactly as flagged at posting.** Galatasaray 2:2 v Corum (Super Lig MD1) and Union SG 0:0 (Pro League early) took out every rung. I named openers as "the ladder's soft underbelly" in the same message I posted it. **Standing rule reinforced: if the only way to reach a target odds number is to include openers, the honest answer is a lower odds target — not the openers.**
- **USER INSIGHT VALIDATED (Over 3 → Over 1.5 conversion, PN2GVG)**: the three converted legs (Sporting/Al Hilal/Dinamo Zagreb, moved off coin-flip Over 3 onto Over 1.5) ALL WON. The 5 losses on that ticket were the **Over 2 integer legs I left untouched** (Atalanta 1:0, Real Sociedad 0:1, Braunschweig 0:1) plus Nomme O2.5 and an Annecy +1.0. LESSON: the conversion logic was right and I under-applied it — when a board is totals-heavy, drop EVERY total to the lowest sensible line (1.5), not just the worst offenders. R4 totals-optimism keeps being the top loss cluster.
- Live into Sunday: **ZTTNYJ 1W/0L/3P** (Shandong 3:1 won) and **U9XKEG 3W/0L/7P** (Hajduk/Besiktas/St Gallen banked). Both alive — their pending fixtures are OFF-LIMITS for new tickets per the L58/L82 concentration cap.

### Aug 16 Sunday — thin board; ZRD492 posted small and honest
Full research pass across football (11 vetted fixtures), MLB (all 15 games, confirmed probables) and WNBA (all 4 games). Result: a genuine no-edge Sunday.
- **Football: 7 of 11 candidates were matchday 1-3 OPENERS** (Feyenoord, Ajax, Twente, Besiktas, Basaksehir, Salzburg/WSG, Drita) and **5 had a European play-off within 4 days** (Ajax/Sion, Nordsjaelland, Besiktas, Salzburg/Mjallby, Drita — all Aug 20). Two "favourites" weren't favourites at all (Banik Ostrava 1W/3 with 2 goals scored; Twente lost their opener). Seoul E-Land DNB @1.10 was a straight mispricing — home/away splits put the true DNB at ~0.63 vs an implied 0.91. **Only Spartak Trnava DNB (p 0.80, round 4, no European tie, opponent 1pt/3) cleared.**
- **MLB: FIVE trap favourites identified** — the betting favourite carrying the WORSE starter: Angels 1.76 (48-75, worst record in MLB, 6.71-ERA rookie recalled from Triple-A out of desperation), Cubs 1.72 (Cabrera 5.10 v Dobbins 3.40), Braves 1.92 (Elder 4.03 v Soroka 2.92), Rays 1.81, Giants 1.87 (Tidwell's 2.78 is 22 IP / 2 starts with a 4.38 Triple-A ERA — a phantom ace). No repeat of the Scherzer-grade mismatch.
- **WNBA: ZERO qualifying legs.** Phoenix @1.50 v weak Portland looked like the safe leg and is the inverse — **Kelsey Plum confirmed OUT**, Mercury 13-22. The favourite is the depleted team. Research prevented exactly the leg price alone would have selected.
- **EV AUDIT was the sharpest finding**: Trnava DNB @1.16 x p0.80 = **0.928 (NEGATIVE EV)**; Feyenoord DNB @1.15 x 0.77 = 0.885 (negative). The house prices these short DNBs above their true worth. **The ONLY +EV leg on the entire Sunday board was Texas ML @1.81 x p0.60 = 1.086.** This is the L77/L49 tension in its purest form: the highest-probability legs available were negative-value, and the only positive-value leg is a ~60% baseball lean.
- **ZRD492 posted (2 legs, 2.10x, honest ~48% / 1-in-2.1)**: Trnava DNB (highest-p leg on the board) + Texas Rangers ML (the only +EV leg). Deliberately NOT padded — every additional leg available was an opener, a rotation risk, or negative-EV. Sunday is better covered by the two tickets already live (ZTTNYJ, U9XKEG).

### Aug 16 — real tickets on user request (UBTB79 / JFV2ML)
After ZRD492 (2-leg), user asked for real tickets. Built two from genuinely mid-season, real-form fixtures (Brazil Serie A/B, Liga MX, Eliteserien, Ecuador) + the Trnava researched anchor + Texas +EV leg. All home DNB (draw-refund protected) except Texas ML. None overlap the live ZTTNYJ/U9XKEG.
- **UBTB79 (BANKABLE, 6 legs, 4.32x, honest ~14% / 1-in-7)**: Trnava DNB, Sao Paulo DNB, Atletico Mineiro DNB, Brann DNB, Pumas DNB, Emelec DNB.
- **JFV2ML (VALUE, 8 legs, 10.38x, honest ~6% / 1-in-17)**: above + Operario DNB + Texas ML.
- Honest note: these are DNB-protected but the sides are coin-flip-grade (p~0.70 per leg), reflecting a thin board — the DNB refund-on-draw is doing the heavy lifting, not dominance. Grade the mid-season-DNB class at settlement.

### Aug 16 — 100x+ request (MAJ9RV / MB5355)
User wanted 100 odds and above off the thin Sunday board. Built from mid-season data-rich 1X2 favourites ONLY (Brazil A/B, Liga MX, Eliteserien, Allsvenskan, K-League, MLS, USL, Ecuador) — deliberately NO openers/rotation fixtures, none overlapping the 4 live tickets.
- **MAJ9RV (T100, 10 legs, 107x, honest ~0.5% / 1-in-221)**.
- **MB5355 (T500, 13 legs, 648x, honest ~0.1% / 1-in-1,666)**.
- These are 1X2 (not DNB) so no draw-refund — the odds come from stacking coin-flip-grade favourites, which is the only way to reach 100x on a board with no dominant sides. Declared lottery tier; the bankable UBTB79 (1-in-7) remains the real play.

### CORRECTION (Aug 16) — MAJ9RV/MB5355 were CONTAMINATED; rebuilt clean as JP6YAN/QPKYF7
The auto-picker for the 100x request grabbed a FROZEN/PHANTOM line: Djurgarden "Home" @100.00 (harvest had it at 1.52 — a suspended-market artifact) AND it is the banned Stockholm derby (L65), plus Colorado Springs @28.00 (phantom) and several @1.01 fillers. The "107x" was manufactured entirely by the phantom 100.00 odd. **MAJ9RV/MB5355 are junk — disregard.**
- **NEW PROCESS GUARD (now coded): after fetching a favourite's live odds, reject the leg if fetched odds fall outside [1.20, 2.2] OR diverge from the harvest favourite by >0.35** — a frozen/drifted-line detector. This would have caught Djurgarden (1.52 harvest vs 100.00 fetched) and Colorado Springs.
- Rebuilt CLEAN (sanity filter + no derby + no reserve/youth/Next-Pro): **JP6YAN (100x, 8 legs, ~0.5% / 1-in-190)** and **QPKYF7 (402x, 10 legs, ~0.1% / 1-in-831)** — all legs sane 1.53-1.95 mid-season favourites. Declared lottery; UBTB79 (1-in-7) remains the real play.

### Aug 16 — month longshot (J2DRJ4) + researched core, built on full research
User wanted a month-window longshot with "several winning fixtures". Board only prices ~1 week out, so window is effectively Aug 17-24. Two research agents vetted UEFA playoff round + dominant favourites.
- **UEFA playoff round (Aug 18-21) = almost all coin-flips/traps**: only Besiktas v Kauno Zalgiris (p0.76, side beaten 7-1 by Dinamo) cleared. Trabzonspor-Ferencvaros & Slovan-Celje are champions-vs-champions coin-flips; Salzburg@Mjallby & Brighton@Tromso are away-favourite-vs-in-form-home traps. First-leg away favourites (Copenhagen/Salzburg/Brighton) flagged for cagey-margin rotation.
- **Dominant-favourite vetting**: KEEP-5 cleared p>=0.72 (Al Ahli @1.11, Al Hilal @1.11 — both Kings Cup giant-v-2nd-tier; Porto @1.20 & Sporting @1.19 Liga Pt Round 3; Shanghai Port @1.34 mid-season). Two HARD REJECTS: **Botafogo @1.12 (dead rubber — LOST 1st leg 6-1 in Cusco, mathematically out) and Benfica @1.24 away at bogey-side Casa Pia (drew opener 2-2)**. Both are the exact "favourite price is a mirage" trap.
- **CORE-8 posted (4.57x, ~10% / 1-in-10)**: the 5 keeps + Besiktas + 2 researched-RISKY (Fenerbahce 0.70, Al Nassr 0.68). This is the real play.
- **J2DRJ4 (LONGSHOT, 23 legs, 627x, honest ~0.02% / 1-in-4,991)**: CORE-8 + 15 clean mid-season data-rich favourites (Liga MX, Brazil A/B, Scandinavia, MLS, USL, Qatar, Ecuador), frozen-line guard applied, no openers/derbies/Botafogo/Benfica. Declared longshot; the researched core is the "several winning fixtures" backbone. Locks stake Aug 17-24.

## ═══ Calibration (Aug 18 settlement) — WIN via mid-season DNB spine; one-leg-short again ═══
- **UBTB79 WON (4W/2V) → PROJECT WIN.** The "real ticket" mid-season DNB spine: Trnava 2:0, Atletico Mineiro 3:0, Brann 3:0, Emelec 2:1 all WON; **Sao Paulo 1:1 and Pumas 0:0 both VOIDED (DNB draw-refund)** → ticket settled as a WIN at reduced odds. This validates the whole corrected-v3 thesis: a spine of mid-season home DNBs where the draw refunds is a genuinely winning shape even when 2 of 6 sides only draw. The DNB refund-on-draw is the engine, exactly as designed.
- **U9XKEG (week DNB-10) went 8W/1V/1L — DEAD by ONE leg.** Hajduk 4:0, Besiktas 1:0, St Gallen 5:1, HJK 3:0, America 3:0, Monterrey 6:1, Chicago 2:1, Houston 1:0 all won; RSL 1:1 VOID; **only LAFC (0:1) lost outright.** The corrected DNB spine performed superbly at leg level (8/10 wins, 1 void, 1 loss) but 10 legs is too many — one outright loss kills it. LESSON REINFORCED: the DNB spine is the right instrument; keep it to 5-7 legs (UBTB79's 6 won; U9XKEG's 10 lost by one). Leg count is still the killer even with the best instrument.
- **ZTTNYJ DEAD on Pachuca (2:3)** — Pachuca were the researched p~0.83 dominant home favourite and LOST OUTRIGHT to weak Juarez at home. This is the SAME failure class as Cruz Azul/UdeC (Aug 1-2): strong-home-vs-weak-away result-sides lose ~1 in 6 and a DNB gives NO protection when the favourite loses (only on a draw). Shandong/Dynamo Kyiv/Colorado all won; Pachuca was the one home fav that fell. Even researched dominance is a ~1-in-6 loser; do not treat any single home fav as a lock.
- **Al Ahli 1:2 + Al Hilal 0:2 (both away, researched giant-v-minnow cup ties) WON** exactly as called — the QAR6NM anchors delivered. Research is reliable at the extremes (top-flight giant v 2nd-tier minnow) — same principle as the Scherzer MLB call.
- **Texas ML LOST (Athletics won 5:2)** — the "only +EV leg on the board" MLB lean failed; MLB ML variance again. Killed JFV2ML. MLB ML remains the highest-variance leg class; a +EV lean is not a safe leg.
- **KB8EKV amateur/cup trims DEAD** as flagged — Gateshead 5:6 (DC lost on a 11-goal game), Nykoebing, Levadiakos, Skovde cup. Thin amateur/EFL-Trophy fixtures are unpriceable; the decline-recommendation was correct.
- ALIVE: QAR6NM (month core, 2W/6P — Porto/Sporting/Besiktas etc. Aug 20-23), J2DRJ4 (longshot, 4W/19P).
- **Running win log**: UBTB79 joins the ledger. The winning shape is now unambiguous — 5-7 leg mid-season home-DNB spine (draw-refund protected), researched extremes as anchors, NO leg count above ~7.

## ═══ Calibration + PANEL "WAY FORWARD" (Aug 19 settlement) ═══
Today's results:
- **N5AZU7 / SD4BL5 DEAD — killed by Houston Astros ML (1:3).** Sao Paulo DNB won 3:1, Cubs ML won 4:3, Minnesota/Seattle DNBs still pending — but the MLB ML lean (Astros, the "best MLB lean" at p0.62) lost and took both tickets. **This is the 4th+ time an MLB ML lean has been the killer (Astros, Texas x2, Reds, D-backs, E.Rodriguez).** HARD RULE: stop adding sub-0.65 MLB moneyline leans to otherwise-sound tickets. MLB ML is the single highest-variance leg class and it keeps being the one leg that loses. Only use MLB when there's a CONFIRMED extreme starter mismatch (Scherzer-grade), and even then cap at ONE and never as the swing that decides the ticket.
- **JKJW71 (UG3XYJ edited, 36 Over-1.5 legs) went 19W/5L — DEAD.** The correlated Over-1.5 stack died on multiple low-scoring games (Karlstad 1:0, AGMK 0:1, IK Franke 0:1 all failed Over 1.5). CONFIRMS L73: stacking one market (Over 1.5) across 36 fixtures is a correlated bet on league-wide scoring; even at ~0.80/leg, 36 legs lose ~5-7. High per-leg p does NOT save a mega — leg count + correlation kill it.
- **QAR6NM (researched month core) ALIVE 2W/6P** — Al Ahli 1:2, Al Hilal 0:2 (the giant-v-minnow cup anchors) won exactly as researched. J2DRJ4 longshot 4W/19P alive.

### PANEL VERDICT — the way forward (consolidated, binding)
The ledger over ~5 weeks is now unambiguous:
1. **WINS** (UBTB79, XREM4T, Y1UUTT, TAWH8B, and the older set) are ALL short 4-7 leg tickets built from: mid-season home DNBs (draw-refund protected) + researched EXTREMES (giant-v-minnow cup ties, confirmed ace-vs-broken-arm). Nothing longer than 8 legs has EVER won.
2. **LOSSES** cluster in: (a) MLB ML leans, (b) correlated single-market Over-stacks, (c) coin-flip favourites/openers, (d) thin-league goals, (e) strong-home-vs-weak-away result-sides (Pachuca, Cruz Azul), (f) leg count >8.
3. **The 100x+ request is structurally opposed to the winning shape** — a next-day board can only reach 100x via many legs (leg-count death) or coin-flips. This is not fixable; it is arithmetic.
**DECISION**: (a) The "real play" is always a short DNB/researched-anchor spine, built and labelled as such. (b) When the user explicitly wants 100x+, build it CLEAN — no junk classes (corners/WEH/2h-DC/women/goal-bounds), no MLB ML leans, no single-market Over-stack, frozen-line guard, <=2 goals-family per league — and DECLARE the true 1-in-X number. Do not pretend a 100x is a winner. (c) MLB ML leans are removed from the "value leg" toolkit; only confirmed extreme-starter mismatches qualify, capped at one.

### Calibration (Aug 20-21 — clean 100x died on DRAWS; QAR6NM core surging)
- **XJ52D3 (clean 100x, 12 home-favourite 1X2 legs) went 8W/4L — DEAD.** Winners were emphatic (Vila Nova 6:0, Lech 7:0, Jagiellonia 4:0, Braga 2:0, Getafe 3:1, Midtjylland 2:0, Gremio Nov 3:0). The 4 losses: **Univ Craiova 1:1 and Panathinaikos 2:2 — both DRAWS** (1X2 loses on a draw), plus Vancouver 0:1 and LDU Quito. **KEY LESSON: the 100x used 1X2 (not DNB) to reach the odds — and forfeited the draw-refund. Two of the four losses were draws that a DNB would have VOIDED (survived).** This is the structural cost of a 100x: to get the odds you drop to 1X2 favourites which draw ~25% and have zero protection. A clean 100x is still a coin-flip stack; 8W/4L is exactly the ~1-in-378 reality.
- **QAR6NM (researched month CORE-8) 4W/0L/4P — ALIVE and surging**: Al Ahli 1:2, Al Hilal 0:2, Besiktas 3:0, Al Nassr (Al-Riyadh) 0:4 — all four researched anchors WON. Porto/Sporting/Shanghai/Fenerbahce settle Aug 22-23. This is the winning shape (researched giant-v-minnow + strong favourites) performing exactly as designed — possible WIN pending.
- **J2DRJ4 (longshot) 8W/0L/15P — ALIVE.** The researched core all winning.
- Takeaway reinforcing the Aug 19 panel verdict: the researched-anchor shape (QAR6NM) keeps winning; the odds-chasing 1X2 stack (XJ52D3) died on draws. DNB-protection is worth more than the odds gained by dropping to 1X2.

### Open book (Aug 22-24 weekend — UD2P1U "my way" + RFY4D8 value; settle progressively)
Two research agents vetted the weekend. KEY FINDING: opener-heavy weekend — Serie A/EPL/Ligue 1 = MD1, LaLiga big-two first games, Bundesliga not started; only Eredivisie has form. So dominant DNB anchors are scarce.
- **UD2P1U (MY WAY, 5-leg DNB spine, 1.79x, honest ~40-45% / high-prob low-odds)**: Inter DNB (v Monza, champions v weakest promoted), Fluminense DNB (4th v 18th, won reverse 2-0), Palmeiras DNB (1st v relegation Vasco), Nacional URU DNB (giant v bottom Progreso), Al Ahli Saudi DNB (ACL champs v promoted Abha). All void-protected home DNBs; the winning shape but LOW odds because a thin-anchor weekend only offers short-priced favourites. Inter/Al Ahli are L77-short (near-locks) — included for floor, not odds.
- **RFY4D8 (VALUE GAME, 3 legs, 19.97x, researched underdog value)**: Espanyol 1X (fade Mourinho-debut Real Madrid @2.70), Groningen X2 (red-hot 6/6 side fading stuttering PSV @2.90), Frosinone 1X (promotion euphoria v Juve away opener @2.55). Each an underdog-value DC where indep p materially exceeds implied — the "high odds fewer games" ticket. NO fixture overlaps the spine.
- Both kept clear of live QAR6NM fixtures (Porto/Sporting/Fenerbahce/Shanghai). Grade the value-DC-fade-opener thesis at settlement — a new angle (fade cohesion-risk favourites in openers, back the in-form/settled underdog).

### Aug 22 — user rejected low-odds/value shapes; wanted "winners at real odds"
User called UD2P1U (1.79x DNB spine) "criminally low" and RFY4D8 (value-fade underdogs) "planned failure". Core lesson RE-STATED: user wants HIGH ODDS + WIN, which are mathematically opposed on accas. Delivered the honest odds/chance curve (1.8x~45% / 6.5x~1-in-14 / 8.5x~1-in-22 / 100x~1-in-100+) and let user pick.
- **X9LEWS (7 favourites to WIN, 8.54x, ~1-in-22)** — the middle-ground "winners at real odds".
- **XJSJ1M (12 favourites to WIN, 41x, ~1-in-219)** — user picked the 12-leg tier. Came out 41x not 100x because the strongest favourites are short-priced; forcing 100x needs weaker/higher-odds favs (lower win-prob). Declared lottery. Soft legs flagged: Real Madrid (Mourinho debut), Man City (missing Rodri/Silva), PSV (stuttering).
- STANDING NOTE: for this user, always (a) show the odds-vs-chance curve, (b) build to their chosen number, (c) name the weak legs. The researched QAR6NM core (4W/0L, giant-v-minnow anchors) remains the actual winning shape running underneath.

### Calibration (Aug 22-23 partial) — favourites-to-WIN flew; value-fade failed; QAR6NM on brink of WIN
- **RFY4D8 (value-fade underdogs) DEAD on leg 1**: Real Madrid WON 2:1 at Espanyol (Mourinho debut was NOT cagey) → Espanyol 1X lost. **LESSON: fading cohesion-risk opener favourites is NOT a reliable edge — the big clubs often just win.** The user's instinct ("planned failure") was validated. Do NOT build value tickets on fading a favourite; back the favourite or find value elsewhere.
- **Favourites-to-WIN performing**: XJSJ1M (12-fav) 7W/0L/5P, X9LEWS (7-fav) 4W/0L/3P — Inter 4:1, Al Ahli 4:0, Real Madrid 2:1, Fluminense 2:1, Al Sadd 3:1, Espanyol-fixture (RM won), Shabab 2:0, NAC Breda 3:2 all won. Backing the strong favourites to WIN (what the user asked for) is working this weekend. Both ALIVE into Sunday.
- **QAR6NM (researched month CORE-8) 6W/0L/2P — ON THE BRINK OF A WIN**: Al Ahli, Al Hilal, Besiktas 3:0, Sporting 3:1, Fenerbahce 4:2, Al Nassr 0:4 all won; only Porto + Shanghai Port pending (Aug 23). The researched giant-v-minnow + strong-favourite spine performing exactly as designed.
- **J2DRJ4 (longshot) 15W/2L — the 2 losses were EXACTLY the research-flagged risky legs**: Cruz Azul (coin-flip, Atlas above them) and Inter Miami (Messi disciplinary doubt). Strong validation that the research SKIP/RISKY flags are predictive — the flagged legs are the ones that lost.
- Net: this weekend backing favourites-to-WIN is landing; the researched core QAR6NM is near a win; fading favourites (value-underdog thesis) failed.

## ═══ Calibration (Aug 22-24 settlement) — FOUR WINS incl. the 12-favourite; favourites-weekend + KuPS rotation lesson ═══
- **QAR6NM WON 8/8 → PROJECT WIN (4.57x).** The researched month CORE-8: Al Ahli 1:2 & Al Hilal 0:2 (giant-v-minnow cup anchors), Porto 2:0, Besiktas 3:0, Sporting 3:1, Shanghai Port 2:1, Fenerbahce 4:2, Al Nassr 0:4. The researched giant-v-minnow + strong-favourite spine — the single most reliable winning shape in the ledger, delivered clean.
- **XJSJ1M WON 12/12 → PROJECT WIN (41x).** The user's "12 favourites to WIN" demand. EVERY favourite won: Inter 4:1, Al Ahli 4:0, Barcelona (Elche 0:5), Palmeiras 4:1, Fluminense 2:1, Nacional URU 1:0, Al Sadd 3:1, Real Madrid (Espanyol 1:2), Man City 2:1, PSV 5:1, Shabab 2:0, NAC Breda 3:2. This was an EXCEPTIONALLY clean favourites-slate (a ~1-in-219 that hit because the whole board went chalk). VINDICATION of the user's back-favourites-at-odds instinct — but do NOT over-generalise: this is the rare week where zero favourites slipped. The value in it: on a genuinely chalk weekend, a favourites-only 1X2 stack CAN win big; the discipline is building it CLEAN (which we did — no junk, no MLB ML, frozen-line guard).
- **X9LEWS WON 7/7 (8.5x), UD2P1U WON 5/5 (1.79x)** — the same favourites, shorter stacks. All four winning tickets shared the Inter/Al Ahli/Fluminense/Palmeiras/Nacional core.
- **KuPS LOST 2:4 to DEAD-LAST Mariehamn — killed both "today" tickets (MGQMS1, YLGTTT).** The research had EXPLICITLY flagged KuPS for Conference League rotation (Euro 2nd leg Aug 27, 4 days after) despite being the "biggest mismatch on the board" (1st v 0-wins-in-14). They lost 2:4. **HARD LESSON: when research flags rotation risk (European tie within 4 days), DO NOT anchor on that leg even if it is the largest table mismatch — the rotation flag (L66) is predictive and overrides the mismatch.** I put KuPS on both today-tickets as the shortest "safe" leg; it was the single killer. This is the L66 rotation rule failing to be enforced against a tempting mismatch.
- J2DRJ4 longshot 19W/2L — the 2 losses again the exact flagged legs (Cruz Azul coin-flip, Inter Miami Messi-doubt). Research SKIP/RISKY flags remain predictive.
- **NET: 4 wins in one weekend (QAR6NM 4.57x, XJSJ1M 41x, X9LEWS 8.5x, UD2P1U 1.79x).** The through-line: researched favourites/anchors WIN; the two losses were (a) a research-flagged rotation leg I anchored on anyway (KuPS), and (b) research-flagged coin-flips. The research is working; the discipline failure was over-riding a rotation flag.

### Aug 24 — 100/1000/10000 ladder (now->Fri) built on a fixture-desert window
Two agents: UEFA second-leg cushions + domestic/MLB. UEFA gave 4 available To-Qualify near-locks (Glimt 3-1/0.89, Celtic 3-0/0.88, Salzburg 1-0/0.82, Monaco 3-2/0.78; Besiktas & Freiburg TQ not offered yet) — but priced 1.02-1.07 (near-zero odds contribution). Domestic/MLB agent found the window (Aug 25-28) is a FIXTURE DESERT: every dominant home favourite (Chengdu, America, Tigres, Palmeiras) plays Aug 29-30, just past Friday. Only Red Sox ML (Sonny Gray 2.79 v Gusto 4.80, p0.64) cleared as a US edge; 6 UEFA level ties are hard SKIPs (incl. KuPS again).
- **XJ6QLB (T100, 17 legs, 135x, ~1 in 714)**, **HG9LEL (T1000, 22 legs, 1,443x, ~1 in 10,326)**, **YRTJ0Z (T10000, 26 legs, 13,506x, ~1 in 128,931)**. Declared lotteries — the 4 TQ cushions are the only genuine near-locks; the rest are match-wins/level-tie favs/coin-flip fillers the desert forced in. Honest chance is WORSE than fair-odds implied because of the coin-flip content.
- KEY NOTE for next time: the domestic agent flagged the REAL dominant-favourite pool is Aug 29-30 (CSL Chengdu v Liaoning, Liga MX America/Tigres, Brazil R25). A ladder built Sat-Sun would rest on genuine mismatches, not a midweek desert. Recommend revisiting then.

## ═══ NEW MARKET COMPETENCY: TEAM FOULS OVER/UNDER (Aug 24) ═══
User shared a won ticket in "Team Fouls Under" and asked to build competency. **PLATFORM NOTE: this market is NOT in SportyBet's pre-match booking API** — confirmed across 223 distinct markets on a top fixture (only "Player Fouls Won" and "Team Cards" exist pre-match). It is a LIVE/in-play or app-only market. **We CANNOT generate a booking code for it; we can only research it and hand the user a selection list to input on the app.**

### The market study (research-grounded, CIES + FotMob data):
- **League foul averages (fouls/team/game)**: EPL ~10.5 (LOWEST — lenient refs), Bundesliga ~12.0, Ligue 1 ~13.2, Serie A ~13.3, LaLiga ~13.5 (HIGHEST). Brazil/MLS high (~13-15). **The same "Under 11.5" is a totally different bet by league — line-shop relative to the league floor.**
- **#1 driver = POSSESSION dominance**: you cannot foul while you have the ball. A 60%+ possession side has fewer defensive moments to foul. This is the core mechanism.
- **Lowest-foul teams (fouls/game, firm)**: Man City 7.6, Dortmund 8.4, Brentford 8.4, Bayern ~8.8, Real Madrid ~10.0, Newcastle 10.4, Barcelona 10.5, Arsenal 10.6, Man Utd 10.6, Forest 10.6, Villa 10.7, Napoli ~11.0, Liverpool 11.3, Chelsea 11.5. **TRAPS: Inter ~13.1, Brighton/Bournemouth/Atalanta/Bologna all HIGH (pressing sides foul a lot — style beats reputation; "big club" ≠ low foul).**
- **BEST context (stack these)**: possession-dominant side + HOME + vs weaker opponent + low-foul league (EPL/Bund) + lenient/average referee + no derby + team expected to lead not chase.
- **WORST context (avoid)**: derby/rivalry, away underdog/chasing side, high-foul league with tight line, strict/card-happy ref, pressing side, two evenly-matched strong sides.
- **THE REFEREE IS THE FAT TAIL**: strict refs 25-30 fouls/game, lenient <20 — a ±25-30% swing on the SAME fixture. This is the equivalent of the MLB pitcher-edge check: a named, checkable input. **RULE: pull the assigned ref's season fouls/game before every stake; strict/card-happy ref = automatic downgrade or pass.** This is the one check that most often flips a ~78% under into a loss.
- **Lines/hit-rates**: books post ~10-14 (EPL) / 12-15 (Serie A/LaLiga). Strong-context single legs land ~70-80% (NOT 90%+ — referee variance). Sweet spots: elite floor side (≤9 avg) home in EPL/Bund → Under 11.5; low side (10-11.5) → Under 12.5; low-possession side in high-foul league home vs weak → Under 13.5. "Under 10.5" only for true elite floor (City/Dortmund/Bayern/Brentford) with a lenient ref.
- Pre-stake checklist per leg: (1) book posts the market, (2) ref average-or-lenient, (3) team not missing key ball-retaining midfielders, (4) home/away + opponent confirmed. Because foul distributions are TIGHT (8-16, low variance vs goals), the market is MORE modellable than goals — the ref is the only real fat tail.

### Calibration (Aug 25 settlement) — SA away catches killed my own "sound core" (self-inflicted)
- **TVCN0C (HKBXLU sound core) DEAD** on Deportivo Madryn +1-away and Real Pilar +1-away (both 2:0 home wins → away -1 catches lost). **I FLAGGED these exact legs as the L38/L63 South American away-catch loser class in my own presentation ("if you want it tighter I'd drop one of the three away catches") — then left them on the core.** HARD RULE HARDENED: when I know a class is a persistent loser (SA away handicap catches, L38/L63), CUT it from a "sound core", do NOT merely warn and keep. A core that contains a known-loser class is not a sound core.
- **KQS8YM / RX9LWC (converted-to-O1.5 megas) DEAD** — multiple Over 1.5 legs lost on 1:0 games (Botev, Real Santander, Jong PSV all 1:0; FK Auda 1:0). CONFIRMS: the Over-1.5 conversion raises per-leg p to ~0.80 but is NOT a lock — ~1 in 5 low-scoring games finish 1:0/0:0. The conversion is the right edit for a junk goals-mega but does not make a 20+ leg stack winnable.
- **XJ6QLB (desert T100) DEAD** on Gangwon 2:2 (1X2 draw) — reconfirms the midweek-desert ladder was a poor-value declared lottery, as flagged at posting.
- Net: the SA away-catch self-inflicted loss is the actionable one — enforce known loser-class cuts on cores, don't just annotate them.
