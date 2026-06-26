export interface SurfaceInput {
  title: string;
  summary: string;
  reproSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  labels: string[];
  suggestedOwner: string;
}

export interface SurfaceResult {
  ok: boolean;
  ref: string;
  refUrl: string;
  mock: boolean;
}

let nextIssueNum = 1042;

export async function createGithubIssue(input: SurfaceInput): Promise<SurfaceResult> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const repoPath = owner && repo ? `${owner}/${repo}` : "owner/repo";

  if (!token) {
    const issueNumber = nextIssueNum++;
    console.log(`[GitHub Surface Mock] Issue #${issueNumber}: ${input.title}`);
    return {
      ok: true,
      ref: `GH-${issueNumber}`,
      refUrl: `https://github.com/${repoPath}/issues/${issueNumber}`,
      mock: true,
    };
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

  const res = await fetch(`https://api.github.com/repos/${repoPath}/issues`, {
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
    ok: true,
    ref: `GH-${data.number}`,
    refUrl: data.html_url,
    mock: false,
  };
}
