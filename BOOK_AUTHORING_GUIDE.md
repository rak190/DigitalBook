# DigitalBook Platform: Book Authoring & Curriculum Guide

This guide describes how curriculum designers, educators, and content developers can add a new interactive textbook to **DigitalBook** without modifying any core application logic or React components.

---

## 🏛 Architecture Overview

The DigitalBook reader engine is **strictly content-agnostic**:
- The reader shell, canvas, audio player dock, image focus lightbox, and exercise renderer do not have hardcoded references to book IDs, unit structures, or curriculum rules.
- Everything is driven by a single TypeScript declaration file called a **`BookManifest`** located in `src/data/books/`.
- Assets (page images, audio recordings, cropped artworks) live in the `public/` directory and are referenced via standard paths.

---

## 🛠 Step-by-Step Authoring Workflow

### Step 1: Prepare Textbook Assets

Organize your digital assets into the `public/` directory:

1. **Cover Image**:
   - Location: `public/<bookId>_cover.jpg` (or `public/book_thumbnails/`)
   - Recommended resolution: ~600x850 px, JPEG format, quality 85-90.
2. **Page Scans**:
   - Location: `public/<folder_name>/<prefix>_p<number>.jpg`
   - Recommended resolution: ~1400x1980 px (150-200 DPI), clean contrast.
3. **Course Audio Files**:
   - Location: `public/audio/<trackId>.mp3`
   - Recommended format: MP3, 128 kbps stereo / 64 kbps mono.
4. **Cropped Image Regions** (for artwork, maps, or dialogue focus):
   - Location: `public/images/<image_name>.jpg`
   - Recommended resolution: 800-1600 px wide.

---

### Step 1b: Automated PDF Ingestion (Optional Shortcut)

Instead of manually slicing PDF pages, use the built-in ingestion CLI:
```bash
python scripts/ingest_pdf.py /path/to/textbook.pdf public/my_pages/ --manifest-id my-book-1 --title "My Textbook" --dpi 150
```
This utility:
- Renders high-fidelity JPEG page scans (`page_1.jpg`, `page_2.jpg`, etc.)
- Creates optimized cover and page thumbnails in `public/my_pages/thumbnails/`
- Emits a starter `manifest.json` pre-populated with total page count and page structures.

---

### Step 2: Create the Book Manifest File

Create a new file in `src/data/books/`:
```bash
src/data/books/myNewBook.ts
```

Here is the complete template:

