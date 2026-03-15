type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

export type GithubFileChange = {
  path: string;
  content: string;
};

const GITHUB_API_BASE = "https://api.github.com";

const getGithubConfig = (): GithubConfig => {
  const token = import.meta.env.GITHUB_TOKEN;
  const owner = import.meta.env.GITHUB_OWNER;
  const repo = import.meta.env.GITHUB_REPO;
  const branch = import.meta.env.GITHUB_BRANCH || "master";

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub config. Required: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO");
  }

  return { token, owner, repo, branch };
};

const githubRequest = async <T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> => {
  const { token } = getGithubConfig();
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
};

const getBranchHeadSha = async (): Promise<string> => {
  const { owner, repo, branch } = getGithubConfig();
  const ref = await githubRequest<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );

  return ref.object.sha;
};

const getCommitTreeSha = async (commitSha: string): Promise<string> => {
  const { owner, repo } = getGithubConfig();
  const commit = await githubRequest<{ tree: { sha: string } }>(
    `/repos/${owner}/${repo}/git/commits/${commitSha}`,
  );

  return commit.tree.sha;
};

export const commitFilesToGithub = async (
  files: GithubFileChange[],
  message: string,
): Promise<{ commitSha: string }> => {
  if (!files.length) {
    throw new Error("No files provided for commit");
  }

  const { owner, repo, branch } = getGithubConfig();
  const headCommitSha = await getBranchHeadSha();
  const baseTreeSha = await getCommitTreeSha(headCommitSha);

  const newTree = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      })),
    }),
  });

  const commit = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [headCommitSha],
    }),
  });

  await githubRequest<{ ref: string; object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commit.sha,
        force: false,
      }),
    },
  );

  return { commitSha: commit.sha };
};
