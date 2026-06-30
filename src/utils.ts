// ─── File System Utilities ────────────────────────────────────────────────────
// Helpers for reading directories via the File System Access API and
// rendering Markdown to styled HTML.

import { marked } from 'marked';
import type { DirectoryNode, FileExtension, FileNode, TreeNode } from './types';

/** Extensions we include in the file tree */
const ALLOWED_EXTENSIONS: FileExtension[] = ['.html', '.htm', '.md'];

/**
 * Check whether a filename ends with one of the allowed extensions.
 * Returns the matched extension or `null`.
 */
function matchExtension(name: string): FileExtension | null {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.find((ext) => lower.endsWith(ext)) ?? null;
}

/**
 * Recursively parse a FileSystemDirectoryHandle into a TreeNode hierarchy.
 * Only files matching ALLOWED_EXTENSIONS are kept; empty directories are pruned.
 */
export async function buildFileTree(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = '',
): Promise<TreeNode[]> {
  const children: TreeNode[] = [];

  // Iterate all entries in the directory
  for await (const [name, handle] of dirHandle.entries()) {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;

    if (handle.kind === 'file') {
      const ext = matchExtension(name);
      if (ext) {
        children.push({
          kind: 'file',
          name,
          path: currentPath,
          handle: handle as FileSystemFileHandle,
          extension: ext,
        } satisfies FileNode);
      }
    } else if (handle.kind === 'directory') {
      // Recurse into subdirectories
      const subChildren = await buildFileTree(
        handle as FileSystemDirectoryHandle,
        currentPath,
      );
      // Only include directories that contain at least one relevant file
      if (subChildren.length > 0) {
        children.push({
          kind: 'directory',
          name,
          path: currentPath,
          children: subChildren,
          isExpanded: true, // expanded by default
        } satisfies DirectoryNode);
      }
    }
  }

  // Sort: directories first, then alphabetical
  return children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/**
 * Read the text content of a file handle.
 */
export async function readFileContent(
  handle: FileSystemFileHandle,
): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/**
 * A clean, Notion/GitHub-like CSS stylesheet injected into the Markdown
 * HTML boilerplate rendered inside the iframe.
 */
const MARKDOWN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.75;
    color: #1a1a2e;
    background: #ffffff;
    max-width: 48rem;
    margin: 0 auto;
    padding: 2.5rem 2rem;
  }

  /* ── Headings ── */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.3;
    margin-top: 2em;
    margin-bottom: 0.5em;
    color: #0f172a;
  }
  h1 { font-size: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.4em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.3em; }
  h3 { font-size: 1.25rem; }

  /* ── Paragraphs & text ── */
  p { margin: 1em 0; }
  a { color: #3b82f6; text-decoration: none; }
  a:hover { text-decoration: underline; }
  strong { font-weight: 600; }

  /* ── Code ── */
  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875em;
    background: #f1f5f9;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    color: #e11d48;
  }
  pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1.25rem;
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.6;
    margin: 1.5em 0;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: 0.875rem;
  }

  /* ── Blockquotes ── */
  blockquote {
    border-left: 3px solid #6366f1;
    margin: 1.5em 0;
    padding: 0.5em 1.25em;
    background: #f8fafc;
    color: #475569;
    border-radius: 0 6px 6px 0;
  }
  blockquote p { margin: 0.5em 0; }

  /* ── Lists ── */
  ul, ol { padding-left: 1.75em; margin: 1em 0; }
  li { margin: 0.35em 0; }
  li::marker { color: #94a3b8; }

  /* ── Horizontal rule ── */
  hr {
    border: none;
    height: 1px;
    background: #e5e7eb;
    margin: 2em 0;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.925rem;
  }
  th, td {
    padding: 0.75em 1em;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    font-weight: 600;
    color: #374151;
    background: #f9fafb;
  }
  tr:hover td { background: #fafbfc; }

  /* ── Images ── */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5em 0;
  }

  /* ── Task lists (GFM) ── */
  input[type="checkbox"] {
    margin-right: 0.5em;
    accent-color: #6366f1;
  }
`;

/**
 * Convert raw Markdown text to a full HTML document string with embedded
 * styles for beautiful, clean reading inside an iframe.
 */
export function markdownToHtml(mdContent: string): string {
  const htmlBody = marked.parse(mdContent, { async: false }) as string;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${MARKDOWN_CSS}</style>
</head>
<body>${htmlBody}</body>
</html>`;
}