```typescript
import { BookManifest } from '../../types';

const BASE = import.meta.env.BASE_URL || '/';

export const myNewBook: BookManifest = {
  id: 'my-curriculum-book-1',
  title: 'English For Global Communication',
  subtitle: "Student's Coursebook Level 1",
  author: 'Jane Doe, John Smith',
  publisher: 'Educational Press',
  category: 'moeys-secondary', // 'moeys-secondary' | 'self-study' | 'general'
  grade: 'Level 1',
  gradeLabel: 'Level 1',
  cefrLevel: 'A1-A2',
  coverImage: `${BASE}my_book_cover.jpg`,
  totalPages: 120, // Total digitized pages
  physicalTotalPages: 120, // Total pages in physical print
  language: 'en-US',
  description:
    'Interactive coursebook featuring speaking activities, listening comprehension, grammar drills, and vocabulary enrichment.',
  version: '1.0.0',
  contentBasePath: `${BASE}my_pages/`,
  pageImagePattern: 'my_pages/p{page}.jpg', // Optional generic page filename pattern
  initialPage: 5, // Default start page when book is first opened
  aliases: ['my-book-1', 'level-1'], // Shorthand IDs for URL routing
  features: {
    audio: true,
    exercises: true,
    imageRegions: true,
    presentationMode: true,
  },

  // 1. Table of Contents Navigation
  navigation: [
    {
      id: 'unit_1',
      title: 'Unit 1: First Impressions',
      startPage: 5,
      endPage: 12,
      lessons: [
        {
          id: 'u1_l1',
          title: 'Lesson 1: Greetings & Introductions',
          pageNumber: 5,
          badge: 'p.5',
          grammar: 'Verb to be',
          vocabulary: 'Greetings',
        },
        {
          id: 'u1_l2',
          title: 'Lesson 2: Meeting Classmates',
          pageNumber: 7,
          badge: 'p.7',
          grammar: 'Subject pronouns',
          vocabulary: 'Classroom objects',
        },
      ],
    },
  ],

  // 2. Interactive Pages Mapping
  pages: {
    5: {
      internalPageId: 5,
      pdfPageNumber: 5,
      printedPageNumber: 5,
      image: `${BASE}my_pages/p5.jpg`,
      chapter: 'Unit 1: First Impressions',
      unit: 'Unit 1: Greetings & Introductions',
      lesson: 'Lesson 1',
      title: 'Unit 1: Lesson 1 - Greetings & Introductions',
      pageType: 'lesson', // 'cover' | 'syllabus' | 'lesson' | 'review' | 'reference'

      // Hotspots placed on the textbook page (0 to 100 percentage coordinates)
      hotspots: [
        {
          id: 'u1_p5_audio_1',
          type: 'audio',
          xPercent: 8.5,
          yPercent: 20.0,
          badgeLabel: '1.1',
          title: 'Audio Track 1.1: Common Greetings',
          targetId: 'track_1_1',
          audioTrack: 'track_1_1',
        },
        {
          id: 'u1_p5_act_1',
          type: 'exercise',
          xPercent: 90.0,
          yPercent: 20.0,
          badgeLabel: 'Ex 1',
          title: 'Exercise 1: Complete the dialogue',
          targetId: 'u1_ex1',
          exerciseId: 'u1_ex1',
        },
        {
          id: 'u1_p5_img_1',
          type: 'image',
          xPercent: 50.0,
          yPercent: 45.0,
          badgeLabel: '🖼 Class Photo',
          title: 'View Class Photo',
          targetId: 'img_u1_class',
          imageRegionId: 'img_u1_class',
        },
      ],

      // Audio Tracks definition for this page
      audioTracks: [
        {
          id: 'track_1_1',
          title: 'Track 1.1: Common Greetings',
          source: `${BASE}audio/track_1_1.mp3`,
          bookId: 'my-curriculum-book-1',
          pageId: 5,
          transcript:
            'Speaker A: Hello, my name is Alex. What is your name?\nSpeaker B: Hi Alex! I am Sarah. Pleased to meet you.\nSpeaker A: Pleased to meet you too!',
        },
      ],

      // Interactive Image Regions (Clickable Lightbox Artwork / Illustrations)
      imageRegions: [
        {
          id: 'img_u1_class',
          x: 10.0,      // Left edge percentage [0..100]
          y: 35.0,      // Top edge percentage [0..100]
          width: 80.0,   // Width percentage [0..100]
          height: 30.0,  // Height percentage [0..100]
          imageSource: `${BASE}images/my_class_photo.jpg`,
          title: 'Welcome to the Classroom',
          caption: 'Students welcoming their new teacher in the first week of the semester.',
          vocabularyTag: 'Classroom Language',
          enabled: true,
          zoom: 1.2,
          vocabulary: {
            word: 'Classmate',
            phonetic: '/ˈklɑːsmeɪt/',
            partOfSpeech: 'noun',
            definition: 'A person who is in the same class as you at school or college.',
            exampleSentence: 'Sarah introduced her new classmate to the teacher.',
          },
        },
      ],

      // Interactive Exercises
      exercises: [
        {
          id: 'u1_ex1',
          title: '1 Complete the Dialogue',
          type: 'gap-fill', // 'gap-fill' | 'multiple-choice' | 'open-response'
          instructions: 'Fill in the blanks with the correct words from the word bank.',
          audioTrack: 'track_1_1',
          wordBank: ['Hello', 'name', 'Pleased', 'meet'],
          questions: [
            {
              id: 'q1',
              prompt: 'A: ______, my name is Alex.',
              correctAnswer: 'Hello',
              acceptedAnswers: ['Hello', 'hello', 'Hi'],
            },
            {
              id: 'q2',
              prompt: 'B: Pleased to ______ you, Alex.',
              correctAnswer: 'meet',
              acceptedAnswers: ['meet'],
            },
          ],
        },
      ],
    },
  },
};
```

---

### Step 3: Register the Book in the Catalog

