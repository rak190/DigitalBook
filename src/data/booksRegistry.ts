export interface Exercise {
  id: string;
  title: string;
  type: 'gap-fill' | 'multiple-choice' | 'table-fill' | 'open-response';
  instructions: string;
  audioTrack?: string;
  wordBank?: string[];
  questions: {
    id: string;
    prompt?: string;
    options?: string[];
    correctAnswer?: string | string[];
  }[];
}

export interface PageData {
  pageNumber: number;
  imageSrc: string;
  unitName: string;
  lessonName: string;
  hotspots: {
    id: string;
    type: 'audio' | 'activity';
    xPercent: number;
    yPercent: number;
    badgeLabel: string;
    exerciseId?: string;
    audioTrack?: string;
  }[];
  exercises: Exercise[];
}

export interface BookManifest {
  id: string; // 'english-file-pre-int', 'moeys-english-grade-7', 'moeys-english-grade-8', 'moeys-english-grade-9'
  title: string;
  subtitle: string;
  category: 'moeys-secondary' | 'oxford-series';
  gradeLabel: string;
  coverImage: string;
  totalPages: number;
  pages: Record<number, PageData>;
}

const BASE = import.meta.env.BASE_URL || '/';

export const BOOKS_REGISTRY: Record<string, BookManifest> = {
  'english-file-pre-int': {
    id: 'english-file-pre-int',
    title: 'English File Pre-Intermediate',
    subtitle: "Student's Book (4th Edition - Self-Study)",
    category: 'oxford-series',
    gradeLabel: 'Pre-Intermediate',
    coverImage: `${BASE}book_thumbnails/thumb_1.jpg`,
    totalPages: 168,
    pages: {
      1: {
        pageNumber: 1,
        imageSrc: `${BASE}book_pages/page_1.jpg`,
        unitName: 'Cover',
        lessonName: "Student's Book Front Cover",
        hotspots: [],
        exercises: [],
      },
      6: {
        pageNumber: 6,
        imageSrc: `${BASE}book_pages/page_6.jpg`,
        unitName: 'Course Overview',
        lessonName: 'Welcome to English File 4th Edition',
        hotspots: [],
        exercises: [],
      },
      7: {
        pageNumber: 7,
        imageSrc: `${BASE}book_pages/page_7.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1A: Are you? Can you? Do you? Did you? (Part 1)',
        hotspots: [
          {
            id: 'ef_p7_audio_1_2',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 19.5,
            badgeLabel: '1.2',
            audioTrack: '1.2',
          },
          {
            id: 'ef_p7_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 19.5,
            badgeLabel: 'Ex 1',
            exerciseId: 'ef_u1a_ex1',
          },
          {
            id: 'ef_p7_audio_1_3',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 49.0,
            badgeLabel: '1.3',
            audioTrack: '1.3',
          },
          {
            id: 'ef_p7_act_2',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 49.0,
            badgeLabel: 'Ex 2',
            exerciseId: 'ef_u1a_ex2',
          },
        ],
        exercises: [
          {
            id: 'ef_u1a_ex1',
            title: '1 GRAMMAR word order in questions',
            type: 'gap-fill',
            instructions: 'Complete the questions with the correct question words from the word bank.',
            audioTrack: '1.2',
            wordBank: ['Where', 'What', 'How', 'Who', 'When', 'Why'],
            questions: [
              { id: 'ef_q1', prompt: '1. ______ were you born?', correctAnswer: 'Where' },
              { id: 'ef_q2', prompt: '2. ______ do you do?', correctAnswer: 'What' },
              { id: 'ef_q3', prompt: '3. ______ are you today?', correctAnswer: 'How' },
              { id: 'ef_q4', prompt: '4. ______ do you live with?', correctAnswer: 'Who' },
              { id: 'ef_q5', prompt: '5. ______ is your birthday?', correctAnswer: 'When' },
            ],
          },
          {
            id: 'ef_u1a_ex2',
            title: '2 PRONUNCIATION vowel sounds',
            type: 'multiple-choice',
            instructions: 'Listen and choose the word with the matching vowel sound.',
            audioTrack: '1.3',
            questions: [
              {
                id: 'ef_q6',
                prompt: 'Which word has the /eɪ/ sound (train)?',
                options: ['day', 'car', 'me'],
                correctAnswer: 'day',
              },
              {
                id: 'ef_q7',
                prompt: 'Which word has the /iː/ sound (tree)?',
                options: ['meet', 'cat', 'hot'],
                correctAnswer: 'meet',
              },
            ],
          },
        ],
      },
      8: {
        pageNumber: 8,
        imageSrc: `${BASE}book_pages/page_8.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1A: Are you? Can you? Do you? Did you? (Part 2)',
        hotspots: [
          {
            id: 'ef_p8_audio_1_9',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 32.0,
            badgeLabel: '1.9',
            audioTrack: '1.9',
          },
          {
            id: 'ef_p8_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 32.0,
            badgeLabel: 'Ex 4',
            exerciseId: 'ef_u1a_ex4',
          },
        ],
        exercises: [
          {
            id: 'ef_u1a_ex4',
            title: '4 LISTENING Student Information Form',
            type: 'gap-fill',
            instructions: "Listen to Wayne Roberts talking to the receptionist. Complete the form.",
            audioTrack: '1.9',
            wordBank: ['Wayne', 'Roberts', 'British', 'London'],
            questions: [
              { id: 'ef_w1', prompt: '1. First Name: ______', correctAnswer: 'Wayne' },
              { id: 'ef_w2', prompt: '2. Surname: ______', correctAnswer: 'Roberts' },
              { id: 'ef_w3', prompt: '3. Nationality: ______', correctAnswer: 'British' },
            ],
          },
        ],
      },
      9: {
        pageNumber: 9,
        imageSrc: `${BASE}book_pages/page_9.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1B: The perfect date? (Part 1)',
        hotspots: [
          {
            id: 'ef_p9_audio_1_11',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 22.0,
            badgeLabel: '1.11',
            audioTrack: '1.11',
          },
          {
            id: 'ef_p9_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 22.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'ef_u1b_ex1',
          },
        ],
        exercises: [
          {
            id: 'ef_u1b_ex1',
            title: '1 VOCABULARY describing people',
            type: 'multiple-choice',
            instructions: 'Choose the correct adjective that describes the personality trait.',
            audioTrack: '1.11',
            questions: [
              {
                id: 'ef_d1',
                prompt: 'A person who likes talking to people and making friends is...',
                options: ['friendly', 'shy', 'mean'],
                correctAnswer: 'friendly',
              },
              {
                id: 'ef_d2',
                prompt: 'A person who makes people laugh is...',
                options: ['funny', 'serious', 'quiet'],
                correctAnswer: 'funny',
              },
              {
                id: 'ef_d3',
                prompt: 'A person who does not like spending money is...',
                options: ['mean', 'generous', 'kind'],
                correctAnswer: 'mean',
              },
            ],
          },
        ],
      },
      10: {
        pageNumber: 10,
        imageSrc: `${BASE}book_pages/page_10.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1B: The perfect date? (Part 2)',
        hotspots: [
          {
            id: 'ef_p10_audio_1_15',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 28.0,
            badgeLabel: '1.15',
            audioTrack: '1.15',
          },
          {
            id: 'ef_p10_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 28.0,
            badgeLabel: 'Ex 3',
            exerciseId: 'ef_u1b_ex3',
          },
        ],
        exercises: [
          {
            id: 'ef_u1b_ex3',
            title: "3 LISTENING Charlotte's Dates",
            type: 'multiple-choice',
            instructions: "Listen and decide which suitor Charlotte preferred.",
            audioTrack: '1.15',
            questions: [
              {
                id: 'ef_c1',
                prompt: 'Who was tall with dark hair and a great smile?',
                options: ['Sebastian', 'John'],
                correctAnswer: 'Sebastian',
              },
              {
                id: 'ef_c2',
                prompt: 'Who arrived late for the date?',
                options: ['John', 'Sebastian'],
                correctAnswer: 'John',
              },
            ],
          },
        ],
      },
      11: {
        pageNumber: 11,
        imageSrc: `${BASE}book_pages/page_11.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1C: The Remake Project (Part 1)',
        hotspots: [
          {
            id: 'ef_p11_audio_1_19',
            type: 'audio',
            xPercent: 7.0,
            yPercent: 18.0,
            badgeLabel: '1.19',
            audioTrack: '1.19',
          },
          {
            id: 'ef_p11_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 18.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'ef_u1c_ex1',
          },
        ],
        exercises: [
          {
            id: 'ef_u1c_ex1',
            title: '1 VOCABULARY things you wear',
            type: 'gap-fill',
            instructions: 'Complete with the clothing items.',
            wordBank: ['trousers', 'shoes', 'shirt', 'jacket', 'scarf'],
            questions: [
              { id: 'ef_cl1', prompt: 'You wear them on your legs: ______', correctAnswer: 'trousers' },
              { id: 'ef_cl2', prompt: 'You wear them on your feet: ______', correctAnswer: 'shoes' },
              { id: 'ef_cl3', prompt: 'You wear it around your neck in winter: ______', correctAnswer: 'scarf' },
            ],
          },
        ],
      },
      12: {
        pageNumber: 12,
        imageSrc: `${BASE}book_pages/page_12.jpg`,
        unitName: 'Unit 1: Getting to know you',
        lessonName: '1C: The Remake Project (Part 2) - Vermeer and The Milkmaid',
        hotspots: [
          {
            id: '1C_ex4_audio',
            type: 'audio',
            badgeLabel: '1.28',
            xPercent: 6.5,
            yPercent: 36.8,
            audioTrack: '1.28',
          },
          {
            id: '1C_ex4_hotspot',
            type: 'activity',
            badgeLabel: 'Ex 4',
            xPercent: 28.0,
            yPercent: 4.8,
            exerciseId: '1C_ex4',
          },
          {
            id: '1C_ex5a_audio',
            type: 'audio',
            badgeLabel: '1.29',
            xPercent: 54.0,
            yPercent: 38.0,
            audioTrack: '1.29',
          },
          {
            id: '1C_ex5a_hotspot',
            type: 'activity',
            badgeLabel: 'Ex 5a',
            xPercent: 88.0,
            yPercent: 4.8,
            exerciseId: '1C_ex5a',
          },
        ],
        exercises: [
          {
            id: '1C_ex4',
            title: '4 LISTENING Vermeer and The Milkmaid',
            type: 'multiple-choice',
            audioTrack: '1.28',
            instructions:
              'Listen to an art expert talking about Johannes Vermeer and The Milkmaid. Choose the correct answers (a, b, or c).',
            questions: [
              {
                id: 'p12_1',
                prompt: 'Johannes Vermeer was a Dutch painter from the...',
                options: ['16th century', '17th century', '18th century'],
                correctAnswer: '17th century',
              },
              {
                id: 'p12_2',
                prompt: 'He lived and worked in...',
                options: ['Holland', 'France', 'Germany'],
                correctAnswer: 'Holland',
              },
              {
                id: 'p12_3',
                prompt: 'In his paintings, he mostly painted...',
                options: ['everyday scenes', 'portraits of kings', 'landscapes'],
                correctAnswer: 'everyday scenes',
              },
              {
                id: 'p12_4',
                prompt: 'In The Milkmaid, the woman is pouring milk to make...',
                options: ['butter', 'cheese', 'a pudding'],
                correctAnswer: 'a pudding',
              },
              {
                id: 'p12_5',
                prompt: "Vermeer didn't paint many paintings because he only completed about...",
                options: ['24', '34', '64'],
                correctAnswer: '34',
              },
              {
                id: 'p12_6',
                prompt: 'He died with many debts because...',
                options: [
                  'nobody liked his paintings',
                  'some of the paints he used were very expensive',
                  'his paintings were very cheap',
                ],
                correctAnswer: 'some of the paints he used were very expensive',
              },
            ],
          },
          {
            id: '1C_ex5a',
            title: '5 VOCABULARY prepositions of place',
            type: 'gap-fill',
            audioTrack: '1.29',
            instructions: 'Look at the painting The Milkmaid. Complete the sentences with prepositions from the list.',
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
            questions: [
              { id: 'p12_7', prompt: "2. ______ him there's a small table.", correctAnswer: 'in front of' },
              { id: 'p12_8', prompt: "3. ______ the table there's a cloth.", correctAnswer: 'on' },
              { id: 'p12_9', prompt: "4a. ______ the table there's a loaf of bread", correctAnswer: 'in the middle of' },
              { id: 'p12_10', prompt: "4b. and ______ the bread and the eggs there's a bowl.", correctAnswer: 'between' },
              { id: 'p12_11', prompt: '5. The man is holding some bread ______ his hand.', correctAnswer: 'in' },
              { id: 'p12_12', prompt: "6. ______ the table there's a dog.", correctAnswer: 'under' },
              { id: 'p12_13', prompt: "7. On the right there's a woman, and ______ her there's a window.", correctAnswer: 'next to' },
              { id: 'p12_14', prompt: "8. ______ there's a pair of shoes.", correctAnswer: 'in the corner' },
              { id: 'p12_15', prompt: "9a. ______ the wall there's a shelf", correctAnswer: 'on' },
              { id: 'p12_16', prompt: '9b. ______ the mirror.', correctAnswer: 'above' },
              { id: 'p12_17', prompt: "10. There's a towel on the wall ______ the door.", correctAnswer: 'behind' },
            ],
          },
        ],
      },
      13: {
        pageNumber: 13,
        imageSrc: `${BASE}book_pages/page_13.jpg`,
        unitName: 'Practical English Episode 1',
        lessonName: 'Calling reception (Part 1)',
        hotspots: [
          {
            id: 'ef_p13_act_1',
            type: 'activity',
            xPercent: 90.0,
            yPercent: 25.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'ef_pe1_ex1',
          },
        ],
        exercises: [
          {
            id: 'ef_pe1_ex1',
            title: '1 CALLING RECEPTION',
            type: 'multiple-choice',
            instructions: 'Choose the correct response for hotel reception.',
            questions: [
              {
                id: 'pe1_q1',
                prompt: "Hello, reception? There's a problem with...",
                options: ['the air conditioning', 'the bed', 'the carpet'],
                correctAnswer: 'the air conditioning',
              },
              {
                id: 'pe1_q2',
                prompt: "I'll send somebody to look at it...",
                options: ['right away', 'next week', 'never'],
                correctAnswer: 'right away',
              },
            ],
          },
        ],
      },
      14: {
        pageNumber: 14,
        imageSrc: `${BASE}book_pages/page_14.jpg`,
        unitName: 'Practical English Episode 1',
        lessonName: 'Calling reception (Part 2)',
        hotspots: [],
        exercises: [],
      },
    },
  },

  'moeys-english-grade-7': {
    id: 'moeys-english-grade-7',
    title: 'English Grade 7',
    subtitle: "Student's Book (Cambodia Secondary School Curriculum)",
    category: 'moeys-secondary',
    gradeLabel: 'Grade 7',
    coverImage: `${BASE}moeys_g7_cover.jpg`,
    totalPages: 242,
    pages: {
      1: {
        pageNumber: 1,
        imageSrc: `${BASE}moeys_g7_cover.jpg`,
        unitName: 'Front Cover',
        lessonName: "MoEYS Cambodia Student's Book Grade 7",
        hotspots: [],
        exercises: [],
      },
      6: {
        pageNumber: 6,
        imageSrc: `${BASE}moeys_pages/g7_p6.jpg`,
        unitName: 'Syllabus',
        lessonName: 'Grade 7 English Curriculum Outline',
        hotspots: [],
        exercises: [],
      },
      9: {
        pageNumber: 9,
        imageSrc: `${BASE}moeys_pages/g7_p9.jpg`,
        unitName: 'Chapter 1: At a new school',
        lessonName: 'Unit 1: Meeting new friends (Intro)',
        hotspots: [
          {
            id: 'g7_p9_audio_1',
            type: 'audio',
            xPercent: 12.0,
            yPercent: 28.0,
            badgeLabel: 'T.1.1.1',
            audioTrack: 'T.1.1.1',
          },
          {
            id: 'g7_p9_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 28.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'g7_u1_ex1',
          },
        ],
        exercises: [
          {
            id: 'g7_u1_ex1',
            title: "1 Welcome to Grade 7! You're at a new school.",
            type: 'open-response',
            instructions: 'Ask and answer with your friend. Complete the self-introduction questions.',
            questions: [
              { id: 'g7_intro_1', prompt: "What's your name?", correctAnswer: 'My name is' },
              { id: 'g7_intro_2', prompt: 'How old are you?', correctAnswer: 'I am 13 years old' },
              { id: 'g7_intro_3', prompt: 'Where are you from?', correctAnswer: 'I am from Phnom Penh' },
            ],
          },
        ],
      },
      10: {
        pageNumber: 10,
        imageSrc: `${BASE}moeys_pages/g7_p10.jpg`,
        unitName: 'Chapter 1: At a new school',
        lessonName: 'Unit 1: Lesson A - Meeting new friends (How are you today?)',
        hotspots: [
          {
            id: 'g7_p10_audio_2',
            type: 'audio',
            xPercent: 12.0,
            yPercent: 22.0,
            badgeLabel: 'T.1.1.2',
            audioTrack: 'T.1.1.2',
          },
          {
            id: 'g7_p10_act_2',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 24.0,
            badgeLabel: 'Ex 2',
            exerciseId: 'g7_u1_ex2',
          },
          {
            id: 'g7_p10_audio_3',
            type: 'audio',
            xPercent: 12.0,
            yPercent: 44.0,
            badgeLabel: 'T.1.1.3',
            audioTrack: 'T.1.1.3',
          },
          {
            id: 'g7_p10_act_3',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 46.0,
            badgeLabel: 'Ex 3',
            exerciseId: 'g7_u1_ex3',
          },
        ],
        exercises: [
          {
            id: 'g7_u1_ex2',
            title: '2 Listen and match',
            type: 'multiple-choice',
            instructions: 'Match each character with their description from the listening track.',
            audioTrack: 'T.1.1.2',
            questions: [
              {
                id: 'g7_char_1',
                prompt: 'Dara is...',
                options: ['from Phnom Penh', 'a crow', 'a teacher'],
                correctAnswer: 'from Phnom Penh',
              },
              {
                id: 'g7_char_2',
                prompt: 'Avorng is...',
                options: ['a bird who never takes a shower', 'a football player', 'the school director'],
                correctAnswer: 'a bird who never takes a shower',
              },
              {
                id: 'g7_char_3',
                prompt: 'Bopha is...',
                options: ['13 years old', '20 years old', 'living in France'],
                correctAnswer: '13 years old',
              },
            ],
          },
          {
            id: 'g7_u1_ex3',
            title: '3 Listen. Who said these?',
            type: 'gap-fill',
            instructions: 'Write the character name who said each statement.',
            audioTrack: 'T.1.1.3',
            wordBank: ['Dara', 'Bopha', 'Sophal', 'Avorng'],
            questions: [
              { id: 'g7_wh_1', prompt: '1. I am from Phnom Penh: ______', correctAnswer: 'Dara' },
              { id: 'g7_wh_2', prompt: '2. I am 13 years old: ______', correctAnswer: 'Bopha' },
              { id: 'g7_wh_3', prompt: "3. I live near Sophal and Dara, so we're neighbours: ______", correctAnswer: 'Sophal' },
              { id: 'g7_wh_4', prompt: '4. I never take a shower: ______', correctAnswer: 'Avorng' },
              { id: 'g7_wh_5', prompt: "5. I've got short curly hair: ______", correctAnswer: 'Sophal' },
            ],
          },
        ],
      },
      11: {
        pageNumber: 11,
        imageSrc: `${BASE}moeys_pages/g7_p11.jpg`,
        unitName: 'Chapter 1: At a new school',
        lessonName: 'Unit 1: Lesson B - Hello! He is Dara.',
        hotspots: [
          {
            id: 'g7_p11_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 26.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'g7_u1b_ex1',
          },
        ],
        exercises: [
          {
            id: 'g7_u1b_ex1',
            title: '1 Pronouns and Verb "to be"',
            type: 'multiple-choice',
            instructions: 'Complete with the correct pronoun (He, She, We, They).',
            questions: [
              {
                id: 'g7_pr_1',
                prompt: '______ is my friend Dara.',
                options: ['He', 'She', 'It'],
                correctAnswer: 'He',
              },
              {
                id: 'g7_pr_2',
                prompt: '______ are classmates at the new school.',
                options: ['We', 'He', 'I'],
                correctAnswer: 'We',
              },
            ],
          },
        ],
      },
      12: {
        pageNumber: 12,
        imageSrc: `${BASE}moeys_pages/g7_p12.jpg`,
        unitName: 'Chapter 1: At a new school',
        lessonName: 'Unit 1: Lesson C - BET WIN LOSE',
        hotspots: [],
        exercises: [],
      },
    },
  },

  'moeys-english-grade-8': {
    id: 'moeys-english-grade-8',
    title: 'English Grade 8',
    subtitle: "Student's Book (Cambodia Secondary School Curriculum)",
    category: 'moeys-secondary',
    gradeLabel: 'Grade 8',
    coverImage: `${BASE}moeys_g8_cover.jpg`,
    totalPages: 242,
    pages: {
      1: {
        pageNumber: 1,
        imageSrc: `${BASE}moeys_g8_cover.jpg`,
        unitName: 'Front Cover',
        lessonName: "MoEYS Cambodia Student's Book Grade 8",
        hotspots: [],
        exercises: [],
      },
      6: {
        pageNumber: 6,
        imageSrc: `${BASE}moeys_pages/g8_p6.jpg`,
        unitName: 'Syllabus',
        lessonName: 'Grade 8 English Curriculum Outline',
        hotspots: [],
        exercises: [],
      },
      10: {
        pageNumber: 10,
        imageSrc: `${BASE}moeys_pages/g8_p10.jpg`,
        unitName: 'Review',
        lessonName: 'Review Lesson A - Welcome to Grade 8!',
        hotspots: [
          {
            id: 'g8_p10_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 32.0,
            badgeLabel: 'Ex 3',
            exerciseId: 'g8_rev_ex3',
          },
        ],
        exercises: [
          {
            id: 'g8_rev_ex3',
            title: '3 How many words can you make?',
            type: 'gap-fill',
            instructions:
              'Find smaller English words contained within these terms: Phnom Penh, homework, teacher, friends, goodbye, Cambodia.',
            wordBank: ['pen', 'home', 'tea', 'men', 'hen', 'each', 'end', 'good'],
            questions: [
              { id: 'g8_w_1', prompt: "From 'Phnom Penh': ______", correctAnswer: 'pen' },
              { id: 'g8_w_2', prompt: "From 'homework': ______", correctAnswer: 'home' },
              { id: 'g8_w_3', prompt: "From 'teacher': ______", correctAnswer: 'tea' },
              { id: 'g8_w_4', prompt: "From 'friends': ______", correctAnswer: 'end' },
            ],
          },
        ],
      },
      15: {
        pageNumber: 15,
        imageSrc: `${BASE}moeys_pages/g8_p15.jpg`,
        unitName: 'Chapter 1: A Sunday Adventure',
        lessonName: 'Unit 1: A new classmate',
        hotspots: [
          {
            id: 'g8_p15_audio_1',
            type: 'audio',
            xPercent: 12.0,
            yPercent: 24.0,
            badgeLabel: 'T.1.1.1',
            audioTrack: 'T.1.1.1',
          },
          {
            id: 'g8_p15_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 24.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'g8_u1_ex1',
          },
          {
            id: 'g8_p15_act_2',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 52.0,
            badgeLabel: 'Ex 2',
            exerciseId: 'g8_u1_ex2',
          },
        ],
        exercises: [
          {
            id: 'g8_u1_ex1',
            title: '1 Meeting a New Classmate',
            type: 'multiple-choice',
            instructions: 'Select the polite and natural English expression when greeting a newcomer.',
            audioTrack: 'T.1.1.1',
            questions: [
              {
                id: 'g8_m_1',
                prompt: 'What do you say when meeting someone for the first time?',
                options: ['Pleased to meet you', 'Goodbye forever', 'Where is my lunch?'],
                correctAnswer: 'Pleased to meet you',
              },
              {
                id: 'g8_m_2',
                prompt: 'Excuse me, could you tell me where Room 8 is?',
                options: ["It's down the hall on the left", 'No, I have no shoes', 'Yesterday morning'],
                correctAnswer: "It's down the hall on the left",
              },
            ],
          },
          {
            id: 'g8_u1_ex2',
            title: '2 Classroom Equipment & Directions',
            type: 'gap-fill',
            instructions: 'Fill in the blanks with the correct classroom object.',
            wordBank: ['chalkboard', 'ruler', 'notebook', 'pencil', 'timetable'],
            questions: [
              { id: 'g8_eq_1', prompt: 'The teacher wrote today\'s lesson on the ______.', correctAnswer: 'chalkboard' },
              { id: 'g8_eq_2', prompt: 'Use a ______ to measure the line accurately.', correctAnswer: 'ruler' },
              { id: 'g8_eq_3', prompt: 'Check your ______ to see what class we have next.', correctAnswer: 'timetable' },
            ],
          },
        ],
      },
      16: {
        pageNumber: 16,
        imageSrc: `${BASE}moeys_pages/g8_p16.jpg`,
        unitName: 'Chapter 1: A Sunday Adventure',
        lessonName: 'Unit 1: Lesson A',
        hotspots: [],
        exercises: [],
      },
      17: {
        pageNumber: 17,
        imageSrc: `${BASE}moeys_pages/g8_p17.jpg`,
        unitName: 'Chapter 1: A Sunday Adventure',
        lessonName: 'Unit 1: Lesson B',
        hotspots: [],
        exercises: [],
      },
    },
  },

  'moeys-english-grade-9': {
    id: 'moeys-english-grade-9',
    title: 'English Grade 9',
    subtitle: "Student's Book (Cambodia Secondary School Curriculum)",
    category: 'moeys-secondary',
    gradeLabel: 'Grade 9',
    coverImage: `${BASE}moeys_g9_cover.jpg`,
    totalPages: 275,
    pages: {
      1: {
        pageNumber: 1,
        imageSrc: `${BASE}moeys_g9_cover.jpg`,
        unitName: 'Front Cover',
        lessonName: "MoEYS Cambodia Student's Book Grade 9",
        hotspots: [],
        exercises: [],
      },
      6: {
        pageNumber: 6,
        imageSrc: `${BASE}moeys_pages/g9_p6.jpg`,
        unitName: 'Syllabus',
        lessonName: 'Grade 9 English Curriculum Outline',
        hotspots: [],
        exercises: [],
      },
      10: {
        pageNumber: 10,
        imageSrc: `${BASE}moeys_pages/g9_p10.jpg`,
        unitName: 'Review',
        lessonName: 'Review Lesson A - Past Tenses & Irregular Verbs',
        hotspots: [
          {
            id: 'g9_p10_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 28.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'g9_rev_ex1',
          },
        ],
        exercises: [
          {
            id: 'g9_rev_ex1',
            title: '1 Irregular Verbs Review',
            type: 'multiple-choice',
            instructions: 'Choose the correct Past Simple form.',
            questions: [
              {
                id: 'g9_v_1',
                prompt: "What is the past simple of 'go'?",
                options: ['went', 'gone', 'goed'],
                correctAnswer: 'went',
              },
              {
                id: 'g9_v_2',
                prompt: "What is the past simple of 'see'?",
                options: ['saw', 'seen', 'seed'],
                correctAnswer: 'saw',
              },
              {
                id: 'g9_v_3',
                prompt: "What is the past simple of 'take'?",
                options: ['took', 'taken', 'taked'],
                correctAnswer: 'took',
              },
            ],
          },
        ],
      },
      15: {
        pageNumber: 15,
        imageSrc: `${BASE}moeys_pages/g9_p15.jpg`,
        unitName: 'Chapter 1: Free time',
        lessonName: 'Unit 1: After school',
        hotspots: [
          {
            id: 'g9_p15_audio_1',
            type: 'audio',
            xPercent: 12.0,
            yPercent: 22.0,
            badgeLabel: 'T.1.1.1',
            audioTrack: 'T.1.1.1',
          },
          {
            id: 'g9_p15_act_1',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 24.0,
            badgeLabel: 'Ex 1',
            exerciseId: 'g9_u1_ex1',
          },
          {
            id: 'g9_p15_act_2',
            type: 'activity',
            xPercent: 88.0,
            yPercent: 52.0,
            badgeLabel: 'Ex 2',
            exerciseId: 'g9_u1_ex2',
          },
        ],
        exercises: [
          {
            id: 'g9_u1_ex1',
            title: '1 After-School Hobbies and Free Time',
            type: 'gap-fill',
            instructions: 'Complete the sentences using after-school activities from the word bank.',
            audioTrack: 'T.1.1.1',
            wordBank: ['football', 'library', 'guitar', 'homework', 'bicycle'],
            questions: [
              { id: 'g9_act_1', prompt: 'After school, Sophal plays ______ with his teammates.', correctAnswer: 'football' },
              { id: 'g9_act_2', prompt: 'Bopha goes to the ______ to study quietly.', correctAnswer: 'library' },
              { id: 'g9_act_3', prompt: 'Dara practices chords on his acoustic ______.', correctAnswer: 'guitar' },
              { id: 'g9_act_4', prompt: 'They always finish their ______ before evening.', correctAnswer: 'homework' },
            ],
          },
          {
            id: 'g9_u1_ex2',
            title: '2 Adverbs of Frequency & Routines',
            type: 'multiple-choice',
            instructions: 'Select the sentence with the correct natural word order.',
            questions: [
              {
                id: 'g9_adv_1',
                prompt: 'Which sentence has the correct adverb placement?',
                options: [
                  'I always do my homework before dinner.',
                  'I do always my homework before dinner.',
                  'Always I do homework before dinner.',
                ],
                correctAnswer: 'I always do my homework before dinner.',
              },
              {
                id: 'g9_adv_2',
                prompt: "Which adverb indicates '0% frequency'?",
                options: ['never', 'seldom', 'sometimes'],
                correctAnswer: 'never',
              },
            ],
          },
        ],
      },
      16: {
        pageNumber: 16,
        imageSrc: `${BASE}moeys_pages/g9_p16.jpg`,
        unitName: 'Chapter 1: Free time',
        lessonName: 'Unit 1: Lesson A',
        hotspots: [],
        exercises: [],
      },
      17: {
        pageNumber: 17,
        imageSrc: `${BASE}moeys_pages/g9_p17.jpg`,
        unitName: 'Chapter 1: Free time',
        lessonName: 'Unit 1: Lesson B',
        hotspots: [],
        exercises: [],
      },
    },
  },
};

export const DEFAULT_BOOK_ID = 'english-file-pre-int';

export function getAllBooks(): BookManifest[] {
  return Object.values(BOOKS_REGISTRY);
}

export function getBookManifest(id: string): BookManifest | undefined {
  return BOOKS_REGISTRY[id];
}

export function generateStaticParams(): { bookId: string }[] {
  return Object.keys(BOOKS_REGISTRY).map((bookId) => ({ bookId }));
}
