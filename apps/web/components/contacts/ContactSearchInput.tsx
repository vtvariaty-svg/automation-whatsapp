"use client";

import { useState, useEffect, useRef } from "react";

export interface ContactResult {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  normalizedPhone: string | null;
}

interface ContactSearchInputProps {
  label?: string;
  placeholder?: string;
  /** Called when the user picks a contact from the dropdown */
  onSelect: (contact: ContactResult) => void;
  initialValue?: string;
  /** 'dark' for payment modal; 'light' for agenda/fiscal forms */
  theme?: "light" | "dark";
  className?: string;
}

function getToken(): string {
  return typeof window !== "undefined"
    ? (localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "")
    : "";
}

export function ContactSearchInput({
  label,
  placeholder,
  onSelect,
  initialValue,
  theme = "light",
  className,
}: ContactSearchInputProps) {
  const [query, setQuery] = useState(initialValue ?? "");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/contacts?search=${encodeURIComponent(query)}&pageSize=8`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.items ?? []);
          setOpen(true);
        }
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(contact: ContactResult) {
    setQuery(contact.name ?? contact.phone ?? "");
    setOpen(false);
    onSelect(contact);
  }

  const inputClass = isDark
    ? "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
    : "w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all text-sm";

  const dropdownClass = isDark
    ? "bg-[#1a1a2e] border-white/10"
    : "bg-white border-gray-200";

  const rowClass = isDark
    ? "hover:bg-white/5 text-white"
    : "hover:bg-indigo-50 text-gray-900";

  const avatarClass = isDark
    ? "bg-indigo-600 text-white"
    : "bg-indigo-100 text-indigo-700";

  const subClass = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {label && (
        <label className={`block mb-1 ${isDark ? "text-xs text-gray-400" : "text-sm font-medium text-gray-700"}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Buscar contato por nome ou telefone..."}
          className={inputClass}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl shadow-lg border overflow-hidden ${dropdownClass}`}>
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${rowClass}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClass}`}>
                  {(c.name ?? c.phone ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name ?? "—"}</p>
                  <p className={`text-xs truncate ${subClass}`}>
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className={`px-4 py-3 text-sm ${subClass}`}>
              Nenhum contato encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