Edit `src/data/books/index.ts`:

```typescript
import { myNewBook } from './myNewBook';

export const INITIAL_BOOKS: BookManifest[] = [
  englishGrade7,
  englishGrade8,
  englishGrade9,
  englishFilePreIntermediate,
  myNewBook, // <-- Add here
];
```

---

### Step 4: Validate Your Manifest

Run the automated validator to verify all rules:
```bash
npm run validate-content
```

The validator checks:
1. **File Existence**: All page images, cover images, image regions, and audio files exist on disk.
2. **Bounding Box Math**: Ensures `0 <= x, y, width, height <= 100` and `x + width <= 100`, `y + height <= 100`.
3. **Hotspot Pointers**: Ensures `targetId` references real exercises, image regions, or audio tracks.
4. **Answer Keys**: Verifies every question has at least one valid correct answer or accepted alternative.
5. **Multiple Choice Rules**: Verifies each question has at least 2 selectable options and the correct answer exists among the options.

---

## 📝 Universal Exercise Authoring Guidelines

The platform supports 16 pedagogical activity paradigms dispatched dynamically via `ExerciseRenderer`.

### 1. Gap-Fill with Word Bank (`gap-fill`)
```typescript
{
  id: 'g8_u1_ex2',
  title: '2 Classroom Objects',
  type: 'gap-fill',
  instructions: 'Fill in the blanks using words from the list.',
  wordBank: ['chalkboard', 'ruler', 'notebook'],
  wordBankConfig: { allowMultipleUse: false }, // Optional: allow reusing chips
  questions: [
    {
      id: 'q1',
      prompt: "The teacher wrote on the ______.",
      correctAnswer: 'chalkboard',
      acceptedAnswers: ['chalkboard', 'board'],
    },
  ],
}
```
*Note*: Students can click chips in the word bank to insert words directly into the focused blank.

### 2. Multiple-Choice (`multiple-choice` / `single-choice`)
```typescript
{
  id: 'g8_u1_ex1',
  title: '1 Meeting a New Classmate',
  type: 'multiple-choice',
  instructions: 'Choose the most polite response.',
  questions: [
    {
      id: 'q1',
      prompt: 'What do you say when meeting someone for the first time?',
      options: ['Pleased to meet you', 'Goodbye forever', 'Where is my lunch?'],
      correctAnswer: 'Pleased to meet you',
      acceptedAnswers: ['Pleased to meet you', 'a'],
    },
  ],
}
```

### 3. Multiple-Selection (`multiple-selection`)
```typescript
{
  id: 'u1_ex_ms',
  title: 'Select All True Statements',
  type: 'multiple-selection',
  instructions: 'Choose all correct statements about the listening track.',
  questions: [
    {
      id: 'ms1',
      prompt: 'Which activities did Dara mention?',
      options: ['Playing football', 'Doing homework', 'Visiting Angkor Wat', 'Swimming'],
      correctAnswer: ['Playing football', 'Doing homework'],
    },
  ],
}
```

### 4. Matching (`matching`)
```typescript
{
  id: 'g8_u0_matching',
  title: '1 Matching: School Subjects & Activities',
  type: 'matching',
  instructions: 'Match each school subject with its classroom activity.',
  questions: [
    {
      id: 'match_q1',
      prompt: 'Match the left and right items.',
      matchingPairs: [
        { leftId: 'pair_1', left: 'Mathematics', right: 'Solving equations' },
        { leftId: 'pair_2', left: 'Geography', right: 'Studying maps' },
        { leftId: 'pair_3', left: 'English', right: 'Practising dialogue' },
      ],
      correctAnswer: 'Solving equations',
      acceptedAnswers: ['Solving equations'],
    },
  ],
}
```

### 5. True / False (`true-false`)
```typescript
{
  id: 'g8_u0_tf',
  title: '2 True / False: School Life',
  type: 'true-false',
  instructions: 'Decide whether each statement is True or False.',
  questions: [
    {
      id: 'tf_1',
      prompt: 'In Cambodia, Grade 8 is part of lower secondary school.',
      correctAnswer: 'True',
      acceptedAnswers: ['True', 'true', 'T'],
    },
  ],
}
```

