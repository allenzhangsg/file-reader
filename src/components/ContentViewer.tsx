// ─── ContentViewer Component ─────────────────────────────────────────────────
// Renders the selected file inside an iframe, or shows a placeholder.

import React from 'react';
import { SpinnerIcon } from './Icons';

interface ContentViewerProps {
  blobUrl: string | null;
  isFileLoading: boolean;
  selectedFileName: string | null;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  blobUrl,
  isFileLoading,
  selectedFileName,
}) => {
  // ── Loading spinner while file is being read / parsed ──
  if (isFileLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <SpinnerIcon size={28} />
          <span className="text-sm">Loading {selectedFileName ?? 'file'}…</span>
        </div>
      </div>
    );
  }

  // ── File content in iframe ──
  if (blobUrl) {
    return (
      <iframe
        src={blobUrl}
        title={selectedFileName ?? 'File preview'}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-same-origin allow-popups"
      />
    );
  }

  // ── Empty / welcome state ──
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-8">
        {/* Decorative icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m10 13-2 2 2 2" />
            <path d="m14 17 2-2-2-2" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          No file selected
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Open a folder and select an <strong>.html</strong> or{' '}
          <strong>.md</strong> file from the sidebar to preview it here.
        </p>
      </div>
    </div>
  );
};

export default React.memo(ContentViewer);
