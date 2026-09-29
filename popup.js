// popup.js — Settings popup logic for GfG to GitHub extension

const tokenInput = document.getElementById("token");
const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const saveBtn = document.getElementById("save-btn");
const saveBtnText = document.getElementById("save-btn-text");
const statusBanner = document.getElementById("status-banner");
const toggleTokenBtn = document.getElementById("toggle-token");

// --- Load saved settings on open ---
chrome.storage.local.get(["token", "owner", "repo"], (items) => {
  if (items.token) tokenInput.value = items.token;
  // Pre-fill defaults for Trilochan77
  ownerInput.value = items.owner || "Trilochan77";
  repoInput.value = items.repo || "GfG-to-GitHub-Extension";
  validateInputs();
});

// --- Toggle token visibility ---
let tokenVisible = false;
toggleTokenBtn.addEventListener("click", () => {
  tokenVisible = !tokenVisible;
  tokenInput.type = tokenVisible ? "text" : "password";
  document.getElementById("eye-icon").innerHTML = tokenVisible
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

// --- Real-time validation ---
function validateInputs() {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();

  const tokenValid = token.length > 10;
  const ownerValid = owner.length > 0 && /^[a-zA-Z0-9_-]+$/.test(owner);
  const repoValid = repo.length > 0 && /^[a-zA-Z0-9_.-]+$/.test(repo);

  tokenInput.className = `input ${token ? (tokenValid ? "valid" : "invalid") : ""}`;
  ownerInput.className = `input ${owner ? (ownerValid ? "valid" : "invalid") : ""}`;
  repoInput.className = `input ${repo ? (repoValid ? "valid" : "invalid") : ""}`;

  saveBtn.disabled = !(tokenValid && ownerValid && repoValid);
}

tokenInput.addEventListener("input", validateInputs);
ownerInput.addEventListener("input", validateInputs);
repoInput.addEventListener("input", validateInputs);

// --- Save settings ---
saveBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();

  saveBtnText.textContent = "Verifying...";
  saveBtn.disabled = true;

  // Verify token by fetching the user's repos
  const verified = await verifyGitHubCredentials(token, owner, repo);

  if (!verified.ok) {
    showBanner("error", `❌ ${verified.error}`);
    saveBtnText.textContent = "Save Settings";
    saveBtn.disabled = false;
    return;
  }

  chrome.storage.local.set({ token, owner, repo }, () => {
    showBanner("success", `✅ Saved! Repo: ${owner}/${repo}`);
    saveBtnText.textContent = "Saved ✓";
    setTimeout(() => {
      saveBtnText.textContent = "Save Settings";
      saveBtn.disabled = false;
    }, 2000);
  });
});

// --- Verify GitHub credentials ---
async function verifyGitHubCredentials(token, owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (res.status === 401) return { ok: false, error: "Invalid token. Check your GitHub PAT." };
    if (res.status === 404) return { ok: false, error: `Repo '${owner}/${repo}' not found. Make sure it exists.` };
    if (!res.ok) return { ok: false, error: `GitHub API error: ${res.status}` };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

// --- Show banner ---
function showBanner(type, message) {
  statusBanner.className = `status-banner ${type}`;
  statusBanner.textContent = message; // textContent — safe, no XSS risk
  statusBanner.classList.remove("hidden");
  setTimeout(() => {
    statusBanner.classList.add("hidden");
  }, 5000);
}
