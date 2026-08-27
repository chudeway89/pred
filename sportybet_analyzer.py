#!/usr/bin/env python3
"""
SportyBet Nigeria Accumulator Analyser
=======================================
Usage:
    python sportybet_analyzer.py RDKMC6
    python sportybet_analyzer.py RDKMC6 --targets 100 500 5000 10000
    python sportybet_analyzer.py RDKMC6 --no-codes   # analyse only, skip API code generation
"""

import sys, json, math, itertools, argparse, datetime, time
import urllib.request, urllib.error

API_BASE = "https://www.sportybet.com/api/ng/orders/share"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Linux; Android 12; SM-G991B)",
            "Content-Type": "application/json", "Accept": "application/json"}

# ---------------------------------------------------------------------------
# THRESHOLDS
# ---------------------------------------------------------------------------
PROB_STRONG_CUT  = 0.55   # always cut below this
PROB_WEAK_CUT    = 0.62   # cut unless specific evidence supports
PROB_BORDERLINE  = 0.695  # borderline — research recommended
# HI tier = >= PROB_BORDERLINE, LO tier = PROB_WEAK_CUT to PROB_BORDERLINE

# ---------------------------------------------------------------------------
# UTILITIES
# ---------------------------------------------------------------------------

def fetch_json(url, method="GET", body=None):
    data = json.dumps(body).encode() if body else None
    req  = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
        d, _ = json.JSONDecoder().raw_decode(raw)
        return d
    except urllib.error.URLError as e:
        print(f"  [ERROR] Network: {e}")
        return None


def fetch_betslip(code):
    print(f"Fetching booking code {code} ...")
    d = fetch_json(f"{API_BASE}/{code}")
    if not d or d.get("bizCode") != 10000:
        print("  [ERROR] Could not retrieve booking code.")
        sys.exit(1)
    return d["data"]


def create_booking_code(selections, stake=100, order_type=1):
    """POST a selection list to SportyBet and return the new booking code."""
    def clean_sel(s):
        raw = {"eventId": s["eventId"], "marketId": s["marketId"],
               "specifier": s.get("specifier"), "outcomeId": s["outcomeId"],
               "productId": s["productId"], "sportId": s["sportId"]}
        return {k: v for k, v in raw.items() if v is not None}

    payload = {
        "selections": [clean_sel(s) for s in selections],
        "stake":      stake,
        "orderType":  order_type,
    }
    d = fetch_json(API_BASE, method="POST", body=payload)
    if not d or d.get("bizCode") != 10000:
        return None
    return d["data"]["shareCode"]


# ---------------------------------------------------------------------------
# PARSING
# ---------------------------------------------------------------------------

def parse_legs(data):
    """Extract all legs from the betslip data with full metadata."""
    outcomes = {o["eventId"]: o for o in data["outcomes"]}
    legs = []
    for i, s in enumerate(data["ticket"]["selections"], 1):
        ev = outcomes.get(s["eventId"], {})
        home = ev.get("homeTeamName", "?")
        away = ev.get("awayTeamName", "?")
        sport = ev.get("sport", {})
        cat   = sport.get("category", {})
        tour  = cat.get("tournament", {})
        league = f"{cat.get('name','?')} / {tour.get('name','?')}"
        st = ev.get("estimateStartTime")
        kickoff = (datetime.datetime.utcfromtimestamp(st / 1000).strftime("%m-%d %H:%M UTC")
                   if st else "?")
        booking_ok = ev.get("bookingStatus", "?") == "Booked"
        mkts = ev.get("markets", [])
        market = pick = "?"
        odds = prob = 0.0
        mkt_ok = True
        source = "?"
        if mkts:
            m = mkts[0]
            mkt_ok = m.get("status", 0) == 0
            source = m.get("sourceType", "?")
            market = m.get("desc", "?")
            spec = s.get("specifier", "")
            if spec:
                market = f"{market} [{spec}]"
            if m.get("outcomes"):
                oc    = m["outcomes"][0]
                odds  = float(oc.get("odds", 0) or 0)
                prob  = float(oc.get("probability", 0) or 0)
                pick  = oc.get("desc", "?")

        structural_cut = not booking_ok or not mkt_ok
        cut_reason = ""
        if not booking_ok:
            cut_reason = f"Booking={ev.get('bookingStatus','?')}"
        elif not mkt_ok:
            cut_reason = f"MarketStatus={mkts[0].get('status','?')}"

        legs.append({
            "n": i, "home": home, "away": away, "league": league,
            "kickoff": kickoff, "market": market, "pick": pick,
            "odds": odds, "prob": prob, "source": source,
            "structural_cut": structural_cut, "cut_reason": cut_reason,
            "stat_cut": False, "stat_reason": "",
            "sel": s,
        })
    return legs