### 6. Ordering / Chronology (`ordering`)
```typescript
{
  id: 'u2_order',
  title: 'Order the Story Events',
  type: 'ordering',
  instructions: 'Arrange the sentences in chronological order.',
  questions: [
    {
      id: 'ord_1',
      prompt: 'Morning Routine Order',
      items: [
        'Wake up at 6:00 AM',
        'Eat breakfast with family',
        'Walk to school with classmates',
      ],
      correctAnswer: 'Wake up at 6:00 AM, Eat breakfast with family, Walk to school with classmates',
    },
  ],
}
```

### 7. Dropdown Selection (`dropdown`)
```typescript
{
  id: 'u3_dropdown',
  title: 'Choose the Correct Verb Form',
  type: 'dropdown',
  instructions: 'Select the correct option from each dropdown.',
  questions: [
    {
      id: 'dd_1',
      prompt: 'She ______ to school every weekday morning.',
      options: ['walk', 'walks', 'walking'],
      correctAnswer: 'walks',
      acceptedAnswers: ['walks'],
    },
  ],
}
```

### 8. Table Completion (`table-completion`)
```typescript
{
  id: 'u4_table',
  title: 'Irregular Verbs Table',
  type: 'table-completion',
  instructions: 'Fill in the past simple form for each infinitive verb.',
  questions: [
    {
      id: 'tbl_1',
      tableHeaders: ['Base Form', 'Past Simple'],
      tableRows: [
        ['go', '______'],
        ['see', '______'],
      ],
      correctAnswer: 'went, saw',
    },
  ],
}
```

### 9. Speaking & Model Pronunciation (`speaking`)
```typescript
{
  id: 'u1_speaking',
  title: 'Dialogue Practice',
  type: 'speaking',
  instructions: 'Listen to the model phrase and practise speaking with your partner.',
  questions: [
    {
      id: 'spk_1',
      prompt: 'Nice to meet you. Where are you from?',
      modelAudioText: 'Nice to meet you. Where are you from?',
    },
  ],
}
```

### 10. Self-Check / Teacher-Led (`self-check`, `teacher-led`)
```typescript
{
  id: 'u1_check',
  title: 'Unit 1 Self-Assessment Checklist',
  type: 'self-check',
  instructions: 'Assess your confidence with the unit language goals.',
  questions: [
    {
      id: 'chk_1',
      prompt: 'I can introduce myself and ask basic questions in English.',
    },
  ],
}
```

### 11. Open Response (`open-response`)
```typescript
{
  id: 'g7_u1_ex1',
  title: '1 Personal Introduction',
  type: 'open-response',
  instructions: 'Write answers about yourself.',
  questions: [
    {
      id: 'q1',
      prompt: "What's your name?",
      correctAnswer: 'My name is...',
    },
  ],
}
```

---

## 🎧 Audio Tracks & Speech Fallback

1. **Official Audio**: If an MP3 file exists in `public/audio/<trackId>.mp3`, the audio dock will stream the authentic recording with seeking, speed controls, and A/B looping.
2. **Missing Audio (Graceful Fallback)**: If an audio track file is not present on disk, the system displays an honest badge:
   `"Course audio unavailable"`
   and offers the student or teacher a **Device Speech Pronunciation** button powered by the Web Speech API. It never misleads the teacher by claiming synthesized voice is the official recording.
3. **Listening Scripts**: Provide a multiline string in `transcript`. When the student clicks `"Script"`, it opens an expandable panel with a `"Large Text (Projector)"` toggle for high-visibility classroom projection.

---

## 🖼 Clickable Image Regions & Lightbox

Image regions allow students to inspect textbook artwork, charts, and dialogues in high definition:
- `x`, `y`: Top-left corner in percentages of the page.
- `width`, `height`: Bounding box dimensions.
- `vocabulary`: Optional target word definition, phonetic transcription, part of speech, and example sentence. The Lightbox provides an audio button to pronounce the vocabulary word out loud.

---

## 🔒 Storage Isolation

No configuration is needed for persistence. The platform automatically isolates user answers and completed exercises by book ID:
```
digital_book_progress_<bookId>
```
When a student switches between textbooks, their progress remains clean and independent.
