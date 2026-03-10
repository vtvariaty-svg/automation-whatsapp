"use client";

export default function Header() {
  const openSidebar = () => {
    // Dispatch custom event to open sidebar
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
      {/* Hamburger - mobile only */}
      <button
        onClick={openSidebar}
        className="lg:hidden mr-3 p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Abrir menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-lg lg:text-xl font-bold text-gray-800 truncate">VTvariaty IA Secretaria</h1>
    </header>
  );
}
