export interface SurfaceInput {
  title: string;
  summary: string;
  reproSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: string;
  suggestedOwner: string;
}

export interface SurfaceResult {
  ok: boolean;
  ref: string;
  refUrl: string;
  mock: boolean;
}

let nextJiraNum = 221;

export async function createJiraIssue(input: SurfaceInput): Promise<SurfaceResult> {
  const baseUrl = process.env.JIRA_INSTANCE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    const issueKey = `JIRA-${nextJiraNum++}`;
    console.log(`[Jira Surface Mock] ${issueKey}: ${input.title}`);
    return {
      ok: true,
      ref: issueKey,
      refUrl: `${baseUrl || "https://your-domain.atlassian.net"}/browse/${issueKey}`,
      mock: true,
    };
  }

  const body = [
    `*Summary:* ${input.summary}`,
    `*Steps to Reproduce:* ${input.reproSteps}`,
    `*Expected:* ${input.expectedBehavior}`,
    `*Actual:* ${input.actualBehavior}`,
    `*Severity:* ${input.severity}`,
  ].join("\n");

  const res = await fetch(`${baseUrl}/rest/api/2/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: process.env.JIRA_PROJECT_KEY || "DEV" },
        summary: input.title,
        description: body,
        issuetype: { name: "Bug" },
        labels: [input.severity],
        assignee: input.suggestedOwner ? { name: input.suggestedOwner } : undefined,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Jira API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    ok: true,
    ref: data.key,
    refUrl: `${baseUrl}/browse/${data.key}`,
    mock: false,
  };
}
