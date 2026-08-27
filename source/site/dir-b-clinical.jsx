// GSLEY — single consolidated site (Clinical Light copy, infused with editorial detailing).
// Light cream backgrounds, Plus Jakarta + Inter, structured grids, data-forward.

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB } = React;

const PHONE = "+2349024767079";
const PHONE_DIGITS = "2349024767079"; // for wa.me
const EMAIL = "gsleydigital@gmail.com";
const WHATSAPP_PREFILL = "Hello GSLEY — I'd like to talk about working with you.";

function DirB({ tweaks = {} }) {
  const [route, setRoute] = useHashRoute("/");
  const dark = tweaks.darkMode === true;
  const accent = tweaks.accent || "#0A192F";
  const density = tweaks.density || "spacious";

  // Reset scroll on route change
  useEffectB(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [route]);

  const T = useMemoB(() => {
    if (dark) return {
      bg: "#0F1B2D", paper: "#13243B", surface: "#172A44", surface2: "#1B304E",
      text: "#F8FAFC", textDim: "#CBD5E1", muted: "#94A3B8",
      border: "rgba(248,250,252,0.10)", borderStrong: "rgba(248,250,252,0.22)",
      accent, teal: "#0EA5A0", ink: "#0F1B2D", grid: "rgba(255,255,255,0.04)",
    };
    // Engineered Precision: Arctic White paper + Graphite Blue ink + Crisp Teal sub-brand accent
    return {
      bg: "#FFFFFF", paper: "#FFFFFF", surface: "#F7F9FB", surface2: "#F4F7FA",
      text: "#0F1B2D", textDim: "#334155", muted: "#64748B",
      border: "rgba(15,27,45,0.10)", borderStrong: "rgba(15,27,45,0.28)",
      accent, teal: "#0EA5A0", ink: "#FFFFFF", grid: "rgba(15,27,45,0.04)",
    };
  }, [dark, accent]);

  const sansH = tweaks.headingFont || "'Plus Jakarta Sans', sans-serif";
  const body = tweaks.bodyFont || "'Inter', sans-serif";
  const mono = "'JetBrains Mono', monospace";
  const dispH = sansH;

  const pad = density === "compact" ? { sec: 80, gut: 40 } : { sec: 120, gut: 64 };

  return (
    <div data-screen-label="GSLEY" style={{
      background: T.bg, color: T.text, fontFamily: body,
      minHeight: "100vh", position: "relative",
    }}>
      <NavB T={T} route={route} setRoute={setRoute} sansH={sansH} mono={mono} />
      <main>
        {route === "/" && <HomeB T={T} setRoute={setRoute} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />}
        {route === "/services" && <ServicesB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} setRoute={setRoute} />}
        {route === "/diagnostic" && <DiagnosticPageB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} dark={dark} />}
        {route === "/about" && <AboutB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />}
        {route === "/contact" && <ContactB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />}
        {SUBBRANDS.map(s => route === `/${s.id}` && <SubBrandB key={s.id} T={T} sb={s} dispH={dispH} sansH={sansH} mono={mono} pad={pad} setRoute={setRoute} dark={dark} />)}
      </main>
      <FooterB T={T} sansH={sansH} mono={mono} setRoute={setRoute} />
      <WhatsAppLiveChat T={T} sansH={sansH} mono={mono} />
    </div>
  );
}

