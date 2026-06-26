export { createGithubIssue } from "./github";
export type { SurfaceInput as GithubInput, SurfaceResult as GithubResult } from "./github";

export { createJiraIssue } from "./jira";
export type { SurfaceInput as JiraInput, SurfaceResult as JiraResult } from "./jira";

export { postSlackMessage, postActivityUpdate } from "./slack";
export type { SurfaceInput as SlackInput, SurfaceResult as SlackResult } from "./slack";

export { ingestGmailSignal } from "./gmail";
export type { GmailSignalInput, GmailSignalResult } from "./gmail";
