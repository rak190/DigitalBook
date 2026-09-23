import React, { useState, useMemo } from 'react';
import { Unit, ReferenceSection } from '../../types';
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

interface ManifestUnitGroup {
  id: string;
  title: string;
  startPage: number;
  lessons: {
    pageNumber: number;
    title: string;
    badge?: string;
  }[];
}

export const SidebarTOC: React.FC<SidebarTOCProps> = ({
  units = [],
  referenceSections = [],
  currentPage,
  onSelectPage,
  onClose,
  bookManifest,
}) => {
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    u1: true,
    manifest_u1: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUnit = (uId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [uId]: !prev[uId] }));
  };

  // Build manifest groups if not using the legacy English File units array
  const manifestGroups = useMemo<ManifestUnitGroup[]>(() => {
    if (!bookManifest) return [];
    if (bookManifest.id === 'english-file-pre-int' && units.length > 0) return [];

    const grouped: Record<string, ManifestUnitGroup> = {};

    // First, collect starter unit pages from bookManifest
    Object.values(bookManifest.pages).forEach((page) => {
      const uName = page.unitName || 'Front Matter';
      if (!grouped[uName]) {
        grouped[uName] = {
          id: `u_${uName.replace(/\s+/g, '_')}`,
          title: uName,
          startPage: page.pageNumber,
          lessons: [],
        };
      }
      grouped[uName].lessons.push({
        pageNumber: page.pageNumber,
        title: page.lessonName,
        badge: `p.${page.pageNumber}`,
      });
    });

    // Add authentic curriculum units from MoEYS Cambodia syllabus
    if (bookManifest.category === 'moeys-secondary') {
      const isG7 = bookManifest.id.includes('7');
      const isG8 = bookManifest.id.includes('8');
      const additionalChapters = isG7
        ? [
            { title: 'Unit 2: Meeting old friends', startPage: 14 },
            { title: "Unit 3: What's this? What's that?", startPage: 20 },
            { title: 'Unit 4: My new school', startPage: 26 },
            { title: 'Unit 5: Study habits', startPage: 32 },
            { title: 'Unit 6: Talking with teachers', startPage: 38 },
            { title: 'Unit 7: Getting ready for school', startPage: 44 },
            { title: 'Unit 8: Going to school', startPage: 50 },
            { title: 'Unit 9: After school', startPage: 56 },
            { title: 'Unit 10: My family', startPage: 62 },
            { title: "Unit 11: I'm the coolest in my family", startPage: 68 },
            { title: 'Unit 12: Monsters', startPage: 74 },
          ]
        : isG8
        ? [
            { title: 'Unit 2: New routines', startPage: 20 },
            { title: 'Unit 3: The morning ceremony', startPage: 26 },
            { title: 'Unit 4: A family visit', startPage: 32 },
            { title: 'Unit 5: A Homecoming', startPage: 38 },
            { title: "Unit 6: Travelling to grandma's", startPage: 44 },
            { title: 'Unit 7: Yum, yum, yum!', startPage: 50 },
            { title: 'Unit 8: Helping family and friends', startPage: 56 },
            { title: 'Unit 9: We all love to shop', startPage: 62 },
            { title: 'Unit 10: Advice on how to stay well', startPage: 68 },
            { title: 'Unit 11: We love to play sports', startPage: 74 },
            { title: 'Unit 12: It can be fun to teach', startPage: 80 },
          ]
        : [
            { title: 'Unit 2: Weekend activities', startPage: 20 },
            { title: 'Unit 3: A day fishing', startPage: 26 },
            { title: 'Unit 4: Working at a restaurant', startPage: 32 },
            { title: 'Unit 5: Visiting a shop', startPage: 38 },
            { title: 'Unit 6: The repair shop', startPage: 44 },
            { title: 'Unit 7: Healthy eating', startPage: 50 },
            { title: 'Unit 8: Healthy lifestyle', startPage: 56 },
            { title: 'Unit 9: Village health volunteer', startPage: 62 },
            { title: 'Unit 10: A trip to Phnom Penh', startPage: 68 },
            { title: 'Unit 11: A crime at the shop', startPage: 74 },
            { title: 'Unit 12: A traffic accident', startPage: 80 },
          ];

      additionalChapters.forEach((ch, idx) => {
        if (!grouped[ch.title]) {
          grouped[ch.title] = {
            id: `moeys_u_${idx + 2}`,
            title: ch.title,
            startPage: ch.startPage,
            lessons: [
              { pageNumber: ch.startPage, title: `${ch.title} (Lesson A)` },
              { pageNumber: ch.startPage + 1, title: `${ch.title} (Lesson B)` },
            ],
          };
        }
      });
    }

    return Object.values(grouped);
  }, [bookManifest, units]);

  const filteredUnits = units.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (u.title.toLowerCase().includes(q)) return true;
    return u.lessons.some(
      (l) => l.title.toLowerCase().includes(q) || l.grammar?.toLowerCase().includes(q)
    );
  });

  const filteredManifestGroups = manifestGroups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (g.title.toLowerCase().includes(q)) return true;
    return g.lessons.some((l) => l.title.toLowerCase().includes(q));
  });

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
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
        {/* Dynamic Manifest Units (for MoEYS or custom books) */}
        {manifestGroups.length > 0 ? (
          <>
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Curriculum Units & Lessons
            </div>
            {filteredManifestGroups.map((g, idx) => {
              const containsCurrent = g.lessons.some((l) => l.pageNumber === currentPage);
              const isExpanded =
                expandedUnits[g.id] ??
                (containsCurrent || idx === 0 || searchQuery.trim().length > 0);

              return (
                <div key={g.id} className="rounded-lg overflow-hidden border border-slate-800/60 mb-1">
                  <button
                    onClick={() => toggleUnit(g.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                      containsCurrent
                        ? 'bg-sky-500/10 text-sky-300'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded bg-slate-700/60 flex items-center justify-center text-[10px] text-sky-400 font-bold">
                        {idx + 1}
                      </span>
                      <span className="truncate">{g.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-900/60 divide-y divide-slate-800/40 px-2 py-1">
                      {g.lessons.map((l) => (
                        <button
                          key={`${g.id}_${l.pageNumber}_${l.title}`}
                          onClick={() => onSelectPage(l.pageNumber)}
                          className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors cursor-pointer ${
                            currentPage === l.pageNumber
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="truncate">{l.title}</span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono">p.{l.pageNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          /* Default Oxford English File units */
          <>
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Student's Book Units
            </div>

            {filteredUnits.map((u) => {
              const isExpanded = expandedUnits[u.id] || searchQuery.trim().length > 0;
              const containsCurrentPage =
                u.lessons.some((l) => l.page === currentPage) ||
                u.practical?.page === currentPage ||
                u.review?.page === currentPage;

              return (
                <div key={u.id} className="rounded-lg overflow-hidden border border-slate-800/60">
                  <button
                    onClick={() => toggleUnit(u.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
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
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-900/60 divide-y divide-slate-800/40 px-2 py-1">
                      {u.lessons.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => onSelectPage(l.page)}
                          className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors cursor-pointer ${
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
                          className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors cursor-pointer ${
                            currentPage === u.practical.page
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold mr-1.5 text-emerald-400">PE</span>
                            <span className="truncate">{u.practical.title}</span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono">p.{u.practical.bookPage}</span>
                        </button>
                      )}

                      {u.review && (
                        <button
                          onClick={() => onSelectPage(u.review!.page)}
                          className={`w-full px-2 py-1.5 text-left flex items-center justify-between text-xs rounded transition-colors cursor-pointer ${
                            currentPage === u.review.page
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold mr-1.5 text-amber-400">Rev</span>
                            <span className="truncate">{u.review.title}</span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono">p.{u.review.bookPage}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {referenceSections.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-sky-400" />
                  Reference Material
                </div>
                {referenceSections.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectPage(r.startPage)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-lg transition-colors cursor-pointer ${
                      currentPage >= r.startPage && currentPage <= r.endPage
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="text-[10px] opacity-60 font-mono">p.{r.startBookPage}-{r.endBookPage}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
