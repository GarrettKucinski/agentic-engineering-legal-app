export default function DocPlaceholder() {
  return (
    <div
      className="nda-document flex flex-col items-center justify-center text-center"
      style={{ minHeight: "calc(100vh - 10rem)" }}
    >
      <svg
        className="h-16 w-16 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm font-medium text-gray-400">Your document will appear here</p>
      <p className="text-xs text-gray-300 mt-1">Tell the AI what kind of document you need</p>
    </div>
  );
}
