import React, { useState } from 'react';
import { Unit, ReferenceSection } from '../../types';
import { BookOpen, ChevronRight, ChevronDown, Search, Layers, X } from 'lucide-react';

interface SidebarTOCProps {
  units: Unit[];
  referenceSections: ReferenceSection[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  onClose: () => void;
}

export const SidebarTOC: React.FC<SidebarTOCProps> = ({
  units,
  referenceSections,
  currentPage,
  onSelectPage,
  onClose,
}) => {
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({ u1: true });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUnit = (uId: string) => {
    setExpandedUnits(prev => ({ ...prev, [uId]: !prev[uId] }));
  };

  const filteredUnits = units.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (u.title.toLowerCase().includes(q)) return true;
    return u.lessons.some(l => l.title.toLowerCase().includes(q) || l.grammar?.toLowerCase().includes(q));
  });

  return (
    <aside className="w-72 md:w-80 bg-slateDark-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20 flex-shrink-0 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slateDark-950/60">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Contents</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons & topics..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Units & Lessons List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Student's Book Units
        </div>

        {filteredUnits.map((u) => {
          const isExpanded = expandedUnits[u.id] || searchQuery.trim().length > 0;
          const containsCurrentPage = u.lessons.some(l => l.page === currentPage) ||
            u.practical?.page === currentPage ||
            u.review?.page === currentPage;

          return (
            <div key={u.id} className="rounded-lg overflow-hidden border border-slate-800/60">
              <button
                onClick={() => toggleUnit(u.id)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold transition-colors ${
                  containsCurrentPage
                    ? 'bg-sky-500/10 text-sky-300'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 h-5 rounded bg-slate-700/60 flex items-center justify-center text-[10px] text-sky-400 font-bold">
                    {u.unitNumber}
                  </span>
                  <span className="truncate">{u.title}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="bg-slate-900/60 divide-y divide-slate-800/40 px-2 py-1">
                  {u.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onSelectPage(l.page)}
                      className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors ${
                        currentPage === l.page
                          ? 'bg-sky-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold mr-1.5 text-sky-400">{l.id}</span>
                        <span className="truncate">{l.title}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono">p.{l.bookPage}</span>
                    </button>
                  ))}

                  {u.practical && (
                    <button
                      onClick={() => onSelectPage(u.practical!.page)}
                      className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors ${
                        currentPage === u.practical.page
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate text-emerald-400 font-medium">
                        {u.practical.title}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">p.{u.practical.bookPage}</span>
                    </button>
                  )}

                  {u.review && (
                    <button
                      onClick={() => onSelectPage(u.review!.page)}
                      className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors ${
                        currentPage === u.review.page
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate text-purple-400 font-medium">
                        {u.review.title}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">p.{u.review.bookPage}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Reference Banks & Sections */}
        <div className="pt-3 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Reference Banks</span>
        </div>

        <div className="space-y-1">
          {referenceSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => onSelectPage(sec.startPage)}
              className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-lg border border-slate-800 transition-colors ${
                currentPage >= sec.startPage && currentPage <= sec.endPage
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>{sec.title}</span>
              <span className="text-[10px] font-mono opacity-60">p.{sec.startBookPage}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
