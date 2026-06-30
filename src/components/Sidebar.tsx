// ─── Sidebar Component ───────────────────────────────────────────────────────
// Collapsible & resizable sidebar housing the file tree and a folder open action.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FileNode, TreeNode } from '../types';
import FileTreeItem from './FileTreeItem';
import { FolderPlusIcon, SpinnerIcon } from './Icons';

/** Resize constraints (pixels) */
const MIN_WIDTH = 180;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 288; // 18rem ≈ w-72

interface SidebarProps {
  isOpen: boolean;
  tree: TreeNode[];
  isLoading: boolean;
  selectedPath: string | null;
  folderName: string | null;
  basePath: string;
  onBasePathChange: (path: string) => void;
  onOpenFolder: () => void;
  onSelectFile: (file: FileNode) => void;
  onToggleDirectory: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  tree,
  isLoading,
  selectedPath,
  folderName,
  basePath,
  onBasePathChange,
  onOpenFolder,
  onSelectFile,
  onToggleDirectory,
}) => {
  const [isEditingPath, setIsEditingPath] = useState(false);
  const pathInputRef = useRef<HTMLInputElement>(null);

  // ── Resize state ──
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  // Attach document-level listeners while dragging so the handle doesn't
  // lose the cursor if the mouse moves fast.
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
    },
    [width],
  );

  // ── Path editing ──
  const handleStartEdit = useCallback(() => {
    setIsEditingPath(true);
    setTimeout(() => pathInputRef.current?.focus(), 0);
  }, []);

  const handleFinishEdit = useCallback(() => {
    setIsEditingPath(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        setIsEditingPath(false);
      }
    },
    [],
  );

  return (
    <>
      {/* Transparent overlay covers the entire viewport while resizing so the
          iframe can't steal mousemove/mouseup events */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}

      <div className="relative shrink-0 flex" style={{ width: isOpen ? width : 0 }}>
      {/* ── Sidebar panel ── */}
      <aside
        className="flex flex-col overflow-hidden bg-white h-full w-full"
        style={{ transition: isOpen ? 'none' : 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* ── Sidebar header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {folderName ? (
              isEditingPath ? (
                <input
                  ref={pathInputRef}
                  type="text"
                  value={basePath}
                  onChange={(e) => onBasePathChange(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300
                             rounded px-1.5 py-0.5 outline-none focus:border-blue-400 focus:ring-1
                             focus:ring-blue-200 w-full min-w-0"
                  spellCheck={false}
                />
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="truncate text-sm font-semibold text-gray-800 hover:text-blue-600
                             transition-colors duration-150 text-left"
                  title="Click to edit the root path (for absolute path copy)"
                >
                  {basePath || folderName}
                </button>
              )
            ) : (
              <span className="text-sm text-gray-400">No folder open</span>
            )}
          </div>
          <button
            onClick={onOpenFolder}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs
                       font-medium text-white shadow-sm hover:bg-gray-800
                       disabled:opacity-50 transition-colors duration-150 shrink-0 ml-2"
            title="Open a folder"
          >
            {isLoading ? (
              <SpinnerIcon size={14} />
            ) : (
              <FolderPlusIcon size={14} />
            )}
            <span>{isLoading ? 'Scanning…' : 'Open'}</span>
          </button>
        </div>

        {/* ── File tree ── */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2">
          {isLoading && tree.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <SpinnerIcon size={24} />
              <span className="text-xs">Scanning directory…</span>
            </div>
          )}

          {!isLoading && tree.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <p className="text-sm text-center px-4">
                Open a folder to browse<br />
                <span className="text-xs">.html, .htm & .md files</span>
              </p>
            </div>
          )}

          {tree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              basePath={basePath}
              onSelectFile={onSelectFile}
              onToggleDirectory={onToggleDirectory}
            />
          ))}
        </div>
      </aside>

      {/* ── Resize handle ── */}
      {isOpen && (
        <div
          onMouseDown={handleResizeStart}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-10
                      transition-colors duration-150
                      ${isResizing ? 'bg-blue-400' : 'bg-gray-200 hover:bg-gray-400'}`}
        />
      )}
    </div>
    </>
  );
};

export default React.memo(Sidebar);
