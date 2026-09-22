"""
Digital Textbook Database Layer
Handles SQLite persistence for annotations, interactive exercise blanks,
vocabulary items, study notes, bookmarks, study progress, and mistake review.
"""

import sqlite3
import json
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "digital_textbook.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Annotations (pen strokes, custom text boxes, sticky notes per page)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS annotations (
        page_num INTEGER PRIMARY KEY,
        strokes TEXT,
        text_boxes TEXT,
        sticky_notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. Interactive Overlay Fields (fill-in blanks, checkboxes, multiple choices positioned over page)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS page_overlays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_num INTEGER NOT NULL,
        field_type TEXT DEFAULT 'text',
        x REAL NOT NULL,
        y REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        placeholder TEXT,
        label TEXT,
        correct_answers TEXT,
        hint TEXT,
        explanation TEXT,
        unit_ref TEXT,
        options TEXT,
        grading_type TEXT DEFAULT 'exact',
        sample_answer TEXT,
        audio_track TEXT,
        is_default INTEGER DEFAULT 1
    )
    """)

    # Migrations for existing database schemas
    for col_def in [
        ("options", "TEXT"),
        ("grading_type", "TEXT DEFAULT 'exact'"),
        ("sample_answer", "TEXT"),
        ("audio_track", "TEXT"),
        ("is_default", "INTEGER DEFAULT 1")
    ]:
        try:
            cursor.execute(f"ALTER TABLE page_overlays ADD COLUMN {col_def[0]} {col_def[1]}")
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    # 3. User Page Answers (user-filled answers for overlay fields and exercises)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_page_answers (
        page_num INTEGER PRIMARY KEY,
        answers TEXT,
        score REAL DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 4. Vocabulary Bank & Personal Notebook
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE NOT NULL,
        pos TEXT,
        definition TEXT,
        example TEXT,
        phonetic TEXT,
        page_num INTEGER,
        category TEXT,
        learned INTEGER DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 5. Study Notes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_num INTEGER NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 6. Bookmarks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        page_num INTEGER PRIMARY KEY,
        title TEXT,
        tags TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    try:
        cursor.execute("ALTER TABLE bookmarks ADD COLUMN notes TEXT")
    except sqlite3.OperationalError:
        pass
    
    # 7. Study Progress (reading history & exercise completion)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_progress (
        page_num INTEGER PRIMARY KEY,
        completed INTEGER DEFAULT 0,
        time_spent_sec INTEGER DEFAULT 0,
        last_visited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accuracy REAL DEFAULT 0,
        mistakes_count INTEGER DEFAULT 0,
        exercises_attempted INTEGER DEFAULT 0
    )
    """)
    for col_def in [
        ("accuracy", "REAL DEFAULT 0"),
        ("mistakes_count", "INTEGER DEFAULT 0"),
        ("exercises_attempted", "INTEGER DEFAULT 0")
    ]:
        try:
            cursor.execute(f"ALTER TABLE study_progress ADD COLUMN {col_def[0]} {col_def[1]}")
        except sqlite3.OperationalError:
            pass

    # 8. Study Mistakes (Mistake Review tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_mistakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_num INTEGER NOT NULL,
        overlay_id INTEGER,
        label TEXT,
        student_answer TEXT,
        correct_answer TEXT,
        explanation TEXT,
        hint TEXT,
        unit_ref TEXT,
        resolved INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 9. User Audio Practice Recordings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_num INTEGER NOT NULL,
        exercise_id TEXT,
        title TEXT,
        audio_data TEXT,
        duration_sec INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    
    # Seed preloaded data if empty
    seed_initial_data()