# ---------------------------------------------------------------------------
# STATISTICAL CUT LOGIC
# ---------------------------------------------------------------------------

MARKET_FLAGS = {
    "GG/NG":          "BTTS market — verify match motivation and squad depth",
    "Early Goals":    "Early Goals market — needs ≥80% prob to be safe",
}

def apply_stat_cuts(legs):
    for leg in legs:
        if leg["structural_cut"]:
            continue
        p = leg["prob"]
        market = leg["market"].upper()

        if p < PROB_STRONG_CUT:
            leg["stat_cut"] = True
            leg["stat_reason"] = f"p={p:.3f} — below {PROB_STRONG_CUT} threshold (coin flip or worse)"
            continue

        if p < PROB_WEAK_CUT:
            leg["stat_cut"] = True
            leg["stat_reason"] = (f"p={p:.3f} — high-risk zone ({PROB_STRONG_CUT}–{PROB_WEAK_CUT}); "
                                   "remove unless strong external evidence")
            continue

        # Market-specific flags
        if "GG" in market or "BTTS" in market or "GG/NG" in market:
            if p < 0.65:
                leg["stat_cut"] = True
                leg["stat_reason"] = f"BTTS market with p={p:.3f} — insufficient probability for acca leg"
        if "EARLY GOALS" in market and p < 0.75:
            leg["stat_cut"] = True
            leg["stat_reason"] = f"Early Goals market with p={p:.3f} — needs ≥75% to be reliable"

        # BET_GENIUS in very low probability range is extra-suspect
        if leg["source"] == "BET_GENIUS" and p < 0.68:
            leg["stat_cut"] = True
            leg["stat_reason"] = (f"BET_GENIUS source with p={p:.3f} — "
                                   "thin model data, amateur league, elevated variance")

    return legs


# ---------------------------------------------------------------------------
# OPTIMISER
# ---------------------------------------------------------------------------

