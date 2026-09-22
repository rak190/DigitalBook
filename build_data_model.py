"""
Generates the complete structured content model for Oxford English File 4th Edition Pre-Intermediate.
Creates:
- data/textbook.json
- data/units.json
- data/pages.json
- data/audio.json
- data/vocabulary.json
- data/exercises.json
- data/answer-key.json
"""

import os
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Load existing Audio metadata and Listening scripts from audio.js
def extract_audio_tracks():
    audio_js_path = os.path.join(BASE_DIR, "public", "js", "audio.js")
    tracks = []
    if os.path.exists(audio_js_path):
        with open(audio_js_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse track blocks
        pattern = r"{\s*id:\s*'([^']+)',\s*unit:\s*'([^']+)',\s*page:\s*(\d+),\s*title:\s*([^\n]+?),\s*script:\s*`([^`]+)`\s*}"
        matches = re.findall(pattern, content, re.DOTALL)
        for m in matches:
            t_id = m[0].strip()
            unit = m[1].strip()
            page = int(m[2].strip())
            title = m[3].strip().strip("'").strip('"')
            script = m[4].strip()
            tracks.append({
                "id": t_id,
                "unit": unit,
                "page": page,
                "bookPage": max(1, page - 1),
                "title": title,
                "filename": f"{t_id}.mp3",
                "script": script
            })
    return tracks

audio_tracks = extract_audio_tracks()
print(f"Extracted {len(audio_tracks)} audio tracks")

# 2. Units Structure
units_data = [
    {
        "id": "u1", "unitNumber": 1, "title": "Getting to know you",
        "lessons": [
            {"id": "1A", "title": "Are you? Can you? Do you? Did you?", "page": 7, "bookPage": 6, "grammar": "word order in questions", "vocabulary": "common verb phrases", "pronunciation": "the alphabet"},
            {"id": "1B", "title": "The perfect date?", "page": 9, "bookPage": 8, "grammar": "present simple", "vocabulary": "describing people: appearance and personality", "pronunciation": "final -s and -es"},
            {"id": "1C", "title": "The Remake Project", "page": 11, "bookPage": 10, "grammar": "present continuous", "vocabulary": "clothes, prepositions of place", "pronunciation": "/ə/ and /ɜː/"}
        ],
        "practical": {"id": "PE1", "title": "Episode 1: Calling reception", "page": 13, "bookPage": 12, "focus": "hotel problems", "pronunciation": "sentence rhythm"},
        "review": None
    },
    {
        "id": "u2", "unitNumber": 2, "title": "Past experiences",
        "lessons": [
            {"id": "2A", "title": "OMG! Where's my passport?", "page": 15, "bookPage": 14, "grammar": "past simple: regular and irregular verbs", "vocabulary": "holidays", "pronunciation": "regular verbs: -ed endings"},
            {"id": "2B", "title": "That's me in the picture!", "page": 17, "bookPage": 16, "grammar": "past continuous", "vocabulary": "prepositions of time and place: at, in, on", "pronunciation": "weak forms: was, were"},
            {"id": "2C", "title": "One dark October evening", "page": 19, "bookPage": 18, "grammar": "time sequencers and connectors", "vocabulary": "verb phrases", "pronunciation": "word stress"}
        ],
        "practical": None,
        "review": {"id": "RC1_2", "title": "Revise and Check 1&2", "page": 21, "bookPage": 20}
    },
    {
        "id": "u3", "unitNumber": 3, "title": "Future plans and predictions",
        "lessons": [
            {"id": "3A", "title": "A TripAside", "page": 23, "bookPage": 22, "grammar": "be going to (plans and predictions)", "vocabulary": "airports", "pronunciation": "the letter g"},
            {"id": "3B", "title": "Put it in your calendar!", "page": 25, "bookPage": 24, "grammar": "present continuous (future arrangements)", "vocabulary": "verbs + prepositions (arrive in, etc.)", "pronunciation": "linking"},
            {"id": "3C", "title": "Word games", "page": 27, "bookPage": 26, "grammar": "defining relative clauses", "vocabulary": "paraphrasing", "pronunciation": "silent e"}
        ],
        "practical": {"id": "PE2", "title": "Episode 2: At the restaurant", "page": 29, "bookPage": 28, "focus": "ordering a meal", "pronunciation": "understanding fast speech"},
        "review": None
    },
    {
        "id": "u4", "unitNumber": 4, "title": "Present perfect and shopping",
        "lessons": [
            {"id": "4A", "title": "Who does what?", "page": 31, "bookPage": 30, "grammar": "present perfect + yet, just, already", "vocabulary": "housework, make or do?", "pronunciation": "the letters y and j"},
            {"id": "4B", "title": "In your basket", "page": 33, "bookPage": 32, "grammar": "present perfect or past simple? (1)", "vocabulary": "shopping", "pronunciation": "c and ch"},
            {"id": "4C", "title": "#greatweekend", "page": 35, "bookPage": 34, "grammar": "something, anything, nothing, etc.", "vocabulary": "adjectives ending -ed and -ing", "pronunciation": "/e/, /əʊ/, and /ʌ/"}
        ],
        "practical": None,
        "review": {"id": "RC3_4", "title": "Revise and Check 3&4", "page": 37, "bookPage": 36}
    },
    {
        "id": "u5", "unitNumber": 5, "title": "Comparisons and lifestyle",
        "lessons": [
            {"id": "5A", "title": "I want it NOW!", "page": 39, "bookPage": 38, "grammar": "comparative adjectives and adverbs, as...as", "vocabulary": "types of numbers", "pronunciation": "/ə/"},
            {"id": "5B", "title": "Twelve lost wallets", "page": 41, "bookPage": 40, "grammar": "superlatives (+ ever + present perfect)", "vocabulary": "describing a town or city", "pronunciation": "sentence stress"},
            {"id": "5C", "title": "How much is enough?", "page": 43, "bookPage": 42, "grammar": "quantifiers, too, (not) enough", "vocabulary": "health and the body", "pronunciation": "/ʌ/"}
        ],
        "practical": {"id": "PE3", "title": "Episode 3: Taking something back to a shop", "page": 45, "bookPage": 44, "focus": "shopping problems", "pronunciation": "taking things back"},
        "review": None
    },
    {
        "id": "u6", "unitNumber": 6, "title": "Will and future choices",
        "lessons": [
            {"id": "6A", "title": "Think positive - or negative?", "page": 47, "bookPage": 46, "grammar": "will / won't (predictions)", "vocabulary": "opposite verbs", "pronunciation": "'ll, won't"},
            {"id": "6B", "title": "I'll always love you", "page": 49, "bookPage": 48, "grammar": "will / won't / shall (other uses)", "vocabulary": "verb + back", "pronunciation": "word stress: two-syllable verbs"},
            {"id": "6C", "title": "The meaning of dreaming", "page": 51, "bookPage": 50, "grammar": "review of verb forms: present, past, and future", "vocabulary": "modifiers", "pronunciation": "the letters ea"}
        ],
        "practical": None,
        "review": {"id": "RC5_6", "title": "Revise and Check 5&6", "page": 53, "bookPage": 52}
    },
    {
        "id": "u7", "unitNumber": 7, "title": "Rules and obligations",
        "lessons": [
            {"id": "7A", "title": "First day nerves", "page": 55, "bookPage": 54, "grammar": "uses of the infinitive with to", "vocabulary": "verbs + infinitive: try to, forget to", "pronunciation": "weak form of to, linking"},
            {"id": "7B", "title": "Happiness is...", "page": 57, "bookPage": 56, "grammar": "uses of the gerund (verb + -ing)", "vocabulary": "verbs + gerund", "pronunciation": "-ing, the letter o"},
            {"id": "7C", "title": "Could you pass the test?", "page": 59, "bookPage": 58, "grammar": "have to, don't have to, must, mustn't", "vocabulary": "adjectives + prepositions: afraid of", "pronunciation": "stress on prepositions"}
        ],
        "practical": {"id": "PE4", "title": "Episode 4: Going to a pharmacy", "page": 61, "bookPage": 60, "focus": "health problems", "pronunciation": "feeling ill"},
        "review": None
    },
    {
        "id": "u8", "unitNumber": 8, "title": "Conditionals and advice",
        "lessons": [
            {"id": "8A", "title": "Should I stay or should I go?", "page": 63, "bookPage": 62, "grammar": "should", "vocabulary": "get", "pronunciation": "/ʊ/ and /uː/"},
            {"id": "8B", "title": "Murphy's Law", "page": 65, "bookPage": 64, "grammar": "if + present, + will + infinitive (first conditional)", "vocabulary": "confusing verbs", "pronunciation": "homophones"},
            {"id": "8C", "title": "Who is Vivienne?", "page": 67, "bookPage": 66, "grammar": "possessive pronouns", "vocabulary": "adverbs of manner", "pronunciation": "reading aloud"}
        ],
        "practical": None,
        "review": {"id": "RC7_8", "title": "Revise and Check 7&8", "page": 69, "bookPage": 68}
    },
    {
        "id": "u9", "unitNumber": 9, "title": "Hypotheticals and fears",
        "lessons": [
            {"id": "9A", "title": "Beware of the dog", "page": 71, "bookPage": 70, "grammar": "if + past, would + infinitive (second conditional)", "vocabulary": "animals and insects", "pronunciation": "word stress"},
            {"id": "9B", "title": "Fearof.net", "page": 73, "bookPage": 72, "grammar": "present perfect + for and since", "vocabulary": "words related to fear", "pronunciation": "sentence stress"},
            {"id": "9C", "title": "Scream queens", "page": 75, "bookPage": 74, "grammar": "present perfect or past simple? (2)", "vocabulary": "biographies", "pronunciation": "word stress, /ɔː/"}
        ],
        "practical": {"id": "PE5", "title": "Episode 5: Asking how to get there", "page": 77, "bookPage": 76, "focus": "directions", "pronunciation": "asking for directions"},
        "review": None
    },
    {
        "id": "u10", "unitNumber": 10, "title": "Movement and Inventions",
        "lessons": [
            {"id": "10A", "title": "Into the net", "page": 79, "bookPage": 78, "grammar": "expressing movement", "vocabulary": "sports, expressing movement", "pronunciation": "word stress"},
            {"id": "10B", "title": "Early birds", "page": 81, "bookPage": 80, "grammar": "word order of phrasal verbs", "vocabulary": "phrasal verbs", "pronunciation": "linking"},
            {"id": "10C", "title": "International inventions", "page": 83, "bookPage": 82, "grammar": "the passive", "vocabulary": "people from different countries", "pronunciation": "/ʃ/, /tʃ/, and /dʒ/"}
        ],
        "practical": None,
        "review": {"id": "RC9_10", "title": "Revise and Check 9&10", "page": 85, "bookPage": 84}
    },
    {
        "id": "u11", "unitNumber": 11, "title": "Memories and Decisions",
        "lessons": [
            {"id": "11A", "title": "Ask the teacher", "page": 87, "bookPage": 86, "grammar": "used to", "vocabulary": "school subjects", "pronunciation": "used to / didn't use to"},
            {"id": "11B", "title": "Help! I can't decide!", "page": 89, "bookPage": 88, "grammar": "might", "vocabulary": "word building: noun formation", "pronunciation": "diphthongs"},
            {"id": "11C", "title": "Twinstrangers.net", "page": 91, "bookPage": 90, "grammar": "so, neither + auxiliaries", "vocabulary": "similarities and differences", "pronunciation": "/ð/ and /θ/"}
        ],
        "practical": {"id": "PE6", "title": "Episode 6: On the phone", "page": 93, "bookPage": 92, "focus": "phone conversations", "pronunciation": "leaving messages"},
        "review": None
    },
    {
        "id": "u12", "unitNumber": 12, "title": "Stories and General Knowledge",
        "lessons": [
            {"id": "12A", "title": "Unbelievable!", "page": 95, "bookPage": 94, "grammar": "past perfect", "vocabulary": "time expressions", "pronunciation": "the letter i"},
            {"id": "12B", "title": "Think before you speak", "page": 97, "bookPage": 96, "grammar": "reported speech", "vocabulary": "say or tell?", "pronunciation": "double consonants"},
            {"id": "12C", "title": "The English File quiz", "page": 99, "bookPage": 98, "grammar": "questions without auxiliaries", "vocabulary": "revision of question words", "pronunciation": "question words"}
        ],
        "practical": None,
        "review": {"id": "RC11_12", "title": "Revise and Check 11&12", "page": 101, "bookPage": 100}
    }
]

reference_banks = [
    {"id": "comm", "title": "Communication", "startPage": 103, "endPage": 113, "startBookPage": 102, "endBookPage": 112},
    {"id": "writing", "title": "Writing", "startPage": 114, "endPage": 120, "startBookPage": 113, "endBookPage": 119},
    {"id": "listening", "title": "Listening Scripts", "startPage": 121, "endPage": 126, "startBookPage": 120, "endBookPage": 125},
    {"id": "grammar", "title": "Grammar Bank", "startPage": 127, "endPage": 150, "startBookPage": 126, "endBookPage": 149},
    {"id": "vocab", "title": "Vocabulary Bank", "startPage": 151, "endPage": 164, "startBookPage": 150, "endBookPage": 163},
    {"id": "irregular", "title": "Irregular Verbs", "startPage": 165, "endPage": 165, "startBookPage": 164, "endBookPage": 164},
    {"id": "appendix", "title": "Appendix", "startPage": 166, "endPage": 166, "startBookPage": 165, "endBookPage": 165},
    {"id": "sounds", "title": "Sound Bank", "startPage": 167, "endPage": 169, "startBookPage": 166, "endBookPage": 168}
]

with open(os.path.join(DATA_DIR, "units.json"), "w", encoding="utf-8") as f:
    json.dump({"units": units_data, "referenceBanks": reference_banks}, f, indent=2, ensure_ascii=False)
print("Saved units.json")

# 3. Generate pages.json for all 169 pages
pages_data = []

def get_page_meta(p):
    # Prelims
    if p == 1:
        return {"title": "Front Cover & Title", "type": "prelim", "bookPage": 1, "unit": None, "lesson": None}
    if p == 2:
        return {"title": "Inside Cover / Welcome", "type": "prelim", "bookPage": 1, "unit": None, "lesson": None}
    if p in [3, 4]:
        return {"title": f"Contents (Part {p-2})", "type": "prelim", "bookPage": p - 1, "unit": None, "lesson": None}
    if p in [5, 6]:
        return {"title": f"Welcome to English File 4th Edition (Part {p-4})", "type": "prelim", "bookPage": p - 1, "unit": None, "lesson": None}

    # Units 1-12
    for u in units_data:
        for les in u["lessons"]:
            if p == les["page"] or p == les["page"] + 1:
                part = "Part 1" if p == les["page"] else "Part 2"
                return {
                    "title": f"Unit {u['unitNumber']}{les['id']} — {les['title']} ({part})",
                    "type": "unit",
                    "bookPage": p - 1,
                    "unit": f"Unit {u['unitNumber']}",
                    "lesson": les["id"],
                    "grammar": les.get("grammar"),
                    "vocabulary": les.get("vocabulary"),
                    "pronunciation": les.get("pronunciation")
                }
        if u["practical"] and (p == u["practical"]["page"] or p == u["practical"]["page"] + 1):
            part = "Part 1" if p == u["practical"]["page"] else "Part 2"
            return {
                "title": f"Practical English {u['practical']['title']} ({part})",
                "type": "practical",
                "bookPage": p - 1,
                "unit": f"Unit {u['unitNumber']}",
                "lesson": u["practical"]["id"],
                "focus": u["practical"]["focus"]
            }
        if u["review"] and (p == u["review"]["page"] or p == u["review"]["page"] + 1):
            part = "Grammar & Vocabulary" if p == u["review"]["page"] else "Reading & Listening"
            return {
                "title": f"{u['review']['title']} ({part})",
                "type": "review",
                "bookPage": p - 1,
                "unit": f"Unit {u['unitNumber']}",
                "lesson": u["review"]["id"]
            }

    # Reference Banks
    for b in reference_banks:
        if b["startPage"] <= p <= b["endPage"]:
            offset = p - b["startPage"] + 1
            return {
                "title": f"{b['title']} (Page {offset})",
                "type": "bank",
                "bookPage": p - 1,
                "unit": "Reference Bank",
                "lesson": b["id"],
                "bankName": b["title"]
            }

    return {"title": f"Textbook Page {p}", "type": "page", "bookPage": max(1, p - 1), "unit": None, "lesson": None}

for p in range(1, 170):
    meta = get_page_meta(p)
    # Find audio tracks for page
    page_tracks = [t["id"] for t in audio_tracks if t["page"] == p]
    pages_data.append({
        "pdfPage": p,
        "bookPage": meta["bookPage"],
        "title": meta["title"],
        "type": meta["type"],
        "unit": meta["unit"],
        "lesson": meta["lesson"],
        "grammar": meta.get("grammar"),
        "vocabulary": meta.get("vocabulary"),
        "pronunciation": meta.get("pronunciation"),
        "audioTracks": page_tracks
    })

with open(os.path.join(DATA_DIR, "pages.json"), "w", encoding="utf-8") as f:
    json.dump(pages_data, f, indent=2, ensure_ascii=False)
print(f"Saved pages.json ({len(pages_data)} pages)")

# 4. Save audio.json
with open(os.path.join(DATA_DIR, "audio.json"), "w", encoding="utf-8") as f:
    json.dump(audio_tracks, f, indent=2, ensure_ascii=False)
print(f"Saved audio.json ({len(audio_tracks)} tracks)")

# 5. Build rich vocabulary database
vocab_data = [
    # Describing people (Appearance)
    {"word": "appearance", "pos": "noun", "phonetic": "/əˈpɪərəns/", "definition": "The way that someone or something looks.", "example": "She has a very youthful appearance.", "page": 8, "category": "Describing People"},
    {"word": "personality", "pos": "noun", "phonetic": "/ˌpɜːsəˈnæləti/", "definition": "The various aspects of a person's character that combine to make them different.", "example": "He has an outgoing and friendly personality.", "page": 8, "category": "Describing People"},
    {"word": "straight hair", "pos": "phrase", "phonetic": "/streɪt heə/", "definition": "Hair that has no curves, waves, or curls.", "example": "She has long straight dark hair.", "page": 8, "category": "Appearance"},
    {"word": "curly hair", "pos": "phrase", "phonetic": "/ˈkɜːli heə/", "definition": "Hair that grows in curls or spirals.", "example": "He has short curly brown hair.", "page": 8, "category": "Appearance"},
    {"word": "wavy hair", "pos": "phrase", "phonetic": "/ˈweɪvi heə/", "definition": "Hair having gentle curves.", "example": "She has blonde wavy hair.", "page": 8, "category": "Appearance"},
    {"word": "beard", "pos": "noun", "phonetic": "/bɪəd/", "definition": "Hair that grows on the chin and cheeks of a man's face.", "example": "He grew a thick beard over the winter.", "page": 8, "category": "Appearance"},
    {"word": "moustache", "pos": "noun", "phonetic": "/məˈstɑːʃ/", "definition": "Hair that grows on a man's upper lip.", "example": "He has a neatly trimmed moustache.", "page": 8, "category": "Appearance"},
    {"word": "overweight", "pos": "adjective", "phonetic": "/ˌəʊvəˈweɪt/", "definition": "Too heavy or fat; above a normal or desirable weight.", "example": "A bit overweight.", "page": 8, "category": "Appearance"},
    {"word": "slim", "pos": "adjective", "phonetic": "/slɪm/", "definition": "Attractively thin.", "example": "She is tall and slim.", "page": 8, "category": "Appearance"},
    {"word": "bald", "pos": "adjective", "phonetic": "/bɔːld/", "definition": "Having little or no hair on the head.", "example": "My grandfather is completely bald.", "page": 8, "category": "Appearance"},

    # Personality
    {"word": "friendly", "pos": "adjective", "phonetic": "/ˈfrendli/", "definition": "Behaving in a kind and pleasant way.", "example": "The hotel staff were polite and friendly.", "page": 9, "category": "Personality"},
    {"word": "unfriendly", "pos": "adjective", "phonetic": "/ʌnˈfrendli/", "definition": "Not kind or pleasant; hostile.", "example": "The clerk was cold and unfriendly.", "page": 9, "category": "Personality"},
    {"word": "talkative", "pos": "adjective", "phonetic": "/ˈtɔːkətɪv/", "definition": "Liking to talk a lot.", "example": "She is very talkative and easy to talk with.", "page": 9, "category": "Personality"},
    {"word": "quiet", "pos": "adjective", "phonetic": "/ˈkwaɪət/", "definition": "Making little noise; speaking little.", "example": "He is quiet and thoughtful.", "page": 9, "category": "Personality"},
    {"word": "generous", "pos": "adjective", "phonetic": "/ˈdʒenərəs/", "definition": "Giving or willing to give freely; not mean.", "example": "It was very generous of you to pay for dinner.", "page": 9, "category": "Personality"},
    {"word": "mean", "pos": "adjective", "phonetic": "/miːn/", "definition": "Not willing to give or share things, especially money.", "example": "He's too mean to buy a round of drinks.", "page": 9, "category": "Personality"},
    {"word": "funny", "pos": "adjective", "phonetic": "/ˈfʌni/", "definition": "Making you laugh; amusing.", "example": "He told a very funny joke yesterday.", "page": 9, "category": "Personality"},
    {"word": "serious", "pos": "adjective", "phonetic": "/ˈsɪəriəs/", "definition": "Thinking about things in a careful way and not laughing much.", "example": "You need to be serious when taking an exam.", "page": 9, "category": "Personality"},
    {"word": "lazy", "pos": "adjective", "phonetic": "/ˈleɪzi/", "definition": "Unwilling to work or use energy.", "example": "Get out of bed, you lazy boy!", "page": 9, "category": "Personality"},
    {"word": "hard-working", "pos": "adjective", "phonetic": "/ˌhɑːd ˈwɜːkɪŋ/", "definition": "Putting a lot of effort into a job and doing it well.", "example": "She is a hard-working student who always does her homework.", "page": 9, "category": "Personality"},
    {"word": "shy", "pos": "adjective", "phonetic": "/ʃaɪ/", "definition": "Nervous or embarrassed about meeting and speaking to other people.", "example": "He was too shy to speak to the girl.", "page": 9, "category": "Personality"},
    {"word": "extrovert", "pos": "noun", "phonetic": "/ˈekstrəvɜːt/", "definition": "A lively and confident person who enjoys being with other people.", "example": "As an extrovert, she loves meeting new people at parties.", "page": 9, "category": "Personality"},
    {"word": "clever", "pos": "adjective", "phonetic": "/ˈklevə/", "definition": "Quick at learning and understanding things.", "example": "She's very clever at mathematics.", "page": 9, "category": "Personality"},
    {"word": "kind", "pos": "adjective", "phonetic": "/kaɪnd/", "definition": "Caring about others; friendly and generous.", "example": "Thank you for your kind help.", "page": 9, "category": "Personality"},

    # Clothes & Fashion
    {"word": "cardigan", "pos": "noun", "phonetic": "/ˈkɑːdɪɡən/", "definition": "A knitted jacket that fastens up the front with buttons.", "example": "She put on a warm woollen cardigan.", "page": 11, "category": "Clothes"},
    {"word": "coat", "pos": "noun", "phonetic": "/kəʊt/", "definition": "An outer garment with sleeves, worn outdoors.", "example": "Don't forget your winter coat!", "page": 11, "category": "Clothes"},
    {"word": "suit", "pos": "noun", "phonetic": "/suːt/", "definition": "A set of clothes made of the same fabric, typically a jacket and trousers or a skirt.", "example": "He wore a navy blue suit to the interview.", "page": 11, "category": "Clothes"},
    {"word": "tracksuit", "pos": "noun", "phonetic": "/ˈtræksuːt/", "definition": "A loose, warm set of clothes with trousers and a top, worn for exercise.", "example": "He goes jogging in a grey tracksuit.", "page": 11, "category": "Clothes"},
    {"word": "trainers", "pos": "noun (plural)", "phonetic": "/ˈtreɪnəz/", "definition": "Soft athletic shoes suitable for sports (US: sneakers).", "example": "I need a new pair of running trainers.", "page": 11, "category": "Clothes"},
    {"word": "flip-flops", "pos": "noun (plural)", "phonetic": "/ˈflɪp flɒps/", "definition": "Light sandals, typically made of plastic or rubber, with a thong between the big toe and the second toe.", "example": "She wore flip-flops to the beach.", "page": 11, "category": "Clothes"},

    # Holidays & Travel
    {"word": "flight", "pos": "noun", "phonetic": "/flaɪt/", "definition": "A journey in an aircraft.", "example": "Our flight to London was delayed by two hours.", "page": 15, "category": "Holidays"},
    {"word": "luggage", "pos": "noun", "phonetic": "/ˈlʌɡɪdʒ/", "definition": "Bags, cases, etc. that you take with you when travelling.", "example": "You can leave your luggage at the hotel reception.", "page": 15, "category": "Holidays"},
    {"word": "boarding pass", "pos": "noun", "phonetic": "/ˈbɔːdɪŋ pɑːs/", "definition": "A card that a passenger must have to be allowed on a plane or ship.", "example": "Please show your passport and boarding pass at gate 4.", "page": 15, "category": "Holidays"},
    {"word": "passport", "pos": "noun", "phonetic": "/ˈpɑːspɔːt/", "definition": "An official document that identifies you as a citizen of a particular country.", "example": "Don't forget to pack your passport before leaving!", "page": 15, "category": "Holidays"},
    {"word": "souvenir", "pos": "noun", "phonetic": "/ˌsuːvəˈnɪə/", "definition": "A thing that is kept as a reminder of a person, place, or event.", "example": "We bought some fridge magnets as souvenirs.", "page": 15, "category": "Holidays"},
    {"word": "sunbathe", "pos": "verb", "phonetic": "/ˈsʌnbeɪð/", "definition": "Sit or lie in the sun, especially to get a tan.", "example": "We spent the afternoon sunbathing on the beach.", "page": 15, "category": "Holidays"},
    {"word": "hire", "pos": "verb", "phonetic": "/ˈhaɪə/", "definition": "Pay money to borrow something for a short time.", "example": "We decided to hire bicycles for the weekend.", "page": 15, "category": "Holidays"},
    {"word": "delay", "pos": "noun / verb", "phonetic": "/dɪˈleɪ/", "definition": "A period of time by which something is late or postponed.", "example": "There is a 30-minute delay on the train service.", "page": 23, "category": "Airports"},
    {"word": "gate", "pos": "noun", "phonetic": "/ɡeɪt/", "definition": "An exit from an airport building to an aircraft.", "example": "Flight BA142 is now boarding at Gate 12.", "page": 23, "category": "Airports"},
    {"word": "terminal", "pos": "noun", "phonetic": "/ˈtɜːmɪnl/", "definition": "A building at an airport where passengers arrive and depart.", "example": "All international flights depart from Terminal 2.", "page": 23, "category": "Airports"}
]

with open(os.path.join(DATA_DIR, "vocabulary.json"), "w", encoding="utf-8") as f:
    json.dump(vocab_data, f, indent=2, ensure_ascii=False)
print(f"Saved vocabulary.json ({len(vocab_data)} items)")

print("Content model files successfully initialized!")
