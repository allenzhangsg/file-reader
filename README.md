# 📄 Local-First HTML & Markdown Reader

A lightning-fast, privacy-focused web application built with **React**, **Vite**, and **Tailwind CSS**. 
It allows you to beautifully render local Markdown (`.md`) and HTML (`.html`) files directly in your browser without uploading them to any server, leveraging the modern **File System Access API**.

🌐 **[Live Demo on GitHub Pages](https://allenzhangsg.github.io/file-reader/)**

> **Note:** To view your local files securely, this app uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), which is supported on Chromium-based browsers (Chrome, Edge, Opera).

---

## ✨ Key Features

- **🔒 Local-First & Private:** Reads your local files directly in the browser. Nothing is ever uploaded to a server.
- **🌳 Interactive File Tree:** Select a folder on your computer to instantly build a collapsible, recursive file tree of only relevant `.html` and `.md` files.
- **🎨 Beautiful Markdown Rendering:** Automatically parses Markdown into a clean, GitHub/Notion-style reading experience using `marked` and custom typography (Inter & JetBrains Mono).
- **🖼️ Relative Image Resolution:** Seamlessly renders local images (like `../assets/pic.png`) referenced inside your Markdown files by dynamically reading them from your file system.
- **📋 Copy Absolute Path:** Hover over any folder or file in the sidebar to reveal a quick-copy button. It intelligently copies the absolute path (e.g. `/Users/name/docs/guide.md`) for easy pasting into terminals or AI prompts. You can also edit the base path directly in the sidebar header!
- **↔️ Resizable Sidebar:** Drag the sidebar to your preferred width (clamped between 180px and 600px).
- **🚀 Deploy Ready:** Configured with GitHub Actions to automatically deploy to GitHub Pages on every push to `main`.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Markdown Parsing:** `marked`
- **Icons:** Custom SVG components (No heavy icon libraries!)

---

## 🚀 Running Locally

Want to hack on it locally? It's incredibly simple to set up:

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/allenzhangsg/file-reader.git
   cd file-reader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173/` (or the port specified in your terminal).

---

## 🚢 Deployment

This project includes a `.github/workflows/deploy.yml` file that automatically builds and deploys the app to GitHub Pages.

To ensure it works on your fork/repo:
1. Go to your repository **Settings**.
2. Navigate to **Pages** in the left sidebar.
3. Under **Build and deployment > Source**, select **GitHub Actions**.

Whenever you push to the `main` branch, your site will be automatically updated!

---

## 📄 License

MIT License. Feel free to use, modify, and distribute this project as you see fit.
