// content.js — Injected into GeeksForGeeks problem pages
// Extracts code, problem metadata, and injects the "Push to GitHub" button

(function () {
  "use strict";

  // If inside an iframe, listen for extraction requests from parent window
  if (window !== window.top) {
    window.addEventListener("message", async (e) => {
      if (e.data && e.data.type === "GFG_FRAME_REQUEST") {
        let code = extractFromDoc(document);
        if (!code) {
          code = await extractCodeFromMainWorld();
        }
        if (code) {
          window.top.postMessage(
            {
              type: "GFG_FRAME_RESPONSE",
              id: e.data.id,
              code: code,
            },
            "*"
          );
        }
      }
    });
    return; // Do not inject button inside child frames
  }

  // Avoid injecting twice in top frame
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
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        // Strip everything after | or - to avoid page suffix noise
        return el.textContent.split("|")[0].split("-")[0].trim();
      }
    }

    // Fallback 1: Extract from URL slug — most reliable
    // e.g. /problems/trapping-rain-water-1587115621/1 → "Trapping Rain Water"
    const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
    if (urlMatch) {
      return urlMatch[1]
        .replace(/-\d+$/, "")      // remove trailing number like -1587115621
        .replace(/-/g, " ")        // dashes to spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
    }

    // Fallback 2: page title, strip everything after first |
    return document.title.split("|")[0].trim();
  }

  // --- Extract difficulty ---
  function getDifficulty() {
    // Search ALL elements matching difficulty-related class names
    const selectors = [
      "[class*='difficulty']",
      "[class*='Difficulty']",
      "[class*='problemDifficulty']",
      "[class*='problem_difficulty']",
      "[class*='diffTag']",
      ".problems_header_content__difficulty__KGkt",
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel); // check ALL matches
      for (const el of els) {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes("easy")) return "Easy";
        if (text.includes("medium")) return "Medium";
        if (text.includes("hard")) return "Hard";
        if (text.includes("school")) return "School";
        if (text.includes("basic")) return "Basic";
      }
    }

    // Fallback: scan full page text for difficulty badge
    const bodyText = document.body.innerText.toLowerCase();
    const patterns = [
      { key: "difficulty: hard", val: "Hard" },
      { key: "difficulty: medium", val: "Medium" },
      { key: "difficulty: easy", val: "Easy" },
    ];
    for (const { key, val } of patterns) {
      if (bodyText.includes(key)) return val;
    }

    return "Unknown";
  }

  // --- Helper: try to extract code from a given document context ---
  // --- Helper: extract code from DOM in any document ---
  function extractFromDoc(doc) {
    if (!doc) return null;

    // Strategy 1: CodeMirror 6 (.cm-content, .cm-line)
    try {
      const cmContent = doc.querySelector(".cm-content");
      if (cmContent) {
        const cmLines = cmContent.querySelectorAll(".cm-line");
        if (cmLines.length > 0) {
          const code = Array.from(cmLines)
            .map((l) => l.innerText.replace(/\u200B/g, ""))
            .join("\n");
          if (code && code.trim().length > 0) {
            console.log("[GfG→GitHub] ✅ Got code via Strategy 1 (CM6 .cm-line)");
            return code;
          }
        }
        if (cmContent.innerText && cmContent.innerText.trim().length > 0) {
          console.log("[GfG→GitHub] ✅ Got code via Strategy 1 (CM6 .cm-content innerText)");
          return cmContent.innerText.replace(/\u200B/g, "");
        }
      }
    } catch (_) {}

    // Strategy 2: Ace Editor (.ace_line, .ace_text-layer, .ace_content)
    try {
      const aceLines = doc.querySelectorAll(".ace_line");
      if (aceLines.length > 0) {
        const code = Array.from(aceLines)
          .map((l) => l.innerText)
          .join("\n");
        if (code && code.trim().length > 0) {
          console.log("[GfG→GitHub] ✅ Got code via Strategy 2 (Ace .ace_line)");
          return code;
        }
      }
    } catch (_) {}

    // Strategy 3: CodeMirror 5 (.CodeMirror-line, .CodeMirror-code)
    try {
      const cmLines = doc.querySelectorAll(".CodeMirror-line");
      if (cmLines.length > 0) {
        const code = Array.from(cmLines)
          .map((l) => l.innerText.replace(/\u200B/g, ""))
          .join("\n");
        if (code && code.trim().length > 0) {
          console.log("[GfG→GitHub] ✅ Got code via Strategy 3 (CM5 .CodeMirror-line)");
          return code;
        }
      }
    } catch (_) {}

    // Strategy 4: Monaco Editor (.view-line, .view-lines)
    try {
      const monacoLines = doc.querySelectorAll(".view-line");
      if (monacoLines.length > 0) {
        const code = Array.from(monacoLines)
          .map((l) => l.innerText)
          .join("\n");
        if (code && code.trim().length > 0) {
          console.log("[GfG→GitHub] ✅ Got code via Strategy 4 (Monaco .view-line)");
          return code;
        }
      }
    } catch (_) {}

    // Strategy 5: Textarea / Pre / Code in editor containers
    try {
      const selectors = [
        ".CodeMirror textarea",
        ".ace_text-input",
        "textarea.inputarea",
        "textarea[class*='editor']",
        ".editor-container textarea",
        "#editor textarea",
        "#problems-editor textarea",
        "pre[class*='code']",
        "code[class*='code']",
      ];
      for (const sel of selectors) {
        const el = doc.querySelector(sel);
        if (el) {
          const val = el.value || el.innerText || "";
          if (val.trim().length > 0) {
            console.log("[GfG→GitHub] ✅ Got code via Strategy 5 (" + sel + ")");
            return val;
          }
        }
      }
    } catch (_) {}

    // Strategy 6: Scan elements for attached editor instances
    try {
      const allEls = doc.querySelectorAll("*");
      for (const el of allEls) {
        if (el.CodeMirror && typeof el.CodeMirror.getValue === "function") {
          const code = el.CodeMirror.getValue();
          if (code && code.trim().length > 0) {
            console.log("[GfG→GitHub] ✅ Got code via Strategy 6 (el.CodeMirror)");
            return code;
          }
        }
        if (el.env && el.env.editor && typeof el.env.editor.getValue === "function") {
          const code = el.env.editor.getValue();
          if (code && code.trim().length > 0) {
            console.log("[GfG→GitHub] ✅ Got code via Strategy 6 (el.env.editor)");
            return code;
          }
        }
      }
    } catch (_) {}

    return null;
  }

  // --- Helper: Extract code directly from Page Context (Main World) ---
  function extractCodeFromMainWorld() {
    return new Promise((resolve) => {
      const reqId = "gfg_extract_" + Date.now() + "_" + Math.random().toString(36).substring(2);

      function onResponse(e) {
        if (e.detail && e.detail.reqId === reqId) {
          window.removeEventListener("gfg_extract_response", onResponse);
          resolve(e.detail.code || null);
        }
      }
      window.addEventListener("gfg_extract_response", onResponse);

      const script = document.createElement("script");
      script.textContent = `(function() {
        let code = "";
        try {
          // 1. Ace Editor
          if (window.ace) {
            const aceEls = document.querySelectorAll(".ace_editor");
            for (const el of aceEls) {
              try {
                const ed = window.ace.edit(el);
                if (ed && ed.getValue && ed.getValue().trim()) {
                  code = ed.getValue();
                  break;
                }
              } catch(e) {}
            }
          }
          // 2. CodeMirror 5
          if (!code) {
            const cmEls = document.querySelectorAll(".CodeMirror");
            for (const el of cmEls) {
              if (el.CodeMirror && typeof el.CodeMirror.getValue === "function") {
                const val = el.CodeMirror.getValue();
                if (val && val.trim()) { code = val; break; }
              }
            }
          }
          // 3. Monaco
          if (!code && window.monaco && window.monaco.editor) {
            const eds = window.monaco.editor.getEditors();
            if (eds && eds.length > 0) {
              const val = eds[0].getValue();
              if (val && val.trim()) code = val;
            }
          }
          // 4. CodeMirror 6
          if (!code) {
            const cmContent = document.querySelector(".cm-content");
            if (cmContent && cmContent.cmView && cmContent.cmView.view && cmContent.cmView.view.state) {
              code = cmContent.cmView.view.state.doc.toString();
            }
          }
        } catch(err) {}

        window.dispatchEvent(new CustomEvent("gfg_extract_response", {
          detail: { reqId: "${reqId}", code: code }
        }));
      })();`;

      (document.head || document.documentElement).appendChild(script);
      script.remove();

      setTimeout(() => {
        window.removeEventListener("gfg_extract_response", onResponse);
        resolve(null);
      }, 500);
    });
  }

  // --- Helper: Request code from child frames via postMessage ---
  function requestFromFrames() {
    return new Promise((resolve) => {
      const reqId = "gfg_frame_req_" + Date.now() + "_" + Math.random().toString(36).substring(2);

      function onFrameMsg(e) {
        if (e.data && e.data.type === "GFG_FRAME_RESPONSE" && e.data.id === reqId) {
          window.removeEventListener("message", onFrameMsg);
          resolve(e.data.code || null);
        }
      }
      window.addEventListener("message", onFrameMsg);

      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        try {
          iframe.contentWindow?.postMessage({ type: "GFG_FRAME_REQUEST", id: reqId }, "*");
        } catch (_) {}
      }

      setTimeout(() => {
        window.removeEventListener("message", onFrameMsg);
        resolve(null);
      }, 700);
    });
  }

  // --- Extract code coordinating all strategies & retries ---
  async function extractCode() {
    // 1. Direct DOM extraction from main document
    let code = extractFromDoc(document);
    if (code) return code;

    // 2. Main world script injection
    code = await extractCodeFromMainWorld();
    if (code) return code;

    // 3. Accessible iframes via contentDocument
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iDoc) continue;
        code = extractFromDoc(iDoc);
        if (code) {
          console.log("[GfG→GitHub] ✅ Got code from accessible iframe");
          return code;
        }
      } catch (_) {}
    }

    // 4. Cross-origin / isolated iframes via postMessage
    code = await requestFromFrames();
    if (code) return code;

    // 5. Retry once after 800ms in case editor is rendering
    console.log("[GfG→GitHub] Waiting 800ms and retrying extraction...");
    await new Promise((r) => setTimeout(r, 800));

    code = extractFromDoc(document);
    if (code) return code;

    code = await extractCodeFromMainWorld();
    if (code) return code;

    for (const iframe of iframes) {
      try {
        const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iDoc) continue;
        code = extractFromDoc(iDoc);
        if (code) return code;
      } catch (_) {}
    }

    code = await requestFromFrames();
    if (code) return code;

    console.warn("[GfG→GitHub] All extraction strategies failed.");
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
  // Uses startsWith/includes to handle values like "Java (21)", "C++ 17", "Python 3"
  function getExtension(lang) {
    const l = lang.toLowerCase().trim();
    if (l.startsWith("c++") || l.startsWith("cpp"))  return "cpp";
    if (l.startsWith("c#") || l.startsWith("csharp")) return "cs";
    if (l.startsWith("c ") || l === "c")             return "c";
    if (l.startsWith("java") && !l.startsWith("javascript")) return "java";
    if (l.startsWith("python") || l.startsWith("py")) return "py";
    if (l.startsWith("javascript") || l.startsWith("js")) return "js";
    if (l.startsWith("typescript") || l.startsWith("ts")) return "ts";
    if (l.startsWith("kotlin"))   return "kt";
    if (l.startsWith("swift"))    return "swift";
    if (l.startsWith("go") || l.startsWith("golang")) return "go";
    if (l.startsWith("ruby"))     return "rb";
    if (l.startsWith("rust"))     return "rs";
    if (l.startsWith("php"))      return "php";
    if (l.startsWith("scala"))    return "scala";
    if (l.startsWith("perl"))     return "pl";
    return "txt";
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
  // Files go directly into: GfG/problem-name.ext
  function buildFilePath(title, difficulty, lang) {
    const ext = getExtension(lang);
    const filename = sanitizeFilename(title);
    return `GfG/${filename}.${ext}`;
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

        const code = await extractCode();
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
