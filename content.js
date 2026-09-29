// content.js — Injected into GeeksForGeeks problem pages
// Extracts code, problem metadata, and injects the "Push to GitHub" button

(function () {
  "use strict";

  // Avoid injecting twice
  if (document.getElementById("gfg-gh-btn-wrapper")) return;

  // --- Utility: Wait for an element to appear in DOM ---
  function waitForElement(selector, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for: ${selector}`));
      }, timeout);
    });
  }

  // --- Extract problem title from the page ---
  function getProblemTitle() {
    const selectors = [
      "h1.problems_header_content__title__L2cB2",
      "h1.problem-statement__problem-title",
      ".problems-navbar__title",
      "[class*='problems_header'] h1",
      "[class*='problem-title']",
      "h1",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    // Fallback: use page title
    return document.title.replace(" | GeeksForGeeks", "").replace(" - GeeksForGeeks", "").trim();
  }

  // --- Extract difficulty ---
  function getDifficulty() {
    const selectors = [
      "[class*='difficulty']",
      "[class*='Difficulty']",
      ".problems_header_content__difficulty__KGkt",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes("easy")) return "Easy";
        if (text.includes("medium")) return "Medium";
        if (text.includes("hard")) return "Hard";
        if (text.includes("school")) return "School";
        if (text.includes("basic")) return "Basic";
      }
    }
    return "Unknown";
  }

  // --- Extract the user's code from the editor ---
  function extractCode() {

    // ✅ Strategy 1: CodeMirror JS object (most reliable for GFG)
    // Directly accesses the editor instance — works even if DOM lines are lazy-loaded
    try {
      const cmEl = document.querySelector(".CodeMirror");
      if (cmEl && cmEl.CodeMirror) {
        const code = cmEl.CodeMirror.getValue();
        if (code && code.trim().length > 0) return code;
      }
    } catch (_) {}

    // ✅ Strategy 2: CodeMirror DOM lines
    const cmLines = document.querySelectorAll(".CodeMirror-line");
    if (cmLines.length > 0) {
      const code = Array.from(cmLines).map((l) => l.innerText).join("\n");
      if (code.trim().length > 0) return code;
    }

    // ✅ Strategy 3: Monaco Editor JS object
    try {
      if (window.monaco && window.monaco.editor) {
        const editors = window.monaco.editor.getEditors();
        if (editors && editors.length > 0) {
          const code = editors[0].getValue();
          if (code && code.trim().length > 0) return code;
        }
      }
    } catch (_) {}

    // ✅ Strategy 4: Monaco Editor DOM lines
    const monacoLines = document.querySelectorAll(".view-line");
    if (monacoLines.length > 0) {
      const code = Array.from(monacoLines).map((l) => l.innerText).join("\n");
      if (code.trim().length > 0) return code;
    }

    // ✅ Strategy 5: Any hidden textarea inside the editor wrapper
    const editorWrappers = [
      ".editor-container textarea",
      ".CodeMirror textarea",
      "textarea.inputarea",
      "textarea[class*='editor']",
      "textarea",
    ];
    for (const sel of editorWrappers) {
      const ta = document.querySelector(sel);
      if (ta && ta.value && ta.value.trim().length > 0) return ta.value;
    }

    // ✅ Strategy 6: GFG-specific editor wrapper innerText fallback
    const gfgEditorWrap = document.querySelector(
      "[class*='editor_container'], [class*='editorContainer'], [class*='code-editor']"
    );
    if (gfgEditorWrap) {
      const code = gfgEditorWrap.innerText;
      if (code && code.trim().length > 0) return code;
    }

    return null;
  }


  // --- Get selected language ---
  function getLanguage() {
    const selectors = [
      "[class*='languageButtonText']",
      "[class*='language-select'] .selected",
      ".g-select__selected",
      "[class*='lang'] [class*='selected']",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    // Try dropdown
    const dropdown = document.querySelector("select[name='language'], select[id='language']");
    if (dropdown) return dropdown.options[dropdown.selectedIndex]?.text || "cpp";
    return "cpp";
  }

  // --- Map language to file extension ---
  function getExtension(lang) {
    const map = {
      "c++": "cpp",
      cpp: "cpp",
      c: "c",
      java: "java",
      python: "py",
      "python3": "py",
      javascript: "js",
      "js": "js",
      "c#": "cs",
      csharp: "cs",
      go: "go",
      kotlin: "kt",
      swift: "swift",
      ruby: "rb",
      rust: "rs",
      php: "php",
    };
    return map[lang.toLowerCase()] || "txt";
  }

  // --- Sanitize filename ---
  function sanitizeFilename(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  // --- Build the file path in repo ---
  // Files go inside: GfG/Difficulty/problem-name.ext
  function buildFilePath(title, difficulty, lang) {
    const ext = getExtension(lang);
    const filename = sanitizeFilename(title);
    return `GfG/${difficulty}/${filename}.${ext}`;
  }

  // --- Inject the Push to GitHub button ---
  async function injectButton() {
    // Wait for the submit button area to appear
    let anchorEl = null;
    try {
      anchorEl = await waitForElement(
        "[class*='problems_submit_button'], [class*='submit_button'], button[class*='Submit'], .problems-navbar__submit-btn"
      );
    } catch {
      // Try a generic fallback
      anchorEl = document.querySelector("button");
    }

    if (document.getElementById("gfg-gh-btn-wrapper")) return;

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.id = "gfg-gh-btn-wrapper";

    // Create button
    const btn = document.createElement("button");
    btn.id = "gfg-gh-push-btn";
    btn.innerHTML = `
      <span class="gfg-gh-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      </span>
      <span class="gfg-gh-label">Push to GitHub</span>
    `;
    btn.className = "gfg-gh-push-btn";

    // Status message
    const status = document.createElement("span");
    status.id = "gfg-gh-status";
    status.className = "gfg-gh-status";

    wrapper.appendChild(btn);
    wrapper.appendChild(status);

    // Insert after the anchor element or into the navbar
    const navbar = document.querySelector("[class*='problems-navbar'], [class*='problems_navbar']");
    if (navbar) {
      navbar.appendChild(wrapper);
    } else if (anchorEl && anchorEl.parentNode) {
      anchorEl.parentNode.insertBefore(wrapper, anchorEl.nextSibling);
    } else {
      // Last resort: insert at top of body
      document.body.prepend(wrapper);
    }

    // --- Button click handler ---
    btn.addEventListener("click", async () => {
      setStatus("loading", "Pushing...");
      btn.disabled = true;

      try {
        // Get stored settings
        const settings = await getSettings();

        if (!settings.token || !settings.owner || !settings.repo) {
          setStatus("error", "⚠️ Set your GitHub token & repo in the extension popup first!");
          btn.disabled = false;
          return;
        }

        const code = extractCode();
        if (!code || code.trim().length === 0) {
          setStatus("error", "❌ Could not extract code. Is the editor loaded?");
          btn.disabled = false;
          return;
        }

        const title = getProblemTitle();
        const difficulty = getDifficulty();
        const lang = getLanguage();
        const filePath = buildFilePath(title, difficulty, lang);
        const problemUrl = window.location.href;

        // Build commit message
        const commitMessage = `Add: ${title} [${difficulty}] (${lang})`;

        // Add header comment to code
        const ext = getExtension(lang);
        const header = buildHeader(ext, title, difficulty, lang, problemUrl);
        const finalCode = header + code;

        // Send to background to push
        const response = await chrome.runtime.sendMessage({
          type: "PUSH_TO_GITHUB",
          payload: {
            token: settings.token,
            owner: settings.owner,
            repo: settings.repo,
            filePath,
            content: finalCode,
            commitMessage,
          },
        });

        if (response.success) {
          const fileUrl = `https://github.com/${settings.owner}/${settings.repo}/blob/main/${filePath}`;
          // Build success message safely using DOM — no innerHTML
          const fragment = document.createDocumentFragment();
          const checkMark = document.createTextNode("✅ Pushed! ");
          const link = document.createElement("a");
          link.href = fileUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "View on GitHub ↗";
          fragment.appendChild(checkMark);
          fragment.appendChild(link);
          setStatus("success", fragment);
        } else {
          setStatus("error", `❌ Error: ${response.error}`);
        }
      } catch (err) {
        setStatus("error", `❌ ${err.message}`);
      }

      btn.disabled = false;
    });

    function setStatus(type, content) {
      // Clear previous content safely
      status.textContent = "";
      status.className = `gfg-gh-status gfg-gh-status--${type}`;

      if (typeof content === "string") {
        status.textContent = content;
      } else {
        // content is a DOM node (for success with a link)
        status.appendChild(content);
      }

      if (type === "success") {
        setTimeout(() => {
          status.textContent = "";
          status.className = "gfg-gh-status";
        }, 8000);
      }
    }
  }

  // --- Build a comment header for the solution file ---
  function buildHeader(ext, title, difficulty, lang, url) {
    const date = new Date().toISOString().split("T")[0];
    const commentStyles = {
      py: `# Problem: ${title}\n# Difficulty: ${difficulty}\n# Language: ${lang}\n# Date: ${date}\n# URL: ${url}\n\n`,
      rb: `# Problem: ${title}\n# Difficulty: ${difficulty}\n# Language: ${lang}\n# Date: ${date}\n# URL: ${url}\n\n`,
    };
    return (
      commentStyles[ext] ||
      `/*\n * Problem: ${title}\n * Difficulty: ${difficulty}\n * Language: ${lang}\n * Date: ${date}\n * URL: ${url}\n */\n\n`
    );
  }

  // --- Load settings from Chrome storage ---
  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["token", "owner", "repo"], (items) => resolve(items));
    });
  }

  // --- Run ---
  // Inject on load and also watch for SPA navigation
  injectButton();

  // GFG is a SPA — re-inject on URL change
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(injectButton, 1500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
