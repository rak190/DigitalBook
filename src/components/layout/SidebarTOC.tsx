import React, { useState, useMemo } from 'react';
import { Unit, ReferenceSection, TOCNavigationSection } from '../../types';
import { BookManifest } from '../../data/booksRegistry';
import { BookOpen, ChevronRight, ChevronDown, Search, Layers, X, BookmarkCheck } from 'lucide-react';

interface SidebarTOCProps {
  units?: Unit[];
  referenceSections?: ReferenceSection[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  onClose: () => void;
  bookManifest?: BookManifest;
}

export const SidebarTOC: React.FC<SidebarTOCProps> = ({
  units = [],
  referenceSections = [],
  currentPage,
  onSelectPage,
  onClose,
  bookManifest,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string, defaultOpen = true) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !defaultOpen,
    }));
  };

  // 1. Primary Manifest Navigation (Universal for all books)
  const navigationSections = useMemo<TOCNavigationSection[]>(() => {
    if (bookManifest?.navigation && bookManifest.navigation.length > 0) {
      return bookManifest.navigation;
    }

    // Auto-synthesize navigation from manifest pages if navigation array not present
    if (bookManifest?.pages) {
      const grouped: Record<string, TOCNavigationSection> = {};
      Object.entries(bookManifest.pages).forEach(([pNumStr, page]) => {
        const pNum = Number(pNumStr);
        const groupTitle = page.chapter || page.unit || page.unitName || 'Front Matter';
        const groupId = `nav_${groupTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

        if (!grouped[groupId]) {
          grouped[groupId] = {
            id: groupId,
            title: groupTitle,
            startPage: pNum,
            lessons: [],
          };
        }
        grouped[groupId].lessons.push({
          id: `lesson_${pNum}`,
          title: page.lesson || page.lessonName || page.title || `Page ${pNum}`,
          pageNumber: pNum,
          badge: `p.${page.printedPageNumber || pNum}`,
        });
      });
      return Object.values(grouped);
    }

    return [];
  }, [bookManifest]);

  // Filter sections by search query
  const filteredNavSections = useMemo(() => {
    if (!searchQuery.trim()) return navigationSections;
    const q = searchQuery.toLowerCase();
    return navigationSections
      .map((sec) => {
        const matchesTitle = sec.title.toLowerCase().includes(q);
        const matchingLessons = sec.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.grammar?.toLowerCase().includes(q) ||
            l.vocabulary?.toLowerCase().includes(q)
        );
        if (matchesTitle || matchingLessons.length > 0) {
          return {
            ...sec,
            lessons: matchesTitle ? sec.lessons : matchingLessons,
          };
        }
        return null;
      })
      .filter(Boolean) as TOCNavigationSection[];
  }, [navigationSections, searchQuery]);

  // Legacy fallback units for backward compatibility with existing tests
  const filteredLegacyUnits = useMemo(() => {
    if (navigationSections.length > 0) return [];
    if (!searchQuery.trim()) return units;
    const q = searchQuery.toLowerCase();
    return units.filter((u) => {
      if (u.title.toLowerCase().includes(q)) return true;
      return u.lessons.some(
        (l) => l.title.toLowerCase().includes(q) || l.grammar?.toLowerCase().includes(q)
      );
    });
  }, [units, navigationSections, searchQuery]);

  return (
    <aside className="w-72 md:w-80 bg-slateDark-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20 flex-shrink-0 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slateDark-950/60">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Table of Contents</h2>
            <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
              {bookManifest?.title || 'Interactive Reader'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close table of contents"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units, grammar, vocabulary..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Navigation Sections List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
        {/* Render Universal Manifest Navigation Sections */}
        {filteredNavSections.map((sec) => {
          const isExpanded = expandedSections[sec.id] ?? true;
          const containsCurrent = sec.lessons.some((l) => l.pageNumber === currentPage);

          return (
            <div
              key={sec.id}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                containsCurrent
                  ? 'border-sky-500/40 bg-sky-950/20'
                  : 'border-slate-800/80 bg-slate-850/60 hover:border-slate-700'
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`p-1 rounded-md text-[10px] font-bold ${
                      containsCurrent
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                  </span>
                  <span
                    className={`text-xs font-bold truncate ${
                      containsCurrent ? 'text-sky-300' : 'text-slate-200'
                    }`}
                  >
                    {sec.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {/* Lessons Sublist */}
              {isExpanded && (
                <div className="border-t border-slate-800/60 bg-slate-900/40 divide-y divide-slate-800/40">
                  {sec.lessons.map((lesson) => {
                    const isSelected = lesson.pageNumber === currentPage;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onSelectPage(lesson.pageNumber)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600/30 text-sky-200 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="text-xs truncate block">{lesson.title}</span>
                          {(lesson.grammar || lesson.vocabulary) && (
                            <span className="text-[10px] text-slate-400 truncate block">
                              {[lesson.grammar, lesson.vocabulary].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 flex-shrink-0">
                          {lesson.badge || `p.${lesson.pageNumber}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Legacy Units Fallback if navigationSections empty */}
        {filteredLegacyUnits.map((unit) => {
          const isExpanded = expandedSections[`u_${unit.id}`] ?? false;
          return (
            <div key={unit.id} className="rounded-xl border border-slate-800 bg-slate-850/60 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(`u_${unit.id}`)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50"
              >
                <span className="text-xs font-bold text-slate-200 truncate">{unit.title}</span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-900/40">
                  {unit.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onSelectPage(lesson.page)}
                      className="w-full px-3 py-2 text-left flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800"
                    >
                      <span className="truncate">{lesson.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">p.{lesson.page}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
