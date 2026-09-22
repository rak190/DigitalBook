"""
Digital Textbook HTTP Server & REST API Backend
Serves high-resolution textbook pages, thumbnails, interactive UI,
and provides REST API for annotations, exercises, vocabulary, and notes.
"""

import http.server
import socketserver
import urllib.parse
import json
import os
import mimetypes
import sqlite3
import datetime
import re
import base64
import database

try:
    import dotenv
    dotenv.load_dotenv()
except Exception:
    pass

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except Exception:
    HAS_GENAI = False

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
PAGES_DIR = os.path.join(BASE_DIR, "book_pages")
THUMBS_DIR = os.path.join(BASE_DIR, "book_thumbnails")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
PDF_PATH = "D:/English File 4th edition Pre Intermediate Student's Book.pdf"

KNOWN_AUDIO_TRACKS = [
    # Unit 1A
    "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10",
    # Unit 1B
    "1.11", "1.12", "1.13", "1.14", "1.15", "1.16", "1.17", "1.18",
    # Unit 1C
    "1.19", "1.20", "1.21", "1.22", "1.23", "1.24", "1.25",
    # Practical English 1
    "1.26", "1.27", "1.28", "1.29", "1.30",
    # Unit 2A
    "1.31", "1.32", "1.33", "1.34", "1.35", "1.36", "1.37", "1.38",
    # Unit 2B
    "1.39", "1.40", "1.41", "1.42", "1.43", "1.44",
    # Unit 2C
    "1.45", "1.46", "1.47", "1.48", "1.49", "1.50", "1.51",
    # Revise & Check
    "1.53",
    # Disc 4: Unit 9A
    "4.16", "4.17", "4.18", "4.19",
    # Unit 9B
    "4.20", "4.21", "4.22", "4.23", "4.24",
    # Unit 9C
    "4.25", "4.26", "4.27", "4.28", "4.29",
    # Practical English 5
    "4.31", "4.32", "4.33", "4.34", "4.35", "4.36",
    # Unit 10A
    "4.37", "4.38", "4.39", "4.40", "4.41",
    # Unit 10B
    "4.42", "4.43", "4.44", "4.45", "4.46",
    # Unit 10C
    "4.48", "4.49", "4.50", "4.51", "4.52", "4.53",
    # Revise & Check 9&10
    "4.54",
    # Backwards compatibility aliases
    "2.1", "2.10"
]

AUDIO_ALIASES = {
    "2.1": "1.31",
    "2.10": "1.45"
}

def normalize_audio_filename(filename):
    """Extract standard track id from uploaded filenames like EF4_1.2.mp3, 1.02.mp3, Track 02.mp3, ef3e_p-int_pe1_1-26.mp3"""
    name_clean = os.path.basename(filename)

    # Strip English File edition prefixes such as EF4_, EF4e_, EF3_, EF_, English_File_4_, etc.
    s_clean = re.sub(r'^(?:ef\d*e?|english[-_\s]*file[-_\s]*\d*)[-_\s]*', '', name_clean, flags=re.IGNORECASE)

    # 1. Check for CD number and Track number e.g. CD2_Track 01 or CD 2 Track 10
    cd_trk = re.search(r'cd\s*0?(\d+)[_\s-]+(?:track[_\s-]*)?0*(\d+)', s_clean, re.IGNORECASE)
    if cd_trk:
        cd_num = int(cd_trk.group(1))
        trk_num = int(cd_trk.group(2))
        track_id = f"{cd_num}.{trk_num}"
        return track_id, f"{track_id}.mp3"

    # 2. Check for Disc-Track pattern anchored at end of filename before extension:
    # e.g. ef3e_p-int_pe1_1-26.mp3, ef3e_p-int_pe5_4-31.mp3, ef3e_p-int_01a_1-02.mp3, 1_03.mp3, 1-02.mp3, EF4_1.2.mp3
    m_end = re.search(r'(?:[_\s-]|^)([1-9]|1[0-2])[\._\s-]+0*(\d+)(?:\.[a-zA-Z0-9]+)?$', s_clean, re.IGNORECASE)
    if m_end:
        cd_num = int(m_end.group(1))
        trk_num = int(m_end.group(2))
        track_id = f"{cd_num}.{trk_num}"
        return track_id, f"{track_id}.mp3"

    # 3. Check for Track XX e.g. Track 02, Track 2, Track 10 -> maps to 1.XX
    m_trk = re.search(r'track[_\s-]*0*(\d+)', s_clean, re.IGNORECASE)
    if m_trk:
        trk_num = int(m_trk.group(1))
        track_id = f"1.{trk_num}"
        return track_id, f"{track_id}.mp3"

    # 4. Check anywhere in string for Unit.Track with leading zeros e.g. 1.02, 1_02, 1-02, EF4_1.2
    m_unit_trk = re.search(r'(?:^|[^\d])([1-9]|1[0-2])[\._\s-]+0*(\d+)', s_clean)
    if m_unit_trk:
        unit_num = int(m_unit_trk.group(1))
        trk_num = int(m_unit_trk.group(2))
        track_id = f"{unit_num}.{trk_num}"
        return track_id, f"{track_id}.mp3"

    # 5. Fallback to sanitized basename
    base, ext = os.path.splitext(s_clean)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean, f"{clean}{ext.lower() if ext else '.mp3'}"

def is_answer_matching(user_answer, correct_answers):
    """Flexible ESL answer comparator accounting for contractions, punctuation, whitespace, and slash alternatives."""
    if user_answer is None:
        return False
    u = str(user_answer).strip().lower()
    if not u:
        return False

    u_norm = re.sub(r'\s+', ' ', u)
    u_nopunct = re.sub(r"[^\w\s]", "", u_norm).strip()

    # Contraction mappings
    contractions = {
        "don't": "do not", "doesn't": "does not", "didn't": "did not",
        "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
        "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
        "can't": "cannot", "couldn't": "could not", "won't": "will not",
        "'s": " is", "'re": " are", "'m": " am", "'ve": " have", "'ll": " will", "'d": " would"
    }

    def expand_contractions(text):
        res = text
        for c, exp in contractions.items():
            res = res.replace(c, exp)
        return re.sub(r'\s+', ' ', res).strip()

    u_exp = expand_contractions(u_norm)
    u_exp_nopunct = re.sub(r"[^\w\s]", "", u_exp).strip()

    num_map = {"1":"one", "2":"two", "3":"three", "4":"four", "5":"five", "6":"six", "7":"seven", "8":"eight", "9":"nine", "10":"ten"}
    rev_num_map = {v: k for k, v in num_map.items()}

    for ans in correct_answers:
        c = str(ans).strip().lower()
        if not c:
            continue
        c_norm = re.sub(r'\s+', ' ', c)
        c_nopunct = re.sub(r"[^\w\s]", "", c_norm).strip()
        c_exp = expand_contractions(c_norm)
        c_exp_nopunct = re.sub(r"[^\w\s]", "", c_exp).strip()

        if (u_norm == c_norm or
            u_nopunct == c_nopunct or
            u_exp == c_exp or
            u_exp_nopunct == c_exp_nopunct or
            num_map.get(u_norm) == c_norm or
            rev_num_map.get(u_norm) == c_norm):
            return True

        # Check options with parentheses like 'b (17th)' or 'Photo 2'
        m_paren = re.search(r'^([a-zA-Z0-9]+)\s*\((.*?)\)$', c)
        if m_paren:
            opt_letter = m_paren.group(1).lower()
            opt_val = m_paren.group(2).lower()
            if u_norm in (opt_letter, opt_val) or u_nopunct in (opt_letter, opt_val):
                return True

        # Check slash alternatives e.g. "take photos / pictures"
        if "/" in c:
            for part in c.split("/"):
                p = part.strip()
                if not p:
                    continue
                p_norm = re.sub(r'\s+', ' ', p)
                p_nopunct = re.sub(r"[^\w\s]", "", p_norm).strip()
                if u_norm == p_norm or u_nopunct == p_nopunct:
                    return True

    return False

def parse_multipart_form(content_type, body_bytes):
    """Parses multipart/form-data payload into list of dicts with filename and data without corrupting binary data."""
    boundary = None
    for part in content_type.split(';'):
        part = part.strip()
        if part.startswith('boundary='):
            b_val = part.split('=', 1)[1].strip('"\'')
            boundary = b_val.encode('utf-8')
            break
    if not boundary:
        return []

    delimiter = b'--' + boundary
    parts = body_bytes.split(delimiter)
    files = []
    for p in parts:
        if p.startswith(b'\r\n'):
            p = p[2:]
        elif p.startswith(b'\n'):
            p = p[1:]
        if p.endswith(b'--\r\n'):
            p = p[:-4]
        elif p.endswith(b'--'):
            p = p[:-2]
        if p.endswith(b'\r\n'):
            p = p[:-2]
        elif p.endswith(b'\n'):
            p = p[:-1]
        if not p:
            continue
        if b'\r\n\r\n' in p:
            hdr_bytes, data = p.split(b'\r\n\r\n', 1)
        elif b'\n\n' in p:
            hdr_bytes, data = p.split(b'\n\n', 1)
        else:
            continue
        hdr_text = hdr_bytes.decode('utf-8', errors='ignore')
        m_fn = re.search(r'filename="([^"]+)"', hdr_text)
        if not m_fn:
            m_fn = re.search(r'filename=([^\s;]+)', hdr_text)
        if m_fn:
            filename = os.path.basename(m_fn.group(1).strip())
            files.append({'filename': filename, 'data': data})
    return files

