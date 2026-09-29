# GfG → GitHub Extension 🚀

> A Chrome extension that lets you push your GeeksForGeeks solutions directly to GitHub with a single click!

---

## ✨ Features

- 🖱️ **One-click push** — "Push to GitHub" button injected directly on GFG problem pages
- 📁 **Smart file organization** — Files saved as `Difficulty/problem-name.ext` (e.g., `Medium/two-sum.cpp`)
- 💬 **Auto comment header** — Every file gets a header with problem name, difficulty, language, date, and URL
- 🔄 **Update support** — Re-pushing an existing solution updates the file instead of duplicating it
- 🌐 **Multi-language** — Supports C++, Java, Python, JavaScript, C, C#, Go, Kotlin, and more
- 🔒 **Secure** — Your GitHub token is stored locally in Chrome only, never sent anywhere else
- ✅ **Token verification** — Validates your credentials before saving settings

---

## 📦 Installation (Developer Mode)

1. **Clone or download** this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right)
4. Click **"Load unpacked"**
5. Select the `GFG to GitHub` folder
6. The extension icon will appear in your toolbar ✅

---

## ⚙️ Setup

1. Click the extension icon in your Chrome toolbar
2. **Generate a GitHub PAT** → [Click here to generate](https://github.com/settings/tokens/new?scopes=repo&description=GfG-to-GitHub-Extension)
   - Check the `repo` scope
   - Copy the token
3. Paste your token into the **GitHub Personal Access Token** field
4. Enter your **GitHub Username** (e.g., `Trilochan77`)
5. Enter your **Repository Name** (e.g., `GfG-to-GitHub-Extension`)
6. Click **Save Settings** — the extension will verify your credentials!

---

## 🚀 Usage

1. Go to any GeeksForGeeks problem page
2. Write your solution in the editor
3. Click the **"Push to GitHub"** button (appears in the navbar)
4. ✅ Your solution is pushed to GitHub instantly!

### File Structure in Your Repo

```
📁 your-repo/
├── 📁 Easy/
│   ├── reverse-a-linked-list.cpp
│   └── find-minimum-in-array.py
├── 📁 Medium/
│   ├── longest-common-subsequence.java
│   └── number-of-islands.cpp
└── 📁 Hard/
    └── serialize-deserialize-binary-tree.cpp
```

### Auto-generated File Header (C++)

```cpp
/*
 * Problem: Two Sum
 * Difficulty: Medium
 * Language: C++
 * Date: 2026-09-29
 * URL: https://www.geeksforgeeks.org/problems/two-sum/...
 */

// Your solution code here...
```

---

## 🛠️ Project Structure

```
GFG to GitHub/
├── manifest.json       # Chrome Extension Manifest V3
├── background.js       # Service Worker — handles GitHub API calls
├── content.js          # Injected into GFG pages — button + code extraction
├── styles.css          # Injected styles for the button
├── popup.html          # Extension settings popup
├── popup.css           # Popup styles
├── popup.js            # Popup logic — save/validate settings
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔐 Privacy & Security

- Your GitHub PAT is stored in `chrome.storage.sync` (local to your browser)
- The token is only sent to `api.github.com` — nowhere else
- No analytics, no tracking, no third-party servers

---

## 🤝 Contributing

Pull requests are welcome! Feel free to open issues for bugs or feature requests.

---

## 📄 License

MIT License — feel free to use and modify!

---

Made with ❤️ by [Trilochan77](https://github.com/Trilochan77)
