// ─── Header Component ────────────────────────────────────────────────────────
// Minimalist top bar with sidebar toggle and primary Open Folder action.

import React from 'react';
import { FolderPlusIcon, SidebarIcon, SpinnerIcon } from './Icons';

interface HeaderProps {
  isSidebarOpen: boolean;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onOpenFolder: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  isLoading,
  onToggleSidebar,
  onOpenFolder,
}) => {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                     transition-colors duration-150"
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <SidebarIcon />
        </button>

        {/* App title */}
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900 tracking-tight">
            File Reader
          </h1>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            Local
          </span>
        </div>
      </div>

      {/* Right section — primary Open Folder */}
      <button
        onClick={onOpenFolder}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm
                   font-medium text-white shadow-sm hover:bg-blue-700
                   disabled:opacity-50 transition-all duration-150 hover:shadow-md"
      >
        {isLoading ? <SpinnerIcon size={16} /> : <FolderPlusIcon size={16} />}
        <span>{isLoading ? 'Scanning…' : 'Open Folder'}</span>
      </button>
    </header>
  );
};

export default React.memo(Header);