def check_answers_ai(page_num, user_answers, user_prompt=""):
    """Evaluate student answers with Gemini AI or intelligent local fallback."""
    conn = database.get_db_connection()
    overlays = conn.execute("SELECT * FROM page_overlays WHERE page_num = ?", (page_num,)).fetchall()
    conn.close()

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if HAS_GENAI and api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are an encouraging expert English Language (ESL) teacher for Oxford English File 4th Edition Pre-Intermediate.
The student is working on textbook page {page_num}.
Here are the exercise items with expected answers and the student's typed answers:
"""
            for ov in overlays:
                ov_id = str(ov["id"])
                corr = json.loads(ov["correct_answers"] or "[]")
                u_val = user_answers.get(ov_id, "")
                prompt += f"- Question ID {ov_id} ({ov['label']}): Expected: {corr}, Student Answer: '{u_val}', Context/Hint: '{ov['hint']}'\n"

            prompt += """
Please evaluate each student answer. Be reasonably flexible with minor punctuation or contraction variations (e.g. "don't" vs "do not", "'s" vs "is").
Respond with ONLY valid JSON with this exact schema:
{
  "score": <number 0-100>,
  "correct_count": <number>,
  "total_count": <number>,
  "teacher_summary": "<encouraging 1-2 sentence overall feedback>",
  "evaluations": {
    "<question_id>": {
      "is_correct": <boolean>,
      "student_answer": "<string>",
      "correct_answer": "<string>",
      "explanation": "<friendly explanation of why it is right or wrong>",
      "grammar_tip": "<short grammar rule or tip>"
    }
  }
}
"""
            try:
                response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = re.sub(r"^```[a-zA-Z]*\n", "", resp_text)
                resp_text = re.sub(r"\n```$", "", resp_text)
            ai_data = json.loads(resp_text)
            ai_data["ai_powered"] = True
            ai_data["correct"] = ai_data.get("correct_count", 0)
            ai_data["correct_count"] = ai_data.get("correct_count", 0)
            ai_data["total"] = ai_data.get("total_count", 0)
            ai_data["total_count"] = ai_data.get("total_count", 0)
            return ai_data
        except Exception:
            pass

    # Local intelligent rule-based / fuzzy evaluation
    evaluations = {}
    correct_count = 0
    total_gradable = 0
    for ov in overlays:
        ov_id = str(ov["id"])
        corr = json.loads(ov["correct_answers"] or "[]")
        u_raw = user_answers.get(ov_id, "")
        u_val = str(u_raw).strip()
        if corr:
            total_gradable += 1
            is_correct = is_answer_matching(u_val, corr)
            if is_correct:
                correct_count += 1
                explanation = f"Well done! '{u_val}' is correct."
                tip = ov["explanation"] or "Great grammatical form!"
            else:
                explanation = f"Not quite. Expected: '{corr[0]}'. Your answer: '{u_val or '(empty)'}'."
                tip = ov["hint"] or ov["explanation"] or "Review the grammar box on this unit."

            evaluations[ov_id] = {
                "is_correct": is_correct,
                "student_answer": user_answers.get(ov_id, ""),
                "correct_answer": corr[0] if corr else "",
                "explanation": explanation,
                "grammar_tip": tip
            }
        else:
            evaluations[ov_id] = {
                "is_correct": True,
                "student_answer": user_answers.get(ov_id, ""),
                "correct_answer": "(Open-ended)",
                "explanation": "Great job expressing yourself!",
                "grammar_tip": "Check your spelling and capitalization."
            }

    score_pct = round((correct_count / total_gradable * 100) if total_gradable > 0 else 100, 1)
    if score_pct >= 90:
        summary = f"Outstanding work! You got {correct_count} out of {total_gradable} correct ({score_pct}%). Excellent mastery of the target language!"
    elif score_pct >= 70:
        summary = f"Good effort! You scored {correct_count} out of {total_gradable} ({score_pct}%). Review the questions you missed to lock in the grammar rules."
    else:
        summary = f"Keep practicing! You scored {correct_count} out of {total_gradable} ({score_pct}%). Take a look at the grammar tips below and try again."

    return {
        "ai_powered": False,
        "score": score_pct,
        "correct": correct_count,
        "correct_count": correct_count,
        "total": total_gradable,
        "total_count": total_gradable,
        "teacher_summary": summary,
        "evaluations": evaluations
    }

# Initialize DB and calibrate overlays on startup
database.init_db()
database.refresh_default_overlays()

# Structured Table of Contents for Oxford English File 4th Ed Pre-Intermediate
TABLE_OF_CONTENTS = [
    {
        "id": "cover",
        "title": "Front Cover & Title",
        "page": 1,
        "bookPage": 1,
        "type": "prelim"
    },
    {
        "id": "contents",
        "title": "Contents",
        "page": 3,
        "bookPage": 2,
        "type": "prelim"
    },
    {
        "id": "u1a",
        "unit": "Unit 1",
        "section": "1A",
        "title": "Are you? Can you? Do you? Did you?",
        "page": 7,
        "bookPage": 6,
        "grammar": "word order in questions",
        "vocabulary": "common verb phrases",
        "pronunciation": "the alphabet",
        "type": "unit"
    },
    {
        "id": "u1b",
        "unit": "Unit 1",
        "section": "1B",
        "title": "The perfect date?",
        "page": 9,
        "bookPage": 8,
        "grammar": "present simple",
        "vocabulary": "describing people: appearance and personality",
        "pronunciation": "final -s and -es",
        "type": "unit"
    },
    {
        "id": "u1c",
        "unit": "Unit 1",
        "section": "1C",
        "title": "The Remake Project",
        "page": 11,
        "bookPage": 10,
        "grammar": "present continuous",
        "vocabulary": "clothes, prepositions of place",
        "pronunciation": "/ə/ and /ɜː/",
        "type": "unit"
    },
    {
        "id": "u1pe",
        "unit": "Unit 1",
        "section": "PE 1",
        "title": "Practical English Episode 1: Calling reception",
        "page": 13,
        "bookPage": 12,
        "grammar": "practical English",
        "vocabulary": "hotel problems",
        "pronunciation": "sentence rhythm",
        "type": "practical"
    },
    {
        "id": "u2a",
        "unit": "Unit 2",
        "section": "2A",
        "title": "OMG! Where's my passport?",
        "page": 15,
        "bookPage": 14,
        "grammar": "past simple: regular and irregular verbs",
        "vocabulary": "holidays",
        "pronunciation": "regular verbs: -ed endings",
        "type": "unit"
    },
    {
        "id": "u2b",
        "unit": "Unit 2",
        "section": "2B",
        "title": "That's me in the picture!",
        "page": 17,
        "bookPage": 16,
        "grammar": "past continuous",
        "vocabulary": "prepositions of time and place: at, in, on",
        "pronunciation": "weak forms: was, were",
        "type": "unit"
    },
    {
        "id": "u2c",
        "unit": "Unit 2",
        "section": "2C",
        "title": "One dark October evening",
        "page": 19,
        "bookPage": 18,
        "grammar": "time sequencers and connectors",
        "vocabulary": "verb phrases",
        "pronunciation": "word stress",
        "type": "unit"
    },
    {
        "id": "u2rc",
        "unit": "Unit 2",
        "section": "Revise 1&2",
        "title": "Revise and Check 1&2",
        "page": 21,
        "bookPage": 20,
        "type": "review"
    },
    {
        "id": "u3a",
        "unit": "Unit 3",
        "section": "3A",
        "title": "A TripAside",
        "page": 23,
        "bookPage": 22,
        "grammar": "be going to (plans and predictions)",
        "vocabulary": "airports",
        "pronunciation": "the letter g",
        "type": "unit"
    },
    {
        "id": "u3b",
        "unit": "Unit 3",
        "section": "3B",
        "title": "Put it in your calendar!",
        "page": 25,
        "bookPage": 24,
        "grammar": "present continuous (future arrangements)",
        "vocabulary": "verbs + prepositions (arrive in, etc.)",
        "pronunciation": "linking",
        "type": "unit"
    },
    {
        "id": "u3c",
        "unit": "Unit 3",
        "section": "3C",
        "title": "Word games",
        "page": 27,
        "bookPage": 26,
        "grammar": "defining relative clauses",
        "vocabulary": "paraphrasing",
        "pronunciation": "silent e",
        "type": "unit"
    },
    {
        "id": "u3pe",
        "unit": "Unit 3",
        "section": "PE 2",
        "title": "Practical English Episode 2: At the restaurant",
        "page": 29,
        "bookPage": 28,
        "type": "practical"
    },
    {
        "id": "u4a",
        "unit": "Unit 4",
        "section": "4A",
        "title": "Who does what?",
        "page": 31,
        "bookPage": 30,
        "grammar": "present perfect + yet, just, already",
        "vocabulary": "housework, make or do?",
        "pronunciation": "the letters y and j",
        "type": "unit"
    },
    {
        "id": "u4b",
        "unit": "Unit 4",
        "section": "4B",
        "title": "In your basket",
        "page": 33,
        "bookPage": 32,
        "grammar": "present perfect or past simple? (1)",
        "vocabulary": "shopping",
        "pronunciation": "c and ch",
        "type": "unit"
    },
    {
        "id": "u4c",
        "unit": "Unit 4",
        "section": "4C",
        "title": "#greatweekend",
        "page": 35,
        "bookPage": 34,
        "grammar": "something, anything, nothing, etc.",
        "vocabulary": "adjectives ending -ed and -ing",
        "pronunciation": "/e/, /əʊ/, and /ʌ/",
        "type": "unit"
    },
    {
        "id": "u4rc",
        "unit": "Unit 4",
        "section": "Revise 3&4",
        "title": "Revise and Check 3&4",
        "page": 37,
        "bookPage": 36,
        "type": "review"
    },
    {
        "id": "u5a",
        "unit": "Unit 5",
        "section": "5A",
        "title": "I want it NOW!",
        "page": 39,
        "bookPage": 38,
        "grammar": "comparative adjectives and adverbs, as...as",
        "vocabulary": "types of numbers",
        "pronunciation": "/ə/",
        "type": "unit"
    },
    {
        "id": "u5b",
        "unit": "Unit 5",
        "section": "5B",
        "title": "Twelve lost wallets",
        "page": 41,
        "bookPage": 40,
        "grammar": "superlatives (+ ever + present perfect)",
        "vocabulary": "describing a town or city",
        "pronunciation": "sentence stress",
        "type": "unit"
    },
    {
        "id": "u5c",
        "unit": "Unit 5",
        "section": "5C",
        "title": "How much is enough?",
        "page": 43,
        "bookPage": 42,
        "grammar": "quantifiers, too, (not) enough",
        "vocabulary": "health and the body",
        "pronunciation": "/ʌ/",
        "type": "unit"
    },
    {
        "id": "u5pe",
        "unit": "Unit 5",
        "section": "PE 3",
        "title": "Practical English Episode 3: Taking something back to a shop",
        "page": 45,
        "bookPage": 44,
        "type": "practical"
    },
    {
        "id": "u6a",
        "unit": "Unit 6",
        "section": "6A",
        "title": "Think positive - or negative?",
        "page": 47,
        "bookPage": 46,
        "grammar": "will / won't (predictions)",
        "vocabulary": "opposite verbs",
        "pronunciation": "'ll, won't",
        "type": "unit"
    },
    {
        "id": "u6b",
        "unit": "Unit 6",
        "section": "6B",
        "title": "I'll always love you",
        "page": 49,
        "bookPage": 48,
        "grammar": "will / won't / shall (other uses)",
        "vocabulary": "verb + back",
        "pronunciation": "word stress: two-syllable verbs",
        "type": "unit"
    },
    {
        "id": "u6c",
        "unit": "Unit 6",
        "section": "6C",
        "title": "The meaning of dreaming",
        "page": 51,
        "bookPage": 50,
        "grammar": "review of verb forms: present, past, and future",
        "vocabulary": "modifiers",
        "pronunciation": "the letters ea",
        "type": "unit"
    },
    {
        "id": "u6rc",
        "unit": "Unit 6",
        "section": "Revise 5&6",
        "title": "Revise and Check 5&6",
        "page": 53,
        "bookPage": 52,
        "type": "review"
    },
    {
        "id": "u7a",
        "unit": "Unit 7",
        "section": "7A",
        "title": "First day nerves",
        "page": 55,
        "bookPage": 54,
        "grammar": "uses of the infinitive with to",
        "vocabulary": "verbs + infinitive: try to, forget to",
        "pronunciation": "weak form of to, linking",
        "type": "unit"
    },
    {
        "id": "u7b",
        "unit": "Unit 7",
        "section": "7B",
        "title": "Happiness is...",
        "page": 57,
        "bookPage": 56,
        "grammar": "uses of the gerund (verb + -ing)",
        "vocabulary": "verbs + gerund",
        "pronunciation": "-ing, the letter o",
        "type": "unit"
    },
    {
        "id": "u7c",
        "unit": "Unit 7",
        "section": "7C",
        "title": "Could you pass the test?",
        "page": 59,
        "bookPage": 58,
        "grammar": "have to, don't have to, must, mustn't",
        "vocabulary": "adjectives + prepositions: afraid of",
        "pronunciation": "stress on prepositions",
        "type": "unit"
    },
    {
        "id": "u7pe",
        "unit": "Unit 7",
        "section": "PE 4",
        "title": "Practical English Episode 4: Going to a pharmacy",
        "page": 61,
        "bookPage": 60,
        "type": "practical"
    },
    {
        "id": "u8a",
        "unit": "Unit 8",
        "section": "8A",
        "title": "Should I stay or should I go?",
        "page": 63,
        "bookPage": 62,
        "grammar": "should",
        "vocabulary": "get",
        "pronunciation": "/ʊ/ and /uː/",
        "type": "unit"
    },
    {
        "id": "u8b",
        "unit": "Unit 8",
        "section": "8B",
        "title": "Murphy's Law",
        "page": 65,
        "bookPage": 64,
        "grammar": "if + present, + will + infinitive (first conditional)",
        "vocabulary": "confusing verbs",
        "pronunciation": "homophones",
        "type": "unit"
    },
    {
        "id": "u8c",
        "unit": "Unit 8",
        "section": "8C",
        "title": "Who is Vivienne?",
        "page": 67,
        "bookPage": 66,
        "grammar": "possessive pronouns",
        "vocabulary": "adverbs of manner",
        "pronunciation": "reading aloud",
        "type": "unit"
    },
    {
        "id": "u8rc",
        "unit": "Unit 8",
        "section": "Revise 7&8",
        "title": "Revise and Check 7&8",
        "page": 69,
        "bookPage": 68,
        "type": "review"
    },
    {
        "id": "u9a",
        "unit": "Unit 9",
        "section": "9A",
        "title": "Beware of the dog",
        "page": 71,
        "bookPage": 70,
        "grammar": "if + past, would + infinitive (second conditional)",
        "vocabulary": "animals and insects",
        "pronunciation": "word stress",
        "type": "unit"
    },
    {
        "id": "u9b",
        "unit": "Unit 9",
        "section": "9B",
        "title": "Fearof.net",
        "page": 73,
        "bookPage": 72,
        "grammar": "present perfect + for and since",
        "vocabulary": "words related to fear",
        "pronunciation": "sentence stress",
        "type": "unit"
    },
    {
        "id": "u9c",
        "unit": "Unit 9",
        "section": "9C",
        "title": "Scream queens",
        "page": 75,
        "bookPage": 74,
        "grammar": "present perfect or past simple? (2)",
        "vocabulary": "biographies",
        "pronunciation": "word stress, /ɔː/",
        "type": "unit"
    },
    {
        "id": "u9pe",
        "unit": "Unit 9",
        "section": "PE 5",
        "title": "Practical English Episode 5: Asking how to get there",
        "page": 77,
        "bookPage": 76,
        "type": "practical"
    },
    {
        "id": "u10a",
        "unit": "Unit 10",
        "section": "10A",
        "title": "Into the net",
        "page": 79,
        "bookPage": 78,
        "grammar": "expressing movement",
        "vocabulary": "sports, expressing movement",
        "pronunciation": "word stress",
        "type": "unit"
    },
    {
        "id": "u10b",
        "unit": "Unit 10",
        "section": "10B",
        "title": "Early birds",
        "page": 81,
        "bookPage": 80,
        "grammar": "word order of phrasal verbs",
        "vocabulary": "phrasal verbs",
        "pronunciation": "linking",
        "type": "unit"
    },
    {
        "id": "u10c",
        "unit": "Unit 10",
        "section": "10C",
        "title": "International inventions",
        "page": 83,
        "bookPage": 82,
        "grammar": "the passive",
        "vocabulary": "people from different countries",
        "pronunciation": "/ʃ/, /tʃ/, and /dʒ/",
        "type": "unit"
    },
    {
        "id": "u10rc",
        "unit": "Unit 10",
        "section": "Revise 9&10",
        "title": "Revise and Check 9&10",
        "page": 85,
        "bookPage": 84,
        "type": "review"
    },
    {
        "id": "u11a",
        "unit": "Unit 11",
        "section": "11A",
        "title": "Ask the teacher",
        "page": 87,
        "bookPage": 86,
        "grammar": "used to",
        "vocabulary": "school subjects",
        "pronunciation": "used to / didn't use to",
        "type": "unit"
    },
    {
        "id": "u11b",
        "unit": "Unit 11",
        "section": "11B",
        "title": "Help! I can't decide!",
        "page": 89,
        "bookPage": 88,
        "grammar": "might",
        "vocabulary": "word building: noun formation",
        "pronunciation": "diphthongs",
        "type": "unit"
    },
    {
        "id": "u11c",
        "unit": "Unit 11",
        "section": "11C",
        "title": "Twinstrangers.net",
        "page": 91,
        "bookPage": 90,
        "grammar": "so, neither + auxiliaries",
        "vocabulary": "similarities and differences",
        "pronunciation": "/ð/ and /θ/",
        "type": "unit"
    },
    {
        "id": "u11pe",
        "unit": "Unit 11",
        "section": "PE 6",
        "title": "Practical English Episode 6: On the phone",
        "page": 93,
        "bookPage": 92,
        "type": "practical"
    },
    {
        "id": "u12a",
        "unit": "Unit 12",
        "section": "12A",
        "title": "Unbelievable!",
        "page": 95,
        "bookPage": 94,
        "grammar": "past perfect",
        "vocabulary": "time expressions",
        "pronunciation": "the letter i",
        "type": "unit"
    },
    {
        "id": "u12b",
        "unit": "Unit 12",
        "section": "12B",
        "title": "Think before you speak",
        "page": 97,
        "bookPage": 96,
        "grammar": "reported speech",
        "vocabulary": "say or tell?",
        "pronunciation": "double consonants",
        "type": "unit"
    },
    {
        "id": "u12c",
        "unit": "Unit 12",
        "section": "12C",
        "title": "The English File quiz",
        "page": 99,
        "bookPage": 98,
        "grammar": "questions without auxiliaries",
        "vocabulary": "revision of question words",
        "pronunciation": "question words",
        "type": "unit"
    },
    {
        "id": "u12rc",
        "unit": "Unit 12",
        "section": "Revise 11&12",
        "title": "Revise and Check 11&12",
        "page": 101,
        "bookPage": 100,
        "type": "review"
    },
    {
        "id": "ref_comm",
        "section": "Bank",
        "title": "Communication",
        "page": 103,
        "bookPage": 102,
        "type": "bank"
    },
    {
        "id": "ref_writing",
        "section": "Bank",
        "title": "Writing",
        "page": 114,
        "bookPage": 113,
        "type": "bank"
    },
    {
        "id": "ref_listening",
        "section": "Bank",
        "title": "Listening Scripts",
        "page": 121,
        "bookPage": 120,
        "type": "bank"
    },
    {
        "id": "ref_grammar",
        "section": "Bank",
        "title": "Grammar Bank",
        "page": 127,
        "bookPage": 126,
        "type": "bank"
    },
    {
        "id": "ref_vocab",
        "section": "Bank",
        "title": "Vocabulary Bank",
        "page": 151,
        "bookPage": 150,
        "type": "bank"
    },
    {
        "id": "ref_irregular",
        "section": "Bank",
        "title": "Irregular Verbs",
        "page": 165,
        "bookPage": 164,
        "type": "bank"
    },
    {
        "id": "ref_appendix",
        "section": "Bank",
        "title": "Appendix",
        "page": 166,
        "bookPage": 165,
        "type": "bank"
    },
    {
        "id": "ref_sounds",
        "section": "Bank",
        "title": "Sound Bank",
        "page": 167,
        "bookPage": 166,
        "type": "bank"
    }
]


def search_textbook(query_str):
    """Global textbook search across page titles, grammar/vocab topics, exercises, vocabulary, notes, and bookmarks."""
    q = query_str.strip().lower()
    if not q:
        return []
    results = []

    # 1. Search Table of Contents / Units
    for item in TABLE_OF_CONTENTS:
        match_reasons = []
        if q in item.get("title", "").lower():
            match_reasons.append("Title")
        if q in item.get("grammar", "").lower():
            match_reasons.append("Grammar")
        if q in item.get("vocabulary", "").lower():
            match_reasons.append("Vocabulary")
        if q in item.get("pronunciation", "").lower():
            match_reasons.append("Pronunciation")
        if match_reasons:
            results.append({
                "type": "unit",
                "category": "Course Unit",
                "pageNum": item["page"],
                "bookPage": item.get("bookPage", max(1, item["page"] - 1)),
                "title": f"{item.get('section', item.get('unit', ''))} {item['title']}",
                "snippet": f"Matched in {', '.join(match_reasons)}: {item.get('grammar', '') or item.get('vocabulary', '') or item.get('title', '')}"
            })

    # 2. Search Database Overlays & Exercises
    try:
        conn = database.get_db_connection()
        overlays = conn.execute(
            "SELECT * FROM page_overlays WHERE label LIKE ? OR hint LIKE ? OR explanation LIKE ? OR unit_ref LIKE ? LIMIT 20",
            (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%")
        ).fetchall()
        for ov in overlays:
            results.append({
                "type": "exercise",
                "category": "Exercise",
                "pageNum": ov["page_num"],
                "bookPage": max(1, ov["page_num"] - 1),
                "title": f"Page {ov['page_num']} — {ov['label']} ({ov['unit_ref'] or 'Exercise'})",
                "snippet": f"{ov['explanation'] or ov['hint'] or ov['label']}"
            })

        # 3. Search Vocabulary Bank
        vocab_items = conn.execute(
            "SELECT * FROM vocabulary WHERE word LIKE ? OR definition LIKE ? OR example LIKE ? LIMIT 15",
            (f"%{q}%", f"%{q}%", f"%{q}%")
        ).fetchall()
        for v in vocab_items:
            p_num = v["page_num"] or 151
            results.append({
                "type": "vocab",
                "category": "Vocabulary",
                "pageNum": p_num,
                "bookPage": max(1, p_num - 1),
                "title": f"{v['word']} ({v['pos'] or 'word'})",
                "snippet": f"{v['definition']} — \"{v['example']}\""
            })

        # 4. Search Personal Notes
        notes = conn.execute(
            "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? LIMIT 10",
            (f"%{q}%", f"%{q}%")
        ).fetchall()
        for n in notes:
            results.append({
                "type": "note",
                "category": "Study Note",
                "pageNum": n["page_num"],
                "bookPage": max(1, n["page_num"] - 1),
                "title": f"📝 {n['title']}",
                "snippet": n["content"][:120]
            })

        # 5. Search Bookmarks
        bookmarks = conn.execute(
            "SELECT * FROM bookmarks WHERE title LIKE ? OR tags LIKE ? LIMIT 10",
            (f"%{q}%", f"%{q}%")
        ).fetchall()
        for b in bookmarks:
            results.append({
                "type": "bookmark",
                "category": "Bookmark",
                "pageNum": b["page_num"],
                "bookPage": max(1, b["page_num"] - 1),
                "title": f"🔖 {b['title']}",
                "snippet": f"Bookmarked page {b['page_num']}"
            })
        conn.close()
    except Exception as e:
        print("Search error:", e)

    return results[:40]

class DigitalTextbookHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers where appropriate
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def parse_body(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len > 0:
            post_body = self.rfile.read(content_len)
            self._cached_body = post_body
            try:
                return json.loads(post_body.decode('utf-8'))
            except Exception:
                return {}
        self._cached_body = b""
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API: Book Info & TOC
        # Content APIs & Global Search
        if path == "/api/content/textbook":
            p = os.path.join(BASE_DIR, "data", "textbook.json")
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    return self.send_json(json.load(f))
            return self.send_json({"totalPages": 169})

        if path == "/api/content/units":
            p = os.path.join(BASE_DIR, "data", "units.json")
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    return self.send_json(json.load(f))
            return self.send_json({"units": []})

        if path == "/api/content/toc":
            return self.send_json(TABLE_OF_CONTENTS)

        if path.startswith("/api/content/pages/"):
            try:
                p_num = int(path.split("/")[-1])
                p = os.path.join(BASE_DIR, "data", "pages.json")
                if os.path.exists(p):
                    with open(p, "r", encoding="utf-8") as f:
                        pages_list = json.load(f)
                    match = next((pg for pg in pages_list if pg["pdfPage"] == p_num), None)
                    if match:
                        return self.send_json(match)
                return self.send_json({"pdfPage": p_num, "bookPage": max(1, p_num - 1)})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        if path == "/api/search":
            q = query.get("q", [""])[0]
            results = search_textbook(q)
            return self.send_json({"query": q, "count": len(results), "results": results})

        if path == "/api/mistakes":
            try:
                conn = database.get_db_connection()
                rows = conn.execute("SELECT * FROM study_mistakes WHERE resolved = 0 ORDER BY updated_at DESC LIMIT 50").fetchall()
                conn.close()
                return self.send_json([dict(r) for r in rows])
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        if path == "/api/book-info":
            return self.send_json({
                "title": "English File 4th edition Pre-Intermediate Student's Book",
                "totalPages": 169,
                "firstPage": 1,
                "toc": TABLE_OF_CONTENTS
            })

        # 2. API: Page Images & Thumbnails
        if path.startswith("/api/pages/"):
            try:
                page_num = int(path.split("/")[-1])
                img_path = os.path.join(PAGES_DIR, f"page_{page_num}.jpg")
                if os.path.exists(img_path):
                    with open(img_path, "rb") as f:
                        data = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Content-Length", str(len(data)))
                    self.send_header("Cache-Control", "public, max-age=86400")
                    self.end_headers()
                    self.wfile.write(data)
                    return
                else:
                    self.send_error(404, "Page image not found")
                    return
            except ValueError:
                self.send_error(400, "Invalid page number")
                return

        if path.startswith("/api/thumbnails/"):
            try:
                page_num = int(path.split("/")[-1])
                img_path = os.path.join(THUMBS_DIR, f"thumb_{page_num}.jpg")
                if os.path.exists(img_path):
                    with open(img_path, "rb") as f:
                        data = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Content-Length", str(len(data)))
                    self.send_header("Cache-Control", "public, max-age=86400")
                    self.end_headers()
                    self.wfile.write(data)
                    return
                else:
                    self.send_error(404, "Thumbnail not found")
                    return
            except ValueError:
                self.send_error(400, "Invalid page number")
                return

        # 3. API: Annotations for Page
        if path.startswith("/api/annotations/"):
            try:
                page_num = int(path.split("/")[-1])
                conn = database.get_db_connection()
                row = conn.execute("SELECT * FROM annotations WHERE page_num = ?", (page_num,)).fetchone()
                conn.close()
                if row:
                    return self.send_json({
                        "page_num": page_num,
                        "strokes": json.loads(row["strokes"] or "[]"),
                        "text_boxes": json.loads(row["text_boxes"] or "[]"),
                        "sticky_notes": json.loads(row["sticky_notes"] or "[]"),
                        "updated_at": row["updated_at"]
                    })
                else:
                    return self.send_json({
                        "page_num": page_num,
                        "strokes": [],
                        "text_boxes": [],
                        "sticky_notes": [],
                        "updated_at": None
                    })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 4. API: Overlays (Interactive Exercise Fields) for Page
        if path.startswith("/api/overlays/"):
            try:
                page_num = int(path.split("/")[-1])
                conn = database.get_db_connection()
                rows = conn.execute("SELECT * FROM page_overlays WHERE page_num = ? ORDER BY id ASC", (page_num,)).fetchall()
                # Also get user saved answers if any
                ans_row = conn.execute("SELECT answers, score FROM user_page_answers WHERE page_num = ?", (page_num,)).fetchone()
                conn.close()
                
                overlays = []
                for r in rows:
                    ov_dict = {
                        "id": r["id"],
                        "page_num": r["page_num"],
                        "field_type": r["field_type"],
                        "x": r["x"],
                        "y": r["y"],
                        "width": r["width"],
                        "height": r["height"],
                        "placeholder": r["placeholder"],
                        "label": r["label"],
                        "correct_answers": json.loads(r["correct_answers"] or "[]"),
                        "hint": r["hint"],
                        "explanation": r["explanation"],
                        "unit_ref": r["unit_ref"],
                        "options": json.loads(r["options"] or "[]") if ("options" in r.keys() and r["options"]) else [],
                        "grading_type": r["grading_type"] if "grading_type" in r.keys() else "exact",
                        "sample_answer": r["sample_answer"] if "sample_answer" in r.keys() else "",
                        "audio_track": r["audio_track"] if "audio_track" in r.keys() else "",
                        "is_default": r["is_default"] if "is_default" in r.keys() else 1
                    }
                    overlays.append(ov_dict)
                
                user_answers = {}
                score = 0
                if ans_row and ans_row["answers"]:
                    user_answers = json.loads(ans_row["answers"])
                    score = ans_row["score"]

                return self.send_json({
                    "page_num": page_num,
                    "overlays": overlays,
                    "user_answers": user_answers,
                    "score": score
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 5. API: Vocabulary List
        if path == "/api/vocabulary":
            try:
                category = query.get("category", [None])[0]
                search = query.get("search", [None])[0]
                conn = database.get_db_connection()
                sql = "SELECT * FROM vocabulary WHERE 1=1"
                params = []
                if category:
                    sql += " AND category = ?"
                    params.append(category)
                if search:
                    sql += " AND (word LIKE ? OR definition LIKE ?)"
                    params.extend([f"%{search}%", f"%{search}%"])
                sql += " ORDER BY word ASC"
                rows = conn.execute(sql, params).fetchall()
                conn.close()
                vocab = [dict(r) for r in rows]
                return self.send_json(vocab)
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 6. API: Notes & Bookmarks
        if path == "/api/notes":
            try:
                conn = database.get_db_connection()
                rows = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
                conn.close()
                return self.send_json([dict(r) for r in rows])
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        if path == "/api/bookmarks":
            try:
                conn = database.get_db_connection()
                rows = conn.execute("SELECT * FROM bookmarks ORDER BY page_num ASC").fetchall()
                conn.close()
                return self.send_json([dict(r) for r in rows])
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 7. API: Overall Progress
        if path == "/api/progress":
            try:
                conn = database.get_db_connection()
                total_words = conn.execute("SELECT COUNT(*) as c FROM vocabulary").fetchone()["c"]
                learned_words = conn.execute("SELECT COUNT(*) as c FROM vocabulary WHERE learned = 1").fetchone()["c"]
                total_notes = conn.execute("SELECT COUNT(*) as c FROM notes").fetchone()["c"]
                total_bookmarks = conn.execute("SELECT COUNT(*) as c FROM bookmarks").fetchone()["c"]
                annotated_pages = conn.execute("SELECT COUNT(*) as c FROM annotations WHERE (strokes != '[]' OR text_boxes != '[]' OR sticky_notes != '[]')").fetchone()["c"]
                completed_exercises = conn.execute("SELECT COUNT(*) as c FROM user_page_answers WHERE completed = 1").fetchone()["c"]
                
                # Advanced learning metrics
                visited_row = conn.execute("SELECT COUNT(DISTINCT page_num) as c, SUM(time_spent_sec) as total_time FROM study_progress").fetchone()
                visited_pages = visited_row["c"] or 0
                total_time_spent = visited_row["total_time"] or 0
                
                # Exercise performance
                ans_stats = conn.execute("SELECT SUM(total_questions) as total_q, AVG(score) as avg_score FROM user_page_answers WHERE total_questions > 0").fetchone()
                total_questions_attempted = ans_stats["total_q"] or 0
                avg_accuracy = round(ans_stats["avg_score"] or 0, 1)
                
                # Unresolved mistakes
                unresolved_mistakes = conn.execute("SELECT COUNT(*) as c FROM study_mistakes WHERE resolved = 0").fetchone()["c"]
                
                # Last visited page
                last_p = conn.execute("SELECT page_num FROM study_progress ORDER BY last_visited DESC LIMIT 1").fetchone()
                last_studied_page = last_p["page_num"] if last_p else 7

                recent_progress = conn.execute("SELECT page_num, completed, time_spent_sec, last_visited FROM study_progress ORDER BY last_visited DESC LIMIT 10").fetchall()
                conn.close()

                return self.send_json({
                    "vocabulary": {"total": total_words, "learned": learned_words},
                    "notesCount": total_notes,
                    "bookmarksCount": total_bookmarks,
                    "annotatedPages": annotated_pages,
                    "completedExercises": completed_exercises,
                    "totalPages": 169,
                    "visitedPages": visited_pages,
                    "bookCompletion": round((visited_pages / 169) * 100, 1),
                    "totalQuestionsAttempted": total_questions_attempted,
                    "accuracy": avg_accuracy,
                    "unresolvedMistakes": unresolved_mistakes,
                    "lastStudiedPage": last_studied_page,
                    "timeSpentSec": total_time_spent,
                    "recent": [dict(r) for r in recent_progress]
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 8. API: Export all user data as JSON
        if path == "/api/export":
            try:
                conn = database.get_db_connection()
                annotations = [dict(r) for r in conn.execute("SELECT * FROM annotations").fetchall()]
                answers = [dict(r) for r in conn.execute("SELECT * FROM user_page_answers").fetchall()]
                vocab = [dict(r) for r in conn.execute("SELECT * FROM vocabulary").fetchall()]
                notes = [dict(r) for r in conn.execute("SELECT * FROM notes").fetchall()]
                bookmarks = [dict(r) for r in conn.execute("SELECT * FROM bookmarks").fetchall()]
                custom_overlays = [dict(r) for r in conn.execute("SELECT * FROM page_overlays WHERE (is_default = 0 OR is_default IS NULL)").fetchall()]
                progress = [dict(r) for r in conn.execute("SELECT * FROM study_progress").fetchall()]
                mistakes = [dict(r) for r in conn.execute("SELECT * FROM study_mistakes").fetchall()]
                recordings = []
                if conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_recordings'").fetchone():
                    recordings = [dict(r) for r in conn.execute("SELECT id, page_num, exercise_id, title, duration_sec, created_at FROM user_recordings").fetchall()]
                conn.close()

                export_data = {
                    "version": "2.0",
                    "exported_at": datetime.datetime.now().isoformat(),
                    "textbook": "English File 4th edition Pre-Intermediate Student's Book",
                    "annotations": annotations,
                    "answers": answers,
                    "vocabulary": vocab,
                    "notes": notes,
                    "bookmarks": bookmarks,
                    "custom_overlays": custom_overlays,
                    "study_progress": progress,
                    "study_mistakes": mistakes,
                    "recordings": recordings
                }
                return self.send_json(export_data)
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 8b. API: Get User Recordings for Page
        if path.startswith("/api/recordings/"):
            try:
                page_num = int(path.split("/")[-1])
                conn = database.get_db_connection()
                if conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_recordings'").fetchone():
                    rows = conn.execute("SELECT id, page_num, exercise_id, title, audio_data, duration_sec, created_at FROM user_recordings WHERE page_num = ? ORDER BY created_at DESC", (page_num,)).fetchall()
                    conn.close()
                    return self.send_json([dict(r) for r in rows])
                conn.close()
                return self.send_json([])
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 9. API: Audio Status
        if path == "/api/audio/status":
            try:
                tracks = {}
                if os.path.exists(AUDIO_DIR):
                    for fn in os.listdir(AUDIO_DIR):
                        if fn.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg')):
                            t_id, _ = normalize_audio_filename(fn)
                            fpath = os.path.join(AUDIO_DIR, fn)
                            is_canonical = (fn.lower() == f"{t_id.lower()}.mp3")
                            if t_id not in tracks or is_canonical:
                                tracks[t_id] = {
                                    "track_id": t_id,
                                    "filename": fn,
                                    "size": os.path.getsize(fpath),
                                    "url": f"/audio/{fn}"
                                }
                # Also expose aliases (e.g. 2.1 -> 1.31, 2.10 -> 1.45)
                for alias_id, target_id in AUDIO_ALIASES.items():
                    if target_id in tracks and alias_id not in tracks:
                        tracks[alias_id] = {
                            "track_id": alias_id,
                            "filename": tracks[target_id]["filename"],
                            "size": tracks[target_id]["size"],
                            "url": f"/audio/{alias_id}.mp3"
                        }
                return self.send_json({
                    "status": "success",
                    "tracks": tracks,
                    "uploaded_count": len(tracks),
                    "known_tracks": KNOWN_AUDIO_TRACKS,
                    "missing_tracks": [t for t in KNOWN_AUDIO_TRACKS if t not in tracks]
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 10. Stream /audio/ files with HTTP 206 Partial Content (Range requests)
        if path.startswith("/audio/"):
            try:
                fn = os.path.basename(urllib.parse.unquote(path[len("/audio/"):]))
                fpath = os.path.join(AUDIO_DIR, fn)
                if not os.path.exists(fpath) or not os.path.isfile(fpath):
                    # Check if any file in AUDIO_DIR maps to this track id (or alias)
                    req_tid, _ = normalize_audio_filename(fn)
                    req_tid = AUDIO_ALIASES.get(req_tid, req_tid)
                    matched_fn = None
                    if os.path.exists(AUDIO_DIR):
                        for existing_fn in os.listdir(AUDIO_DIR):
                            cand_id, _ = normalize_audio_filename(existing_fn)
                            if cand_id == req_tid:
                                matched_fn = existing_fn
                                break
                    if matched_fn:
                        fn = matched_fn
                        fpath = os.path.join(AUDIO_DIR, fn)
                    else:
                        self.send_error(404, "Audio track not found")
                        return

                total_size = os.path.getsize(fpath)
                mime_type = mimetypes.guess_type(fpath)[0] or 'audio/mpeg'
                range_header = self.headers.get('Range')

                if range_header:
                    m = re.match(r'bytes=(\d+)-(\d*)', range_header)
                    if m:
                        start = int(m.group(1))
                        if start >= total_size or start < 0:
                            self.send_response(416)
                            self.send_header('Content-Range', f'bytes */{total_size}')
                            self.end_headers()
                            return
                        end = int(m.group(2)) if m.group(2) else total_size - 1
                        end = min(end, total_size - 1)
                        if end < start:
                            end = start
                        length = end - start + 1

                        self.send_response(206)
                        self.send_header('Content-Type', mime_type)
                        self.send_header('Content-Range', f'bytes {start}-{end}/{total_size}')
                        self.send_header('Content-Length', str(length))
                        self.send_header('Accept-Ranges', 'bytes')
                        self.end_headers()

                        with open(fpath, 'rb') as f:
                            f.seek(start)
                            self.wfile.write(f.read(length))
                        return

                self.send_response(200)
                self.send_header('Content-Type', mime_type)
                self.send_header('Content-Length', str(total_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()
                with open(fpath, 'rb') as f:
                    self.wfile.write(f.read())
                return
            except Exception as e:
                self.send_error(500, str(e))
                return

        # Default static file serving from public/
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()

        # Mistakes resolve
        if path.startswith("/api/mistakes/") and path.endswith("/resolve"):
            try:
                m_id = int(path.split("/")[3])
                conn = database.get_db_connection()
                conn.execute("UPDATE study_mistakes SET resolved = 1 WHERE id = ?", (m_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "id": m_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # Reset study progress
        if path == "/api/reset-progress":
            try:
                conn = database.get_db_connection()
                conn.execute("DELETE FROM user_page_answers")
                conn.execute("DELETE FROM study_progress")
                conn.execute("DELETE FROM study_mistakes")
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "message": "Study progress reset successfully."})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 1. API: Save Annotations for Page
        if path.startswith("/api/annotations/"):
            try:
                page_num = int(path.split("/")[-1])
                strokes = json.dumps(body.get("strokes", []))
                text_boxes = json.dumps(body.get("text_boxes", []))
                sticky_notes = json.dumps(body.get("sticky_notes", []))
                now = datetime.datetime.now().isoformat()

                conn = database.get_db_connection()
                conn.execute("""
                INSERT INTO annotations (page_num, strokes, text_boxes, sticky_notes, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    strokes = excluded.strokes,
                    text_boxes = excluded.text_boxes,
                    sticky_notes = excluded.sticky_notes,
                    updated_at = excluded.updated_at
                """, (page_num, strokes, text_boxes, sticky_notes, now))
                conn.commit()
                conn.close()

                return self.send_json({"status": "success", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 2. API: Check & Save Answers for Page
        if path.startswith("/api/check-answers/"):
            try:
                page_num = int(path.split("/")[-1])
                user_answers = body.get("answers", {})  # { overlay_id_str: user_text }
                
                conn = database.get_db_connection()
                overlays = conn.execute("SELECT * FROM page_overlays WHERE page_num = ?", (page_num,)).fetchall()
                
                results = {}
                correct_count = 0
                total_gradable = 0

                for ov in overlays:
                    ov_id = str(ov["id"])
                    correct_list = json.loads(ov["correct_answers"] or "[]")
                    u_raw = user_answers.get(ov_id, "")
                    u_val = str(u_raw).strip()
                    
                    # Handle self-check / open-ended
                    grading = ov["grading_type"] if "grading_type" in ov.keys() else "exact"
                    f_type = ov["field_type"] or "text"

                    if correct_list and grading != "self-check" and f_type != "self_check":
                        total_gradable += 1
                        is_correct = is_answer_matching(u_val, correct_list)
                        if is_correct:
                            correct_count += 1
                            # Mark resolved in study_mistakes
                            conn.execute("UPDATE study_mistakes SET resolved = 1 WHERE page_num = ? AND overlay_id = ?", (page_num, int(ov["id"])))
                        else:
                            # Record mistake
                            now_m = datetime.datetime.now().isoformat()
                            corr_str = correct_list[0] if correct_list else ""
                            conn.execute("""
                            INSERT INTO study_mistakes (page_num, overlay_id, label, student_answer, correct_answer, explanation, hint, unit_ref, resolved, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                            """, (page_num, int(ov["id"]), ov["label"], u_val, corr_str, ov["explanation"], ov["hint"], ov["unit_ref"], now_m))

                        results[ov_id] = {
                            "is_correct": is_correct,
                            "user_answer": user_answers.get(ov_id, ""),
                            "correct_answers": correct_list,
                            "hint": ov["hint"],
                            "explanation": ov["explanation"]
                        }
                    else:
                        # Self-check / Open-ended
                        results[ov_id] = {
                            "is_correct": True,
                            "user_answer": user_answers.get(ov_id, ""),
                            "open_ended": True,
                            "self_check": True,
                            "sample_answer": ov["sample_answer"] if "sample_answer" in ov.keys() else "",
                            "hint": ov["hint"],
                            "explanation": ov["explanation"]
                        }

                score_pct = round((correct_count / total_gradable * 100) if total_gradable > 0 else 100, 1)
                
                # Save user answers to DB
                now = datetime.datetime.now().isoformat()
                conn.execute("""
                INSERT INTO user_page_answers (page_num, answers, score, total_questions, completed, updated_at)
                VALUES (?, ?, ?, ?, 1, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    answers = excluded.answers,
                    score = excluded.score,
                    total_questions = excluded.total_questions,
                    completed = excluded.completed,
                    updated_at = excluded.updated_at
                """, (page_num, json.dumps(user_answers), score_pct, total_gradable, now))
                conn.commit()
                conn.close()

                return self.send_json({
                    "page_num": page_num,
                    "score": score_pct,
                    "correct": correct_count,
                    "total": total_gradable,
                    "results": results
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 3. API: Save Answers directly without full check
        if path.startswith("/api/answers/"):
            try:
                page_num = int(path.split("/")[-1])
                user_answers = body.get("answers", {})
                now = datetime.datetime.now().isoformat()
                conn = database.get_db_connection()
                conn.execute("""
                INSERT INTO user_page_answers (page_num, answers, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    answers = excluded.answers,
                    updated_at = excluded.updated_at
                """, (page_num, json.dumps(user_answers), now))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 4. API: Create Custom Overlay Field (Add Blank tool)
        if path == "/api/overlays":
            try:
                page_num = int(body.get("page_num"))
                field_type = body.get("field_type", "text")
                x = float(body.get("x", 10.0))
                y = float(body.get("y", 10.0))
                width = float(body.get("width", 15.0))
                height = float(body.get("height", 2.0))
                placeholder = body.get("placeholder", "Answer...")
                label = body.get("label", "Custom Blank")
                correct_answers = json.dumps(body.get("correct_answers", []))
                hint = body.get("hint", "")
                explanation = body.get("explanation", "")
                unit_ref = body.get("unit_ref", "User Created")
                options = json.dumps(body.get("options", []))
                grading_type = body.get("grading_type", "exact")
                sample_answer = body.get("sample_answer", "")
                audio_track = body.get("audio_track", "")

                conn = database.get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO page_overlays (page_num, field_type, x, y, width, height, placeholder, label, correct_answers, hint, explanation, unit_ref, options, grading_type, sample_answer, audio_track, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """, (page_num, field_type, x, y, width, height, placeholder, label, correct_answers, hint, explanation, unit_ref, options, grading_type, sample_answer, audio_track))
                new_id = cur.lastrowid
                conn.commit()
                conn.close()

                return self.send_json({"status": "success", "id": new_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 4b. API: Update Existing Overlay Field (Calibration & editing)
        if path.startswith("/api/overlays/") and not path.endswith("/calibrate"):
            try:
                ov_id = int(path.split("/")[-1])
                conn = database.get_db_connection()
                cur = conn.cursor()
                existing = cur.execute("SELECT * FROM page_overlays WHERE id = ?", (ov_id,)).fetchone()
                if not existing:
                    conn.close()
                    return self.send_json({"error": "Overlay not found"}, 404)

                x = float(body.get("x", existing["x"]))
                y = float(body.get("y", existing["y"]))
                width = float(body.get("width", existing["width"]))
                height = float(body.get("height", existing["height"]))
                label = body.get("label", existing["label"])
                placeholder = body.get("placeholder", existing["placeholder"])
                hint = body.get("hint", existing["hint"])
                explanation = body.get("explanation", existing["explanation"])
                unit_ref = body.get("unit_ref", existing["unit_ref"])
                field_type = body.get("field_type", existing["field_type"] if "field_type" in existing.keys() else "text")
                grading_type = body.get("grading_type", existing["grading_type"] if "grading_type" in existing.keys() else "exact")
                sample_answer = body.get("sample_answer", existing["sample_answer"] if "sample_answer" in existing.keys() else "")
                audio_track = body.get("audio_track", existing["audio_track"] if "audio_track" in existing.keys() else "")

                if "correct_answers" in body:
                    correct_answers = json.dumps(body.get("correct_answers", []))
                else:
                    correct_answers = existing["correct_answers"]

                if "options" in body:
                    options = json.dumps(body.get("options", []))
                else:
                    options = existing["options"] if "options" in existing.keys() else "[]"

                cur.execute("""
                UPDATE page_overlays
                SET x = ?, y = ?, width = ?, height = ?, label = ?, placeholder = ?, hint = ?,
                    explanation = ?, unit_ref = ?, field_type = ?, correct_answers = ?,
                    options = ?, grading_type = ?, sample_answer = ?, audio_track = ?
                WHERE id = ?
                """, (x, y, width, height, label, placeholder, hint, explanation, unit_ref, field_type, correct_answers, options, grading_type, sample_answer, audio_track, ov_id))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "id": ov_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 5. API: Vocabulary Management
        if path == "/api/vocabulary":
            try:
                word = body.get("word", "").strip()
                if not word:
                    return self.send_json({"error": "Word is required"}, 400)
                pos = body.get("pos", "")
                definition = body.get("definition", "")
                example = body.get("example", "")
                phonetic = body.get("phonetic", "")
                page_num = body.get("page_num", None)
                category = body.get("category", "My Words")

                conn = database.get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO vocabulary (word, pos, definition, example, phonetic, page_num, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(word) DO UPDATE SET
                    pos = excluded.pos,
                    definition = excluded.definition,
                    example = excluded.example,
                    phonetic = excluded.phonetic,
                    page_num = excluded.page_num,
                    category = excluded.category
                """, (word, pos, definition, example, phonetic, page_num, category))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "word": word})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 6. API: Toggle Vocabulary Learned status
        if path.startswith("/api/vocabulary/") and path.endswith("/toggle"):
            try:
                v_id = int(path.split("/")[3])
                conn = database.get_db_connection()
                cur = conn.cursor()
                cur.execute("UPDATE vocabulary SET learned = CASE WHEN learned = 1 THEN 0 ELSE 1 END WHERE id = ?", (v_id,))
                conn.commit()
                row = cur.execute("SELECT learned FROM vocabulary WHERE id = ?", (v_id,)).fetchone()
                conn.close()
                return self.send_json({"status": "success", "id": v_id, "learned": row["learned"]})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 7. API: Study Notes
        if path == "/api/notes":
            try:
                page_num = int(body.get("page_num", 1))
                title = body.get("title", f"Note on Page {page_num}")
                content = body.get("content", "").strip()
                now = datetime.datetime.now().isoformat()

                conn = database.get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO notes (page_num, title, content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """, (page_num, title, content, now, now))
                note_id = cur.lastrowid
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "id": note_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 8. API: Bookmarks
        if path == "/api/bookmarks":
            try:
                page_num = int(body.get("page_num", 1))
                title = body.get("title", f"Page {page_num}")
                tags = body.get("tags", "")

                conn = database.get_db_connection()
                conn.execute("""
                INSERT INTO bookmarks (page_num, title, tags)
                VALUES (?, ?, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    title = excluded.title,
                    tags = excluded.tags
                """, (page_num, title, tags))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 9. API: Record Page Visit / Progress
        if path.startswith("/api/progress/"):
            try:
                page_num = int(path.split("/")[-1])
                time_spent = int(body.get("time_spent_sec", 0))
                now = datetime.datetime.now().isoformat()

                conn = database.get_db_connection()
                conn.execute("""
                INSERT INTO study_progress (page_num, time_spent_sec, last_visited)
                VALUES (?, ?, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    time_spent_sec = time_spent_sec + excluded.time_spent_sec,
                    last_visited = excluded.last_visited
                """, (page_num, time_spent, now))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 10. API: Import user data
        if path == "/api/import":
            try:
                data = body
                if not isinstance(data, dict):
                    return self.send_json({"error": "Invalid backup payload format"}, 400)

                conn = database.get_db_connection()
                counts = {"annotations": 0, "answers": 0, "notes": 0, "bookmarks": 0, "vocabulary": 0, "overlays": 0, "progress": 0, "mistakes": 0, "recordings": 0}

                # 1. Restore annotations
                for a in data.get("annotations", []):
                    conn.execute("""
                    INSERT INTO annotations (page_num, strokes, text_boxes, sticky_notes, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(page_num) DO UPDATE SET
                        strokes = excluded.strokes,
                        text_boxes = excluded.text_boxes,
                        sticky_notes = excluded.sticky_notes,
                        updated_at = excluded.updated_at
                    """, (a["page_num"], a.get("strokes", "[]"), a.get("text_boxes", "[]"), a.get("sticky_notes", "[]"), a.get("updated_at")))
                    counts["annotations"] += 1

                # 2. Restore user answers
                for ans in data.get("answers", []):
                    conn.execute("""
                    INSERT INTO user_page_answers (page_num, answers, score, total_questions, completed, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(page_num) DO UPDATE SET
                        answers = excluded.answers,
                        score = excluded.score,
                        total_questions = excluded.total_questions,
                        completed = excluded.completed,
                        updated_at = excluded.updated_at
                    """, (ans["page_num"], ans.get("answers", "{}"), ans.get("score", 0), ans.get("total_questions", 0), ans.get("completed", 1), ans.get("updated_at")))
                    counts["answers"] += 1

                # 3. Restore vocabulary
                for v in data.get("vocabulary", []):
                    conn.execute("""
                    INSERT INTO vocabulary (word, pos, definition, example, phonetic, page_num, category, learned, review_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(word) DO UPDATE SET
                        pos = excluded.pos,
                        definition = excluded.definition,
                        example = excluded.example,
                        phonetic = excluded.phonetic,
                        page_num = excluded.page_num,
                        category = excluded.category,
                        learned = excluded.learned,
                        review_count = excluded.review_count
                    """, (v["word"], v.get("pos"), v.get("definition"), v.get("example"), v.get("phonetic"), v.get("page_num"), v.get("category"), v.get("learned", 0), v.get("review_count", 0)))
                    counts["vocabulary"] += 1

                # 4. Restore notes
                for n in data.get("notes", []):
                    exists = conn.execute("SELECT id FROM notes WHERE page_num = ? AND content = ?", (n["page_num"], n["content"])).fetchone()
                    if not exists:
                        conn.execute("INSERT INTO notes (page_num, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                                     (n["page_num"], n.get("title", ""), n["content"], n.get("created_at"), n.get("updated_at")))
                        counts["notes"] += 1

                # 5. Restore bookmarks
                for b in data.get("bookmarks", []):
                    conn.execute("""
                    INSERT INTO bookmarks (page_num, title, tags, notes)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(page_num) DO UPDATE SET
                        title = excluded.title,
                        tags = excluded.tags,
                        notes = excluded.notes
                    """, (b["page_num"], b.get("title", ""), b.get("tags", ""), b.get("notes", "")))
                    counts["bookmarks"] += 1

                # 6. Restore custom overlays
                for ov in data.get("custom_overlays", []):
                    exists = conn.execute("SELECT id FROM page_overlays WHERE page_num = ? AND label = ? AND x = ?", (ov["page_num"], ov.get("label", ""), ov["x"])).fetchone()
                    if not exists:
                        conn.execute("""
                        INSERT INTO page_overlays (page_num, field_type, x, y, width, height, placeholder, label, correct_answers, hint, explanation, unit_ref, options, grading_type, sample_answer, audio_track, is_default)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                        """, (ov["page_num"], ov.get("field_type", "text"), ov["x"], ov["y"], ov["width"], ov["height"],
                              ov.get("placeholder", ""), ov.get("label", ""), ov.get("correct_answers", "[]"),
                              ov.get("hint", ""), ov.get("explanation", ""), ov.get("unit_ref", "Imported Blank"),
                              ov.get("options", "[]"), ov.get("grading_type", "exact"), ov.get("sample_answer", ""), ov.get("audio_track", "")))
                        counts["overlays"] += 1

                # 7. Restore study progress
                for sp in data.get("study_progress", []):
                    conn.execute("""
                    INSERT INTO study_progress (page_num, completed, time_spent_sec, last_visited, accuracy, mistakes_count, exercises_attempted)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(page_num) DO UPDATE SET
                        completed = excluded.completed,
                        time_spent_sec = time_spent_sec + excluded.time_spent_sec,
                        last_visited = excluded.last_visited,
                        accuracy = excluded.accuracy,
                        mistakes_count = excluded.mistakes_count,
                        exercises_attempted = excluded.exercises_attempted
                    """, (sp["page_num"], sp.get("completed", 0), sp.get("time_spent_sec", 0), sp.get("last_visited"), sp.get("accuracy", 0), sp.get("mistakes_count", 0), sp.get("exercises_attempted", 0)))
                    counts["progress"] += 1

                # 8. Restore study mistakes
                for m in data.get("study_mistakes", []):
                    exists = conn.execute("SELECT id FROM study_mistakes WHERE page_num = ? AND overlay_id = ? AND student_answer = ?", (m["page_num"], m.get("overlay_id"), m.get("student_answer", ""))).fetchone()
                    if not exists:
                        conn.execute("""
                        INSERT INTO study_mistakes (page_num, overlay_id, label, student_answer, correct_answer, explanation, hint, unit_ref, resolved, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (m["page_num"], m.get("overlay_id"), m.get("label", ""), m.get("student_answer", ""), m.get("correct_answer", ""), m.get("explanation", ""), m.get("hint", ""), m.get("unit_ref", ""), m.get("resolved", 0), m.get("created_at"), m.get("updated_at")))
                        counts["mistakes"] += 1

                # 9. Restore recordings
                if conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_recordings'").fetchone():
                    for rec in data.get("recordings", []):
                        conn.execute("""
                        INSERT INTO user_recordings (page_num, exercise_id, title, audio_data, duration_sec, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, (rec["page_num"], rec.get("exercise_id", ""), rec.get("title", ""), rec.get("audio_data", ""), rec.get("duration_sec", 0), rec.get("created_at")))
                        counts["recordings"] += 1

                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "counts": counts})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 10b. API: Reset All User Study Data
        if path in ("/api/reset-data", "/api/reset-progress"):
            try:
                conn = database.get_db_connection()
                conn.execute("DELETE FROM user_page_answers")
                conn.execute("DELETE FROM annotations")
                conn.execute("DELETE FROM notes")
                conn.execute("DELETE FROM bookmarks")
                conn.execute("DELETE FROM study_progress")
                conn.execute("DELETE FROM study_mistakes")
                conn.execute("DELETE FROM page_overlays WHERE (is_default = 0 OR is_default IS NULL)")
                conn.execute("UPDATE vocabulary SET learned = 0, review_count = 0")
                if conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_recordings'").fetchone():
                    conn.execute("DELETE FROM user_recordings")
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "message": "All student data reset successfully."})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 10c. API: Resolve Study Mistake
        if path.startswith("/api/mistakes/") and path.endswith("/resolve"):
            try:
                m_id = int(path.split("/")[3])
                conn = database.get_db_connection()
                conn.execute("UPDATE study_mistakes SET resolved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (m_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "id": m_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 10d. API: Save Voice Recording
        if path == "/api/recordings":
            try:
                page_num = int(body.get("page_num", 1))
                exercise_id = str(body.get("exercise_id", ""))
                title = str(body.get("title", f"Speaking Recording (p.{page_num})"))
                audio_data = str(body.get("audio_data", ""))
                duration_sec = int(body.get("duration_sec", 0))

                conn = database.get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO user_recordings (page_num, exercise_id, title, audio_data, duration_sec)
                VALUES (?, ?, ?, ?, ?)
                """, (page_num, exercise_id, title, audio_data, duration_sec))
                rec_id = cur.lastrowid
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "id": rec_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 11. API: Audio Upload
        if path == "/api/audio/upload":
            try:
                ctype = self.headers.get('Content-Type', '')
                raw_bytes = getattr(self, '_cached_body', b"")
                uploaded = []

                os.makedirs(AUDIO_DIR, exist_ok=True)
                if 'multipart/form-data' in ctype:
                    files = parse_multipart_form(ctype, raw_bytes)
                    for f in files:
                        if not f.get('data'):
                            continue
                        t_id, target_fn = normalize_audio_filename(f['filename'])
                        save_path = os.path.join(AUDIO_DIR, target_fn)
                        with open(save_path, 'wb') as out_f:
                            out_f.write(f['data'])
                        uploaded.append({
                            "track_id": t_id,
                            "filename": target_fn,
                            "size": len(f['data']),
                            "url": f"/audio/{target_fn}"
                        })
                else:
                    orig_fn = "uploaded_track.mp3"
                    file_data = raw_bytes
                    if isinstance(body, dict) and "data" in body:
                        orig_fn = body.get('filename', 'uploaded_track.mp3')
                        file_data = base64.b64decode(body.get('data', ''))
                    elif 'filename' in query:
                        orig_fn = query['filename'][0]

                    if file_data and len(file_data) > 0:
                        t_id, target_fn = normalize_audio_filename(orig_fn)
                        save_path = os.path.join(AUDIO_DIR, target_fn)
                        with open(save_path, 'wb') as out_f:
                            out_f.write(file_data)
                        uploaded.append({
                            "track_id": t_id,
                            "filename": target_fn,
                            "size": len(file_data),
                            "url": f"/audio/{target_fn}"
                        })

                return self.send_json({
                    "status": "success",
                    "uploaded": uploaded,
                    "count": len(uploaded)
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 12. API: AI Check Answers
        if path == "/api/ai-check-answers" or path.startswith("/api/ai-check-answers/"):
            try:
                page_num = int(body.get("page_num", 7))
                user_answers = body.get("answers", {})
                user_prompt = body.get("prompt", "")

                evaluation = check_answers_ai(page_num, user_answers, user_prompt)

                # Persist answer record in DB
                now = datetime.datetime.now().isoformat()
                conn = database.get_db_connection()
                conn.execute("""
                INSERT INTO user_page_answers (page_num, answers, score, total_questions, completed, updated_at)
                VALUES (?, ?, ?, ?, 1, ?)
                ON CONFLICT(page_num) DO UPDATE SET
                    answers = excluded.answers,
                    score = excluded.score,
                    total_questions = excluded.total_questions,
                    completed = excluded.completed,
                    updated_at = excluded.updated_at
                """, (page_num, json.dumps(user_answers), evaluation.get("score", 0), evaluation.get("total_count", 0), now))
                conn.commit()
                conn.close()

                return self.send_json({
                    "status": "success",
                    "page_num": page_num,
                    **evaluation
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. API: Clear annotations for page
        if path.startswith("/api/annotations/"):
            try:
                page_num = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM annotations WHERE page_num = ?", (page_num,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 2. API: Delete custom overlay field
        if path.startswith("/api/overlays/"):
            try:
                field_id = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM page_overlays WHERE id = ?", (field_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "id": field_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 3. API: Delete vocabulary item
        if path.startswith("/api/vocabulary/"):
            try:
                v_id = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM vocabulary WHERE id = ?", (v_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "id": v_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 4. API: Delete note
        if path.startswith("/api/notes/"):
            try:
                n_id = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM notes WHERE id = ?", (n_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "id": n_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 5. API: Delete bookmark
        if path.startswith("/api/bookmarks/"):
            try:
                page_num = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM bookmarks WHERE page_num = ?", (page_num,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "page_num": page_num})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # 6. API: Delete recording
        if path.startswith("/api/recordings/"):
            try:
                rec_id = int(path.split("/")[-1])
                conn = database.get_db_connection()
                conn.execute("DELETE FROM user_recordings WHERE id = ?", (rec_id,))
                conn.commit()
                conn.close()
                return self.send_json({"status": "deleted", "id": rec_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        self.send_error(404, "Endpoint not found")

def run_server(port=PORT):
    # Try port, fall back to port + 1 if busy
    p = port
    while p < port + 10:
        try:
            server = socketserver.ThreadingTCPServer(("", p), DigitalTextbookHandler)
            print(f"================================================================")
            print(f" Digital English Textbook Web Application is Running!")
            print(f" URL: http://localhost:{p}")
            print(f" Serving: Oxford English File 4th Ed Pre-Intermediate (169 pages)")
            print(f"================================================================")
            server.serve_forever()
            break
        except OSError as e:
            if "address already in use" in str(e).lower() or e.errno == 10048:
                p += 1
            else:
                raise e

if __name__ == '__main__':
    run_server()