def optimise_to_target(pool, target_odds, label=""):
    """
    Find the subset of pool legs whose combined odds is closest to target_odds
    while maximising combined probability.

    Strategy:
    - If target < pool_odds: enumerate removing 1-6 legs (fast, exact)
    - If target << pool_odds: greedy build from highest-p + swap refinement
    """
    full_log = sum(math.log(r["odds"]) for r in pool if r["odds"] > 0)
    log_t    = math.log(target_odds)
    pool_odds = math.exp(full_log)

    if label:
        print(f"  Optimising for ~{target_odds} odds (pool = {pool_odds:.1f})...")

    if target_odds >= pool_odds * 0.15:
        # === REMOVAL APPROACH: enumerate removing 1-6 legs ===
        removal_log_target = full_log - log_t
        best = None; best_dist = 1e9; best_prob = 0

        max_remove = min(7, len(pool))
        for n in range(1, max_remove + 1):
            for removal_idx in itertools.combinations(range(len(pool)), n):
                removed_log = sum(math.log(pool[i]["odds"]) for i in removal_idx)
                dist = abs(removed_log - removal_log_target)
                if dist < best_dist - 1e-6:
                    remaining = [pool[i] for i in range(len(pool)) if i not in removal_idx]
                    new_prob = math.prod(r["p"] for r in remaining)
                    best = remaining; best_dist = dist; best_prob = new_prob
                elif dist < best_dist + 1e-4:
                    remaining = [pool[i] for i in range(len(pool)) if i not in removal_idx]
                    new_prob = math.prod(r["p"] for r in remaining)
                    if new_prob > best_prob:
                        best = remaining; best_dist = dist; best_prob = new_prob
            # Early exit if we found something very close
            if best_dist < 0.005:
                break

        return sorted(best, key=lambda x: x["n"])

    else:
        # === SELECTION APPROACH: greedy + swap ===
        pool_sorted = sorted(pool, key=lambda x: -x["prob"])
        greedy = []; logsum = 0.0
        for leg in pool_sorted:
            if logsum + math.log(leg["odds"]) <= log_t * 1.02:
                greedy.append(leg)
                logsum += math.log(leg["odds"])

        greedy_set   = {r["n"] for r in greedy}
        excluded     = [r for r in pool_sorted if r["n"] not in greedy_set]

        best_combo   = list(greedy)
        best_logodds = logsum
        best_dist    = abs(logsum - log_t)
        best_prob    = math.prod(r["prob"] for r in greedy)

        # Try single addition
        for ex in excluded:
            new_log = logsum + math.log(ex["odds"])
            dist    = abs(new_log - log_t)
            new_prob = best_prob * ex["prob"]
            if dist < best_dist - 1e-6 or (abs(dist - best_dist) < 0.01 and new_prob > best_prob):
                best_dist = dist; best_logodds = new_log
                best_combo = greedy + [ex]; best_prob = new_prob

        # Try single swap (remove one included, add one excluded)
        for inc in greedy:
            for ex in excluded:
                new_log  = logsum - math.log(inc["odds"]) + math.log(ex["odds"])
                dist     = abs(new_log - log_t)
                new_combo = [r for r in greedy if r["n"] != inc["n"]] + [ex]
                new_prob  = math.prod(r["prob"] for r in new_combo)
                if dist < best_dist - 1e-6 or (abs(dist - best_dist) < 0.005 and new_prob > best_prob):
                    best_dist = dist; best_logodds = new_log
                    best_combo = new_combo; best_prob = new_prob

        # Try double swap
        for i1, inc1 in enumerate(greedy):
            for inc2 in greedy[i1 + 1:]:
                for ex1 in excluded:
                    for ex2 in excluded:
                        if ex1["n"] == ex2["n"]: continue
                        new_log = (logsum
                                   - math.log(inc1["odds"]) - math.log(inc2["odds"])
                                   + math.log(ex1["odds"]) + math.log(ex2["odds"]))
                        dist    = abs(new_log - log_t)
                        if dist < best_dist - 1e-5:
                            new_combo = ([r for r in greedy
                                          if r["n"] not in {inc1["n"], inc2["n"]}]
                                         + [ex1, ex2])
                            new_prob  = math.prod(r["prob"] for r in new_combo)
                            best_dist = dist; best_logodds = new_log
                            best_combo = new_combo; best_prob = new_prob

        return sorted(best_combo, key=lambda x: x["n"])


# ---------------------------------------------------------------------------
# REPORTING
# ---------------------------------------------------------------------------

def tier(prob):
    if prob >= PROB_BORDERLINE: return "HI"
    if prob >= PROB_WEAK_CUT:   return "LO"
    return "CUT"