def seed_initial_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if vocabulary is seeded
    cursor.execute("SELECT COUNT(*) as count FROM vocabulary")
    if cursor.fetchone()["count"] == 0:
        # Load from data/vocabulary.json if exists
        v_path = os.path.join(os.path.dirname(__file__), "data", "vocabulary.json")
        if os.path.exists(v_path):
            with open(v_path, "r", encoding="utf-8") as vf:
                v_list = json.load(vf)
            seed_vocab = [
                (item["word"], item.get("pos"), item.get("definition"), item.get("example"), item.get("phonetic"), item.get("page"), item.get("category"))
                for item in v_list
            ]
        else:
            seed_vocab = [
                ("appearance", "noun", "The way that someone or something looks on the outside.", "She has a very youthful appearance.", "/əˈpɪərəns/", 8, "Describing People"),
                ("personality", "noun", "The various aspects of a person's character that combine to make them different.", "He has an outgoing and friendly personality.", "/ˌpɜːsəˈnæləti/", 8, "Describing People"),
                ("friendly", "adjective", "Behaving in a kind and pleasant way.", "The hotel staff were polite and friendly.", "/ˈfrendli/", 9, "Personality"),
                ("unfriendly", "adjective", "Not kind or pleasant.", "The clerk was cold and unfriendly.", "/ʌnˈfrendli/", 9, "Personality"),
                ("flight", "noun", "A journey in an aircraft.", "Our flight to London was delayed by two hours.", "/flaɪt/", 14, "Holidays"),
                ("luggage", "noun", "Bags, cases, etc. that you take with you when travelling.", "You can leave your luggage at the hotel reception.", "/ˈlʌɡɪdʒ/", 14, "Holidays")
            ]
        cursor.executemany("""
        INSERT OR IGNORE INTO vocabulary (word, pos, definition, example, phonetic, page_num, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, seed_vocab)
        conn.commit()

    conn.close()
    # Safely seed default overlays without force-deleting user data
    refresh_default_overlays(force=False)

# Default pre-calibrated overlays covering units and banks
DEFAULT_PAGE_OVERLAYS = {
    # Unit 1A (Page 7: Book page 6 - Getting To Know You)
    7: [
        (7, 'text', 21.9, 48.4, 8.2, 2.0, 'verb', 'Q3', json.dumps(['live']), 'Where do you reside/stay?', 'Where do you live?', 'Unit 1A Ex 1a'),
        (7, 'text', 16.4, 50.6, 8.1, 2.0, 'verb', 'Q4', json.dumps(['live']), 'In a house or flat?', 'Do you live in a house or a flat?', 'Unit 1A Ex 1a'),
        (7, 'text', 16.4, 54.5, 8.1, 2.0, 'verb', 'Q5', json.dumps(['have', 'have got']), 'Possession of siblings', 'Do you have any brothers and sisters?', 'Unit 1A Ex 1a'),
        (7, 'text', 16.4, 58.5, 8.1, 2.0, 'verb', 'Q6', json.dumps(['have', 'keep', 'have got']), 'Possession of animals', 'Do you have any pets?', 'Unit 1A Ex 1a'),
        (7, 'text', 49.5, 44.1, 8.2, 2.0, 'verb', 'Q7', json.dumps(['do']), 'Job or occupation', 'What do you do? (means what is your job)', 'Unit 1A Ex 1a'),
        (7, 'text', 53.4, 46.3, 8.1, 2.0, 'verb', 'Q8', json.dumps(['get', 'wake']), 'Rising from bed', 'What time do you get up during the week?', 'Unit 1A Ex 1a'),
        (7, 'text', 38.9, 52.0, 8.1, 2.0, 'verb', 'Q9', json.dumps(['have', 'eat']), 'Eating lunch', 'Where do you usually have/eat lunch?', 'Unit 1A Ex 1a'),
        (7, 'text', 38.9, 55.9, 8.0, 2.0, 'verb', 'Q10', json.dumps(['go']), 'Going to sleep', 'What time do you usually go to bed?', 'Unit 1A Ex 1a'),
        (7, 'text', 50.8, 58.1, 8.1, 2.0, 'verb', 'Q11', json.dumps(['learn', 'study']), 'Acquiring language', 'Where did you learn/study English before?', 'Unit 1A Ex 1a'),
        (7, 'text', 46.1, 62.0, 8.1, 2.0, 'verb', 'Q12', json.dumps(['speak', 'talk']), 'Language ability', 'Can you speak any other languages?', 'Unit 1A Ex 1a'),
        (7, 'text', 67.4, 45.9, 8.1, 2.0, 'verb', 'Q13', json.dumps(['listen']), 'Hearing music with attention', 'What kind of music do you listen to?', 'Unit 1A Ex 1a'),
        (7, 'text', 78.2, 49.8, 8.2, 2.0, 'verb', 'Q14', json.dumps(['watch', 'see']), 'Viewing TV', 'What TV programmes or series do you watch?', 'Unit 1A Ex 1a'),
        (7, 'text', 73.4, 52.0, 8.1, 2.0, 'verb', 'Q15', json.dumps(['do', 'play']), 'Sport activity', 'Do you do any sport or exercise?', 'Unit 1A Ex 1a'),
        (7, 'text', 67.4, 59.5, 8.1, 2.0, 'verb', 'Q16', json.dumps(['read']), 'Perusing text', 'What kind of books or magazines do you read?', 'Unit 1A Ex 1a'),
        (7, 'text', 81.8, 61.6, 8.1, 2.0, 'verb', 'Q17', json.dumps(['go']), 'Visiting the cinema', 'How often do you go to the cinema?', 'Unit 1A Ex 1a'),
        (7, 'text', 78.4, 65.6, 8.1, 2.0, 'verb', 'Q18', json.dumps(['do']), 'Action or activity', 'What did you do last weekend?', 'Unit 1A Ex 1a'),
    ],

    # Unit 1A (Page 8: Book page 7 - Grammar, Listening & Form)
    8: [
        (8, 'text', 9.0, 16.1, 30.0, 1.8, 'Rewrite: Where does your father work?', 'Ex 2a.2', json.dumps(['Where does your father work?', 'Where does your father work']), 'Use does + subject + infinitive', 'In English present simple questions with other verbs, use do/does + subject + infinitive', 'Unit 1A Grammar 2a'),
        (8, 'text', 9.0, 21.6, 30.0, 1.8, 'Rewrite: Do you have cereal for breakfast?', 'Ex 2a.5', json.dumps(['Do you have cereal for breakfast?', 'Do you have cereal for breakfast']), 'Use do + subject + have', 'For meals and habits, we use "Do you have..." not "Have you..."', 'Unit 1A Grammar 2a'),
        (8, 'text', 9.0, 23.0, 30.0, 1.8, 'Rewrite: Where did you go for your last holiday?', 'Ex 2a.6', json.dumps(['Where did you go for your last holiday?', 'Where did you go for your last holiday']), 'Use did + subject + base verb', 'In past simple questions, use did + subject + base verb (go, not went)', 'Unit 1A Grammar 2a'),
        (8, 'text', 53.5, 65.2, 12.0, 1.8, 'SE21 8GP', '4a.2 Postcode', json.dumps(['SE21 8GP', 'se21 8gp']), 'Postcode in South London', 'SE21 8GP', 'Unit 1A Listening 4a'),
        (8, 'text', 53.5, 67.1, 15.0, 1.8, 'Phone number...', '4a.3 Phone', json.dumps(['020 7946 0922', '07700 900543', '02079460922']), 'Phone number', 'Phone number from extract', 'Unit 1A Listening 4a'),
        (8, 'text', 78.0, 63.3, 16.0, 1.8, 'Email address...', '4a.4 Email', json.dumps(['wayne.roberts@gmail.com', 'wayne.roberts@hotmail.com']), 'Email address', 'Email address from conversation', 'Unit 1A Listening 4a'),
        (8, 'text', 78.0, 65.2, 14.0, 1.8, 'Roberts', '4a.5 Surname', json.dumps(['Roberts', 'roberts']), "Wayne's family surname", 'Roberts', 'Unit 1A Listening 4a'),
        (8, 'text', 78.0, 67.1, 16.0, 1.8, '14 Dangerford Road', '4a.6 Address', json.dumps(['14 Dangerford Road', '14 Dangerford Rd']), 'Delivery street address', '14 Dangerford Road', 'Unit 1A Listening 4a'),
        (8, 'text', 47.0, 73.0, 3.5, 1.8, '1-6', '4b.a Buying', json.dumps(['2']), 'Extract 2: Buying a sofa', 'Extract 2', 'Unit 1A Listening 4b'),
        (8, 'text', 47.0, 76.5, 3.5, 1.8, '1-6', '4b.c Help', json.dumps(['5']), 'Extract 5: Trying to get help', 'Extract 5', 'Unit 1A Listening 4b'),
        (8, 'text', 68.0, 73.0, 3.5, 1.8, '1-6', '4b.d Directions', json.dumps(['3']), 'Extract 3: Giving directions', 'Extract 3', 'Unit 1A Listening 4b'),
        (8, 'text', 68.0, 74.8, 3.5, 1.8, '1-6', '4b.e Information', json.dumps(['6']), 'Extract 6: Giving class information', 'Extract 6', 'Unit 1A Listening 4b'),
        (8, 'text', 68.0, 76.5, 3.5, 1.8, '1-6', '4b.f Restaurant', json.dumps(['4']), 'Extract 4: Arriving at restaurant', 'Extract 4', 'Unit 1A Listening 4b'),
        (8, 'text', 53.5, 87.2, 20.0, 1.8, 'First name', 'First Name', json.dumps([]), 'Your given name', 'Enter your personal first name', 'Student Info Form'),
        (8, 'text', 75.0, 87.2, 17.5, 1.8, 'Surname', 'Surname', json.dumps([]), 'Your family name', 'Enter your family surname', 'Student Info Form'),
        (8, 'text', 53.5, 89.4, 23.0, 1.8, 'Address', 'Address', json.dumps([]), 'Street address', 'Enter your street address', 'Student Info Form'),
        (8, 'text', 83.5, 89.4, 9.0, 1.8, 'Postcode', 'Postcode', json.dumps([]), 'Postal code', 'Enter postal code', 'Student Info Form'),
        (8, 'text', 53.5, 91.2, 19.5, 1.8, 'Phone number', 'Phone', json.dumps([]), 'Telephone number', 'Enter contact phone number', 'Student Info Form'),
        (8, 'text', 75.0, 91.2, 17.5, 1.8, 'Email address', 'Email', json.dumps([]), 'Email address', 'Enter contact email address', 'Student Info Form'),
    ],

    # Unit 1B (Page 9: Book page 8 - Describing People)
    9: [
        (9, 'text', 10.0, 36.5, 15.0, 2.0, 'Photo 1, 2, or 3', '1B.1a Father', json.dumps(['3', 'Photo 3']), 'Woman 3 with lovely warm smile', 'Charlotte describes her father with a lovely warm smile (Photo 3).', 'Unit 1B Ex 1a'),
        (9, 'text', 11.5, 43.5, 6.0, 1.8, '52', '1B.1d Age', json.dumps(['52', '52 years old']), 'Clint is 52 years old', '52', 'Unit 1B Ex 1d'),
        (9, 'text', 18.5, 43.5, 13.0, 1.8, 'businessman', '1B.1d Job', json.dumps(['businessman', 'business man']), 'Clint Bouchez is a businessman', 'businessman', 'Unit 1B Ex 1d'),
        (9, 'text', 33.0, 43.5, 9.0, 1.8, 'divorced', '1B.1d Status', json.dumps(['divorced']), 'Divorced ten years ago', 'divorced', 'Unit 1B Ex 1d'),
        (9, 'text', 11.5, 45.5, 16.0, 1.8, 'warm, generous, funny', '1B.1d Personality', json.dumps(['warm, generous, funny', 'warm', 'generous', 'funny', 'romantic']), "Charlotte's description of Clint's personality", 'warm, generous, funny', 'Unit 1B Ex 1d'),
        (9, 'text', 29.0, 45.5, 16.0, 1.8, 'independent, funny, clever', '1B.1d Partner', json.dumps(['independent, funny, clever', 'businesswoman', 'independent']), 'Someone who is independent, funny, and clever', 'independent, funny, clever', 'Unit 1B Ex 1d'),
        (9, 'text', 10.0, 47.0, 20.0, 2.0, 'Height...', '1B.1b Height', json.dumps(['medium height', 'medium-height', 'average height']), 'Not tall, not short', 'Charlotte says: My dad is medium height.', 'Unit 1B Ex 1b'),
        (9, 'text', 10.0, 50.0, 20.0, 2.0, 'Hair...', '1B.1b Hair', json.dumps(['short dark curly hair', 'curly hair', 'short curly hair', 'dark curly hair']), 'Texture and length', 'Charlotte says he has short dark curly hair.', 'Unit 1B Ex 1b'),
        (9, 'text', 10.0, 53.0, 20.0, 2.0, 'Weight...', '1B.1b Weight', json.dumps(['a bit overweight', 'overweight']), 'Slightly heavy', 'Charlotte says: a bit overweight.', 'Unit 1B Ex 1b'),
        (9, 'text', 10.0, 56.0, 20.0, 2.0, 'Smile...', '1B.1b Smile', json.dumps(['a lovely warm smile', 'lovely warm smile', 'warm smile']), 'Kind facial expression', 'Charlotte says: with brown eyes and a lovely warm smile.', 'Unit 1B Ex 1b'),
        (9, 'text', 10.0, 69.0, 12.0, 1.8, 'funny', '1B.1f Q1', json.dumps(['funny']), 'A person who makes you laugh is funny', 'funny', 'Unit 1B Ex 1f'),
        (9, 'text', 10.0, 72.0, 12.0, 1.8, 'fun', '1B.1f Q2', json.dumps(['fun']), 'A person who you can have a good time with is fun', 'fun', 'Unit 1B Ex 1f'),
    ],

    # Unit 1B (Page 10: Book page 9 - Grammar Present Simple & Listening)
    10: [
        (10, 'text', 27.0, 13.0, 10.0, 1.8, 'needs', '1B.2a (+) He', json.dumps(['needs']), '3rd person singular adds -s', 'He needs a new partner.', 'Unit 1B Grammar 2a'),
        (10, 'text', 27.0, 17.5, 14.0, 1.8, "doesn't want", '1B.2a (-) She', json.dumps(["doesn't want", "does not want", "doesn't"]), '3rd person negative uses does not / doesn\'t', "She doesn't want her dad to end up alone.", 'Unit 1B Grammar 2a'),
        (10, 'text', 16.5, 24.5, 7.0, 1.8, 'do', '1B.2a (?) you', json.dumps(['do']), 'Question auxiliary with you', 'What kind of person do you want to meet?', 'Unit 1B Grammar 2a'),
        (10, 'text', 31.0, 24.5, 7.0, 1.8, 'does', '1B.2a (?) he', json.dumps(['does']), 'Question auxiliary with he', 'What kind of person does he want to meet?', 'Unit 1B Grammar 2a'),
        (10, 'text', 11.0, 30.5, 5.0, 1.8, 'A/B', '1B.2b 1', json.dumps(['A', 'a']), 'Adverbs of frequency go before the main verb', 'A (They often go out together.)', 'Unit 1B Grammar 2b'),
        (10, 'text', 11.0, 34.0, 5.0, 1.8, 'A/B', '1B.2b 2', json.dumps(['B', 'b']), 'Adverbs of frequency go after the verb be', "B (He's always the one who pays.)", 'Unit 1B Grammar 2b'),
        (10, 'text', 49.0, 36.5, 5.0, 1.8, 'J/S', '1B.4c 1', json.dumps(['J', 'j', 'John']), 'John: tall, dark, and handsome', 'J (John)', 'Unit 1B Listening 4c'),
        (10, 'text', 49.0, 39.5, 5.0, 1.8, 'J/S', '1B.4c 2', json.dumps(['S', 's', 'Sebastian']), 'Sebastian: very tall', 'S (Sebastian)', 'Unit 1B Listening 4c'),
        (10, 'text', 49.0, 41.5, 5.0, 1.8, 'J/S', '1B.4c 3', json.dumps(['J', 'j', 'John']), 'John: he is a teacher', 'J (John)', 'Unit 1B Listening 4c'),
        (10, 'text', 74.0, 36.5, 5.0, 1.8, 'J/S', '1B.4c 4', json.dumps(['S', 's', 'Sebastian']), 'Sebastian: from Germany, lives in Dublin', 'S (Sebastian)', 'Unit 1B Listening 4c'),
        (10, 'text', 74.0, 39.5, 5.0, 1.8, 'J/S', '1B.4c 5', json.dumps(['J', 'j', 'John']), "John: there isn't a spark", 'J (John)', 'Unit 1B Listening 4c'),
        (10, 'text', 74.0, 41.5, 5.0, 1.8, 'J/S', '1B.4c 6', json.dumps(['S', 's', 'Sebastian']), 'Sebastian: a real gentleman', 'S (Sebastian)', 'Unit 1B Listening 4c'),
    ],

    # Unit 1C (Page 11: Book page 10 - The Remake Project - Present Continuous)
    11: [
        (11, 'text', 11.0, 26.8, 5.0, 1.8, 'W/M', '1C.1b 1 Apron', json.dumps(['W', 'w']), 'Woman wears blue apron', 'W (Woman)', 'Unit 1C Ex 1b'),
        (11, 'text', 11.0, 28.8, 5.0, 1.8, 'W/M', '1C.1b 2 Trousers', json.dumps(['M', 'm']), 'Man wears blue trousers', 'M (Man)', 'Unit 1C Ex 1b'),
        (11, 'text', 11.0, 30.8, 5.0, 1.8, 'W/M', '1C.1b 3 Skirt', json.dumps(['W', 'w']), 'Woman wears brown skirt', 'W (Woman)', 'Unit 1C Ex 1b'),
        (11, 'text', 11.0, 32.8, 5.0, 1.8, 'W/M', '1C.1b 4 Blouse', json.dumps(['W', 'w']), 'Woman wears yellow and green blouse', 'W (Woman)', 'Unit 1C Ex 1b'),
        (11, 'text', 11.0, 34.8, 5.0, 1.8, 'W/M', '1C.1b 5 T-shirt', json.dumps(['M', 'm']), 'Man wears yellow T-shirt', 'M (Man)', 'Unit 1C Ex 1b'),
        (11, 'text', 11.0, 36.8, 5.0, 1.8, 'W/M', '1C.1b 6 Cap', json.dumps(['W', 'w']), 'Woman wears white cap', 'W (Woman)', 'Unit 1C Ex 1b'),
        (11, 'text', 56.0, 21.0, 12.0, 1.8, "They're", '1C.3a 1', json.dumps(["They're", "They are"]), 'Plural pronoun + continuous', "They're wearing yellow and blue clothes.", 'Unit 1C Ex 3a'),
        (11, 'text', 56.0, 22.8, 12.0, 1.8, "She's", '1C.3a 2', json.dumps(["She's", "She is"]), 'Female singular pronoun', "She's wearing a cap.", 'Unit 1C Ex 3a'),
        (11, 'text', 56.0, 24.6, 12.0, 1.8, "He's", '1C.3a 3', json.dumps(["He's", "He is"]), 'Male singular pronoun', "He's pouring milk from a bottle.", 'Unit 1C Ex 3a'),
        (11, 'text', 56.0, 26.4, 12.0, 1.8, "She's", '1C.3a 4', json.dumps(["She's", "She is"]), 'Female singular pronoun', "She's pouring milk from a jug.", 'Unit 1C Ex 3a'),
        (11, 'text', 56.0, 28.2, 12.0, 1.8, "They're", '1C.3a 5', json.dumps(["They're", "She's", "He's", "They are"]), 'Looking at the milk', "They're looking at the milk.", 'Unit 1C Ex 3a'),
        (11, 'text', 56.0, 30.0, 12.0, 1.8, "She's", '1C.3a 6', json.dumps(["She's", "She is"]), 'Female singular pronoun', "She's standing near a window.", 'Unit 1C Ex 3a'),
        (11, 'text', 70.0, 35.0, 14.0, 1.8, "isn't wearing", '1C.3b 1', json.dumps(["isn't wearing", "is not wearing"]), 'Action happening right now in photo', "In the photo the man isn't wearing a cap.", 'Unit 1C Ex 3b'),
        (11, 'text', 64.0, 37.0, 10.0, 1.8, 'wear', '1C.3b 2', json.dumps(['wear']), 'Habitual action with often uses present simple', 'People often wear aprons in the kitchen.', 'Unit 1C Ex 3b'),
    ],

    # Unit 1C (Page 12: Book page 11 - Vermeer & Prepositions of Place)
    12: [
        (12, 'text', 9.0, 14.2, 6.0, 1.8, 'a/b/c', '1C.4a 1', json.dumps(['b', '17th']), 'Vermeer lived in the 17th century', 'b (17th)', 'Unit 1C Listening 4a'),
        (12, 'text', 9.0, 17.2, 6.0, 1.8, 'a/b/c', '1C.4a 2', json.dumps(['a', 'Holland']), 'Vermeer was from Holland', 'a (Holland)', 'Unit 1C Listening 4a'),
        (12, 'text', 9.0, 20.5, 6.0, 1.8, 'a/b/c', '1C.4a 3', json.dumps(['a', 'everyday scenes']), 'He painted everyday scenes', 'a (everyday scenes)', 'Unit 1C Listening 4a'),
        (12, 'text', 9.0, 25.2, 6.0, 1.8, 'a/b/c', '1C.4a 4', json.dumps(['c', 'a pudding', 'pudding']), 'The milkmaid is probably making a pudding', 'c (a pudding)', 'Unit 1C Listening 4a'),
        (12, 'text', 9.0, 28.2, 6.0, 1.8, 'a/b/c', '1C.4a 5', json.dumps(['b', '34']), '34 of Vermeer\'s paintings exist today', 'b (34)', 'Unit 1C Listening 4a'),
        (12, 'text', 9.0, 32.2, 6.0, 1.8, 'a/b/c', '1C.4a 6', json.dumps(['b', 'Because some of the paints were very expensive']), 'Paints were expensive (e.g. lapis lazuli)', 'b (expensive paints)', 'Unit 1C Listening 4a'),
        (12, 'text', 67.0, 18.3, 13.0, 1.8, 'in front of', '1C.5a 2', json.dumps(['in front of']), 'Position in front of him', "There's a table in front of him.", 'Unit 1C Ex 5a'),
        (12, 'text', 54.5, 20.0, 10.0, 1.8, 'On', '1C.5a 3', json.dumps(['On', 'on']), 'Surface preposition', 'On the table there are some eggs...', 'Unit 1C Ex 5a'),
        (12, 'text', 65.0, 23.3, 16.0, 1.8, 'in the middle of', '1C.5a 4a', json.dumps(['in the middle of', 'in the center of']), 'Central position', 'The bread is in the middle of the table.', 'Unit 1C Ex 5a'),
        (12, 'text', 82.0, 23.3, 11.0, 1.8, 'between', '1C.5a 4b', json.dumps(['between']), 'In the middle of two items', "It's between the eggs and the strawberries.", 'Unit 1C Ex 5a'),
        (12, 'text', 66.5, 26.3, 11.0, 1.8, 'under', '1C.5a 5', json.dumps(['under', 'underneath', 'beneath']), 'Below the bread', "There's a board under the bread.", 'Unit 1C Ex 5a'),
        (12, 'text', 54.5, 28.0, 12.0, 1.8, 'Behind', '1C.5a 6', json.dumps(['Behind', 'behind']), 'At the back of the man', "Behind the man, there's an old washing machine.", 'Unit 1C Ex 5a'),
        (12, 'text', 68.5, 29.7, 14.0, 1.8, 'on the left of', '1C.5a 7', json.dumps(['on the left of', 'on the left']), 'Position on the left side', "There's a window on the left of the photo.", 'Unit 1C Ex 5a'),
        (12, 'text', 54.5, 31.4, 13.0, 1.8, 'In the corner', '1C.5a 8', json.dumps(['In the corner', 'in the corner']), 'Corner of the room', "In the corner of the room there's a sink.", 'Unit 1C Ex 5a'),
        (12, 'text', 70.0, 34.3, 8.0, 1.8, 'on', '1C.5a 9a', json.dumps(['on']), 'On the wall', "There's a flower on the wall...", 'Unit 1C Ex 5a'),
        (12, 'text', 83.5, 34.3, 10.0, 1.8, 'above', '1C.5a 9b', json.dumps(['above', 'over']), 'Higher than the sink', "...above the sink.", 'Unit 1C Ex 5a'),
        (12, 'text', 63.5, 36.0, 11.0, 1.8, 'next to', '1C.5a 10', json.dumps(['next to', 'beside']), 'Beside the window', 'The sink is next to the window.', 'Unit 1C Ex 5a'),
    ],

    # Unit 2A (Page 15: Book page 14 - Holidays Past Simple)
    15: [
        (15, 'text', 10.0, 32.0, 16.0, 1.8, 'verb', '2A.1b 1', json.dumps(['went', 'go']), 'go abroad', 'went', 'Unit 2A Holidays'),
        (15, 'text', 10.0, 34.5, 16.0, 1.8, 'verb', '2A.1b 2', json.dumps(['stayed', 'stay']), 'stay in a hotel', 'stayed', 'Unit 2A Holidays'),
        (15, 'text', 10.0, 37.0, 16.0, 1.8, 'verb', '2A.1b 3', json.dumps(['booked', 'book']), 'book flights online', 'booked', 'Unit 2A Holidays'),
        (15, 'text', 10.0, 39.5, 16.0, 1.8, 'verb', '2A.1b 4', json.dumps(['hired', 'hire']), 'hire a car', 'hired', 'Unit 2A Holidays'),
        (15, 'text', 10.0, 42.0, 16.0, 1.8, 'verb', '2A.1b 5', json.dumps(['took', 'take']), 'take photos', 'took', 'Unit 2A Holidays'),
        (15, 'text', 10.0, 44.5, 16.0, 1.8, 'verb', '2A.1b 6', json.dumps(['sunbathed', 'sunbathe']), 'sunbathe on the beach', 'sunbathed', 'Unit 2A Holidays'),
        (15, 'text', 55.0, 48.0, 14.0, 1.8, 'Past verb', '2A.2a 1', json.dumps(['went']), 'Past simple of go', 'went', 'Unit 2A Grammar'),
        (15, 'text', 55.0, 50.5, 14.0, 1.8, 'Past verb', '2A.2a 2', json.dumps(['stayed']), 'Past simple of stay', 'stayed', 'Unit 2A Grammar'),
        (15, 'text', 55.0, 53.0, 14.0, 1.8, 'Past verb', '2A.2a 3', json.dumps(['was']), 'Past simple of be (singular)', 'was', 'Unit 2A Grammar'),
        (15, 'text', 55.0, 55.5, 14.0, 1.8, 'Past verb', '2A.2a 4', json.dumps(["didn't like", "did not like"]), 'Negative past simple', "didn't like", 'Unit 2A Grammar'),
    ],

    # Unit 2B (Page 17: Book page 16 - Past Continuous & Prepositions)
    17: [
        (17, 'text', 10.0, 28.0, 12.0, 1.8, 'at/in/on', '2B.1 1', json.dumps(['in']), 'in the street / in Prague', 'in', 'Unit 2B Prepositions'),
        (17, 'text', 10.0, 31.0, 12.0, 1.8, 'at/in/on', '2B.1 2', json.dumps(['at']), 'at the station / at the hotel', 'at', 'Unit 2B Prepositions'),
        (17, 'text', 10.0, 34.0, 12.0, 1.8, 'at/in/on', '2B.1 3', json.dumps(['on']), 'on a bus / on the train', 'on', 'Unit 2B Prepositions'),
        (17, 'text', 54.0, 45.0, 18.0, 1.8, 'was walking', '2B.2 1', json.dumps(['was walking']), 'Past continuous: was + walking', 'was walking', 'Unit 2B Grammar'),
        (17, 'text', 54.0, 48.0, 18.0, 1.8, 'were sitting', '2B.2 2', json.dumps(['were sitting']), 'Past continuous: were + sitting', 'were sitting', 'Unit 2B Grammar'),
        (17, 'text', 54.0, 51.0, 18.0, 1.8, 'was shining', '2B.2 3', json.dumps(['was shining']), 'The sun was shining', 'was shining', 'Unit 2B Grammar'),
    ],

    # Unit 2C (Page 19: Book page 18 - Time Sequencers & Connectors)
    19: [
        (19, 'text', 10.0, 30.0, 14.0, 1.8, 'connector', '2C.1 1', json.dumps(['because']), 'Gives a reason', 'because', 'Unit 2C Connectors'),
        (19, 'text', 10.0, 33.0, 14.0, 1.8, 'connector', '2C.1 2', json.dumps(['so']), 'Gives a result', 'so', 'Unit 2C Connectors'),
        (19, 'text', 10.0, 36.0, 14.0, 1.8, 'connector', '2C.1 3', json.dumps(['although']), 'Shows contrast', 'although', 'Unit 2C Connectors'),
        (19, 'text', 10.0, 39.0, 14.0, 1.8, 'connector', '2C.1 4', json.dumps(['but']), 'Shows contrast', 'but', 'Unit 2C Connectors'),
    ],

    # Revise and Check 1&2 (Page 21: Book page 20)
    21: [
        (21, 'text', 10.0, 20.0, 8.0, 1.8, 'a/b/c', 'RC1.1', json.dumps(['were', 'c']), 'Where were you born?', 'were', 'Revise & Check 1&2'),
        (21, 'text', 10.0, 23.5, 8.0, 1.8, 'a/b/c', 'RC1.2', json.dumps(['Does', 'b']), 'Does your brother speak French?', 'Does', 'Revise & Check 1&2'),
        (21, 'text', 10.0, 27.0, 8.0, 1.8, 'a/b/c', 'RC1.3', json.dumps(['were you doing', 'a']), 'What were you doing at 8.00?', 'were you doing', 'Revise & Check 1&2'),
        (21, 'text', 10.0, 30.5, 8.0, 1.8, 'a/b/c', 'RC1.4', json.dumps(['hardly ever', 'b']), 'We hardly ever go to the cinema', 'hardly ever', 'Revise & Check 1&2'),
        (21, 'text', 10.0, 34.0, 8.0, 1.8, 'a/b/c', 'RC1.5', json.dumps(['are you', 'a']), 'Why are you wearing a heavy coat?', 'are you', 'Revise & Check 1&2'),
    ],

    # Unit 3A (Page 23: Book page 22 - Airports & be going to)
    23: [
        (23, 'text', 10.0, 35.0, 14.0, 1.8, 'terminal', '3A.1 1', json.dumps(['terminal']), 'Building at airport', 'terminal', 'Unit 3A Vocabulary'),
        (23, 'text', 10.0, 38.0, 14.0, 1.8, 'gate', '3A.1 2', json.dumps(['gate']), 'Exit to aircraft', 'gate', 'Unit 3A Vocabulary'),
        (23, 'text', 10.0, 41.0, 14.0, 1.8, 'check-in', '3A.1 3', json.dumps(['check-in', 'check in']), 'Where you show tickets and drop bags', 'check-in', 'Unit 3A Vocabulary'),
        (23, 'text', 55.0, 45.0, 18.0, 1.8, "'m going to meet", '3A.2 1', json.dumps(["'m going to meet", "am going to meet"]), 'Plan with be going to', "'m going to meet", 'Unit 3A Grammar'),
        (23, 'text', 55.0, 48.0, 18.0, 1.8, "'s going to land", '3A.2 2', json.dumps(["'s going to land", "is going to land"]), 'Prediction with evidence', "'s going to land", 'Unit 3A Grammar'),
    ],

    # Unit 3B (Page 25: Book page 24 - Present continuous for future)
    25: [
        (25, 'text', 10.0, 35.0, 16.0, 1.8, "'m seeing", '3B.1 1', json.dumps(["'m seeing", "am seeing"]), 'Definite future arrangement', "'m seeing", 'Unit 3B Grammar'),
        (25, 'text', 10.0, 38.0, 16.0, 1.8, 'are you leaving', '3B.1 2', json.dumps(['are you leaving']), 'Question about future arrangement', 'are you leaving', 'Unit 3B Grammar'),
    ],

    # Unit 3C (Page 27: Book page 26 - Relative clauses who, which, where)
    27: [
        (27, 'text', 10.0, 35.0, 10.0, 1.8, 'who/which/where', '3C.1 1', json.dumps(['who', 'that']), 'Refers to a person', 'who', 'Unit 3C Relative Clauses'),
        (27, 'text', 10.0, 38.0, 10.0, 1.8, 'who/which/where', '3C.1 2', json.dumps(['which', 'that']), 'Refers to a thing', 'which', 'Unit 3C Relative Clauses'),
        (27, 'text', 10.0, 41.0, 10.0, 1.8, 'who/which/where', '3C.1 3', json.dumps(['where']), 'Refers to a place', 'where', 'Unit 3C Relative Clauses'),
    ],

    # Grammar Bank 1A, 1B, 1C (Page 128: Book page 127 - 40 questions)
    128: [
        # 1A.a
        (128, 'text', 11.5, 12.0, 23.5, 1.8, 'Where can we park?', '1A.a 1', json.dumps(['Where can we park?', 'Where can we park']), 'can before we', 'Where can we park?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 13.8, 23.5, 1.8, 'How old are you?', '1A.a 2', json.dumps(['How old are you?', 'How old are you']), 'old after How', 'How old are you?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 15.6, 23.5, 1.8, 'Does the class finish at 8.00?', '1A.a 3', json.dumps(['Does the class finish at 8.00?', 'Does the class finish at 8:00?']), 'the class after Does', 'Does the class finish at 8.00?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 17.4, 23.5, 1.8, 'Where do your friends live?', '1A.a 4', json.dumps(['Where do your friends live?', 'Where do your friends live']), 'live at the end', 'Where do your friends live?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 19.2, 23.5, 1.8, "Why didn't you answer my email?", '1A.a 5', json.dumps(["Why didn't you answer my email?", "Why didn't you answer my email"]), "didn't before you", "Why didn't you answer my email?", 'Grammar Bank 1A'),
        (128, 'text', 11.5, 21.0, 23.5, 1.8, 'Do you often go to the cinema?', '1A.a 6', json.dumps(['Do you often go to the cinema?', 'Do you often go to the cinema']), 'go after often', 'Do you often go to the cinema?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 22.8, 23.5, 1.8, 'What does this word mean?', '1A.a 7', json.dumps(['What does this word mean?', 'What does this word mean']), 'does after What', 'What does this word mean?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 24.6, 23.5, 1.8, 'What time did your friends arrive?', '1A.a 8', json.dumps(['What time did your friends arrive?', 'What time did your friends arrive']), 'your friends after did', 'What time did your friends arrive?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 26.4, 23.5, 1.8, 'Who are you talking to?', '1A.a 9', json.dumps(['Who are you talking to?', 'Who are you talking to']), 'to at the end', 'Who are you talking to?', 'Grammar Bank 1A'),
        (128, 'text', 11.5, 28.2, 23.5, 1.8, 'Where were you last night?', '1A.a 10', json.dumps(['Where were you last night?', 'Where were you last night']), 'you after were', 'Where were you last night?', 'Grammar Bank 1A'),
        # 1A.b
        (128, 'text', 56.5, 12.0, 36.0, 1.8, 'Do you have a car?', '1A.b 1', json.dumps(['Do you have a car?', 'Do you have a car']), 'Start with Do', 'Do you have a car?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 13.8, 36.0, 1.8, 'Where was your brother born?', '1A.b 2', json.dumps(['Where was your brother born?', 'Where was your brother born']), 'Where + was + subject + born', 'Where was your brother born?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 15.6, 36.0, 1.8, 'How often does he phone you?', '1A.b 3', json.dumps(['How often does he phone you?', 'How often does he phone you']), 'How often + does + he + phone you', 'How often does he phone you?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 17.4, 36.0, 1.8, 'What time does their flight arrive?', '1A.b 4', json.dumps(['What time does their flight arrive?', 'What time does their flight arrive']), 'What time + does + their flight + arrive', 'What time does their flight arrive?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 19.2, 36.0, 1.8, 'Is your girlfriend from Brazil?', '1A.b 5', json.dumps(['Is your girlfriend from Brazil?', 'Is your girlfriend from Brazil']), 'Is + subject + from Brazil', 'Is your girlfriend from Brazil?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 21.0, 36.0, 1.8, 'How many languages can you speak?', '1A.b 6', json.dumps(['How many languages can you speak?', 'How many languages can you speak']), 'How many languages + can + you + speak', 'How many languages can you speak?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 22.8, 36.0, 1.8, 'How was the party?', '1A.b 7', json.dumps(['How was the party?', 'How was the party']), 'How + was + the party', 'How was the party?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 24.6, 36.0, 1.8, 'Where did you go last summer?', '1A.b 8', json.dumps(['Where did you go last summer?', 'Where did you go last summer']), 'Where + did + you + go + last summer', 'Where did you go last summer?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 26.4, 36.0, 1.8, 'Is there a doctor here?', '1A.b 9', json.dumps(['Is there a doctor here?', 'Is there a doctor here']), 'Is there + a doctor + here', 'Is there a doctor here?', 'Grammar Bank 1A'),
        (128, 'text', 56.5, 28.2, 36.0, 1.8, 'Did you come to school by bus?', '1A.b 10', json.dumps(['Did you come to school by bus?', 'Did you come to school by bus']), 'Did + you + come to school + by bus', 'Did you come to school by bus?', 'Grammar Bank 1A'),
        # 1B.a
        (128, 'text', 11.5, 39.5, 26.0, 1.8, 'Does Anna like music?', '1B.a 1', json.dumps(['Does Anna like music?', 'Does Anna like music']), 'question 3rd person singular', 'Does Anna like music?', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 41.5, 26.0, 1.8, 'My sister has a lot of hobbies.', '1B.a 2', json.dumps(['My sister has a lot of hobbies.', 'My sister has a lot of hobbies']), 'positive 3rd person have -> has', 'My sister has a lot of hobbies.', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 43.5, 26.0, 1.8, "I don't get on very well with my parents.", '1B.a 3', json.dumps(["I don't get on very well with my parents.", "I do not get on very well with my parents."]), 'negative with I', "I don't get on very well with my parents.", 'Grammar Bank 1B'),
        (128, 'text', 11.5, 45.5, 26.0, 1.8, 'My brother studies English at university.', '1B.a 4', json.dumps(['My brother studies English at university.', 'My brother studies English at university']), 'study -> studies', 'My brother studies English at university.', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 47.5, 26.0, 1.8, "My neighbours don't have any children.", '1B.a 5', json.dumps(["My neighbours don't have any children.", "My neighbours do not have any children."]), 'negative with plural', "My neighbours don't have any children.", 'Grammar Bank 1B'),
        (128, 'text', 11.5, 49.5, 26.0, 1.8, 'What time does the film start?', '1B.a 6', json.dumps(['What time does the film start?', 'What time does the film start']), 'question with 3rd person singular', 'What time does the film start?', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 51.5, 26.0, 1.8, 'He goes out twice a week.', '1B.a 7', json.dumps(['He goes out twice a week.', 'He goes out twice a week']), 'go -> goes', 'He goes out twice a week.', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 53.5, 26.0, 1.8, "We don't often talk about politics.", '1B.a 8', json.dumps(["We don't often talk about politics.", "We do not often talk about politics."]), 'negative adverb position', "We don't often talk about politics.", 'Grammar Bank 1B'),
        (128, 'text', 11.5, 55.5, 26.0, 1.8, 'How often do you see your brother?', '1B.a 9', json.dumps(['How often do you see your brother?', 'How often do you see your brother']), 'question with you', 'How often do you see your brother?', 'Grammar Bank 1B'),
        (128, 'text', 11.5, 57.5, 26.0, 1.8, "Sally doesn't go on Facebook very much.", '1B.a 10', json.dumps(["Sally doesn't go on Facebook very much.", "Sally does not go on Facebook very much."]), 'negative 3rd person', "Sally doesn't go on Facebook very much.", 'Grammar Bank 1B'),
        # 1B.b
        (128, 'text', 56.5, 39.5, 36.0, 1.8, 'I always go to bed before 11.00.', '1B.b 1', json.dumps(['I always go to bed before 11.00.', 'I always go to bed before 11:00.']), 'always before main verb', 'I always go to bed before 11.00.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 41.5, 36.0, 1.8, 'Kate hardly ever sees her family.', '1B.b 2', json.dumps(['Kate hardly ever sees her family.', 'Kate hardly ever sees her family']), 'hardly ever before sees', 'Kate hardly ever sees her family.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 43.5, 36.0, 1.8, 'We never go shopping on Saturdays.', '1B.b 3', json.dumps(['We never go shopping on Saturdays.', 'We never go shopping on Saturdays']), 'never before go', 'We never go shopping on Saturdays.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 45.5, 36.0, 1.8, "I go to the dentist's twice a year.", '1B.b 4', json.dumps(["I go to the dentist's twice a year.", "I go to the dentist's twice a year"]), 'frequency phrase at end', "I go to the dentist's twice a year.", 'Grammar Bank 1B'),
        (128, 'text', 56.5, 47.5, 36.0, 1.8, 'They sometimes have breakfast in bed.', '1B.b 5', json.dumps(['They sometimes have breakfast in bed.', 'They sometimes have breakfast in bed']), 'sometimes before have', 'They sometimes have breakfast in bed.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 49.5, 36.0, 1.8, 'I usually listen to the radio in the car.', '1B.b 6', json.dumps(['I usually listen to the radio in the car.', 'I usually listen to the radio in the car']), 'usually before listen', 'I usually listen to the radio in the car.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 51.5, 36.0, 1.8, 'Alan runs in the park every day.', '1B.b 7', json.dumps(['Alan runs in the park every day.', 'Alan runs in the park every day']), 'every day at the end', 'Alan runs in the park every day.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 53.5, 36.0, 1.8, 'Sam is often late for work.', '1B.b 8', json.dumps(['Sam is often late for work.', 'Sam is often late for work']), 'often after is (verb be)', 'Sam is often late for work.', 'Grammar Bank 1B'),
        (128, 'text', 56.5, 55.5, 36.0, 1.8, "John doesn't often go to the theatre.", '1B.b 9', json.dumps(["John doesn't often go to the theatre.", "John does not often go to the theatre."]), 'often between negative auxiliary and verb', "John doesn't often go to the theatre.", 'Grammar Bank 1B'),
        (128, 'text', 56.5, 57.5, 36.0, 1.8, 'I visit my mum once a month.', '1B.b 10', json.dumps(['I visit my mum once a month.', 'I visit my mum once a month']), 'frequency phrase at end', 'I visit my mum once a month.', 'Grammar Bank 1B'),
        # 1C.a
        (128, 'text', 11.5, 71.0, 26.0, 1.8, "Oliver's wearing a suit today!", '1C.a 1', json.dumps(["Oliver's wearing a suit today!", "Oliver is wearing a suit today!"]), 'continuous of wear', "Oliver's wearing a suit today!", 'Grammar Bank 1C'),
        (128, 'text', 11.5, 73.0, 26.0, 1.8, "It's hot. Why are you wearing a coat?", '1C.a 2', json.dumps(["Why are you wearing a coat?", "Why are you wearing a coat"]), 'question continuous', 'Why are you wearing a coat?', 'Grammar Bank 1C'),
        (128, 'text', 11.5, 75.0, 26.0, 1.8, "Jane isn't sitting in her usual place today.", '1C.a 3', json.dumps(["Jane isn't sitting in her usual place today.", "Jane is not sitting in her usual place today."]), 'negative continuous sit -> sitting', "Jane isn't sitting in her usual place today.", 'Grammar Bank 1C'),
        (128, 'text', 11.5, 77.0, 26.0, 1.8, "Hey! You're standing on my foot!", '1C.a 4', json.dumps(["You're standing on my foot!", "You are standing on my foot!"]), 'continuous of stand', "You're standing on my foot!", 'Grammar Bank 1C'),
        (128, 'text', 11.5, 79.0, 26.0, 1.8, 'What book are you reading?', '1C.a 5', json.dumps(['What book are you reading?', 'What book are you reading']), 'question continuous', 'What book are you reading?', 'Grammar Bank 1C'),
        (128, 'text', 11.5, 81.0, 26.0, 1.8, "We're renting a small flat at the moment.", '1C.a 6', json.dumps(["We're renting a small flat at the moment.", "We are renting a small flat at the moment."]), 'continuous of rent', "We're renting a small flat at the moment.", 'Grammar Bank 1C'),
        (128, 'text', 11.5, 83.0, 26.0, 1.8, 'Is she wearing make-up?', '1C.a 7', json.dumps(['Is she wearing make-up?', 'Is she wearing make-up']), 'question with she', 'Is she wearing make-up?', 'Grammar Bank 1C'),
        (128, 'text', 11.5, 85.0, 26.0, 1.8, "I'm planning a trip to the USA.", '1C.a 8', json.dumps(["I'm planning a trip to the USA.", "I am planning a trip to the USA."]), 'plan -> planning', "I'm planning a trip to the USA.", 'Grammar Bank 1C'),
        (128, 'text', 11.5, 87.0, 26.0, 1.8, 'Is your brother working in London this week?', '1C.a 9', json.dumps(['Is your brother working in London this week?', 'Is your brother working in London this week']), 'question continuous', 'Is your brother working in London this week?', 'Grammar Bank 1C'),
        (128, 'text', 11.5, 89.0, 26.0, 1.8, "They aren't getting on very well at the moment.", '1C.a 10', json.dumps(["They aren't getting on very well at the moment.", "They are not getting on very well at the moment."]), 'negative continuous get -> getting', "They aren't getting on very well at the moment.", 'Grammar Bank 1C'),
        # 1C.b
        (128, 'text', 56.5, 71.0, 36.0, 1.8, "doesn't bite", '1C.b 1', json.dumps(["doesn't bite", "does not bite"]), 'habitual negative present simple', "He doesn't bite.", 'Grammar Bank 1C'),
        (128, 'text', 56.5, 73.0, 36.0, 1.8, "are you wearing", '1C.b 2', json.dumps(["are you wearing", "'s raining", "is raining"]), 'continuous right now', 'are you wearing', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 75.0, 36.0, 1.8, "'m not listening", '1C.b 3', json.dumps(["'m not listening", "am not listening", "not listening"]), 'negative continuous of listen', "'m not listening", 'Grammar Bank 1C'),
        (128, 'text', 56.5, 77.0, 36.0, 1.8, 'need', '1C.b 4', json.dumps(['need']), 'state verb need is not used in continuous', 'need', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 79.0, 36.0, 1.8, "'s putting", '1C.b 5', json.dumps(["'s putting", "is putting"]), 'continuous right now put -> putting', "'s putting", 'Grammar Bank 1C'),
        (128, 'text', 56.5, 81.0, 36.0, 1.8, 'do you usually cook', '1C.b 6', json.dumps(['do you usually cook', 'cook']), 'habitual routine with usually', 'do you usually cook', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 83.0, 36.0, 1.8, 'are you doing', '1C.b 7', json.dumps(['are you doing', "'m waiting", "am waiting"]), 'continuous action right now', 'are you doing', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 85.0, 36.0, 1.8, 'drink', '1C.b 8', json.dumps(['drink', 'want']), 'habitual routine drink / state want', 'drink', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 87.0, 36.0, 1.8, 'works', '1C.b 9', json.dumps(['works']), 'permanent routine present simple work -> works', 'works', 'Grammar Bank 1C'),
        (128, 'text', 56.5, 89.0, 36.0, 1.8, 'lives', '1C.b 10', json.dumps(['lives', "'s working", "is working"]), 'lives permanently, is working temporarily', 'lives', 'Grammar Bank 1C'),
    ],

    # Grammar Bank Unit 2 Practice Checks (Page 129: Book page 128)
    129: [
        (129, 'text', 11.5, 14.0, 14.0, 1.8, 'went', '2A.rule1 Irregular', json.dumps(['went']), 'Past simple of go', 'went', 'Grammar Bank 2A'),
        (129, 'text', 11.5, 16.5, 14.0, 1.8, 'stayed', '2A.rule2 Regular', json.dumps(['stayed']), 'Past simple of stay', 'stayed', 'Grammar Bank 2A'),
        (129, 'text', 11.5, 40.0, 18.0, 1.8, 'was walking', '2B.rule1 Continuous', json.dumps(['was walking', 'were singing']), 'Past continuous: was/were + -ing', 'was walking', 'Grammar Bank 2B'),
        (129, 'text', 56.5, 66.0, 16.0, 1.8, 'because', '2C.rule1 Connector', json.dumps(['because', 'so', 'although', 'but']), 'Time sequencers & connectors', 'because', 'Grammar Bank 2C'),
    ],

    # Grammar Bank Unit 2 Exercises (Page 130: Book page 129)
    130: [
        (130, 'text', 11.5, 12.0, 24.0, 1.8, 'did you go', '2A.a 1', json.dumps(['did you go', 'Where did you go']), 'Past simple question: did + subject + base verb', 'did you go', 'Grammar Bank 2A'),
        (130, 'text', 11.5, 14.0, 24.0, 1.8, 'was', '2A.a 2', json.dumps(['was']), 'It was great', 'was', 'Grammar Bank 2A'),
        (130, 'text', 11.5, 16.0, 24.0, 1.8, 'stayed', '2A.a 3', json.dumps(['stayed']), 'We stayed at a hotel', 'stayed', 'Grammar Bank 2A'),
        (130, 'text', 11.5, 18.0, 24.0, 1.8, 'did you do', '2A.a 4', json.dumps(['did you do']), 'What did you do during the day?', 'did you do', 'Grammar Bank 2A'),
        (130, 'text', 56.5, 12.0, 24.0, 1.8, 'was walking', '2B.a 1', json.dumps(['was walking']), 'Past continuous action in progress', 'was walking', 'Grammar Bank 2B'),
        (130, 'text', 56.5, 14.0, 24.0, 1.8, 'met', '2B.a 2', json.dumps(['met']), 'Completed past simple action', 'met', 'Grammar Bank 2B'),
        (130, 'text', 56.5, 45.0, 16.0, 1.8, 'because', '2C.a 1', json.dumps(['because']), 'Gives a reason', 'because', 'Grammar Bank 2C'),
        (130, 'text', 56.5, 47.5, 16.0, 1.8, 'although', '2C.a 2', json.dumps(['although']), 'Shows contrast', 'although', 'Grammar Bank 2C'),
    ],

    # Vocabulary Bank: Describing People (Page 151: Book page 150)
    151: [
        # 2 PERSONALITY
        (151, 'text', 76.8, 29.0, 7.5, 1.8, 'adjective', 'Q2.1 Adj', json.dumps(['friendly']), 'Open and warm', 'friendly', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 29.0, 7.5, 1.8, 'opposite', 'Q2.1 Opp', json.dumps(['unfriendly']), 'Opposite of friendly', 'unfriendly', 'Vocab Bank Personality'),
        (151, 'text', 76.8, 32.7, 7.5, 1.8, 'adjective', 'Q2.2 Adj', json.dumps(['talkative']), 'Talks a lot', 'talkative', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 32.7, 7.5, 1.8, 'opposite', 'Q2.2 Opp', json.dumps(['quiet']), 'Opposite of talkative', 'quiet', 'Vocab Bank Personality'),
        (151, 'text', 76.8, 38.6, 7.5, 1.8, 'adjective', 'Q2.3 Adj', json.dumps(['generous']), 'Likes giving things', 'generous', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 38.6, 7.5, 1.8, 'opposite', 'Q2.3 Opp', json.dumps(['mean']), 'Opposite of generous', 'mean', 'Vocab Bank Personality'),
        (151, 'text', 76.8, 40.8, 7.5, 1.8, 'adjective', 'Q2.4 Adj', json.dumps(['kind']), 'Friendly and good to other people', 'kind', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 40.8, 7.5, 1.8, 'opposite', 'Q2.4 Opp', json.dumps(['unkind']), 'Opposite of kind', 'unkind', 'Vocab Bank Personality'),
        (151, 'text', 76.7, 44.5, 7.5, 1.8, 'adjective', 'Q2.5 Adj', json.dumps(['lazy']), 'Does not want to work', 'lazy', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 44.5, 7.5, 1.8, 'opposite', 'Q2.5 Opp', json.dumps(['hard-working', 'hardworking']), 'Opposite of lazy', 'hard-working', 'Vocab Bank Personality'),
        (151, 'text', 76.7, 47.0, 7.5, 1.8, 'adjective', 'Q2.6 Adj', json.dumps(['funny']), 'Makes people laugh', 'funny', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 47.0, 7.5, 1.8, 'opposite', 'Q2.6 Opp', json.dumps(['serious']), 'Opposite of funny', 'serious', 'Vocab Bank Personality'),
        (151, 'text', 76.7, 49.5, 7.5, 1.8, 'adjective', 'Q2.7 Adj', json.dumps(['clever']), 'Quick at learning', 'clever', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 49.5, 7.5, 1.8, 'opposite', 'Q2.7 Opp', json.dumps(['stupid']), 'Opposite of clever', 'stupid', 'Vocab Bank Personality'),
        (151, 'text', 76.7, 52.0, 7.5, 1.8, 'adjective', 'Q2.8 Adj', json.dumps(['shy']), 'Cannot talk easily to strangers', 'shy', 'Vocab Bank Personality'),
        (151, 'text', 85.9, 52.0, 7.5, 1.8, 'opposite', 'Q2.8 Opp', json.dumps(['extrovert']), 'Opposite of shy', 'extrovert', 'Vocab Bank Personality'),
        # 1 APPEARANCE photo matching
        (151, 'text', 8.5, 46.5, 3.5, 1.8, 'Photo #', '1.1 Curly', json.dumps(['2']), 'Photo 2: curly red hair', '2', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 48.5, 3.5, 1.8, 'Photo #', '1.2 Straight', json.dumps(['3']), 'Photo 3: long straight hair', '3', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 52.5, 3.5, 1.8, 'Photo #', '1.4 Blonde', json.dumps(['6']), 'Photo 6: short blonde hair', '6', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 55.0, 3.5, 1.8, 'Photo #', '1.5 Beard', json.dumps(['5']), 'Photo 5: beard and moustache', '5', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 57.0, 3.5, 1.8, 'Photo #', '1.6 Bald', json.dumps(['4']), 'Photo 4: bald', '4', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 59.0, 3.5, 1.8, 'Photo #', '1.7 Tall/thin', json.dumps(['7']), 'Photo 7: tall and thin', '7', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 61.0, 3.5, 1.8, 'Photo #', '1.8 Medium/slim', json.dumps(['9']), 'Photo 9: medium height and very slim', '9', 'Vocab Bank Appearance'),
        (151, 'text', 8.5, 63.0, 3.5, 1.8, 'Photo #', '1.9 Overweight', json.dumps(['8']), 'Photo 8: short and overweight', '8', 'Vocab Bank Appearance'),
    ],

    # Vocabulary Bank: Things you wear (Page 152: Book page 151)
    152: [
        (152, 'text', 8.5, 14.0, 3.8, 1.8, 'Photo', 'Wear 11', json.dumps(['11', 'blouse']), 'Photo 11: blouse', '11', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 16.0, 3.8, 1.8, 'Photo', 'Wear 13', json.dumps(['13', 'cardigan']), 'Photo 13: cardigan', '13', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 18.0, 3.8, 1.8, 'Photo', 'Wear 3', json.dumps(['3', 'coat']), 'Photo 3: coat', '3', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 20.0, 3.8, 1.8, 'Photo', 'Wear 2', json.dumps(['2', 'dress']), 'Photo 2: dress', '2', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 22.0, 3.8, 1.8, 'Photo', 'Wear 9', json.dumps(['9', 'jacket']), 'Photo 9: jacket', '9', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 24.0, 3.8, 1.8, 'Photo', 'Wear 5', json.dumps(['5', 'jeans']), 'Photo 5: jeans', '5', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 26.0, 3.8, 1.8, 'Photo', 'Wear 14', json.dumps(['14', 'leggings']), 'Photo 14: leggings', '14', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 28.0, 3.8, 1.8, 'Photo', 'Wear 18', json.dumps(['18', 'pyjamas']), 'Photo 18: pyjamas', '18', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 30.0, 3.8, 1.8, 'Photo', 'Wear 8', json.dumps(['8', 'shirt']), 'Photo 8: shirt', '8', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 34.0, 3.8, 1.8, 'Photo', 'Wear 6', json.dumps(['6', 'skirt']), 'Photo 6: skirt', '6', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 36.0, 3.8, 1.8, 'Photo', 'Wear 20', json.dumps(['20', 'socks']), 'Photo 20: socks', '20', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 38.0, 3.8, 1.8, 'Photo', 'Wear 7', json.dumps(['7', 'suit']), 'Photo 7: suit', '7', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 40.0, 3.8, 1.8, 'Photo', 'Wear 16', json.dumps(['16', 'sweater']), 'Photo 16: sweater', '16', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 42.0, 3.8, 1.8, 'Photo', 'Wear 19', json.dumps(['19', 'tights']), 'Photo 19: tights', '19', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 44.0, 3.8, 1.8, 'Photo', 'Wear 4', json.dumps(['4', 'top']), 'Photo 4: top', '4', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 46.0, 3.8, 1.8, 'Photo', 'Wear 10', json.dumps(['10', 'tracksuit']), 'Photo 10: tracksuit', '10', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 48.0, 3.8, 1.8, 'Photo', 'Wear 12', json.dumps(['12', 'trousers']), 'Photo 12: trousers', '12', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 50.0, 3.8, 1.8, 'Photo', 'Wear 15', json.dumps(['15', 'T-shirt', 't-shirt']), 'Photo 15: T-shirt', '15', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 52.0, 3.8, 1.8, 'Photo', 'Wear 17', json.dumps(['17', 'underwear']), 'Photo 17: underwear', '17', 'Vocab Bank Clothes'),
        (152, 'text', 8.5, 56.0, 3.8, 1.8, 'Photo', 'Wear 24', json.dumps(['24', 'boots']), 'Photo 24: boots', '24', 'Vocab Bank Footwear'),
        (152, 'text', 8.5, 58.0, 3.8, 1.8, 'Photo', 'Wear 25', json.dumps(['25', 'flip-flops']), 'Photo 25: flip-flops', '25', 'Vocab Bank Footwear'),
        (152, 'text', 8.5, 60.0, 3.8, 1.8, 'Photo', 'Wear 22', json.dumps(['22', 'sandals']), 'Photo 22: sandals', '22', 'Vocab Bank Footwear'),
        (152, 'text', 8.5, 62.0, 3.8, 1.8, 'Photo', 'Wear 23', json.dumps(['23', 'shoes']), 'Photo 23: shoes', '23', 'Vocab Bank Footwear'),
        (152, 'text', 8.5, 64.0, 3.8, 1.8, 'Photo', 'Wear 21', json.dumps(['21', 'trainers']), 'Photo 21: trainers', '21', 'Vocab Bank Footwear'),
        (152, 'text', 8.5, 68.0, 3.8, 1.8, 'Photo', 'Wear 26', json.dumps(['26', 'belt']), 'Photo 26: belt', '26', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 70.0, 3.8, 1.8, 'Photo', 'Wear 30', json.dumps(['30', 'cap']), 'Photo 30: cap', '30', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 72.0, 3.8, 1.8, 'Photo', 'Wear 31', json.dumps(['31', 'hat']), 'Photo 31: hat', '31', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 74.0, 3.8, 1.8, 'Photo', 'Wear 28', json.dumps(['28', 'gloves']), 'Photo 28: gloves', '28', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 76.0, 3.8, 1.8, 'Photo', 'Wear 29', json.dumps(['29', 'scarf']), 'Photo 29: scarf', '29', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 78.0, 3.8, 1.8, 'Photo', 'Wear 27', json.dumps(['27', 'tie']), 'Photo 27: tie', '27', 'Vocab Bank Accessories'),
        (152, 'text', 8.5, 82.0, 3.8, 1.8, 'Photo', 'Wear 33', json.dumps(['33', 'bracelet']), 'Photo 33: bracelet', '33', 'Vocab Bank Jewellery'),
        (152, 'text', 8.5, 84.0, 3.8, 1.8, 'Photo', 'Wear 32', json.dumps(['32', 'earrings']), 'Photo 32: earrings', '32', 'Vocab Bank Jewellery'),
        (152, 'text', 8.5, 86.0, 3.8, 1.8, 'Photo', 'Wear 35', json.dumps(['35', 'necklace']), 'Photo 35: necklace', '35', 'Vocab Bank Jewellery'),
        (152, 'text', 8.5, 88.0, 3.8, 1.8, 'Photo', 'Wear 34', json.dumps(['34', 'ring']), 'Photo 34: ring', '34', 'Vocab Bank Jewellery'),
    ],

    # Vocabulary Bank: Holidays (Page 153: Book page 152)
    153: [
        # 1 Phrases with GO
        (153, 'text', 8.5, 73.0, 3.8, 1.8, 'Photo #', 'Go 7', json.dumps(['7', 'go abroad']), 'Photo 7: go abroad', '7', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 75.0, 3.8, 1.8, 'Photo #', 'Go 10', json.dumps(['10', 'go away for the weekend']), 'Photo 10: go away for the weekend', '10', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 77.0, 3.8, 1.8, 'Photo #', 'Go 4', json.dumps(['4', 'go by bus']), 'Photo 4: go by bus', '4', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 79.0, 3.8, 1.8, 'Photo #', 'Go 8', json.dumps(['8', 'go camping']), 'Photo 8: go camping', '8', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 81.0, 3.8, 1.8, 'Photo #', 'Go 9', json.dumps(['9', 'go for a walk']), 'Photo 9: go for a walk', '9', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 83.0, 3.8, 1.8, 'Photo #', 'Go 5', json.dumps(['5', 'go on holiday']), 'Photo 5: go on holiday', '5', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 85.0, 3.8, 1.8, 'Photo #', 'Go 3', json.dumps(['3', 'go out at night']), 'Photo 3: go out at night', '3', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 89.0, 3.8, 1.8, 'Photo #', 'Go 6', json.dumps(['6', 'go skiing']), 'Photo 6: go skiing', '6', 'Vocab Bank Holidays'),
        (153, 'text', 8.5, 91.0, 3.8, 1.8, 'Photo #', 'Go 2', json.dumps(['2', 'go swimming']), 'Photo 2: go swimming', '2', 'Vocab Bank Holidays'),
        # 2 Other holiday phrases
        (153, 'text', 46.5, 24.0, 10.0, 1.8, 'take', 'Holiday take', json.dumps(['take']), 'take photos', 'take', 'Vocab Bank Holidays'),
        (153, 'text', 46.5, 26.0, 10.0, 1.8, 'buy', 'Holiday buy', json.dumps(['buy']), 'buy souvenirs', 'buy', 'Vocab Bank Holidays'),
        (153, 'text', 46.5, 28.0, 12.0, 1.8, 'sunbathe', 'Holiday sunbathe', json.dumps(['sunbathe']), 'sunbathe on the beach', 'sunbathe', 'Vocab Bank Holidays'),
        (153, 'text', 46.5, 30.0, 10.0, 1.8, 'have', 'Holiday have', json.dumps(['have']), 'have a good time', 'have', 'Vocab Bank Holidays'),
        (153, 'text', 71.0, 21.0, 10.0, 1.8, 'spend', 'Holiday spend', json.dumps(['spend']), 'spend money', 'spend', 'Vocab Bank Holidays'),
        (153, 'text', 71.0, 23.0, 10.0, 1.8, 'rent', 'Holiday rent', json.dumps(['rent']), 'rent an apartment', 'rent', 'Vocab Bank Holidays'),
        (153, 'text', 71.0, 25.0, 10.0, 1.8, 'hire', 'Holiday hire', json.dumps(['hire']), 'hire a bicycle', 'hire', 'Vocab Bank Holidays'),
        (153, 'text', 71.0, 27.0, 10.0, 1.8, 'book', 'Holiday book', json.dumps(['book']), 'book a flight online', 'book', 'Vocab Bank Holidays'),
    ],

    # Vocabulary Bank: Prepositions (Page 154: Book page 153)
    154: [
        (154, 'text', 10.0, 25.0, 10.0, 1.8, 'prep', 'Prep 1', json.dumps(['in']), 'in a room / in a building', 'in', 'Vocab Bank Prepositions'),
        (154, 'text', 10.0, 28.0, 10.0, 1.8, 'prep', 'Prep 2', json.dumps(['on']), 'on a table / on the wall', 'on', 'Vocab Bank Prepositions'),
        (154, 'text', 10.0, 31.0, 10.0, 1.8, 'prep', 'Prep 3', json.dumps(['at']), 'at the bus stop / at home', 'at', 'Vocab Bank Prepositions'),
        (154, 'text', 10.0, 34.0, 10.0, 1.8, 'prep', 'Prep 4', json.dumps(['under']), 'under the bed', 'under', 'Vocab Bank Prepositions'),
        (154, 'text', 55.0, 25.0, 10.0, 1.8, 'prep', 'Prep 5', json.dumps(['into']), 'into the shop', 'into', 'Vocab Bank Prepositions'),
        (154, 'text', 55.0, 28.0, 10.0, 1.8, 'prep', 'Prep 6', json.dumps(['out of']), 'out of the car', 'out of', 'Vocab Bank Prepositions'),
    ],

    # Vocabulary Bank: Housework, Make or Do? (Page 155: Book page 154)
    155: [
        (155, 'text', 10.0, 24.0, 8.0, 1.8, 'make/do', 'MakeDo 1', json.dumps(['do']), 'do the washing-up', 'do', 'Vocab Bank Housework'),
        (155, 'text', 10.0, 27.0, 8.0, 1.8, 'make/do', 'MakeDo 2', json.dumps(['make']), 'make the bed', 'make', 'Vocab Bank Housework'),
        (155, 'text', 10.0, 30.0, 8.0, 1.8, 'make/do', 'MakeDo 3', json.dumps(['do']), 'do homework', 'do', 'Vocab Bank Housework'),
        (155, 'text', 10.0, 33.0, 8.0, 1.8, 'make/do', 'MakeDo 4', json.dumps(['make']), 'make a mistake', 'make', 'Vocab Bank Housework'),
        (155, 'text', 55.0, 24.0, 8.0, 1.8, 'make/do', 'MakeDo 5', json.dumps(['do']), 'do exercise / sport', 'do', 'Vocab Bank Housework'),
        (155, 'text', 55.0, 27.0, 8.0, 1.8, 'make/do', 'MakeDo 6', json.dumps(['make']), 'make noise', 'make', 'Vocab Bank Housework'),
    ],

    # Vocabulary Bank: Shopping (Page 156: Book page 155)
    156: [
        (156, 'text', 10.0, 25.0, 14.0, 1.8, 'basket', 'Shop 1', json.dumps(['basket']), 'Handheld shopping container', 'basket', 'Vocab Bank Shopping'),
        (156, 'text', 10.0, 28.0, 14.0, 1.8, 'trolley', 'Shop 2', json.dumps(['trolley', 'cart']), 'Wheeled shopping container', 'trolley', 'Vocab Bank Shopping'),
        (156, 'text', 10.0, 31.0, 14.0, 1.8, 'receipt', 'Shop 3', json.dumps(['receipt']), 'Proof of purchase', 'receipt', 'Vocab Bank Shopping'),
        (156, 'text', 10.0, 34.0, 14.0, 1.8, 'checkout', 'Shop 4', json.dumps(['checkout']), 'Where you pay in a supermarket', 'checkout', 'Vocab Bank Shopping'),
    ]
}

# Merge complete course overlays from course_content module
try:
    from course_content import COURSE_OVERLAYS
    for p_id, p_ovs in COURSE_OVERLAYS.items():
        if p_id not in DEFAULT_PAGE_OVERLAYS:
            DEFAULT_PAGE_OVERLAYS[p_id] = p_ovs
        else:
            # Append non-duplicate overlays
            DEFAULT_PAGE_OVERLAYS[p_id] = list(DEFAULT_PAGE_OVERLAYS[p_id]) + list(p_ovs)
except Exception as _ce_err:
    pass

def refresh_default_overlays(force=False, reset_user_answers=False):
    """
    Ensure all default overlay sets exist across target pages.
    CRITICAL: Does NOT destroy user answers or custom user blanks!
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    for page_num, overlays in DEFAULT_PAGE_OVERLAYS.items():
        if force:
            # Only delete default overlays on this page, preserve custom user blanks!
            cursor.execute("DELETE FROM page_overlays WHERE page_num = ? AND (is_default = 1 OR is_default IS NULL)", (page_num,))
            if reset_user_answers:
                cursor.execute("DELETE FROM user_page_answers WHERE page_num = ?", (page_num,))

        count = cursor.execute("SELECT COUNT(*) as c FROM page_overlays WHERE page_num = ? AND (is_default = 1 OR is_default IS NULL)", (page_num,)).fetchone()["c"]
        if count == 0:
            formatted_items = []
            for ov in overlays:
                if isinstance(ov, dict):
                    corr = json.dumps(ov.get("correct_answers", [])) if isinstance(ov.get("correct_answers"), list) else str(ov.get("correct_answers", "[]"))
                    opts = json.dumps(ov.get("options", [])) if isinstance(ov.get("options"), list) else str(ov.get("options", "[]"))
                    formatted_items.append((
                        ov.get("page_num", page_num),
                        ov.get("field_type", "text"),
                        float(ov.get("x", 10.0)),
                        float(ov.get("y", 10.0)),
                        float(ov.get("width", 15.0)),
                        float(ov.get("height", 2.0)),
                        ov.get("placeholder", ""),
                        ov.get("label", "Q"),
                        corr,
                        ov.get("hint", ""),
                        ov.get("explanation", ""),
                        ov.get("unit_ref", ""),
                        opts,
                        ov.get("grading_type", "exact"),
                        ov.get("sample_answer", ""),
                        ov.get("audio_track", ""),
                        1
                    ))
                elif len(ov) == 12:
                    formatted_items.append((
                        ov[0], ov[1], ov[2], ov[3], ov[4], ov[5], ov[6], ov[7], ov[8], ov[9], ov[10], ov[11],
                        "[]", "exact", "", "", 1
                    ))
                elif len(ov) >= 16:
                    formatted_items.append((
                        ov[0], ov[1], ov[2], ov[3], ov[4], ov[5], ov[6], ov[7], ov[8], ov[9], ov[10], ov[11],
                        ov[12], ov[13], ov[14], ov[15], 1
                    ))

            if formatted_items:
                cursor.executemany("""
                INSERT INTO page_overlays (page_num, field_type, x, y, width, height, placeholder, label, correct_answers, hint, explanation, unit_ref, options, grading_type, sample_answer, audio_track, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, formatted_items)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    refresh_default_overlays(force=True, reset_user_answers=False)
    print("Database initialized and overlays calibrated successfully without destroying user answers!")
