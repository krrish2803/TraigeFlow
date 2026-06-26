export interface FusionScoreInput {
  source_count: number;
  signal_count: number;
  sources: string[];
  first_seen: string;
}

export interface FusionScoreOutput {
  score: number;
  max_score: number;
  breakdown: {
    source_diversity: number;
    frequency: number;
    channel_authority: number;
    recency: number;
  };
}

export function calculateFusionScore(cluster: FusionScoreInput): number {
  const { source_count, signal_count, sources, first_seen } = cluster;
  let score = 0;

  const sourceDiversity = Math.min(source_count * 15, 60);
  score += sourceDiversity;

  const frequency = Math.min(signal_count * 8, 30);
  score += frequency;

  let channelAuthority = 0;
  if (sources.includes("github")) channelAuthority += 10;
  if (sources.includes("gmail")) channelAuthority += 5;
  if (sources.includes("slack")) channelAuthority += 3;
  if (sources.includes("jira")) channelAuthority += 3;
  score += channelAuthority;

  const hoursSinceFirst = (Date.now() - new Date(first_seen).getTime()) / 3600000;
  const recency = hoursSinceFirst < 2 ? 10 : hoursSinceFirst < 6 ? 6 : hoursSinceFirst < 24 ? 3 : 0;
  score += recency;

  return Math.min(Math.round(score), 100);
}

export function getFusionScoreBreakdown(cluster: FusionScoreInput): FusionScoreOutput {
  const sourceDiversity = Math.min(cluster.source_count * 15, 60);
  const frequency = Math.min(cluster.signal_count * 8, 30);
  let channelAuthority = 0;
  if (cluster.sources.includes("github")) channelAuthority += 10;
  if (cluster.sources.includes("gmail")) channelAuthority += 5;
  if (cluster.sources.includes("slack")) channelAuthority += 3;
  if (cluster.sources.includes("jira")) channelAuthority += 3;
  const hoursSinceFirst = (Date.now() - new Date(cluster.first_seen).getTime()) / 3600000;
  const recency = hoursSinceFirst < 2 ? 10 : hoursSinceFirst < 6 ? 6 : hoursSinceFirst < 24 ? 3 : 0;

  const total = sourceDiversity + frequency + channelAuthority + recency;

  return {
    score: Math.min(Math.round(total), 100),
    max_score: 100,
    breakdown: {
      source_diversity: sourceDiversity,
      frequency,
      channel_authority: channelAuthority,
      recency,
    },
  };
}
