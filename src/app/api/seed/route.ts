import { NextResponse } from "next/server";
import { getLemmaClient } from "@/lib/lemma/client";

const SEEDS = [
  { source: "slack" as const, author: "sarah.k", channel: "#bugs", body: "hey the login page keeps crashing on my iphone, tried 3 times. it happens right after i tap the login button. using ios 17. please fix asap.", title: "iOS login crash after tapping login button" },
  { source: "slack" as const, author: "dev.raj", channel: "#bugs", body: "same issue as sarah, happens right after google oauth redirect. the screen goes white then crashes. ios 17.2, iphone 15 pro.", title: "OAuth redirect crash on iOS 17.2" },
  { source: "slack" as const, author: "pm.priya", channel: "#general", body: "login is broken on mobile for like half the team. multiple people reporting issues with oauth login on iphone.", title: "Mobile login broken for team" },
  { source: "github" as const, author: "external-user", channel: "owner/repo", body: "iOS login crash after OAuth redirect\n\nApp crashes immediately after being redirected back from Google OAuth on iOS 17+. Crash happens 100% of the time.", title: "iOS OAuth redirect crash" },
  { source: "gmail" as const, author: "customer@email.com", channel: "support", body: "Subject: App crashes every time I try to sign in on mobile\n\nApp crashes right when I try to log in with Google. iPhone 14 Pro, iOS 17.1.", title: "Login crash on iPhone 14 Pro" },
  { source: "slack" as const, author: "support.1", channel: "#customer-issues", body: "payment is timing out on checkout, customer is waiting. tried 3 times already. getting a 504 error.", title: "Checkout payment timeout (504)" },
  { source: "github" as const, author: "dev-user", channel: "owner/repo", body: "Payment API timeout on checkout\n\nGetting 504 Gateway Timeout on POST /api/payments/create after ~30 seconds. Happens between 2-4 PM EST daily.", title: "Payment API 504 timeout" },
  { source: "gmail" as const, author: "paying.customer@email.com", channel: "support", body: "Subject: Payment not going through\n\nI've tried to pay 3 times and it keeps saying the request timed out.", title: "Payment request timeout" },
  { source: "slack" as const, author: "cx.team", channel: "#product", body: "users keep getting stuck on step 3 of onboarding, what does 'configure workspace' even mean. getting a blank screen on ipad mini.", title: "Onboarding blank screen on iPad" },
  { source: "gmail" as const, author: "new.user@email.com", channel: "support", body: "Subject: Confused by setup process\n\nStep 3 of the onboarding is just a blank screen on my iPad.", title: "Onboarding step 3 blank" },
  { source: "slack" as const, author: "user.1", channel: "#general", body: "👍", title: "Thumbs up" },
  { source: "slack" as const, author: "user.2", channel: "#support", body: "thanks!", title: "Thanks" },
  { source: "slack" as const, author: "user.3", channel: "#bugs", body: "ok", title: "Ok" },
  { source: "gmail" as const, author: "feature.fan@email.com", channel: "feedback", body: "Subject: Feature request: dark mode\n\nWould love to see a dark mode option added to the app.", title: "Dark mode feature request" },
  { source: "github" as const, author: "open-source-contributor", channel: "owner/repo", body: "Add dark mode support\n\nIt would be great if the app supported a dark mode theme.", title: "Dark mode support request" },
];

