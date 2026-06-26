import lemmaClient from "./lemma";

export const SEED_SIGNALS = [
  {
    source: "slack",
    raw_text: "hey the login page keeps crashing on my iphone, tried 3 times. it happens right after i tap the login button. using ios 17. please fix asap.",
    author: "sarah.k",
    channel: "#bugs",
  },
  {
    source: "slack",
    raw_text: "same issue as sarah, happens right after google oauth redirect. the screen goes white then crashes. ios 17.2, iphone 15 pro.",
    author: "dev.raj",
    channel: "#bugs",
  },
  {
    source: "slack",
    raw_text: "login is broken on mobile for like half the team. multiple people reporting issues with oauth login on iphone.",
    author: "pm.priya",
    channel: "#general",
  },
  {
    source: "github",
    raw_text: "iOS login crash after OAuth redirect\n\nApp crashes immediately after being redirected back from Google OAuth on iOS 17+. Crash happens 100% of the time.\n\nSteps to reproduce:\n1. Open app on iPhone 15 Pro\n2. Tap 'Sign in with Google'\n3. Complete OAuth consent\n4. App crashes to home screen\n\niOS 17.2, iPhone 15 Pro Max",
    author: "external-user",
    channel: "owner/repo",
  },
  {
    source: "gmail",
    raw_text: "Subject: App crashes every time I try to sign in on mobile\n\nHi, I've been trying to use your app for the past week but it keeps crashing right when I try to log in with Google. I've tried reinstalling and restarting my phone. Nothing works. Please help. iPhone 14 Pro, iOS 17.1.",
    author: "customer@email.com",
    channel: "support",
  },
  {
    source: "slack",
    raw_text: "payment is timing out on checkout, customer is waiting. tried 3 times already. getting a 504 error.",
    author: "support.1",
    channel: "#customer-issues",
  },
  {
    source: "github",
    raw_text: "Payment API timeout on checkout\n\nGetting 504 Gateway Timeout on POST /api/payments/create after ~30 seconds. Happens between 2-4 PM EST daily.",
    author: "dev-user",
    channel: "owner/repo",
  },
  {
    source: "gmail",
    raw_text: "Subject: Payment not going through\n\nI've tried to pay 3 times now and it keeps saying the request timed out. Please help. I need this subscription to work.",
    author: "paying.customer@email.com",
    channel: "support",
  },
  {
    source: "slack",
    raw_text: "users keep getting stuck on step 3 of onboarding, what does 'configure workspace' even mean. getting a blank screen on ipad mini.",
    author: "cx.team",
    channel: "#product",
  },
  {
    source: "gmail",
    raw_text: "Subject: Confused by setup process\n\nI don't understand what I need to do in step 3 of the onboarding. There's no explanation and the screen is just blank on my iPad.",
    author: "new.user@email.com",
    channel: "support",
  },
  {
    source: "slack",
    raw_text: "👍",
    author: "user.1",
    channel: "#general",
  },
  {
    source: "slack",
    raw_text: "thanks!",
    author: "user.2",
    channel: "#support",
  },
  {
    source: "slack",
    raw_text: "ok",
    author: "user.3",
    channel: "#bugs",
  },
  {
    source: "gmail",
    raw_text: "Subject: Feature request: dark mode\n\nWould love to see a dark mode option added to the app. The bright white background is hard on the eyes.",
    author: "feature.fan@email.com",
    channel: "feedback",
  },
  {
    source: "github",
    raw_text: "Add dark mode support\n\nIt would be great if the app supported a dark mode theme. Many users have requested this feature.",
    author: "open-source-contributor",
    channel: "owner/repo",
  },
];

export async function seedDemoData() {
  for (const signal of SEED_SIGNALS) {
    const record = await lemmaClient.records.create("feedback_items", {
      source: signal.source,
      source_id: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      raw_text: signal.raw_text,
      author: signal.author,
      channel: signal.channel,
      status: "pending",
    });

    await lemmaClient.workflows.start("classify-and-embed", {
      feedback_item_id: record.id,
    });
  }

  await lemmaClient.records.create("action_log", {
    event_type: "signal_ingested",
    entity_type: "system",
    entity_id: "seed-run",
    actor: "system",
    metadata: { action: "seeded_demo_data", count: SEED_SIGNALS.length },
  });

  return { seeded: SEED_SIGNALS.length };
}
