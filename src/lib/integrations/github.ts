export interface GithubIssueInput {
  title: string;
  summary: string;
  reproSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  labels: string[];
  suggestedOwner: string;
}

export interface GithubIssueResult {
  issueNumber: number;
  issueUrl: string;
  mock: boolean;
}

let nextIssueNum = 1042;

export async function createGithubIssue(input: GithubIssueInput): Promise<GithubIssueResult> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "owner/repo";

  if (!token) {
    const issueNumber = nextIssueNum++;
    const result: GithubIssueResult = {
      issueNumber,
      issueUrl: `https://github.com/${repo}/issues/${issueNumber}`,
      mock: true,
    };
    console.log(`[GitHub Mock] Created issue #${issueNumber}: ${input.title}`);
    return result;
  }

  const body = [
    `## Summary`,
    input.summary,
    ``,
    `## Steps to Reproduce`,
    input.reproSteps,
    ``,
    `## Expected Behavior`,
    input.expectedBehavior,
    ``,
    `## Actual Behavior`,
    input.actualBehavior,
    ``,
    `**Suggested Owner:** ${input.suggestedOwner}`,
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "signal2fix",
    },
    body: JSON.stringify({
      title: input.title,
      body,
      labels: input.labels,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    issueNumber: data.number,
    issueUrl: data.html_url,
    mock: false,
  };
}
