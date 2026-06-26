import lemmaClient from "../../lib/lemma";

export async function ingestGithubSignal(input: {
  repo: string;
  since?: string;
}) {
  const [owner, repo] = input.repo.split("/");

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const sinceParam = input.since || new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&since=${encodeURIComponent(sinceParam)}&per_page=50`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

  const issues = await response.json();
  const results: string[] = [];

  for (const issue of issues) {
    if (issue.pull_request) continue;

    const existing = await lemmaClient.datastore.query(
      `SELECT id FROM feedback_items WHERE source = 'github' AND source_id = $1`,
      [String(issue.number)]
    );
    if (existing.rows.length > 0) continue;

    const record = await lemmaClient.records.create("feedback_items", {
      source: "github",
      source_id: String(issue.number),
      source_url: issue.html_url,
      raw_text: `${issue.title}\n\n${issue.body || ""}`,
      author: issue.user?.login,
      channel: input.repo,
      status: "pending",
    });

    await lemmaClient.workflows.start("classify-and-embed", {
      feedback_item_id: record.id,
    });

    results.push(record.id as string);
  }

  return { ingested: results.length, record_ids: results };
}
