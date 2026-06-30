// ─── File System Types ───────────────────────────────────────────────────────
// Types for the hierarchical file tree built from the File System Access API.

/** Supported file extensions */
export type FileExtension = '.html' | '.htm' | '.md';

/** A single file node in the tree */
export interface FileNode {
  kind: 'file';
  name: string;
  /** Full path relative to the root folder (e.g. "docs/readme.md") */
  path: string;
  /** The underlying FileSystemFileHandle for reading content */
  handle: FileSystemFileHandle;
  /** Derived file extension */
  extension: FileExtension;
}

/** A directory node containing children */
export interface DirectoryNode {
  kind: 'directory';
  name: string;
  path: string;
  children: TreeNode[];
  /** Track expanded/collapsed state in the UI */
  isExpanded?: boolean;
}

/** Union type for any node in the file tree */
export type TreeNode = FileNode | DirectoryNode;
