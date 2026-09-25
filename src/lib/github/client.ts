import { Octokit } from "@octokit/rest";
import { env } from "@/lib/env";

export function getGitHubClient(userAccessToken?: string): Octokit {
  const token = userAccessToken || env.GITHUB_ACCESS_TOKEN;
  
  return new Octokit({
    auth: token,
    userAgent: "TechNexusOrg-Platform/1.0",
    request: {
      timeout: 10000,
    },
  });
}

export async function checkRateLimit(octokit: Octokit) {
  try {
    const { data } = await octokit.rest.rateLimit.get();
    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      resetDate: new Date(data.rate.reset * 1000),
    };
  } catch {
    return null;
  }
}