def print_ticket(label, combo, achieved_odds, make_code=True):
    prob = math.prod(r["prob"] for r in combo)
    one_in = int(1 / prob) if prob > 0 else 999999999
    print(f"\n{'='*76}")
    print(f"  {label}")
    print(f"  Legs: {len(combo)}  |  Odds: {achieved_odds:.2f}x  |  "
          f"Win prob: {prob*100:.4f}% (1 in {one_in:,})")
    print(f"{'='*76}")
    print(f"  {'#':>3}  {'P':>6}  {'Odds':>6}  {'T':>2}  Fixture")
    print(f"  {'-'*3}  {'-'*6}  {'-'*6}  {'-'*2}  {'-'*50}")
    for r in combo:
        t = tier(r["prob"])
        print(f"  {r['n']:>3}  {r['prob']:.3f}  {r['odds']:>6.2f}  {t:>2}  "
              f"{r['home']} vs {r['away']}")
        print(f"       {r['kickoff']}  |  {r['market']}  →  {r['pick']}")

    code = None
    if make_code:
        print(f"\n  Generating booking code...", end="", flush=True)
        code = create_booking_code([r["sel"] for r in combo])
        if code:
            print(f"  CODE: {code}")
        else:
            print(f"  [WARN] Could not generate code — use selections above manually")
    return code


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="SportyBet Accumulator Analyser")
    parser.add_argument("code", help="SportyBet booking code (e.g. RDKMC6)")
    parser.add_argument("--targets", nargs="+", type=float, default=[100.0, 5000.0],
                        help="Target combined odds for optimised tickets (default: 100 5000)")
    parser.add_argument("--no-codes", action="store_true",
                        help="Skip booking code generation (analysis only)")
    args = parser.parse_args()

    make_code = not args.no_codes

    # ---- FETCH ----
    data = fetch_betslip(args.code)
    legs = parse_legs(data)
    legs = apply_stat_cuts(legs)

    total_odds = float(data["ticket"].get("displayTotalOdds", 0))
    print(f"\nBooking Code : {args.code}")
    print(f"Total legs   : {len(legs)}")
    print(f"Order type   : {data['ticket']['orderType']} "
          f"({'Accumulator' if data['ticket']['orderType']==1 else 'System/Multiple'})")
    print(f"Total odds   : {total_odds:,.2f}")
    deadline_ts  = data.get("deadline", 0)
    deadline_str = (datetime.datetime.utcfromtimestamp(deadline_ts / 1000).strftime("%Y-%m-%d %H:%M UTC")
                    if deadline_ts else "?")
    print(f"Deadline     : {deadline_str}")

    # ---- CUT REPORT ----
    structural_cuts = [l for l in legs if l["structural_cut"]]
    stat_cuts       = [l for l in legs if not l["structural_cut"] and l["stat_cut"]]
    kept            = [l for l in legs if not l["structural_cut"] and not l["stat_cut"]]

    print(f"\n{'─'*76}")
    print(f"  STRUCTURAL CUTS ({len(structural_cuts)} legs — dead/suspended):")
    for l in structural_cuts:
        print(f"    #{l['n']:>2}  {l['home']} vs {l['away']}  |  {l['cut_reason']}")

    print(f"\n  STATISTICAL CUTS ({len(stat_cuts)} legs — high risk):")
    for l in sorted(stat_cuts, key=lambda x: x["prob"]):
        print(f"    #{l['n']:>2}  {l['home']} vs {l['away']}  |  p={l['prob']:.3f}  "
              f"|  {l['stat_reason']}")

    print(f"\n  KEPT ({len(kept)} legs):")
    hi = [l for l in kept if l["prob"] >= PROB_BORDERLINE]
    lo = [l for l in kept if l["prob"] < PROB_BORDERLINE]
    print(f"    HI tier (p≥{PROB_BORDERLINE}): {len(hi)} legs")
    print(f"    LO tier (p<{PROB_BORDERLINE}): {len(lo)} legs")

    if not kept:
        print("\nNo legs survived the cuts. Nothing to do.")
        sys.exit(0)

    # ---- STANDARD TICKETS ----
    pool_odds = math.exp(sum(math.log(r["odds"]) for r in kept if r["odds"] > 0))

    codes = {}

    # Ticket: High Confidence
    if hi:
        hi_odds = math.exp(sum(math.log(r["odds"]) for r in hi if r["odds"] > 0))
        c = print_ticket("TICKET — HIGH CONFIDENCE ONLY", hi, hi_odds, make_code)
        if c: codes["High Confidence"] = c

    # Ticket: Low Confidence
    if lo:
        lo_odds = math.exp(sum(math.log(r["odds"]) for r in lo if r["odds"] > 0))
        c = print_ticket("TICKET — LOW/MODERATE CONFIDENCE ONLY", lo, lo_odds, make_code)
        if c: codes["Low Confidence"] = c

    # Ticket: Full Combined
    c = print_ticket("TICKET — FULL COMBINED (all kept legs)", kept, pool_odds, make_code)
    if c: codes["Full Combined"] = c

    # ---- OPTIMISED TARGET TICKETS ----
    for target in args.targets:
        if target >= pool_odds * 1.05:
            print(f"\n  [SKIP] Target {target:,.0f} exceeds pool odds {pool_odds:.1f} — not achievable.")
            continue
        combo   = optimise_to_target(kept, target)
        achieved = math.exp(sum(math.log(r["odds"]) for r in combo if r["odds"] > 0))
        label   = f"TICKET — ~{target:,.0f} ODDS OPTIMISED"
        c = print_ticket(label, combo, achieved, make_code)
        if c: codes[f"~{target:,.0f} Odds"] = c

    # ---- CODE SUMMARY ----
    if codes:
        print(f"\n{'='*76}")
        print("  BOOKING CODE SUMMARY")
        print(f"{'='*76}")
        for name, code in codes.items():
            print(f"  {name:<30}  {code}")

    print(f"\nDone. All times are UTC. Load codes on SportyBet Nigeria via 'Booking Code'.")


if __name__ == "__main__":
    main()
