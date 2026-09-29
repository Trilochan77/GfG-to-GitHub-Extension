// background.js — Service Worker
// Handles GitHub API communication for the GfG to GitHub extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PUSH_TO_GITHUB") {
    handlePushToGitHub(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

/**
 * Pushes a file to GitHub using the Contents API.
 * Creates the file if it doesn't exist, or updates it if it does.
 */
async function handlePushToGitHub({ token, owner, repo, filePath, content, commitMessage }) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Check if file already exists (to get SHA for update)
  let sha = null;
  try {
    const checkRes = await fetch(apiUrl, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
  } catch (_) {
    // File doesn't exist yet — that's fine
  }

  // Encode content to Base64
  const base64Content = btoa(unescape(encodeURIComponent(content)));

  const body = {
    message: commitMessage,
    content: base64Content,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || `GitHub API error: ${res.status}`);
  }

  return await res.json();
}
