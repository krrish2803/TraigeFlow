export const FEATURES = [
  {
    title: "Multi-Source Ingestion",
    description:
      "Connect Slack, Gmail, GitHub Issues, and Jira in one click. All feedback flows into a unified inbox, automatically classified and deduplicated by AI.",
    stat: "4 sources",
    gradient: "from-violet-500/20 to-violet-500/5",
    icon: "⊞",
  },
  {
    title: "AI Signal Fusion",
    description:
      "Our multi-agent pipeline clusters duplicate reports into single issues. Watch signals from different sources converge into one root cause analysis with 94% accuracy.",
    stat: "94% accuracy",
    gradient: "from-blue-500/20 to-blue-500/5",
    icon: "⟐",
  },
  {
    title: "Severity Scoring",
    description:
      "Every cluster gets a severity score (0–10) and confidence rating. Critical issues surface immediately. Noise is filtered automatically before it reaches engineering.",
    stat: "Real-time",
    gradient: "from-rose-500/20 to-rose-500/5",
    icon: "▲",
  },
  {
    title: "Draft Generation",
    description:
      "AI writes structured GitHub issues with summaries, repro steps, and suggested owners. Review, edit, and approve with one click. Average triage time: 12 seconds.",
    stat: "12s avg",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    icon: "⊟",
  },
  {
    title: "Release Risk Analysis",
    description:
      "Before shipping, get a digest of all open issues mapped to release risk. Know exactly what blocks, what's cautionary, and what's safe for deployment.",
    stat: "Risk score",
    gradient: "from-amber-500/20 to-amber-500/5",
    icon: "↑",
  },
  {
    title: "Workflow Automation",
    description:
      "Configure triage rules, auto-assign owners, and route issues to the right team. The pipeline runs continuously in the background, 24/7.",
    stat: "Always on",
    gradient: "from-indigo-500/20 to-indigo-500/5",
    icon: "⚙",
  },
];

export const MOCK_SIGNALS = [
  {
    id: "sig-1",
    source: "Slack",
    from: "sarah.k",
    text: "hey the login page keeps crashing on my iphone, tried 3 times. happens right after i tap the login button. using ios 17.",
    timestamp: "2 min ago",
    avatar: "SK",
    color: "#4A154B",
  },
  {
    id: "sig-2",
    source: "Gmail",
    from: "support@customer.com",
    text: "Your app crashes every time I try to sign in on my mobile device. iPhone 14 Pro, iOS 17.1. Have tried reinstalling. Nothing works.",
    timestamp: "5 min ago",
    avatar: "SC",
    color: "#EA4335",
  },
  {
    id: "sig-3",
    source: "GitHub",
    from: "end-user-reporter",
    text: "iOS login crash after OAuth redirect. Steps: 1) Open app on iPhone 2) Sign in with Google 3) Complete consent 4) Crash to home screen.",
    timestamp: "8 min ago",
    avatar: "EU",
    color: "#24292E",
  },
  {
    id: "sig-4",
    source: "Jira",
    from: "JIR-089",
    text: "Investigate mobile auth stability — priority: Medium. Multiple crash reports on iOS 17+ during OAuth sign-in flow. Affects ~34% of mobile traffic.",
    timestamp: "1 hr ago",
    avatar: "JR",
    color: "#0052CC",
  },
];

export const MOCK_FUSION_OUTPUT = {
  title: "Mobile OAuth Login Crash",
  severity: "CRITICAL",
  score: 9.2,
  confidence: 94,
  sources: ["Slack", "Gmail", "GitHub", "Jira"],
  summary:
    "Users on iOS 17+ experience a hard crash when attempting to log in via Google OAuth. The crash occurs immediately after the OAuth consent redirect completes, before the app can establish a session. Affects approximately 34% of mobile traffic.",
  rootCause:
    "Race condition in OAuth token refresh handler on iOS Safari webview. The callback race between token exchange and session creation causes a null pointer dereference.",
  signals: 5,
  area: "Authentication",
};

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
];

export const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Documentation"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "GDPR"],
};
