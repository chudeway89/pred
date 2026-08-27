// Shared content & taxonomy for the GSLEY site.
// Two-pillar architecture: Growth & Marketing Services (Gsley Market) + Gsley Digital.

const PILLAR_MARKET = {
  id: "market",
  name: "Gsley Market",
  short: "Market",
  pillar: "01",
  pillarLabel: "Growth & Marketing Services",
  role: "Predictable demand, brand authority, commercial systems",
  blurb:
    "An integrated growth studio that engineers predictable demand and brand authority. Strategic commercial planning, elite digital marketing, and senior dealmaking — composed as one compounding system, not disposable campaigns.",
  accent: "#1E2A3A", // Graphite Blue
  accent2: "#3B4A63",
  glyph: "△",
  sectors: ["Global enterprise", "Hospitals & foundations", "Ambitious B2B & B2C brands"],
  practices: [
    "Social Media Content & Management",
    "Social Media Marketing",
    "Email Marketing",
    "Google Ads",
    "Institutional Brand & Online Reputation Management (PR)",
    "B2B Sales Enablement & Commercialisation",
    "Strategic Partnerships & Colocation Dealmaking",
    "Professional Development & Industry Engagement",
  ],
  products: [
    { tier: "Free", name: "Digital Growth Diagnostic" },
    { tier: "Toolkit", name: "B2B Growth Stack" },
    { tier: "Sprint", name: "Demand Sprint (8 wks)" },
    { tier: "Sprint", name: "Partnership Sprint (6–10 wks)" },
    { tier: "Retainer", name: "Growth Engine Retainer" },
    { tier: "Retainer", name: "Founder Visibility Retainer" },
  ],
};

const PILLAR_DIGITAL = {
  id: "digital",
  name: "Gsley Digital",
  short: "Digital",
  pillar: "02",
  pillarLabel: "AI-Native Operating Systems",
  role: "Digital infrastructure · agents · workflow architecture",
  blurb:
    "AI-native operating systems for institutions in transition. We architect digital infrastructure, deploy agents, and rewire workflows around proven commercial outcomes.",
  accent: "#0EA5A0", // Crisp Teal
  accent2: "#14B8A6",
  glyph: "◇",
  sectors: ["Hospitals", "Foundations", "Global Enterprise"],
  practices: [
    "Digital transformation diagnostics",
    "AI agent deployment",
    "Automation & RevOps",
    "Data infrastructure",
  ],
  products: [
    { tier: "01", name: "Digital transformation diagnostics" },
    { tier: "02", name: "AI agent deployment" },
    { tier: "03", name: "Automation & RevOps" },
    { tier: "04", name: "Data infrastructure" },
  ],
};

const SUBBRANDS = [PILLAR_MARKET, PILLAR_DIGITAL];
const SUBBRAND_BY_ID = Object.fromEntries(SUBBRANDS.map(s => [s.id, s]));

// Capability map — six elite differentiators across the two pillars.
const CAPABILITIES = [
  {
    code: "C-01",
    title: "Demand Generation Systems",
    body: "Compounding content engines, paid media architecture, and lifecycle automation engineered for predictable B2B and institutional pipeline.",
    brand: "market",
  },
  {
    code: "C-02",
    title: "B2B Sales Enablement & Commercialisation",
    body: "CRM architecture, named-account playbooks, and pricing logic — the commercial spine that turns marketing momentum into booked revenue.",
    brand: "market",
  },
  {
    code: "C-03",
    title: "Strategic Partnerships & Colocation",
    body: "Multi-stakeholder dealmaking between institutions, corporates, and foundations. Productised as Sprints and Deal Desks.",
    brand: "market",
  },
  {
    code: "C-04",
    title: "Institutional Brand & Reputation",
    body: "Institutional-grade brand systems, executive storytelling, and online reputation management for organisations where trust is the asset.",
    brand: "market",
  },
  {
    code: "C-05",
    title: "AI Agent Deployment",
    body: "Agentic workflows wired into the back office. Prebuilt patterns for hospitals, foundations, and global enterprise — not toy demos.",
    brand: "digital",
  },
  {
    code: "C-06",
    title: "Data Infrastructure & Automation",
    body: "Unified data, governed access, and automation that compounds across RevOps, finance, and operations. Measurable, auditable, owned.",
    brand: "digital",
  },
];

// The four-tier value ladder. Universal pattern across both pillars.
const LADDER = [
  {
    tier: "Free",
    label: "Audience",
    desc: "Diagnostics, briefings, scorecards. Top-of-funnel authority.",
    examples: ["Digital Growth Diagnostic", "Executive briefings", "Scorecards"],
  },
  {
    tier: "Toolkit",
    label: "Self-serve",
    desc: "Productised playbooks, templates, and operating systems.",
    examples: ["B2B Growth Stack", "Reputation Playbook", "Automation Architect Pack"],
  },
  {
    tier: "Cohort & Sprint",
    label: "Mid-ticket",
    desc: "Cohort programmes and 6–12 week productised engagements.",
    examples: ["Demand Sprint", "Partnership Sprint", "AI Adoption Sprint"],
  },
  {
    tier: "Retainer",
    label: "Bespoke",
    desc: "High-ticket advisory and fractional executive engagements.",
    examples: ["Growth Engine Retainer", "Fractional CDO", "Deal Desk"],
  },
];

