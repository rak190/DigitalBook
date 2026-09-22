import { Unit, PageMeta, ExerciseItem, ReferenceSection, AudioTrackMeta } from '../types';
import unitsJson from '../../data/units.json';
import pagesJson from '../../data/pages.json';
import exercisesJson from '../../data/exercises.json';
import answerKeyJson from '../../data/answer-key.json';
import audioJson from '../../data/audio.json';

class DataService {
  private units: Unit[] = [];
  private referenceSections: ReferenceSection[] = [];
  private pages: Map<number, PageMeta> = new Map();
  private exercisesByPage: Map<number, ExerciseItem[]> = new Map();
  private answerKey: Map<string, string[]> = new Map();
  private audioTracks: AudioTrackMeta[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Parse units
    if (unitsJson && (unitsJson as any).units) {
      this.units = (unitsJson as any).units;
    }
    if (unitsJson && (unitsJson as any).referenceSections) {
      this.referenceSections = (unitsJson as any).referenceSections;
    }

    // Parse pages
    if (Array.isArray(pagesJson)) {
      pagesJson.forEach((p: any) => {
        this.pages.set(p.pdfPage, p);
      });
    }

    // Parse exercises
    if (Array.isArray(exercisesJson)) {
      exercisesJson.forEach((ex: any) => {
        const pageList = this.exercisesByPage.get(ex.pageNum) || [];
        pageList.push(ex);
        this.exercisesByPage.set(ex.pageNum, pageList);
      });
    }

    // Parse answer keys
    if (answerKeyJson && typeof answerKeyJson === 'object') {
      Object.entries(answerKeyJson).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          this.answerKey.set(key, val);
        } else if (typeof val === 'string') {
          this.answerKey.set(key, [val]);
        }
      });
    }

    // Parse audio
    if (Array.isArray(audioJson)) {
      this.audioTracks = audioJson;
    } else if (audioJson && Array.isArray((audioJson as any).tracks)) {
      this.audioTracks = (audioJson as any).tracks;
    }
  }

  public getUnits(): Unit[] {
    return this.units;
  }

  public getReferenceSections(): ReferenceSection[] {
    return this.referenceSections;
  }

  public getPageMeta(pdfPage: number): PageMeta {
    return this.pages.get(pdfPage) || {
      pdfPage,
      bookPage: Math.max(1, pdfPage - 1),
      title: `Page ${pdfPage}`,
    };
  }

  public getExercisesForPage(pdfPage: number): ExerciseItem[] {
    return this.exercisesByPage.get(pdfPage) || [];
  }

  public getAcceptedAnswers(exerciseId: string): string[] {
    return this.answerKey.get(exerciseId) || [];
  }

  public getAllPages(): PageMeta[] {
    return Array.from(this.pages.values());
  }

  public getAudioTracksForPage(pdfPage: number): AudioTrackMeta[] {
    return this.audioTracks.filter(track => track.page === pdfPage);
  }

  public getAudioTrack(trackId: string): AudioTrackMeta | undefined {
    const clean = trackId.trim();
    return this.audioTracks.find(t => t.id === clean || t.filename === clean || t.filename === `${clean}.mp3`);
  }

  public getAllAudioTracks(): AudioTrackMeta[] {
    return this.audioTracks;
  }

  public search(query: string): Array<{ type: 'unit' | 'page' | 'exercise'; title: string; pageNum: number; snippet: string }> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ type: 'unit' | 'page' | 'exercise'; title: string; pageNum: number; snippet: string }> = [];

    // Search Units & Lessons
    this.units.forEach(u => {
      if (u.title.toLowerCase().includes(q)) {
        results.push({
          type: 'unit',
          title: `Unit ${u.unitNumber}: ${u.title}`,
          pageNum: u.lessons[0]?.page || 7,
          snippet: `Unit ${u.unitNumber} overview`
        });
      }
      u.lessons.forEach(l => {
        if (l.title.toLowerCase().includes(q) || l.grammar?.toLowerCase().includes(q) || l.vocabulary?.toLowerCase().includes(q)) {
          results.push({
            type: 'unit',
            title: `Lesson ${l.id}: ${l.title}`,
            pageNum: l.page,
            snippet: [l.grammar && `Grammar: ${l.grammar}`, l.vocabulary && `Vocab: ${l.vocabulary}`].filter(Boolean).join(' • ')
          });
        }
      });
    });

    // Search Pages
    this.pages.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.grammar?.toLowerCase().includes(q) || p.vocabulary?.toLowerCase().includes(q)) {
        results.push({
          type: 'page',
          title: p.title,
          pageNum: p.pdfPage,
          snippet: `Book p.${p.bookPage}`
        });
      }
    });

    // Search Exercises
    this.exercisesByPage.forEach((exList, pageNum) => {
      exList.forEach(ex => {
        if (ex.label.toLowerCase().includes(q) || ex.hint?.toLowerCase().includes(q) || ex.explanation?.toLowerCase().includes(q) || ex.unitRef?.toLowerCase().includes(q)) {
          results.push({
            type: 'exercise',
            title: `${ex.unitRef || 'Exercise'} (${ex.label})`,
            pageNum: pageNum,
            snippet: ex.explanation || ex.hint || `Exercise on page ${pageNum}`
          });
        }
      });
    });

    return results.slice(0, 25);
  }
}

export const dataService = new DataService();