/**
 * Create a Blob URL from text content.
 * Always uses `text/html` MIME type so the iframe renders properly.
 */
export function createBlobUrl(content: string): string {
  const blob = new Blob([content], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

// ─── Relative Asset Resolution ───────────────────────────────────────────────

/** Check whether a src string is a relative path (not absolute URL or data URI) */
function isRelativePath(src: string): boolean {
  return (
    !src.startsWith('http://') &&
    !src.startsWith('https://') &&
    !src.startsWith('data:') &&
    !src.startsWith('blob:') &&
    !src.startsWith('//')
  );
}

/**
 * Resolve a relative path against a base directory path.
 * e.g. resolvePath("docs/guides", "../images/pic.png") → "docs/images/pic.png"
 */
function resolvePath(baseDirPath: string, relativePath: string): string {
  const baseSegments = baseDirPath ? baseDirPath.split('/') : [];
  const relSegments = relativePath.split('/');

  const result = [...baseSegments];
  for (const seg of relSegments) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') {
      result.pop();
    } else {
      result.push(seg);
    }
  }
  return result.join('/');
}

/**
 * Navigate the root directory handle to retrieve a File at the given path.
 * Returns `null` if any segment along the way doesn't exist.
 */
async function getFileAtPath(
  rootHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<File | null> {
  const segments = path.split('/');
  let currentDir = rootHandle;

  // Walk to the parent directory
  for (let i = 0; i < segments.length - 1; i++) {
    try {
      currentDir = await currentDir.getDirectoryHandle(segments[i]);
    } catch {
      return null; // directory not found
    }
  }

  // Get the file itself
  try {
    const fileHandle = await currentDir.getFileHandle(segments[segments.length - 1]);
    return await fileHandle.getFile();
  } catch {
    return null; // file not found
  }
}

/** Guess MIME type from a file extension for blob creation */
function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    avif: 'image/avif',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    css: 'text/css',
    js: 'text/javascript',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

/**
 * Scan an HTML string for relative `src` attributes (on img, video, source,
 * audio elements), resolve each against the file's directory in the opened
 * folder, read the referenced file via the File System Access API, convert
 * it to a Blob URL, and substitute it back into the HTML.
 *
 * Returns the updated HTML and an array of all created blob URLs (so the
 * caller can revoke them later to prevent memory leaks).
 */
export async function resolveRelativeAssets(
  html: string,
  filePath: string,
  rootHandle: FileSystemDirectoryHandle,
): Promise<{ html: string; assetBlobUrls: string[] }> {
  // Determine the directory that contains the current file
  const pathSegments = filePath.split('/');
  pathSegments.pop(); // remove the filename
  const baseDirPath = pathSegments.join('/');

  // Match src="..." attributes on relevant elements.
  // We use a regex that captures the src value — this avoids needing a DOM
  // parser (DOMParser doesn't exist in the main thread's module scope in
  // all runtimes and we want this to stay lightweight).
  const srcRegex = /(<(?:img|video|source|audio)\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'][^>]*?>)/gi;

  const assetBlobUrls: string[] = [];
  const replacements: Array<{ original: string; replaced: string }> = [];

  // Collect all matches first (we need to resolve them asynchronously)
  const matches: Array<{ full: string; prefix: string; src: string; suffix: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = srcRegex.exec(html)) !== null) {
    matches.push({
      full: match[0],
      prefix: match[1],
      src: match[2],
      suffix: match[3],
    });
  }

  // Resolve each relative src in parallel
  await Promise.all(
    matches.map(async ({ full, prefix, src, suffix }) => {
      if (!isRelativePath(src)) return;

      const resolvedPath = resolvePath(baseDirPath, src);
      const file = await getFileAtPath(rootHandle, resolvedPath);
      if (!file) return; // silently skip files that can't be found

      const mime = guessMimeType(file.name);
      const blob = new Blob([await file.arrayBuffer()], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      assetBlobUrls.push(blobUrl);

      replacements.push({
        original: full,
        replaced: `${prefix}${blobUrl}${suffix}`,
      });
    }),
  );

  // Apply all substitutions
  let result = html;
  for (const { original, replaced } of replacements) {
    result = result.replace(original, replaced);
  }

  return { html: result, assetBlobUrls };
}
