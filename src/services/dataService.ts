import { Unit, PageMeta, ExerciseItem, ReferenceSection, AudioTrackMeta, ActivityHotspot, OxfordActivity } from '../types';
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

  public getHotspotsForPage(pageNum: number): ActivityHotspot[] {
    const meta = this.getPageMeta(pageNum);
    const isPage11 = pageNum === 11 || pageNum === 12 || meta?.bookPage === 11;

    if (isPage11) {
      return [
        {
          id: '1C_ex4_hotspot',
          type: 'activity',
          label: 'Ex 4',
          title: '4 LISTENING Vermeer and The Milkmaid',
          x: 28.0,
          y: 4.8,
          activityId: '1C_ex4',
        },
        {
          id: '1C_ex4_audio',
          type: 'audio',
          label: '1.28',
          title: 'Audio Track 1.28',
          x: 6.5,
          y: 36.8,
          audioTrackId: '1.28',
        },
        {
          id: '1C_ex5a_hotspot',
          type: 'activity',
          label: 'Ex 5a',
          title: '5 VOCABULARY prepositions of place',
          x: 88.0,
          y: 4.8,
          activityId: '1C_ex5a',
        },
        {
          id: '1C_ex5a_audio',
          type: 'audio',
          label: '1.29',
          title: 'Audio Track 1.29',
          x: 54.0,
          y: 38.0,
          audioTrackId: '1.29',
        },
      ];
    }

    // Dynamic fallback hotspots for any other page in the textbook
    const exercises = this.getExercisesForPage(pageNum);
    const hotspots: ActivityHotspot[] = [];

    // Group exercises by label prefix or unitRef
    const grouped = new Map<string, ExerciseItem[]>();
    exercises.forEach(ex => {
      const groupKey = ex.unitRef || ex.label.split('.')[0] || ex.label;
      const list = grouped.get(groupKey) || [];
      list.push(ex);
      grouped.set(groupKey, list);
    });

    grouped.forEach((exList, key) => {
      const first = exList[0];
      hotspots.push({
        id: `activity_${first.id}`,
        type: 'activity',
        label: `Ex ${first.label}`,
        title: `${first.unitRef || 'Exercise'} ${first.label}`,
        x: Math.min(88, Math.max(8, first.x + first.width + 2)),
        y: Math.max(3, first.y - 1.5),
        activityId: `activity_${first.id}`,
        exerciseIds: exList.map(e => e.id),
      });

      if (first.audioTrack) {
        hotspots.push({
          id: `audio_${first.audioTrack}_${first.id}`,
          type: 'audio',
          label: first.audioTrack,
          title: `Audio Track ${first.audioTrack}`,
          x: Math.max(4, first.x - 5),
          y: first.y,
          audioTrackId: first.audioTrack,
        });
      }
    });

    return hotspots;
  }

  public getActivity(activityId: string): OxfordActivity | null {
    if (activityId === '1C_ex4') {
      return {
        id: '1C_ex4',
        legacyId: 'p12_1',
        unitId: '1C',
        pageId: 12,
        bookPage: 11,
        title: '4 LISTENING Vermeer and The Milkmaid',
        instructions: 'Listen to an art expert talking about Johannes Vermeer and The Milkmaid. Choose the correct answers (a, b, or c).',
        type: 'multiple-choice',
        audioTrack: '1.28',
        hotspot: { x: 28.0, y: 4.8 },
        audioHotspot: { x: 6.5, y: 36.8 },
        questions: [
          {
            num: 1,
            id: 'p12_1',
            question: 'Johannes Vermeer was a Dutch painter from the...',
            correct: 'b',
            label: '17th',
            options: [
              { value: 'a', label: '16th century' },
              { value: 'b', label: '17th century' },
              { value: 'c', label: '18th century' },
            ],
          },
          {
            num: 2,
            id: 'p12_2',
            question: 'He lived and worked in...',
            correct: 'a',
            label: 'Holland',
            options: [
              { value: 'a', label: 'Holland' },
              { value: 'b', label: 'France' },
              { value: 'c', label: 'Germany' },
            ],
          },
          {
            num: 3,
            id: 'p12_3',
            question: 'In his paintings, he mostly painted...',
            correct: 'a',
            label: 'everyday scenes',
            options: [
              { value: 'a', label: 'everyday scenes' },
              { value: 'b', label: 'portraits of kings' },
              { value: 'c', label: 'landscapes' },
            ],
          },
          {
            num: 4,
            id: 'p12_4',
            question: 'In The Milkmaid, the woman is pouring milk to make...',
            correct: 'c',
            label: 'a pudding',
            options: [
              { value: 'a', label: 'butter' },
              { value: 'b', label: 'cheese' },
              { value: 'c', label: 'a pudding' },
            ],
          },
          {
            num: 5,
            id: 'p12_5',
            question: "Vermeer didn't paint many paintings because he only completed about...",
            correct: 'b',
            label: '34',
            options: [
              { value: 'a', label: '24' },
              { value: 'b', label: '34' },
              { value: 'c', label: '64' },
            ],
          },
          {
            num: 6,
            id: 'p12_6',
            question: 'He died with many debts because...',
            correct: 'b',
            label: 'Because some of the paints were very expensive',
            options: [
              { value: 'a', label: 'nobody liked his paintings' },
              { value: 'b', label: 'some of the paints he used were very expensive' },
              { value: 'c', label: 'his paintings were very cheap' },
            ],
          },
        ],
      };
    }

    if (activityId === '1C_ex5a') {
      return {
        id: '1C_ex5a',
        legacyId: 'p12_7',
        unitId: '1C',
        pageId: 12,
        bookPage: 11,
        title: '5 VOCABULARY prepositions of place',
        instructions: 'Look at the painting The Milkmaid. Complete the sentences with prepositions from the list.',
        type: 'gap-fill',
        audioTrack: '1.29',
        hotspot: { x: 88.0, y: 4.8 },
        audioHotspot: { x: 54.0, y: 38.0 },
        wordBank: [
          'above',
          'behind',
          'between',
          'in',
          'in front of',
          'in the corner',
          'in the middle of',
          'next to',
          'on',
          'on the left of',
          'under',
        ],
        blanks: {
          '2': { id: 'p12_7', accepted: ['in front of'], hint: 'Position in front of him', label: 'Blank 2' },
          '3': { id: 'p12_8', accepted: ['On', 'on'], hint: 'Surface preposition', label: 'Blank 3' },
          '4a': { id: 'p12_9', accepted: ['in the middle of', 'in the center of'], hint: 'Central position', label: 'Blank 4a' },
          '4b': { id: 'p12_10', accepted: ['between'], hint: 'In the middle of two items', label: 'Blank 4b' },
          '5': { id: 'p12_11', accepted: ['under', 'underneath', 'beneath'], hint: 'Below the bread', label: 'Blank 5' },
          '6': { id: 'p12_12', accepted: ['Behind', 'behind'], hint: 'At the back of the man', label: 'Blank 6' },
          '7': { id: 'p12_13', accepted: ['on the left of', 'on the left'], hint: 'Position on the left side', label: 'Blank 7' },
          '8': { id: 'p12_14', accepted: ['In the corner', 'in the corner'], hint: 'Corner of the room', label: 'Blank 8' },
          '9a': { id: 'p12_15', accepted: ['on'], hint: 'On the wall', label: 'Blank 9a' },
          '9b': { id: 'p12_16', accepted: ['above', 'over'], hint: 'Higher than the sink', label: 'Blank 9b' },
          '10': { id: 'p12_17', accepted: ['next to', 'beside'], hint: 'Beside the window', label: 'Blank 10' },
        },
        sentences: [
          { num: 1, text: "On the chair there's a man.", blankIds: [] },
          { num: 2, text: "______ him there's a small table.", blankIds: ['2'] },
          { num: 3, text: "______ the table there's a cloth.", blankIds: ['3'] },
          { num: 4, text: "______ the table there's a loaf of bread, and ______ the bread and the eggs there's a bowl.", blankIds: ['4a', '4b'] },
          { num: 5, text: "The man is holding some bread ______ his hand.", blankIds: ['5'] },
          { num: 6, text: "______ the table there's a dog.", blankIds: ['6'] },
          { num: 7, text: "On the right there's a woman, and ______ her there's a window.", blankIds: ['7'] },
          { num: 8, text: "______ there's a pair of shoes.", blankIds: ['8'] },
          { num: 9, text: "______ the wall ______ the mirror there's a shelf.", blankIds: ['9a', '9b'] },
          { num: 10, text: "There's a towel on the wall ______ the door.", blankIds: ['10'] },
        ],
      };
    }

    return null;
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
