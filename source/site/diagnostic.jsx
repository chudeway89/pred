// Growth Diagnostic — shared interactive component used by both directions.
// 5 questions per industry, scored, with a results screen + recommendation.
// Visual treatment is supplied by `theme` prop so each direction can dress it.

const { useState, useMemo } = React;

function Diagnostic({ theme = "dark", brand = null, onClose, embedded = false }) {
  const [step, setStep] = useState(0); // 0 = pick industry, 1..5 = question, 6 = email gate, 7 = results
  const [industry, setIndustry] = useState(brand);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");

  const questions = industry ? DIAGNOSTIC.questions[industry] : [];
  const totalSteps = 1 + questions.length + 2; // industry + N questions + email + results

  const score = useMemo(() => {
    if (!industry) return { total: 0, max: 0, pct: 0 };
    let total = 0, max = 0;
    for (const q of questions) {
      max += 4;
      if (answers[q.id] !== undefined) total += answers[q.id];
    }
    return { total, max, pct: max ? Math.round((total / max) * 100) : 0 };
  }, [industry, answers, questions]);

  const verdict = useMemo(() => industry ? diagnosticVerdict(industry, score.pct) : null, [industry, score.pct]);
  const subbrand = industry ? SUBBRAND_BY_ID[industry] : null;

  // Theme palette
  const T = theme === "light" ? {
    bg: "#F6F4EE", surface: "#FFFFFF", text: "#0A192F", muted: "#64748B",
    border: "rgba(10,25,47,0.12)", accent: subbrand?.accent || "#0A192F",
    chip: "rgba(10,25,47,0.06)", optionHover: "rgba(10,25,47,0.05)",
    optionActive: "rgba(10,25,47,0.08)",
  } : {
    bg: "#0A0F1C", surface: "#0F1626", text: "#F8FAFC", muted: "#94A3B8",
    border: "rgba(248,250,252,0.10)", accent: subbrand?.accent || "#14B8A6",
    chip: "rgba(248,250,252,0.05)", optionHover: "rgba(248,250,252,0.04)",
    optionActive: "rgba(248,250,252,0.08)",
  };

  const stepKind = !industry ? "industry"
    : step <= questions.length ? "question"
    : step === questions.length + 1 ? "email"
    : "results";

  // After picking industry we want to be on step 1 (first question).
  const pickIndustry = (id) => { setIndustry(id); setStep(1); };
  const answer = (qid, val) => {
    setAnswers(a => ({ ...a, [qid]: val }));
    setTimeout(() => setStep(s => s + 1), 220);
  };

  return (
    <div style={{
      background: T.bg, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif",
      borderRadius: embedded ? 0 : 24, border: embedded ? "none" : `1px solid ${T.border}`,
      padding: embedded ? "64px 72px" : 48, position: "relative", overflow: "hidden",
      minHeight: embedded ? "100%" : 620,
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: theme === "dark" ? 0.5 : 0.4,
        backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
        backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: T.muted, textTransform: "uppercase" }}>
              The Gsley Growth Diagnostic
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: "transparent", border: `1px solid ${T.border}`, color: T.muted,
              borderRadius: 999, width: 32, height: 32, cursor: "pointer", fontSize: 16,
            }}>×</button>
          )}
        </div>

        {/* Progress */}
        {industry && stepKind !== "results" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
            {Array.from({ length: totalSteps - 1 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i < step ? T.accent : T.chip,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}

        {/* Industry picker */}
        {stepKind === "industry" && (
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 500, lineHeight: 1.1, marginBottom: 16, fontStyle: "italic" }}>
              Where does growth stall<br/>for you?
            </div>
            <div style={{ color: T.muted, fontSize: 17, lineHeight: 1.55, marginBottom: 36, maxWidth: 540 }}>
              Five questions. A scored read-out of where revenue, reputation, and capacity are leaking — and what we'd recommend if you were our client.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {DIAGNOSTIC.industries.map(ind => {
                const sb = SUBBRAND_BY_ID[ind.brand];
                return (
                  <button key={ind.id} onClick={() => pickIndustry(ind.id)} style={{
                    background: T.surface, border: `1px solid ${T.border}`, color: T.text,
                    padding: "24px 22px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", gap: 12,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = sb.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ fontSize: 28, color: sb.accent, fontWeight: 300 }}>{sb.glyph}</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{ind.label}</div>
                      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.4 }}>{sb.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question */}
        {stepKind === "question" && (() => {
          const q = questions[step - 1];
          if (!q) return null;
          const selected = answers[q.id];
          return (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: T.accent, marginBottom: 16 }}>
                {String(step).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}  ·  {subbrand.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, lineHeight: 1.2, marginBottom: 32 }}>
                {q.prompt}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => {
                  const isSelected = selected === opt.score;
                  return (
                    <button key={i} onClick={() => answer(q.id, opt.score)} style={{
                      background: isSelected ? T.optionActive : T.surface,
                      border: `1px solid ${isSelected ? T.accent : T.border}`,
                      color: T.text, padding: "18px 20px", borderRadius: 10,
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      fontSize: 15, transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.optionHover; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = T.surface; }}
                    >
                      <span>{opt.label}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted,
                        border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 4,
                      }}>{String.fromCharCode(65 + i)}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 1}
                  style={{ background: "transparent", border: "none", color: T.muted, fontFamily: "inherit", fontSize: 14, cursor: step === 1 ? "default" : "pointer", opacity: step === 1 ? 0.4 : 1 }}>
                  ← back
                </button>
                {selected !== undefined && (
                  <button onClick={() => setStep(s => s + 1)}
                    style={{ background: "transparent", border: "none", color: T.accent, fontFamily: "inherit", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                    next →
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Email gate */}
        {stepKind === "email" && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: T.accent, marginBottom: 16 }}>
              READY · DELIVERY DETAILS
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>
              Where should we send your<br/>scorecard and roadmap?
            </div>
            <div style={{ color: T.muted, fontSize: 15, marginBottom: 32 }}>
              You'll get a PDF benchmark + a 20-minute private Loom from the Gsley team within 48 hours.
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <Input theme={T} label="Full name" value={name} onChange={setName} placeholder="Jane Adekunle" />
              <Input theme={T} label="Work email" value={email} onChange={setEmail} placeholder="jane@yourhospital.org" type="email" />
              <Input theme={T} label="Organisation" value={org} onChange={setOrg} placeholder="Hospital, HMO, firm…" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button onClick={() => setStep(s => s - 1)} style={{ background: "transparent", border: "none", color: T.muted, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>← back</button>
              <button onClick={() => setStep(s => s + 1)} disabled={!email || !name} style={{
                background: T.accent, color: theme === "light" ? "#fff" : "#0A192F",
                border: "none", padding: "12px 24px", borderRadius: 8, fontFamily: "inherit",
                fontSize: 14, fontWeight: 600, cursor: email && name ? "pointer" : "default",
                opacity: email && name ? 1 : 0.4,
              }}>Reveal scorecard →</button>
            </div>
          </div>
        )}

        {/* Results */}
        {stepKind === "results" && verdict && (
          <Results theme={T} themeMode={theme} score={score} verdict={verdict} subbrand={subbrand} name={name} answers={answers} questions={questions} />
        )}
      </div>
    </div>
  );
}

function Input({ theme, label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.5, color: theme.muted, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 8,
          border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text,
          fontFamily: "inherit", fontSize: 15, outline: "none",
        }}
        onFocus={e => e.target.style.borderColor = theme.accent}
        onBlur={e => e.target.style.borderColor = theme.border}
      />
    </label>
  );
}

