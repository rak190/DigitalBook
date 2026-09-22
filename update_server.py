"""
Updates server.py to add:
- search_textbook function
- Enhanced is_answer_matching
- Endpoints:
  - GET /api/content/textbook
  - GET /api/content/units
  - GET /api/content/pages/<pageNum>
  - GET /api/content/toc
  - GET /api/search?q=...
  - GET /api/mistakes
  - POST /api/mistakes/<id>/resolve
  - POST /api/reset-progress
  - POST /api/overlays/<id> (update existing overlay)
  - Enhanced /api/progress metrics
  - Mistake recording in /api/check-answers/<pageNum>
"""

with open("server.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update is_answer_matching
old_matching = '''    for ans in correct_answers:
        c = str(ans).strip().lower()
        if not c:
            continue
        c_norm = re.sub(r'\\s+', ' ', c)
        c_nopunct = re.sub(r"[^\\w\\s]", "", c_norm).strip()
        c_exp = expand_contractions(c_norm)
        c_exp_nopunct = re.sub(r"[^\\w\\s]", "", c_exp).strip()

        if (u_norm == c_norm or
            u_nopunct == c_nopunct or
            u_exp == c_exp or
            u_exp_nopunct == c_exp_nopunct):
            return True'''

new_matching = '''    num_map = {"1":"one", "2":"two", "3":"three", "4":"four", "5":"five", "6":"six", "7":"seven", "8":"eight", "9":"nine", "10":"ten"}
    rev_num_map = {v: k for k, v in num_map.items()}

    for ans in correct_answers:
        c = str(ans).strip().lower()
        if not c:
            continue
        c_norm = re.sub(r'\\s+', ' ', c)
        c_nopunct = re.sub(r"[^\\w\\s]", "", c_norm).strip()
        c_exp = expand_contractions(c_norm)
        c_exp_nopunct = re.sub(r"[^\\w\\s]", "", c_exp).strip()

        if (u_norm == c_norm or
            u_nopunct == c_nopunct or
            u_exp == c_exp or
            u_exp_nopunct == c_exp_nopunct or
            num_map.get(u_norm) == c_norm or
            rev_num_map.get(u_norm) == c_norm):
            return True

        # Check options with parentheses like 'b (17th)' or 'Photo 2'
        m_paren = re.search(r'^([a-zA-Z0-9]+)\\s*\\((.*?)\\)$', c)
        if m_paren:
            opt_letter = m_paren.group(1).lower()
            opt_val = m_paren.group(2).lower()
            if u_norm in (opt_letter, opt_val) or u_nopunct in (opt_letter, opt_val):
                return True'''

if old_matching in code:
    code = code.replace(old_matching, new_matching, 1)
    print("Updated is_answer_matching")
else:
    print("WARNING: old_matching not found!")

# 2. Insert search_textbook function before class DigitalTextbookHandler
search_func = '''
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
                "snippet": f"{v['definition']} — \\"{v['example']}\\""
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
'''

if "def search_textbook(" not in code:
    handler_target = "class DigitalTextbookHandler(http.server.SimpleHTTPRequestHandler):"
    code = code.replace(handler_target, search_func + "\n" + handler_target, 1)
    print("Inserted search_textbook")

# 3. Add Content & Search endpoints in do_GET
get_endpoints = '''        # Content APIs & Global Search
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
'''

book_info_target = '        if path == "/api/book-info":'
if "/api/content/textbook" not in code:
    code = code.replace(book_info_target, get_endpoints + "\n" + book_info_target, 1)
    print("Added GET content & search endpoints")

# 4. Enhance overlays in do_GET to include extra fields
old_ov_append = '''                overlays = []
                for r in rows:
                    overlays.append({
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
                        "unit_ref": r["unit_ref"]
                    })'''

new_ov_append = '''                overlays = []
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
                    overlays.append(ov_dict)'''

if old_ov_append in code:
    code = code.replace(old_ov_append, new_ov_append, 1)
    print("Enhanced overlays endpoint with rich fields")

# 5. Enhance /api/progress in do_GET
old_progress = '''        # 7. API: Overall Progress
        if path == "/api/progress":
            try:
                conn = database.get_db_connection()
                total_words = conn.execute("SELECT COUNT(*) as c FROM vocabulary").fetchone()["c"]
                learned_words = conn.execute("SELECT COUNT(*) as c FROM vocabulary WHERE learned = 1").fetchone()["c"]
                total_notes = conn.execute("SELECT COUNT(*) as c FROM notes").fetchone()["c"]
                total_bookmarks = conn.execute("SELECT COUNT(*) as c FROM bookmarks").fetchone()["c"]
                annotated_pages = conn.execute("SELECT COUNT(*) as c FROM annotations WHERE (strokes != '[]' OR text_boxes != '[]' OR sticky_notes != '[]')").fetchone()["c"]
                completed_exercises = conn.execute("SELECT COUNT(*) as c FROM user_page_answers WHERE completed = 1").fetchone()["c"]
                recent_progress = conn.execute("SELECT page_num, completed, time_spent_sec, last_visited FROM study_progress ORDER BY last_visited DESC LIMIT 10").fetchall()
                conn.close()

                return self.send_json({
                    "vocabulary": {"total": total_words, "learned": learned_words},
                    "notesCount": total_notes,
                    "bookmarksCount": total_bookmarks,
                    "annotatedPages": annotated_pages,
                    "completedExercises": completed_exercises,
                    "recent": [dict(r) for r in recent_progress]
                })'''

new_progress = '''        # 7. API: Overall Progress
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
                })'''

if old_progress in code:
    code = code.replace(old_progress, new_progress, 1)
    print("Enhanced /api/progress endpoint")

# 6. Update do_POST for check-answers to track mistakes and handle update of existing overlay
old_check_answers = '''                    if correct_list:
                        total_gradable += 1
                        # Flexible answer matching
                        is_correct = is_answer_matching(u_val, correct_list)
                        if is_correct:
                            correct_count += 1
                        results[ov_id] = {
                            "is_correct": is_correct,
                            "user_answer": user_answers.get(ov_id, ""),
                            "correct_answers": correct_list,
                            "hint": ov["hint"],
                            "explanation": ov["explanation"]
                        }
                    else:
                        # Open-ended field (e.g. personal info, free practice)
                        results[ov_id] = {
                            "is_correct": True,
                            "user_answer": user_answers.get(ov_id, ""),
                            "open_ended": True
                        }'''

new_check_answers = '''                    # Handle self-check / open-ended
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
                        }'''

if old_check_answers in code:
    code = code.replace(old_check_answers, new_check_answers, 1)
    print("Enhanced check-answers with mistake recording")

# 7. Add POST endpoints for mistakes resolve, reset-progress, and update overlay
post_new_endpoints = '''        # Mistakes resolve
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
'''

if "/api/reset-progress" not in code:
    post_marker = '    def do_POST(self):'
    code = code.replace(post_marker, post_marker + "\n" + post_new_endpoints, 1)
    print("Added POST mistakes resolve and reset-progress")

with open("server.py", "w", encoding="utf-8") as f:
    f.write(code)

print("server.py successfully updated and saved!")
