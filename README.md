# English File Pre-Intermediate - Digital Interactive Textbook

An interactive digital textbook application built for **English File 4th Edition Pre-Intermediate Student's Book** (`D:\English File 4th edition Pre Intermediate Student's Book.pdf`).

## Features

- **Complete 169-Page Textbook Viewer**:
  - Crystal-clear native resolution images extracted directly from the official PDF.
  - Smooth Zoom In / Out (50% to 250%), Fit to Width, Fit to Screen, Fullscreen, and 1:1 view.
  - Single-page view and Two-page book spread view (`📖`).
  - Fast page navigation with jump input, next/prev buttons, and keyboard shortcuts (Arrow Left/Right, PageUp/Down).
- **Interactive Answer Completion (Fill-in the Blanks)**:
  - Fill-in fields placed right on top of textbook exercises (e.g. Unit 1A "Getting to Know You", Grammar Bank 1A-1C, Student Information form).
  - **Check Answers (`✓`)**: Automatically validates answers against the answer key, calculates score percentages, and displays green/red status!
  - **Show Answers (`💡`)**: Reveals the answer key in amber/gold for self-correction.
  - **Add Blank Tool (`➕`)**: Click anywhere on ANY exercise on ANY page to place a new interactive fill-in blank with custom answers and hints!
- **On-Page Writing, Pen Drawing & Annotations**:
  - **Freehand Pen (`✏️`)**: Draw, circle multiple choice items, underline words, write notes with custom colors (Blue, Red, Green, Black, Purple) and thickness slider.
  - **Highlighter (`🖍`)**: Semi-transparent marker to highlight vocabulary and grammar points.
  - **Eraser (`🧹`)**: Cleanly erase drawing strokes.
  - **Type Answer / Text Box (`💬`)**: Click anywhere on the book page to create a movable, editable text box to type answers or teacher explanations.
  - **Sticky Notes (`📌`)**: Place movable, collapsible sticky notes for grammar tips.
  - **Undo / Redo (`↩ / ↪`)**: Full history tracking with keyboard shortcuts (`Ctrl+Z`).
  - **Auto-Save**: All strokes, answers, text boxes, and notes are automatically saved to the local SQLite database.
- **Side Interactive Practice Panel**:
  - Open the `✍️ Exercises` side drawer to view exercises side-by-side with the page.
  - Includes audio pronunciation speaker buttons, answer inputs, and instant grading.
- **Audio & Pronunciation Tools**:
  - **Text-to-Speech (TTS `🔊`)**: Listen to native British/American English pronunciation for any sentence, exercise prompt, or selected text.
  - **Speaking Voice Studio (`🎙`)**: Record your speaking answers via microphone, watch recording timer and visual pulse, and play back your recording to compare pronunciation.
- **Vocabulary Bank & Flashcards**:
  - Built-in vocabulary database with preloaded Pre-Intermediate vocabulary (appearance, personality, holidays, travel, airport terms, etc.).
  - Search by word or definition, filter by category.
  - Add your own custom vocabulary words with definitions, examples, and phonetic transcription.
  - **3D Interactive Flashcards (`📇`)**: Flip cards to quiz yourself, shuffle, and track learned status!
- **Notes & Bookmarks**:
  - Bookmark key pages (`🔖`) and write study notes for each lesson.
  - Filter and jump directly to bookmarked pages.
  - Full data Export & Import (`.json`) for backing up your study progress.

## How to Run

### Option 1: Double-click Batch File
Double-click `run_digital_textbook.bat` in this folder. It will start the server and open your browser automatically.

### Option 2: Command Line
Open a terminal in `D:\DigitalTextbook` and run:
```powershell
python server.py
```
Then navigate in your browser to:
```
http://localhost:8000
```
"# DigitalBook" 
