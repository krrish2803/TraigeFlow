import { NextResponse } from "next/server";
import { getLemmaClient } from "@/lib/lemma/client";

const SEEDS = [
  { source: "slack" as const, author: "sarah.k", channel: "#bugs", body: "hey the login page keeps crashing on my iphone, tried 3 times. it happens right after i tap the login button. using ios 17. please fix asap.", title: "iOS login crash" },
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
  lemma.store.clear();

  const signalIds: string[] = [];

  for (const seed of SEEDS) {
    const signal = lemma.ingestSignal({
      source: seed.source,
      body: seed.body,
      author: seed.author,
      channel: seed.channel,
      title: seed.title,
    });
    signalIds.push(signal.id);
    // Run full pipeline (ingest + triage) for each signal
    await lemma.runFullPipeline(signal.id);
  }

  const clusters = lemma.store.getClusters();
  const drafts = lemma.store.getDrafts();
  const activities = lemma.store.getActivities();

  return NextResponse.json({
    ok: true,
    seeds: { signals: signalIds.length, clusters: clusters.length, drafts: drafts.length, activity: activities.length },
  });
}
