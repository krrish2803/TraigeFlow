import lemmaClient from "../../lib/lemma";

const PREFIX_MAP: Record<string, string> = {
  auth: "AUTH",
  payments: "PAY",
  onboarding: "OBR",
  ui: "UI",
  api: "API",
  performance: "PERF",
  notifications: "NOTIF",
};

export async function generateIdentifier(input: { product_area: string }) {
  const prefix = PREFIX_MAP[input.product_area?.toLowerCase()] || "BUG";

  const result = await lemmaClient.datastore.query(
    `SELECT COUNT(*) as count FROM issue_drafts WHERE identifier LIKE $1`,
    [`${prefix}-%`]
  );

  const nextNum = (parseInt(String(result.rows[0]?.count || "0")) + 1).toString().padStart(3, "0");
  return { identifier: `${prefix}-${nextNum}` };
}
