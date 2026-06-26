export interface JiraIssueInput {
  title: string;
  summary: string;
  reproSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: string;
  suggestedOwner: string;
}

export interface JiraIssueResult {
  issueKey: string;
  issueUrl: string;
  mock: boolean;
}

let nextJiraNum = 221;

export async function createJiraIssue(input: JiraIssueInput): Promise<JiraIssueResult> {
  const baseUrl = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_TOKEN;

  if (!baseUrl || !email || !token) {
    const issueKey = `JIRA-${nextJiraNum++}`;
    const result: JiraIssueResult = {
      issueKey,
      issueUrl: `https://your-domain.atlassian.net/browse/${issueKey}`,
      mock: true,
    };
    console.log(`[Jira Mock] Created issue ${issueKey}: ${input.title}`);
    return result;
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
    issueKey: data.key,
    issueUrl: `${baseUrl}/browse/${data.key}`,
    mock: false,
  };
}
