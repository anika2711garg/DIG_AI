const ISSUE_URL = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i;

export function parseGithubIssue(input: string): { fullName: string; issueNumber: number } | null {
  const trimmed = input.trim();
  const match = trimmed.match(ISSUE_URL);
  if (!match) return null;
  return { fullName: `${match[1]}/${match[2]}`, issueNumber: Number(match[3]) };
}

export function issueUrl(fullName: string, issueNumber: number) {
  return `https://github.com/${fullName}/issues/${issueNumber}`;
}

export function isSensitivePath(path: string) {
  return (
    /^\.github\/workflows\//.test(path) ||
    /(^|\/)(\.env|\.env\..+)$/.test(path) ||
    /(^|\/)(Dockerfile|docker-compose\.ya?ml)$/i.test(path) ||
    /(^|\/)(vercel\.json|netlify\.toml|fly\.toml)$/i.test(path) ||
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock)$/i.test(path)
  );
}

export function pathsFromDiff(diff?: string | null) {
  if (!diff) return [];
  const files = new Set<string>();
  for (const line of diff.split("\n")) {
    const match = line.match(/^\+\+\+ b\/(.+)$/) ?? line.match(/^--- a\/(.+)$/);
    if (match && match[1] !== "/dev/null") files.add(match[1]);
  }
  return [...files];
}