function Results({ theme: T, themeMode, score, verdict, subbrand, name, answers, questions }) {
  const ringR = 56;
  const ringC = 2 * Math.PI * ringR;
  const offset = ringC * (1 - score.pct / 100);
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: T.accent, marginBottom: 16 }}>
        SCORECARD · {subbrand.name.toUpperCase()}
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 32 }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r={ringR} fill="none" stroke={T.border} strokeWidth="6" />
            <circle cx="70" cy="70" r={ringR} fill="none" stroke={T.accent} strokeWidth="6"
              strokeDasharray={ringC} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{score.pct}</div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 500, lineHeight: 1.1, marginBottom: 8, fontStyle: "italic" }}>
            {verdict.band}
          </div>
          <div style={{ color: T.muted, fontSize: 15, lineHeight: 1.5, maxWidth: 380 }}>
            {verdict.brief}
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 14, textTransform: "uppercase" }}>Dimension breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((q, i) => {
            const a = answers[q.id] ?? 0;
            const pct = (a / 4) * 100;
            const short = q.prompt.split(/[?:.]/)[0].slice(0, 50);
            return (
              <div key={q.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 60px", alignItems: "center", gap: 12, fontSize: 13 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ marginBottom: 4 }}>{short}</div>
                  <div style={{ height: 3, background: T.chip, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: T.accent, transition: "width 0.6s" }} />
                  </div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.text, textAlign: "right" }}>{a}/4</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`,
        padding: "20px 22px", borderRadius: 8, marginBottom: 24,
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 8, textTransform: "uppercase" }}>What we'd recommend</div>
        <div style={{ fontSize: 16, lineHeight: 1.5 }}>{verdict.recommend}</div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button style={{
          background: T.accent, color: themeMode === "light" ? "#fff" : "#0A192F",
          border: "none", padding: "14px 22px", borderRadius: 8, fontFamily: "inherit",
          fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 1,
        }}>Book a 20-minute call →</button>
        <button style={{
          background: "transparent", color: T.text, border: `1px solid ${T.border}`,
          padding: "14px 22px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer",
        }}>Email me the PDF</button>
      </div>
    </div>
  );
}

window.Diagnostic = Diagnostic;
