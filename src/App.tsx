// ─── App Component ───────────────────────────────────────────────────────────
// Root component: manages file tree state, selected file, and blob URLs.

import { useCallback, useEffect, useRef, useState } from 'react';
import ContentViewer from './components/ContentViewer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import type { DirectoryNode, FileNode, TreeNode } from './types';
import { buildFileTree, createBlobUrl, markdownToHtml, readFileContent, resolveRelativeAssets } from './utils';

function App() {
  // ── State ──
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  // The base path used for copy — editable by the user to set an absolute path
  const [basePath, setBasePath] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Track the current blob URL so we can revoke it on change
  const prevBlobUrlRef = useRef<string | null>(null);
  // Track all asset blob URLs (images, etc.) created for the current view
  const assetBlobUrlsRef = useRef<string[]>([]);
  // Store the root directory handle for resolving relative asset paths
  const rootHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  /** Revoke the page blob URL and all asset blob URLs */
  const revokeAllBlobUrls = useCallback(() => {
    if (prevBlobUrlRef.current) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
      prevBlobUrlRef.current = null;
    }
    for (const url of assetBlobUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    assetBlobUrlsRef.current = [];
  }, []);

  // ── Clean up on unmount ──
  useEffect(() => {
    return () => revokeAllBlobUrls();
  }, [revokeAllBlobUrls]);

  // ── Open Folder handler ──
  const handleOpenFolder = useCallback(async () => {
    // Check API support
    if (!('showDirectoryPicker' in window)) {
      setError(
        'Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.',
      );
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Prompt the user to select a folder
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });

      // Recursively build the file tree
      const fileTree = await buildFileTree(dirHandle);

      // Store the root handle for resolving relative asset paths later
      rootHandleRef.current = dirHandle;

      setTree(fileTree);
      setFolderName(dirHandle.name);
      setBasePath(dirHandle.name); // default to folder name; user can edit to absolute path
      setSelectedFile(null);

      // Clean up all previous blob URLs
      revokeAllBlobUrls();
      setBlobUrl(null);
    } catch (err: unknown) {
      // User cancelled the picker — not an error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Error opening folder:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to open the folder.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── File selection handler ──
  const handleSelectFile = useCallback(async (file: FileNode) => {
    setSelectedFile(file);
    setIsFileLoading(true);
    setError(null);

    try {
      const content = await readFileContent(file.handle);

      let htmlContent: string;
      if (file.extension === '.md') {
        // Parse Markdown → styled HTML
        htmlContent = markdownToHtml(content);
      } else {
        // HTML files are used as-is
        htmlContent = content;
      }

      // Resolve relative image/asset paths to blob URLs so they render
      // correctly inside the sandboxed iframe
      if (rootHandleRef.current) {
        const { html: resolved, assetBlobUrls } = await resolveRelativeAssets(
          htmlContent,
          file.path,
          rootHandleRef.current,
        );
        // Revoke previous blob URLs before storing new ones
        revokeAllBlobUrls();
        assetBlobUrlsRef.current = assetBlobUrls;
        htmlContent = resolved;
      } else {
        revokeAllBlobUrls();
      }

      // Create a new blob URL and store it
      const url = createBlobUrl(htmlContent);
      prevBlobUrlRef.current = url;
      setBlobUrl(url);
    } catch (err) {
      console.error('Error reading file:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to read the file.',
      );
    } finally {
      setIsFileLoading(false);
    }
  }, []);

  // ── Toggle directory expand/collapse ──
  const handleToggleDirectory = useCallback((path: string) => {
    setTree((prevTree) => toggleNode(prevTree, path));
  }, []);

  // ── Sidebar collapse toggle ──
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* ── Top bar ── */}
      <Header
        isSidebarOpen={isSidebarOpen}
        isLoading={isLoading}
        onToggleSidebar={handleToggleSidebar}
        onOpenFolder={handleOpenFolder}
      />

      {/* ── Error banner ── */}
      {error && (
        <div className="shrink-0 bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main area: sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          tree={tree}
          isLoading={isLoading}
          selectedPath={selectedFile?.path ?? null}
          folderName={folderName}
          basePath={basePath}
          onBasePathChange={setBasePath}
          onOpenFolder={handleOpenFolder}
          onSelectFile={handleSelectFile}
          onToggleDirectory={handleToggleDirectory}
        />

        {/* Content viewer */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <ContentViewer
            blobUrl={blobUrl}
            isFileLoading={isFileLoading}
            selectedFileName={selectedFile?.name ?? null}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Helper: recursively toggle a directory's expanded state ──────────────────
function toggleNode(nodes: TreeNode[], targetPath: string): TreeNode[] {
  return nodes.map((node) => {
    if (node.kind === 'directory') {
      const dir = node as DirectoryNode;
      if (dir.path === targetPath) {
        return { ...dir, isExpanded: !dir.isExpanded };
      }
      return { ...dir, children: toggleNode(dir.children, targetPath) };
    }
    return node;
  });
}

export default App;
