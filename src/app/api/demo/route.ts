import { NextRequest, NextResponse } from "next/server";
import { getLemmaClient } from "@/lib/lemma/client";

const DEMO_SCENARIOS = [
  {
    id: "slack-login-crash",
    source: "slack" as const,
    body: "hey the login page keeps crashing on my iphone, tried 3 times. it happens right after i tap the login button. using ios 17. please fix asap.",
    author: "sarah.k",
    channel: "#bugs",
    title: "iOS login crash after tapping login button",
    sourceMessageId: "1715000000.000100",
    externalUrl: "https://slack.com/archives/C01Bugs/p1715000000000100",
    rawType: "message",
    metadata: { teamId: "T001", channelType: "public" },
  },
  {
    id: "gmail-payment-fail",
    source: "gmail" as const,
    body: "Subject: Payment not going through\n\nI've tried to pay 3 times now and it keeps saying the request timed out. Please help. I need this subscription to work.",
    author: "paying.customer@email.com",
    channel: "support",
    title: "Payment timeout on checkout",
    sourceMessageId: "msg-1715000001",
    externalUrl: "https://mail.google.com/mail/u/0/#inbox/msg-1715000001",
    rawType: "message",
    metadata: { threadId: "thread-1715000001", labelIds: ["INBOX", "IMPORTANT"] },
  },
  {
    id: "slack-onboarding-blank",
    source: "slack" as const,
    body: "users keep getting stuck on step 3 of onboarding, what does 'configure workspace' even mean. getting a blank screen on ipad mini.",
    author: "cx.team",
    channel: "#product",
    title: "Onboarding step 3 blank screen on iPad Mini",
    sourceMessageId: "1715000002.000300",
    rawType: "message",
    metadata: { teamId: "T001", channelType: "public" },
  },
  {
    id: "github-api-timeout",
    source: "github" as const,
    body: "API timeout on user data endpoint\n\nGET /api/v2/users consistently returns 504 after 30s during peak hours. Affects all endpoints behind the user-service gateway.",
    author: "backend-dev",
    channel: "org/repo",
    title: "API gateway timeout during peak hours",
    sourceMessageId: "200000001",
    externalUrl: "https://github.com/org/repo/issues/42",
    rawType: "issues.opened",
    metadata: { repo: "org/repo", issueNumber: 42, labels: ["bug", "performance"] },
  },
  {
    id: "gmail-dark-mode",
    source: "gmail" as const,
    body: "Subject: Feature request: dark mode\n\nWould love to see a dark mode option added to the app. The bright white background is hard on the eyes, especially at night.",
    author: "feature.fan@email.com",
    channel: "feedback",
    title: "Dark mode feature request",
    sourceMessageId: "msg-1715000004",
    rawType: "message",
    metadata: { threadId: "thread-1715000004", labelIds: ["INBOX"] },
  },
  {
    id: "slack-auth-broken",
    source: "slack" as const,
    body: "oauth is completely broken on the latest release. nobody can sign in with google anymore. rolling back would be great. cc @engineering",
    author: "pm.alex",
    channel: "#critical",
    title: "OAuth sign-in completely broken on latest release",
    sourceMessageId: "1715000005.000600",
    rawType: "message",
    metadata: { teamId: "T001", channelType: "public", mentions: ["engineering"] },
  },
];

export async function GET() {
  return NextResponse.json({ scenarios: DEMO_SCENARIOS });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { scenarioId, source, body: textBody, author, channel } = body;

  const lemma = getLemmaClient();

  let signal;

  if (scenarioId) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    signal = lemma.ingestSignal({
      source: scenario.source,
      sourceMessageId: (scenario as Record<string, unknown>).sourceMessageId as string,
      body: scenario.body,
      author: scenario.author,
      channel: scenario.channel,
      title: scenario.title,
      externalUrl: (scenario as Record<string, unknown>).externalUrl as string,
      rawType: (scenario as Record<string, unknown>).rawType as string,
      metadata: (scenario as Record<string, unknown>).metadata as Record<string, unknown>,
    });
  } else if (source && textBody) {
    signal = lemma.ingestSignal({
      source,
      body: textBody,
      author: author || "demo-user",
      channel: channel || "#demo",
      title: textBody.slice(0, 80),
    });
  } else {
    return NextResponse.json({ error: "scenarioId or source+body required" }, { status: 400 });
  }

  // Trigger full pipeline (ingest + triage) in Lemma
  lemma.runFullPipeline(signal.id);

  return NextResponse.json({
    ok: true,
    signalId: signal.id,
    signal: {
      id: signal.id,
      title: signal.title,
      source: signal.source,
      status: signal.status,
    },
  });
}
