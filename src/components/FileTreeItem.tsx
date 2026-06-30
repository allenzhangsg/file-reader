// ─── FileTreeItem Component ──────────────────────────────────────────────────
// Recursively renders a single node in the file tree (file or directory).

import React, { useCallback, useState } from 'react';
import type { DirectoryNode, FileNode, TreeNode } from '../types';
import {
  CheckIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  HtmlIcon,
  MarkdownIcon,
} from './Icons';

interface FileTreeItemProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  basePath: string;
  onSelectFile: (file: FileNode) => void;
  onToggleDirectory: (path: string) => void;
}

/** Build the full path used for clipboard copy */
function buildCopyPath(basePath: string, relativePath: string): string {
  if (!basePath) return relativePath;
  // Avoid double slashes when basePath ends with /
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${base}/${relativePath}`;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  selectedPath,
  basePath,
  onSelectFile,
  onToggleDirectory,
}) => {
  // ── Directory node ──
  if (node.kind === 'directory') {
    return (
      <DirectoryRow
        dir={node as DirectoryNode}
        depth={depth}
        selectedPath={selectedPath}
        basePath={basePath}
        onSelectFile={onSelectFile}
        onToggleDirectory={onToggleDirectory}
      />
    );
  }

  // ── File node ──
  const file = node as FileNode;
  const isSelected = selectedPath === file.path;
  const isHtml = file.extension === '.html' || file.extension === '.htm';

  return (
    <FileRow
      file={file}
      depth={depth}
      isSelected={isSelected}
      isHtml={isHtml}
      basePath={basePath}
      onSelectFile={onSelectFile}
    />
  );
};

// ─── DirectoryRow ────────────────────────────────────────────────────────────
interface DirectoryRowProps {
  dir: DirectoryNode;
  depth: number;
  selectedPath: string | null;
  basePath: string;
  onSelectFile: (file: FileNode) => void;
  onToggleDirectory: (path: string) => void;
}

const DirectoryRow: React.FC<DirectoryRowProps> = ({
  dir,
  depth,
  selectedPath,
  basePath,
  onSelectFile,
  onToggleDirectory,
}) => {
  const [copied, setCopied] = useState(false);

  const handleToggle = useCallback(() => {
    onToggleDirectory(dir.path);
  }, [dir.path, onToggleDirectory]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const fullPath = buildCopyPath(basePath, dir.path);
      navigator.clipboard.writeText(fullPath).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [dir.path, basePath],
  );

  return (
    <div className="tree-item-enter">
      {/* Directory row */}
      <div
        className="group flex items-center relative"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button
          onClick={handleToggle}
          className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm
                     text-gray-600 hover:bg-gray-100 transition-colors duration-150 min-w-0"
        >
          {/* Chevron rotates when expanded */}
          <span
            className="transition-transform duration-200 shrink-0"
            style={{
              transform: dir.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronRightIcon className="text-gray-400" />
          </span>

          {dir.isExpanded ? (
            <FolderOpenIcon className="text-amber-500 shrink-0" />
          ) : (
            <FolderClosedIcon className="text-amber-500 shrink-0" />
          )}

          <span className="truncate font-medium">{dir.name}</span>
        </button>

        {/* Copy path button */}
        <button
          onClick={handleCopy}
          className={`absolute right-1 p-1 rounded transition-all duration-150 shrink-0
                      ${
                        copied
                          ? 'opacity-100 bg-green-50'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'
                      }`}
          title="Copy folder path"
        >
          {copied ? (
            <CheckIcon className="text-green-500" />
          ) : (
            <ClipboardCopyIcon className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Children (conditionally rendered) */}
      {dir.isExpanded && (
        <div>
          {dir.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              basePath={basePath}
              onSelectFile={onSelectFile}
              onToggleDirectory={onToggleDirectory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── FileRow ─────────────────────────────────────────────────────────────────
interface FileRowProps {
  file: FileNode;
  depth: number;
  isSelected: boolean;
  isHtml: boolean;
  basePath: string;
  onSelectFile: (file: FileNode) => void;
}

const FileRow: React.FC<FileRowProps> = ({
  file,
  depth,
  isSelected,
  isHtml,
  basePath,
  onSelectFile,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const fullPath = buildCopyPath(basePath, file.path);
      navigator.clipboard.writeText(fullPath).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [file.path, basePath],
  );

  return (
    <div
      className="group tree-item-enter flex w-full items-center rounded-md relative"
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {/* Main clickable row */}
      <button
        onClick={() => onSelectFile(file)}
        className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1
                    text-left text-sm transition-colors duration-150 min-w-0
                    ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
        title={file.path}
      >
        {/* Spacer to align with directory chevrons */}
        <span className="w-3.5 shrink-0" />

        {/* File-type icon */}
        {isHtml ? (
          <HtmlIcon
            className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-orange-500'}`}
          />
        ) : (
          <MarkdownIcon
            className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-indigo-500'}`}
          />
        )}

        <span className="truncate">{file.name}</span>

        {/* Subtle badge — swaps to ellipsis when copy icon appears */}
        <span
          className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 group-hover:hidden
                      ${
                        isHtml
                          ? 'bg-orange-50 text-orange-400'
                          : 'bg-indigo-50 text-indigo-400'
                      }`}
        >
          {file.extension.replace('.', '')}
        </span>
        <span className="ml-auto text-gray-300 text-xs shrink-0 hidden group-hover:inline">
          …
        </span>
      </button>

      {/* Copy path button — visible on hover, shows green check after click */}
      <button
        onClick={handleCopy}
        className={`absolute right-1 p-1 rounded transition-all duration-150 shrink-0
                    ${
                      copied
                        ? 'opacity-100 bg-green-50'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'
                    }`}
        title="Copy file path"
      >
        {copied ? (
          <CheckIcon className="text-green-500" />
        ) : (
          <ClipboardCopyIcon className="text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default React.memo(FileTreeItem);