// Diagnostic — two industries aligned to the two pillars.
const DIAGNOSTIC = {
  industries: [
    { id: "market", label: "Growth & Marketing", brand: "market" },
    { id: "digital", label: "Digital & AI", brand: "digital" },
  ],
  questions: {
    market: [
      {
        id: "m1",
        prompt: "What is your current state of demand-generation systems?",
        options: [
          { label: "Multi-channel engine, fully attributed", score: 4 },
          { label: "One or two channels working", score: 3 },
          { label: "Sporadic campaigns", score: 2 },
          { label: "Word of mouth only", score: 1 },
        ],
      },
      {
        id: "m2",
        prompt: "Content production cadence and editorial governance:",
        options: [
          { label: "Weekly+, owned editorial calendar", score: 4 },
          { label: "Monthly, inconsistent", score: 3 },
          { label: "Quarterly bursts", score: 2 },
          { label: "Effectively none", score: 1 },
        ],
      },
      {
        id: "m3",
        prompt: "Lifecycle automation (email, CRM, retention):",
        options: [
          { label: "Triggered journeys, segmented", score: 4 },
          { label: "Newsletter only", score: 2 },
          { label: "Manual blasts", score: 1 },
          { label: "No CRM at all", score: 0 },
        ],
      },
      {
        id: "m4",
        prompt: "B2B sales enablement maturity:",
        options: [
          { label: "Named accounts, CRM, forecasts", score: 4 },
          { label: "Loose pipeline, no forecasting", score: 2 },
          { label: "Ad-hoc, founder-led only", score: 1 },
          { label: "Nothing in place", score: 0 },
        ],
      },
      {
        id: "m5",
        prompt: "Institutional brand & online reputation health:",
        options: [
          { label: "Category reference; rehearsed media presence", score: 4 },
          { label: "Trusted, occasional coverage", score: 3 },
          { label: "Functional, replaceable, low share-of-voice", score: 2 },
          { label: "Invisible or exposed", score: 1 },
        ],
      },
    ],
    digital: [
      {
        id: "d1",
        prompt: "Where is your organisation in its AI adoption curve?",
        options: [
          { label: "Production agents in core workflows", score: 4 },
          { label: "Pilots in production, mixed results", score: 3 },
          { label: "Experimentation only — no production", score: 2 },
          { label: "Not started", score: 1 },
        ],
      },
      {
        id: "d2",
        prompt: "Data infrastructure maturity:",
        options: [
          { label: "Unified warehouse + governed access", score: 4 },
          { label: "Multiple sources, partial unification", score: 3 },
          { label: "Spreadsheets + scattered tools", score: 2 },
          { label: "Largely paper / unstructured", score: 1 },
        ],
      },
      {
        id: "d3",
        prompt: "How much of your back-office runs on automation today?",
        options: [
          { label: "Most repeatable workflows automated", score: 4 },
          { label: "Some automation, lots of manual work", score: 3 },
          { label: "Mostly manual", score: 2 },
          { label: "Entirely manual", score: 1 },
        ],
      },
      {
        id: "d4",
        prompt: "Internal capability to deploy and maintain AI tooling:",
        options: [
          { label: "Dedicated AI / engineering team", score: 4 },
          { label: "Tech-literate ops staff", score: 3 },
          { label: "Single champion, no team", score: 2 },
          { label: "No internal capability", score: 1 },
        ],
      },
      {
        id: "d5",
        prompt: "Documented digital transformation roadmap (12–24 months):",
        options: [
          { label: "Yes — quantified, owned, reviewed", score: 4 },
          { label: "Yes — narrative, not quantified", score: 3 },
          { label: "Drafts in slides, no owner", score: 2 },
          { label: "Nothing written", score: 1 },
        ],
      },
    ],
  },
};

function diagnosticVerdict(industry, totalPct) {
  const tiers = [
    { min: 80, band: "Compounding", brief: "You operate at the top decile. We work with peers like you on defensibility and category leadership.", recommend: "High-ticket retainer · benchmark advisory" },
    { min: 60, band: "Optimising", brief: "Strong fundamentals — material upside hides in plain sight. A 6–10 week sprint typically unlocks meaningful gains.", recommend: "Productised Sprint · Cohort programme" },
    { min: 35, band: "Underbuilt", brief: "Critical revenue is leaking through structural gaps. Foundational work is needed before scale spend pays off.", recommend: "Diagnostic + Roadmap · Toolkit + Sprint" },
    { min: 0, band: "Critical", brief: "Reputation, revenue, and runway are exposed. We recommend a full architectural engagement before further GTM spend.", recommend: "Bespoke advisory · Full Sprint" },
  ];
  return tiers.find(t => totalPct >= t.min);
}

Object.assign(window, {
  SUBBRANDS, SUBBRAND_BY_ID, CAPABILITIES, LADDER, DIAGNOSTIC, diagnosticVerdict,
});