export async function POST() {
  const lemma = getLemmaClient();
  const store = lemma.store;
  store.clear();

  // ── Directly populate store with demo data (skip slow AI pipeline) ──
  const signalIds: string[] = [];

  // Create signals with pre-classified data
  for (const seed of SEEDS) {
    const isNoise = seed.body.length < 10 || /^(👍|thanks!?|thx|ok|okay|test)$/i.test(seed.body.trim());
    const isFeature = /feature|would like|suggestion|dark mode/i.test(seed.body);
    const isPayment = /payment|checkout|timeout|504/i.test(seed.body);
    const isAuth = /login|signin|oauth|auth|crash/i.test(seed.body);
    const isOnboarding = /onboard|step|setup|blank|confused/i.test(seed.body);

    const productArea = isAuth ? "auth" : isPayment ? "payments" : isOnboarding ? "onboarding" : isFeature ? "ui" : "core_product";
    const severity: "critical" | "medium" | "low" = isAuth ? "critical" : isPayment ? "critical" : isOnboarding ? "medium" : "low";
    const label = isNoise ? "noise" : isFeature ? "feature" : "bug";

    const signal = store.createSignal({
      source: seed.source,
      sourceMessageId: `seed-${Date.now()}-${signalIds.length}`,
      title: seed.title,
      body: seed.body,
      author: seed.author,
      channel: seed.channel,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      status: isNoise ? "noise" : "pending",
      label,
      severity,
      productArea,
      evidence: [{
        type: "seed_data",
        description: `Pre-classified as ${label} (${severity})`,
        confidence: 0.95,
        details: `Product area: ${productArea}`,
      }],
    });

    signalIds.push(signal.id);
  }

  // ── Create clusters for the meaningful signals ──
  const authSignals = signalIds.slice(0, 5);
  const authCluster = store.createCluster({
    canonicalTitle: "iOS OAuth redirect crash cluster",
    summary: "Multiple reports of iOS app crashing during Google OAuth login flow. Affects iOS 17+ across iPhone models.",
    signalIds: authSignals,
    sourceTypes: ["slack", "github", "gmail"],
    severity: "critical",
    severityScore: 9,
    confidence: 0.92,
    productArea: "auth",
    status: "draft_generated",
    firstSeen: new Date(Date.now() - 86400000 * 6).toISOString(),
    lastSeen: new Date().toISOString(),
    rootCauseHypothesis: "Race condition in OAuth token refresh handler during redirect callback on iOS WebView",
    releaseRisk: "block",
    affectedModules: ["auth/oauth-handler", "auth/session-manager", "frontend/login-page"],
  });
  for (const sid of authSignals) {
    store.updateSignal(sid, { relatedClusterId: authCluster.id, status: "clustered" });
  }

  const paymentSignals = signalIds.slice(5, 8);
  const paymentCluster = store.createCluster({
    canonicalTitle: "Payment checkout timeout cluster",
    summary: "Payment API timing out during checkout process. 504 Gateway Timeout errors during peak hours.",
    signalIds: paymentSignals,
    sourceTypes: ["slack", "github", "gmail"],
    severity: "critical",
    severityScore: 8,
    confidence: 0.88,
    productArea: "payments",
    status: "draft_generated",
    firstSeen: new Date(Date.now() - 86400000 * 4).toISOString(),
    lastSeen: new Date().toISOString(),
    rootCauseHypothesis: "Payment API rate limiting and connection pool exhaustion during peak traffic hours",
    releaseRisk: "block",
    affectedModules: ["payments/checkout-flow", "payments/api-gateway"],
  });
  for (const sid of paymentSignals) {
    store.updateSignal(sid, { relatedClusterId: paymentCluster.id, status: "clustered" });
  }

  const onboardingSignals = signalIds.slice(8, 10);
  const onboardingCluster = store.createCluster({
    canonicalTitle: "Onboarding step 3 blank screen cluster",
    summary: "Users getting stuck on step 3 of onboarding wizard with blank screen on iPad Mini.",
    signalIds: onboardingSignals,
    sourceTypes: ["slack", "gmail"],
    severity: "medium",
    severityScore: 4,
    confidence: 0.75,
    productArea: "onboarding",
    status: "draft_generated",
    firstSeen: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastSeen: new Date().toISOString(),
    rootCauseHypothesis: "CSS media query breakpoint mismatch in onboarding wizard at intermediate viewport widths",
    releaseRisk: "caution",
    affectedModules: ["onboarding/wizard", "onboarding/step-manager", "frontend/ui-components"],
  });
  for (const sid of onboardingSignals) {
    store.updateSignal(sid, { relatedClusterId: onboardingCluster.id, status: "clustered" });
  }

  // ── Create drafts from clusters ──
  const drafts: Array<{
    clusterId: string; title: string; identifier: string; summary: string;
    reproSteps: string; severity: "critical" | "medium"; releaseRisk: "block" | "caution";
    ownerSuggestion: string; approvalStatus: "pending";
  }> = [
    { clusterId: authCluster.id, title: "[Auth] iOS OAuth redirect causes app crash on login", identifier: "AUTH-421", summary: "App crashes 100% of the time when users attempt to log in via Google OAuth on iOS 17+. The crash occurs immediately after the OAuth redirect callback is received, before the session can be established. Multiple users across different iPhone models are affected.", reproSteps: "1. Open app on iPhone running iOS 17+\n2. Tap 'Sign in with Google'\n3. Complete OAuth consent in browser\n4. Observe app crash on redirect back to app", severity: "critical", releaseRisk: "block", ownerSuggestion: "mobile-auth-team", approvalStatus: "pending" },
    { clusterId: paymentCluster.id, title: "[Payments] Checkout API returning 504 during peak hours", identifier: "PAY-389", summary: "Payment checkout flow consistently returns 504 Gateway Timeout errors on POST /api/payments/create between 2-4 PM EST daily. Affected users cannot complete purchases during this window.", reproSteps: "1. Add item to cart\n2. Proceed to checkout\n3. Enter payment details\n4. Tap 'Pay Now'\n5. Observe spinner for ~30s then 504 error", severity: "critical", releaseRisk: "block", ownerSuggestion: "payments-team", approvalStatus: "pending" },
    { clusterId: onboardingCluster.id, title: "[Onboarding] Step 3 blank screen on iPad Mini", identifier: "ONB-156", summary: "The onboarding wizard's step 3 ('Configure Workspace') renders as a blank white screen on iPad Mini. Users cannot proceed past this step on that device.", reproSteps: "1. Install app on iPad Mini\n2. Complete steps 1-2 of onboarding\n3. Reach step 3 'Configure Workspace'\n4. Observe blank screen with no content", severity: "medium", releaseRisk: "caution", ownerSuggestion: "ux-team", approvalStatus: "pending" },
  ];

  for (const d of drafts) {
    const draft = store.createDraft({
      clusterId: d.clusterId,
      identifier: d.identifier,
      title: d.title,
      summary: d.summary,
      reproductionSteps: d.reproSteps,
      expectedBehavior: "The app should complete the operation without errors",
      actualBehavior: d.severity === "critical" ? "Users experience a complete failure" : "Users experience unexpected behavior",
      severity: d.severity,
      confidence: 0.88,
      ownerSuggestion: d.ownerSuggestion,
      releaseRisk: d.releaseRisk,
      releaseRiskReason: d.releaseRisk === "block" ? "Critical severity with multiple user-impact signals across multiple sources" : "Should be monitored closely",
      approvalStatus: d.approvalStatus,
      evidence: [{ type: "draft_generation", description: "Generated seed draft", confidence: 0.9, details: "Seed data for demo" }],
    });
    store.updateCluster(d.clusterId, { status: "draft_generated" });

    store.addActivity({
      type: "draft_created",
      actor: "Demo Seed",
      description: `Draft "${d.title}" generated from cluster`,
      entityType: "draft",
      entityId: draft.id,
      metadata: { identifier: d.identifier, severity: d.severity },
    });
  }

  // ── Create activities for demo timeline ──
  const activityData = [
    { type: "ingest", actor: "Slack Integration", description: "Ingested signal from #bugs: iOS login crash", entityType: "signal" as const, entityId: signalIds[0] },
    { type: "ingest", actor: "Slack Integration", description: "Ingested signal from #bugs: OAuth redirect crash", entityType: "signal" as const, entityId: signalIds[1] },
    { type: "ingest", actor: "Slack Integration", description: "Ingested signal from #general: Mobile login broken", entityType: "signal" as const, entityId: signalIds[2] },
    { type: "ingest", actor: "GitHub Integration", description: "Ingested issue: iOS OAuth redirect crash", entityType: "signal" as const, entityId: signalIds[3] },
    { type: "ingest", actor: "Gmail Integration", description: "Ingested support email: Login crash on iPhone", entityType: "signal" as const, entityId: signalIds[4] },
    { type: "triage", actor: "Classify Agent", description: "Classified 5 auth-related signals as CRITICAL", entityType: "cluster" as const, entityId: authCluster.id },
    { type: "triage", actor: "Similarity Agent", description: "Merged 5 signals into iOS OAuth crash cluster", entityType: "cluster" as const, entityId: authCluster.id },
    { type: "triage", actor: "Draft Agent", description: "Draft created: [Auth] iOS OAuth redirect causes app crash on login (AUTH-421)", entityType: "draft" as const, entityId: "draft-1" },
    { type: "ingest", actor: "Slack Integration", description: "Ingested signal from #customer-issues: Payment timeout", entityType: "signal" as const, entityId: signalIds[5] },
    { type: "ingest", actor: "GitHub Integration", description: "Ingested issue: Payment API 504 timeout", entityType: "signal" as const, entityId: signalIds[6] },
    { type: "ingest", actor: "Gmail Integration", description: "Ingested support email: Payment request timeout", entityType: "signal" as const, entityId: signalIds[7] },
    { type: "triage", actor: "Classify Agent", description: "Classified 3 payment signals as CRITICAL", entityType: "cluster" as const, entityId: paymentCluster.id },
    { type: "triage", actor: "Draft Agent", description: "Draft created: [Payments] Checkout API returning 504 (PAY-389)", entityType: "draft" as const, entityId: "draft-2" },
    { type: "ingest", actor: "Slack Integration", description: "Ingested signal from #product: Onboarding blank screen", entityType: "signal" as const, entityId: signalIds[8] },
    { type: "ingest", actor: "Gmail Integration", description: "Ingested support email: Onboarding step 3 blank", entityType: "signal" as const, entityId: signalIds[9] },
    { type: "triage", actor: "Classify Agent", description: "Classified 2 onboarding signals as MEDIUM", entityType: "cluster" as const, entityId: onboardingCluster.id },
    { type: "triage", actor: "Draft Agent", description: "Draft created: [Onboarding] Step 3 blank screen (ONB-156)", entityType: "draft" as const, entityId: "draft-3" },
    { type: "triage", actor: "Review Agent", description: "Draft AUTH-421 passed review, awaiting approval", entityType: "draft" as const, entityId: "draft-1" },
    { type: "triage", actor: "Review Agent", description: "Draft PAY-389 passed review, awaiting approval", entityType: "draft" as const, entityId: "draft-2" },
  ];

  for (const a of activityData) {
    store.addActivity(a);
  }

  const clusters = store.getClusters();
  const allDrafts = store.getDrafts();
  const activities = store.getActivities();

  return NextResponse.json({
    ok: true,
    seeds: { signals: signalIds.length, clusters: clusters.length, drafts: allDrafts.length, activity: activities.length },
  });
}