// ===== Engineered logomark: a single continuous geometric line forms the G,
// then the line "opens up" into the SLEY wordmark beside it =====
function LogoB({ T, size = 36, color }) {
  const s = size;
  const stroke = Math.max(1.6, s / 16);
  return (
    <svg width={s} height={s} viewBox="0 0 36 36" aria-label="GSLEY" style={{ display: "block" }}>
      <path
        d="M 28 10 A 11 11 0 1 0 28 26 L 28 18 L 20 18"
        fill="none"
        stroke={color || T.text}
        strokeWidth={stroke}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

// Brandmark: G icon + animated GSLEY wordmark. The G "opens up" — on mount the
// SLEY characters reveal one-by-one with a clip-mask sweep.
function BrandMark({ T, sansH, size = 32, fontSize = 17, gap = 12 }) {
  return (
    <div className="gsley-mark" style={{ display: "inline-flex", alignItems: "center", gap }}>
      <span className="gsley-mark__icon" style={{ display: "block" }}>
        <LogoB T={T} size={size} />
      </span>
      <span
        className="gsley-mark__word"
        style={{ fontFamily: sansH, fontWeight: 800, fontSize, letterSpacing: 2.4, color: T.text, lineHeight: 1, display: "inline-flex", alignItems: "center" }}
      >
        <span className="gsley-mark__g">G</span>
        <span className="gsley-mark__rest">SLEY</span>
      </span>
      <style>{`
        .gsley-mark__icon path { stroke-dasharray: 90; stroke-dashoffset: 90; animation: gsley-trace 900ms cubic-bezier(.2,.7,.2,1) forwards; }
        .gsley-mark__word .gsley-mark__g { opacity: 0; }
        .gsley-mark__rest { display: inline-block; clip-path: inset(0 100% 0 0); animation: gsley-reveal 700ms 700ms cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes gsley-trace { to { stroke-dashoffset: 0; } }
        @keyframes gsley-reveal { to { clip-path: inset(0 0 0 0); } }
      `}</style>
    </div>
  );
}

// ===== Nav =====
function NavB({ T, route, setRoute, sansH, mono }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50, background: T.bg + "F2", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
      padding: "16px 48px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 24,
    }}>
      <div onClick={() => setRoute("/")} style={{ cursor: "pointer" }}>
        <BrandMark T={T} sansH={sansH} size={30} fontSize={17} />
      </div>

      <div style={{
        display: "flex", gap: 4, fontFamily: sansH,
        background: T.surface, borderRadius: 999, padding: 4,
        border: `1px solid ${T.border}`,
      }}>
        {NAV.map(n => (
          <a key={n.id} onClick={() => setRoute(n.id)} style={{
            cursor: "pointer", fontSize: 13, padding: "8px 16px", borderRadius: 999,
            color: route === n.id ? T.bg : T.textDim,
            background: route === n.id ? T.text : "transparent",
            fontWeight: 500, transition: "all 0.15s",
          }}>{n.label}</a>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
        <button onClick={() => setRoute("/diagnostic")} style={{
          background: T.accent, color: "#FFFFFF", border: "none", padding: "10px 18px", borderRadius: 6,
          fontFamily: sansH, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>Run Diagnostic</button>
      </div>
    </nav>
  );
}

// ===== Home =====
function HomeB({ T, setRoute, dispH, sansH, mono, pad }) {
  return (
    <>
      <HeroB T={T} setRoute={setRoute} dispH={dispH} sansH={sansH} mono={mono} />
      <ArchitectureB T={T} setRoute={setRoute} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />
      <CapabilityMapB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />
      <LadderB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />
      <DiagnosticTeaserB T={T} setRoute={setRoute} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />
      <ManifestoB T={T} dispH={dispH} sansH={sansH} mono={mono} pad={pad} />
    </>
  );
}

function MarkLine({ T, mono, label, num }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>
      <span>§ {num}</span>
      <span style={{ flex: 1, height: 1, background: T.border, maxWidth: 64 }} />
      <span style={{ color: T.text }}>{label}</span>
    </div>
  );
}

function HeroB({ T, setRoute, dispH, sansH, mono }) {
  return (
    <section style={{
      padding: "80px 48px 80px", position: "relative", overflow: "hidden",
      borderBottom: `1px solid ${T.border}`,
    }}>
      {/* Soft ambient backdrop */}
      <div style={{
        position: "absolute", top: -200, right: -100, width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.accent}10, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 48, alignItems: "stretch" }}>
          <div style={{
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            paddingBottom: 12, borderRight: `1px solid ${T.border}`, paddingRight: 16,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, writingMode: "vertical-rl", textOrientation: "mixed" }}>
              GSLEY · 02 PILLARS
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2 }}>
              ↓
            </div>
          </div>

          <div>
            <MarkLine T={T} mono={mono} label="The thesis" num="00" />

            <h1 style={{
              fontFamily: sansH, fontWeight: 300, fontSize: "clamp(54px, 7.5vw, 108px)",
              lineHeight: 0.96, letterSpacing: "-0.035em", margin: "32px 0 0", maxWidth: 1100,
            }}>
              Capability is common.<br/>
              <span style={{ fontWeight: 700 }}>Commercial outcomes are not.</span><br/>
              <span style={{ fontWeight: 300, fontStyle: "italic", color: T.muted }}>
                We engineer the gap.
              </span>
            </h1>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 48, marginTop: 80, paddingTop: 40, borderTop: `1px solid ${T.border}`, alignItems: "start" }}>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: T.textDim, margin: 0 }}>
                A global digital growth and marketing studio engineering predictable revenue and category leadership. Two pillars — elite growth & marketing, and AI-native operating systems — composed as one commercial system.
              </p>
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Operating method</div>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>
                  Productised services. AI-native delivery. Documented archetypes — never opinions.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => setRoute("/diagnostic")} style={{
                  background: T.accent, color: "#fff", border: "none", padding: "14px 22px", borderRadius: 6,
                  fontFamily: sansH, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}><span>Run the Digital Growth Diagnostic</span><span>↗</span></button>
                <button onClick={() => setRoute("/contact")} style={{
                  background: "transparent", color: T.text, border: `1px solid ${T.borderStrong}`,
                  padding: "14px 22px", borderRadius: 6, fontFamily: sansH, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}><span>Book a Discovery Call</span><span>↗</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-brand strip */}
        <div style={{ marginTop: 80 }}>
          <MarkLine T={T} mono={mono} label="Architecture" num="01" />
          <div style={{
            marginTop: 24, border: `1px solid ${T.border}`,
            display: "grid", gridTemplateColumns: "60px repeat(2, 1fr)",
            background: T.paper,
          }}>
            <div style={{
              padding: "16px 12px", fontFamily: mono, fontSize: 10, color: T.muted,
              letterSpacing: 2, textTransform: "uppercase", borderRight: `1px solid ${T.border}`,
              display: "flex", alignItems: "center",
            }}>NO</div>
            {SUBBRANDS.map((s, i) => (
              <div key={s.id} style={{
                padding: "16px 20px", fontFamily: mono, fontSize: 10, color: T.muted,
                letterSpacing: 2, textTransform: "uppercase",
                borderRight: i < 1 ? `1px solid ${T.border}` : "none",
              }}>{s.pillar} · {s.pillarLabel}</div>
            ))}
            <div style={{
              padding: "20px 12px", fontFamily: mono, fontSize: 10, color: T.muted,
              borderTop: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`,
              letterSpacing: 1.5, textTransform: "uppercase", display: "flex", alignItems: "center",
            }}>ID</div>
            {SUBBRANDS.map((s, i) => (
              <a key={s.id} onClick={() => setRoute(`/${s.id}`)} style={{
                padding: "28px 28px 32px", cursor: "pointer", display: "block",
                borderTop: `1px solid ${T.border}`, borderRight: i < 1 ? `1px solid ${T.border}` : "none",
                background: T.paper,
                transition: "background 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.paper; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <span style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.accent, color: "#fff", borderRadius: 4, fontSize: 16, fontWeight: 700,
                  }}>{s.glyph}</span>
                  <span style={{ fontFamily: mono, fontSize: 9, color: T.muted, letterSpacing: 1.5 }}>OPEN ↗</span>
                </div>
                <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 24, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.5, marginBottom: 18 }}>{s.role}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.sectors.slice(0, 3).map((sec, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: "4px 10px", borderRadius: 3,
                      background: T.surface2, color: T.muted, fontFamily: mono, letterSpacing: 0.5,
                    }}>{sec}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureB({ T, setRoute, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: `${pad.sec}px 48px`, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Pillars, in detail" num="02" />
        <h2 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05, margin: "32px 0 64px", letterSpacing: -1.5, maxWidth: 980 }}>
          Two pillars. <span style={{ fontWeight: 700 }}>One commercial system</span> — productised offers, owned methodology, AI-native delivery.
        </h2>

        <div style={{ display: "grid", gap: 1, background: T.border, border: `1px solid ${T.border}` }}>
          {SUBBRANDS.map((s, i) => (
            <div key={s.id} onClick={() => setRoute(`/${s.id}`)} style={{
              background: T.paper, padding: "44px 40px", cursor: "pointer",
              display: "grid", gridTemplateColumns: "60px 200px 1fr 280px 100px", gap: 40, alignItems: "center",
              transition: "background 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surface2; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.paper; }}
            >
              <div style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 2 }}>0{i + 1}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.accent, color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700,
                  }}>{s.glyph}</span>
                  <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 22 }}>{s.short}</div>
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>{s.name}</div>
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.6, color: T.textDim }}>{s.blurb}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {s.practices.slice(0, 5).map((p, j) => (
                  <div key={j} style={{ fontSize: 13, color: T.text, display: "flex", gap: 8 }}>
                    <span style={{ color: s.accent }}>—</span>{p}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right", fontFamily: sansH, fontSize: 14, fontWeight: 600, color: s.accent }}>
                Open ↗
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityMapB({ T, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: `${pad.sec}px 48px`, background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Capability map" num="03" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "end", marginTop: 32, marginBottom: 56 }}>
          <h2 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 1.1, margin: 0, letterSpacing: -1.2 }}>
            <span style={{ fontWeight: 700 }}>Six elite differentiators</span> — mapped to the pillar they live inside.
          </h2>
          <p style={{ fontSize: 16, color: T.textDim, lineHeight: 1.6, margin: 0 }}>
            We work where evidence is strongest. Capabilities below combine documented mastery, repeatable methodology, and AI-augmented delivery — the basis for premium pricing.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: T.border, border: `1px solid ${T.border}` }}>
          {CAPABILITIES.map((c, i) => {
            const sb = SUBBRAND_BY_ID[c.brand];
            return (
              <div key={c.code} style={{
                background: T.paper, padding: 32, position: "relative",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32 }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: sb.accent, letterSpacing: 2, marginBottom: 4 }}>{c.code}</div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{sb.short} pillar</div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 4,
                    background: sb.accent + "18", color: sb.accent,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700,
                  }}>{sb.glyph}</div>
                </div>
                <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 20, marginBottom: 10, lineHeight: 1.25 }}>{c.title}</div>
                <div style={{ color: T.textDim, fontSize: 14, lineHeight: 1.55 }}>{c.body}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 24, alignItems: "end", height: 24 }}>
                  {[3, 5, 4, 6, 4, 7, 5, 8, 6, 9].map((h, j) => (
                    <div key={j} style={{
                      flex: 1, height: `${h * 10}%`, background: j > 6 ? sb.accent : `${sb.accent}40`,
                      borderRadius: 1,
                    }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LadderB({ T, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: `${pad.sec}px 48px`, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Value ladder" num="04" />
        <h2 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 1.1, margin: "32px 0 64px", letterSpacing: -1.2, maxWidth: 880 }}>
          <span style={{ fontWeight: 700 }}>Four tiers</span>. Begin free, graduate at the speed of value, exit on a retainer.
        </h2>

        <div style={{ border: `1px solid ${T.border}`, overflow: "hidden", background: T.paper }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1.4fr 1fr", padding: "14px 24px", fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>
            <span>Tier</span><span>Stage</span><span>What it is</span><span>Examples</span>
          </div>
          {LADDER.map((tier, i) => (
            <div key={tier.tier} style={{
              display: "grid", gridTemplateColumns: "100px 1fr 1.4fr 1fr",
              padding: "32px 24px", borderBottom: i < LADDER.length - 1 ? `1px solid ${T.border}` : "none",
              alignItems: "start", gap: 24,
            }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: T.accent, letterSpacing: 2, paddingTop: 6 }}>0{i + 1}</div>
              <div>
                <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 22, marginBottom: 4 }}>{tier.tier}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>{tier.label}</div>
              </div>
              <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.6 }}>{tier.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: T.text }}>
                {tier.examples.map((e, j) => (
                  <div key={j}>· {e}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiagnosticTeaserB({ T, setRoute, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: `${pad.sec}px 48px`, background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{
          background: T.paper, border: `1px solid ${T.border}`, padding: 56,
          display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, alignItems: "center",
        }}>
          <div>
            <MarkLine T={T} mono={mono} label="Free lead magnet" num="05" />
            <h2 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(40px, 5.5vw, 72px)", lineHeight: 0.98, margin: "32px 0 24px", letterSpacing: -1.5 }}>
              The Gsley<br/><span style={{ fontWeight: 800 }}>Growth Diagnostic</span>™
            </h2>
            <p style={{ fontSize: 17, color: T.textDim, lineHeight: 1.6, marginBottom: 32, maxWidth: 540 }}>
              A scored read-out across the dimensions that actually drive enterprise value. Five questions. Tells you exactly where revenue, reputation, and capacity are leaking — and what we'd recommend.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
              <button onClick={() => setRoute("/diagnostic")} style={{
                background: T.accent, color: "#fff", border: "none", padding: "16px 26px", borderRadius: 6,
                fontFamily: sansH, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Begin diagnostic ↗</button>
              <span style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 1 }}>
                ≈ 4 MIN · INSTANT SCORECARD · FREE
              </span>
            </div>
            <div style={{ display: "flex", gap: 24, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
              {[
                { k: "01", v: "Pick your industry" },
                { k: "02", v: "Answer 5 scored questions" },
                { k: "03", v: "Get scorecard + recommendation" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "start" }}>
                  <span style={{ fontFamily: mono, fontSize: 10, color: T.accent, letterSpacing: 1.5 }}>{s.k}</span>
                  <span style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <MockScorecard T={T} sansH={sansH} mono={mono} />
        </div>
      </div>
    </section>
  );
}

function MockScorecard({ T, sansH, mono }) {
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, padding: 28, borderRadius: 6, position: "relative" }}>
      <div style={{ fontFamily: mono, fontSize: 9, color: T.muted, letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" }}>
        Sample · Growth & Marketing
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke={T.border} strokeWidth="4" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={T.accent} strokeWidth="4"
              strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - 0.62)} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>62</div>
        </div>
        <div>
          <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 22, marginBottom: 4 }}>Optimising</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
            Strong fundamentals — material leakage hides in plain sight.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { l: "Demand-generation system", v: 3 },
          { l: "Editorial cadence", v: 2 },
          { l: "Lifecycle automation", v: 2 },
          { l: "B2B sales enablement", v: 3 },
          { l: "Brand & reputation health", v: 2 },
        ].map((d, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 30px", alignItems: "center", gap: 10, fontSize: 11 }}>
            <span style={{ color: T.textDim }}>{d.l}</span>
            <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${d.v / 4 * 100}%`, height: "100%", background: T.accent }} />
            </div>
            <span style={{ fontFamily: mono, color: T.muted, textAlign: "right" }}>{d.v}/4</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManifestoB({ T, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: `${pad.sec}px 48px`, background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Position" num="06" />
        <h2 style={{
          fontFamily: sansH, fontWeight: 300, fontSize: "clamp(34px, 4.8vw, 60px)",
          lineHeight: 1.18, margin: "32px 0 48px", letterSpacing: -0.8,
        }}>
          No jargon. <span style={{ fontWeight: 700 }}>Proven methodologies</span>, data-backed precision, creative excellence — engineered for organisations that intend to define their category on the global stage.
        </h2>
        <div style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>
          ↳ GSLEY · ENGINEERED PRECISION
        </div>
      </div>
    </section>
  );
}

// ===== Services =====
function ServicesB({ T, dispH, sansH, mono, pad, setRoute }) {
  return (
    <section style={{ padding: "60px 48px 120px", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Services" num="00" />
        <h1 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.98, margin: "32px 0 24px", letterSpacing: -2 }}>
          The full <span style={{ fontWeight: 800 }}>service catalogue</span>.
        </h1>
        <p style={{ fontSize: 17, color: T.textDim, maxWidth: 720, lineHeight: 1.6, marginBottom: 64 }}>
          Every offer is productised — fixed scope, fixed timeline, predictable outcome. Read across the value ladder; pick the entry point that matches where you are. Pricing on request.
        </p>

        {SUBBRANDS.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 60, border: `1px solid ${T.border}`, background: T.paper }}>
            <div style={{ padding: "28px 36px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
              <span style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                background: s.accent, color: "#fff", borderRadius: 4, fontSize: 18, fontWeight: 700,
              }}>{s.glyph}</span>
              <div>
                <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 22, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: T.muted, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>{s.role}</div>
              </div>
              <button onClick={() => setRoute(`/${s.id}`)} style={{
                background: "transparent", color: s.accent, border: `1px solid ${s.accent}`, padding: "8px 16px", borderRadius: 4,
                fontFamily: sansH, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Open ↗</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${s.products.length}, 1fr)`, gap: 1, background: T.border }}>
              {s.products.map((p, j) => (
                <div key={j} style={{ background: T.paper, padding: "24px 28px" }}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: s.accent, marginBottom: 8, textTransform: "uppercase" }}>{p.tier}</div>
                  <div style={{ fontFamily: sansH, fontWeight: 600, fontSize: 15, marginBottom: 14, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 1 }}>Pricing on request</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ===== Diagnostic page =====
function DiagnosticPageB({ T, dispH, sansH, mono, pad, dark }) {
  return (
    <section style={{ padding: "60px 48px 120px", background: T.bg, minHeight: 800 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="The diagnostic" num="00" />
        <h1 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.98, margin: "32px 0 48px", letterSpacing: -2 }}>
          Where does <span style={{ fontWeight: 800 }}>growth stall</span><br/>for you?
        </h1>
        <Diagnostic theme={dark ? "dark" : "light"} />
      </div>
    </section>
  );
}

// ===== About =====
function AboutB({ T, dispH, sansH, mono, pad }) {
  return (
    <section style={{ padding: "60px 48px 120px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="About" num="00" />
        <h1 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.98, margin: "32px 0 64px", letterSpacing: -2, maxWidth: 980 }}>
          A global digital growth and<br/><span style={{ fontWeight: 800 }}>marketing studio</span>.
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, marginBottom: 100 }}>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            Gsley is a global digital growth and marketing studio dedicated to transforming ambitious operations into market-leading brands. We exist to solve the most pressing challenge for modern organizations: achieving scalable, predictable commercial growth.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            By integrating strategic commercial planning with elite digital marketing and AI-native infrastructure, we build robust systems that drive revenue. Our approach combines data-backed precision with creative excellence, ensuring that your organization defines its category on the global stage.
          </p>
        </div>

        <MarkLine T={T} mono={mono} label="Vision · Mission" num="01" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 32, marginBottom: 80, background: T.border, border: `1px solid ${T.border}` }}>
          <div style={{ background: T.paper, padding: 40 }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: T.accent, textTransform: "uppercase", marginBottom: 18 }}>Vision</div>
            <p style={{ fontFamily: sansH, fontWeight: 300, fontSize: 22, lineHeight: 1.4, color: T.text, margin: 0, letterSpacing: -0.3 }}>
              To be the premier global growth engine for ambitious organizations, driving limitless scale through digital innovation and commercial precision.
            </p>
          </div>
          <div style={{ background: T.paper, padding: 40 }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: T.accent, textTransform: "uppercase", marginBottom: 18 }}>Mission</div>
            <p style={{ fontFamily: sansH, fontWeight: 300, fontSize: 22, lineHeight: 1.4, color: T.text, margin: 0, letterSpacing: -0.3 }}>
              To architect predictable revenue growth, elevate brand authority, and build resilient commercial systems through high-impact digital marketing, strategic partnerships, and elite execution.
            </p>
          </div>
        </div>

        <MarkLine T={T} mono={mono} label="Core values" num="02" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginTop: 32, marginBottom: 80, background: T.border, border: `1px solid ${T.border}` }}>
          {[
            { n: "01", t: "Digital Excellence", b: "Every system we ship is engineered for compounding performance." },
            { n: "02", t: "Measurable Impact", b: "Revenue lifts, pipeline, capacity utilisation — not impressions." },
            { n: "03", t: "Global Standard", b: "Built to the bar of the world’s most demanding institutions." },
            { n: "04", t: "Strategic Agility", b: "AI-native delivery means we recompose faster than the market moves." },
          ].map((v, i) => (
            <div key={i} style={{ background: T.paper, padding: 32, minHeight: 200 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 18 }}>{v.n}</div>
              <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 18, marginBottom: 12, lineHeight: 1.25 }}>{v.t}</div>
              <div style={{ color: T.textDim, fontSize: 13, lineHeight: 1.6 }}>{v.b}</div>
            </div>
          ))}
        </div>

        <MarkLine T={T} mono={mono} label="Operating principles" num="03" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, marginTop: 32, background: T.border, border: `1px solid ${T.border}` }}>
          {[
            { n: "01", t: "Productise everything", b: "If we deliver it twice, it becomes a template, a sprint, a software workflow." },
            { n: "02", t: "Outcomes over outputs", b: "We talk in revenue lifts, capacity utilisation, signed partnerships — not impressions." },
            { n: "03", t: "AI-augmented delivery", b: "Agents replicate the methodology. Senior judgement remains with humans." },
            { n: "04", t: "Documented archetypes", b: "Every engagement begins with a documented pattern — never opinions, never vibes." },
          ].map((p, i) => (
            <div key={i} style={{ background: T.paper, padding: 36 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: T.accent, letterSpacing: 2 }}>{p.n}</span>
              <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 22, marginBottom: 10, marginTop: 14 }}>{p.t}</div>
              <div style={{ color: T.textDim, fontSize: 14, lineHeight: 1.6 }}>{p.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Contact =====
function ContactB({ T, dispH, sansH, mono, pad }) {
  const [sent, setSent] = useStateB(false);
  const [form, setForm] = useStateB({ name: "", email: "", org: "", msg: "" });

  const submit = (e) => {
    e.preventDefault();
    // Build a mailto so the form's content is delivered to gsleydigital@gmail.com
    const subject = encodeURIComponent(`New enquiry from ${form.name || "website"}`);
    const bodyText = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nOrganisation: ${form.org}\n\n${form.msg}`
    );
    const mailto = `mailto:${EMAIL}?subject=${subject}&body=${bodyText}`;
    window.location.href = mailto;
    setSent(true);
  };

  const ctas = [
    { rank: "01", title: "Take the Growth Diagnostic", note: "FREE · 4 MIN · scored read-out", primary: true, action: () => { window.location.hash = "/diagnostic"; } },
    { rank: "02", title: "WhatsApp us directly", note: "Fastest reply · live", action: () => { window.open(`https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`, "_blank"); } },
    { rank: "03", title: "Email — gsleydigital@gmail.com", note: "Response within 1 business day", action: () => { window.location.href = `mailto:${EMAIL}`; } },
    { rank: "04", title: "Subscribe — Growth Briefing", note: "WEEKLY · long-form", action: () => {} },
  ];

  return (
    <section style={{ padding: "60px 48px 120px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <MarkLine T={T} mono={mono} label="Contact" num="00" />
        <h1 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.98, margin: "32px 0 48px", letterSpacing: -2 }}>
          Pick the <span style={{ fontWeight: 800 }}>level</span> that matches the moment.
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: `1px solid ${T.border}`, background: T.paper }}>
            {ctas.map((c, i) => (
              <button key={i} onClick={c.action} style={{
                background: c.primary ? T.accent : "transparent",
                color: c.primary ? "#fff" : T.text,
                border: "none", borderBottom: i < ctas.length - 1 ? `1px solid ${c.primary ? "rgba(255,255,255,0.2)" : T.border}` : "none",
                padding: "24px 28px", cursor: "pointer", fontFamily: sansH,
                textAlign: "left", display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 18, alignItems: "center",
                transition: "all 0.2s",
              }}>
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>{c.rank}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, opacity: 0.7, letterSpacing: 1.5 }}>{c.note}</div>
                </div>
                <span style={{ fontSize: 18 }}>↗</span>
              </button>
            ))}
          </div>

          <div style={{ background: T.paper, border: `1px solid ${T.border}`, padding: 36 }}>
            <div style={{ fontFamily: sansH, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Or write us directly.</div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 24, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Sent to {EMAIL}</div>
            {sent ? (
              <div style={{ padding: 28, textAlign: "center", border: `1px dashed ${T.borderStrong}` }}>
                <div style={{ fontFamily: sansH, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Sent.</div>
                <div style={{ color: T.muted, fontSize: 13 }}>If your mail client didn't open, write to {EMAIL} directly.</div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
                <DInputB T={T} mono={mono} label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
                <DInputB T={T} mono={mono} label="Work email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                <DInputB T={T} mono={mono} label="Organisation" value={form.org} onChange={v => setForm({ ...form, org: v })} />
                <DInputB T={T} mono={mono} label="What you need help with" tall value={form.msg} onChange={v => setForm({ ...form, msg: v })} />
                <button type="submit" style={{
                  background: T.accent, color: "#fff", border: "none", padding: "14px 22px", borderRadius: 4,
                  fontFamily: sansH, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>Send ↗</button>
              </form>
            )}
          </div>
        </div>

        <div style={{ marginTop: 80, padding: "32px 0", borderTop: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {[
            { k: "Email", v: EMAIL, href: `mailto:${EMAIL}` },
            { k: "Phone / WhatsApp", v: PHONE, href: `https://wa.me/${PHONE_DIGITS}` },
            { k: "Office hours", v: "Mon — Fri · 09:00 — 18:00 GMT" },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6, textTransform: "uppercase" }}>{m.k}</div>
              {m.href
                ? <a href={m.href} style={{ fontSize: 16, color: T.text, textDecoration: "none" }}>{m.v}</a>
                : <div style={{ fontSize: 16, color: T.text }}>{m.v}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DInputB({ T, mono, label, tall, value, onChange }) {
  const Tag = tall ? "textarea" : "input";
  return (
    <label>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: T.muted, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <Tag rows={tall ? 4 : undefined} value={value} onChange={e => onChange && onChange(e.target.value)} style={{
        width: "100%", padding: "11px 14px", borderRadius: 4,
        border: `1px solid ${T.border}`, background: T.bg, color: T.text,
        fontFamily: "inherit", fontSize: 14, outline: "none", resize: "vertical",
      }} />
    </label>
  );
}

// ===== Sub-brand pages =====
function SubBrandB({ T, sb, dispH, sansH, mono, pad, setRoute, dark }) {
  return (
    <section style={{ padding: "60px 48px 120px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 3 }}>
          <span style={{
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            background: sb.accent, color: "#fff", borderRadius: 3, fontSize: 13, fontWeight: 700,
          }}>{sb.glyph}</span>
          <span>G S L E Y &nbsp;|&nbsp; {sb.short.toUpperCase().split("").join(" ")}</span>
        </div>

        <h1 style={{ fontFamily: sansH, fontWeight: 300, fontSize: "clamp(56px, 8vw, 116px)", lineHeight: 0.95, margin: "0 0 32px", letterSpacing: -3, maxWidth: 1100 }}>
          {sb.name.split(" ")[0]} <span style={{ fontWeight: 800 }}>{sb.name.split(" ")[1]}.</span>
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, marginBottom: 80, alignItems: "end" }}>
          <p style={{ fontSize: 18, color: T.textDim, lineHeight: 1.6, margin: 0 }}>{sb.blurb}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Sectors</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{sb.sectors.join(", ")}</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Practice lines</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{sb.practices.length} productised offers</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 80, border: `1px solid ${T.border}`, background: T.paper }}>
          <div style={{ padding: "16px 28px", fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "60px 1fr 200px", gap: 24 }}>
            <span>No</span><span>Practice line</span><span>Status</span>
          </div>
          {sb.practices.map((p, i) => (
            <div key={i} style={{ padding: "24px 28px", borderBottom: i < sb.practices.length - 1 ? `1px solid ${T.border}` : "none", display: "grid", gridTemplateColumns: "60px 1fr 200px", gap: 24, alignItems: "center" }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: sb.accent, letterSpacing: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ fontFamily: sansH, fontWeight: 600, fontSize: 18 }}>{p}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sb.accent }} />
                Productised
              </div>
            </div>
          ))}
        </div>

        <MarkLine T={T} mono={mono} label={`${sb.short} value ladder`} num="01" />
        <div style={{ marginTop: 32, marginBottom: 60, border: `1px solid ${T.border}`, background: T.paper }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${sb.products.length}, 1fr)`, gap: 1, background: T.border }}>
            {sb.products.map((p, i) => (
              <div key={i} style={{ background: T.paper, padding: "32px 28px", borderTop: `3px solid ${sb.accent}` }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: sb.accent, marginBottom: 12, textTransform: "uppercase" }}>{p.tier}</div>
                <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 19, marginBottom: 14, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 1 }}>Pricing on request</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 32, background: T.surface2, border: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontFamily: sansH, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Want to know your {sb.short.toLowerCase()} score?</div>
            <div style={{ fontSize: 14, color: T.textDim }}>Run the Diagnostic and we'll send a private read-out.</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setRoute("/diagnostic")} style={{
              background: sb.accent, color: "#fff", border: "none", padding: "12px 20px", borderRadius: 4,
              fontFamily: sansH, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Run Diagnostic ↗</button>
            <button onClick={() => setRoute("/contact")} style={{
              background: "transparent", color: T.text, border: `1px solid ${T.borderStrong}`,
              padding: "12px 20px", borderRadius: 4, fontFamily: sansH, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>Talk to us</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Footer =====
function FooterB({ T, sansH, mono, setRoute }) {
  return (
    <footer style={{ padding: "60px 48px 32px", background: T.surface2, borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 60 }}>
          <div>
            <div style={{ marginBottom: 18 }}>
              <BrandMark T={T} sansH={sansH} size={30} fontSize={17} />
            </div>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              A global digital growth and marketing studio. Two pillars, one commercial system — engineered for ambitious institutions worldwide.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: T.textDim }}>
              <a href={`mailto:${EMAIL}`} style={{ color: T.textDim, textDecoration: "none" }}>{EMAIL}</a>
              <a href={`https://wa.me/${PHONE_DIGITS}`} target="_blank" rel="noreferrer" style={{ color: T.textDim, textDecoration: "none" }}>{PHONE}</a>
            </div>
          </div>
          {SUBBRANDS.map(s => (
            <div key={s.id}>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 700, marginBottom: 14, fontFamily: sansH, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, background: s.accent, borderRadius: 1 }} />
                {s.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.practices.slice(0, 4).map((p, i) => (
                  <a key={i} onClick={() => setRoute(`/${s.id}`)} style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>{p}</a>
                ))}
                <a onClick={() => setRoute(`/${s.id}`)} style={{ fontSize: 12, color: T.text, cursor: "pointer", marginTop: 4, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Open ↗</a>
              </div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 700, marginBottom: 14, fontFamily: sansH }}>Navigate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {NAV.map(n => (
                <a key={n.id} onClick={() => setRoute(n.id)} style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>{n.label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: T.muted, letterSpacing: 1 }}>
          <span>© GSLEY · ALL RIGHTS RESERVED</span>
          <span>ENGINEERED PRECISION</span>
        </div>
      </div>
    </footer>
  );
}

// ===== Live chat — opens a small bubble that hands off to WhatsApp =====
function WhatsAppLiveChat({ T, sansH, mono }) {
  const [open, setOpen] = useStateB(false);
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 60, fontFamily: sansH }}>
      {open && (
        <div style={{
          width: 320, marginBottom: 12, background: T.paper, border: `1px solid ${T.border}`,
          borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.20)", overflow: "hidden",
        }}>
          <div style={{ background: "#25D366", color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <WhatsAppIcon size={28} color="#fff" bg="rgba(255,255,255,0.18)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>GSLEY · Live</div>
              <div style={{ fontSize: 11, opacity: 0.9, letterSpacing: 0.5 }}>Replies via WhatsApp · usually within minutes</div>
            </div>
          </div>
          <div style={{ padding: 18, color: T.text, fontSize: 14, lineHeight: 1.55 }}>
            Hi 👋  This live chat hands off to WhatsApp so we can reply fast — even out of hours.
            Tap below to open WhatsApp with our team.
          </div>
          <div style={{ padding: "0 18px 18px" }}>
            <a
              href={`https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
              target="_blank" rel="noreferrer"
              style={{
                display: "block", textAlign: "center", textDecoration: "none",
                background: "#25D366", color: "#fff", padding: "12px 16px", borderRadius: 8,
                fontWeight: 600, fontSize: 14,
              }}>
              Open WhatsApp ↗
            </a>
            <div style={{ fontFamily: mono, fontSize: 10, color: T.muted, letterSpacing: 1.5, marginTop: 10, textAlign: "center" }}>
              {PHONE}
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Live chat"
        style={{
          width: 56, height: 56, borderRadius: "50%", background: "#25D366", color: "#fff",
          border: "none", cursor: "pointer", boxShadow: "0 12px 32px rgba(37, 211, 102, 0.40)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {open ? <span style={{ fontSize: 22, fontWeight: 600 }}>×</span> : <WhatsAppIcon size={28} color="#fff" />}
      </button>
    </div>
  );
}

function WhatsAppIcon({ size = 24, color = "#fff", bg }) {
  return (
    <span style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", background: bg || "transparent", borderRadius: bg ? "50%" : 0 }}>
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" fill={color}>
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.43zM12.05 21.8h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.72.97 1-3.62-.24-.37a9.83 9.83 0 0 1-1.5-5.27c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.13 1.03 7 2.9a9.85 9.85 0 0 1 2.9 7c0 5.46-4.44 9.9-9.95 9.9zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.16c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.49 1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.3 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.18-1.41-.07-.13-.27-.2-.57-.35z"/>
      </svg>
    </span>
  );
}

window.DirB = DirB;
