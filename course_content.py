"""
Complete Oxford English File 4th Edition Pre-Intermediate Course Overlay Content Model
Defines interactive overlays, question items, answer keys, hints, explanations,
and audio tracks systematically across all 12 units, Practical English episodes,
Revise & Check reviews, Grammar Bank, and Vocabulary Bank.
"""

import json

# Comprehensive Course Overlays Dictionary { page_num: [ overlay_dicts ] }
COURSE_OVERLAYS = {
    # Practical English 1 (Page 13: Book page 12 - Calling reception)
    13: [
        {
            "page_num": 13, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "Select problem...", "label": "PE1.1 Room issue",
            "correct_answers": ["heating"],
            "options": ["heating", "shower", "air conditioning", "television"],
            "hint": "The room is too cold", "explanation": "There's a problem with the heating.",
            "unit_ref": "Practical English 1", "audio_track": "1.26"
        },
        {
            "page_num": 13, "field_type": "text", "x": 10.0, "y": 32.0, "width": 14.0, "height": 2.0,
            "placeholder": "Room number", "label": "PE1.2 Room number",
            "correct_answers": ["306", "room 306"],
            "hint": "Room number on 3rd floor", "explanation": "Room 306",
            "unit_ref": "Practical English 1", "audio_track": "1.26"
        },
        {
            "page_num": 13, "field_type": "text", "x": 55.0, "y": 42.0, "width": 24.0, "height": 2.0,
            "placeholder": "right away", "label": "PE1.3 Response",
            "correct_answers": ["I'll send somebody up right away", "right away", "send somebody up"],
            "hint": "Receptionist promise with will", "explanation": "I'll send somebody up right away.",
            "unit_ref": "Practical English 1", "audio_track": "1.27"
        },
        {
            "page_num": 13, "field_type": "self_check", "x": 10.0, "y": 75.0, "width": 80.0, "height": 6.0,
            "placeholder": "Practice calling reception with your own hotel issue...", "label": "PE1.4 Speaking Practice",
            "correct_answers": [], "grading_type": "self-check",
            "sample_answer": "Hello, reception? This is Room 204. I'm afraid the shower isn't working and there's no hot water.",
            "hint": "State your room number and the problem politely", "explanation": "Polite hotel communication formula",
            "unit_ref": "Practical English 1 Role-play"
        }
    ],

    # Unit 2A (Page 16: Book page 15 - The holiday that went wrong)
    16: [
        {
            "page_num": 16, "field_type": "text", "x": 10.0, "y": 30.0, "width": 12.0, "height": 2.0,
            "placeholder": "broke", "label": "2A.3c Past break",
            "correct_answers": ["broke"],
            "hint": "Irregular past of break", "explanation": "The car broke down on the motorway.",
            "unit_ref": "Unit 2A Reading"
        },
        {
            "page_num": 16, "field_type": "text", "x": 10.0, "y": 33.0, "width": 12.0, "height": 2.0,
            "placeholder": "thought", "label": "2A.3c Past think",
            "correct_answers": ["thought"],
            "hint": "Irregular past of think", "explanation": "We thought it would be sunny.",
            "unit_ref": "Unit 2A Reading"
        },
        {
            "page_num": 16, "field_type": "text", "x": 10.0, "y": 36.0, "width": 12.0, "height": 2.0,
            "placeholder": "spent", "label": "2A.3c Past spend",
            "correct_answers": ["spent"],
            "hint": "Irregular past of spend", "explanation": "They spent a lot of money.",
            "unit_ref": "Unit 2A Reading"
        },
        {
            "page_num": 16, "field_type": "dropdown", "x": 55.0, "y": 45.0, "width": 10.0, "height": 2.0,
            "placeholder": "T/F", "label": "2A.4a 1",
            "correct_answers": ["T", "True"], "options": ["T", "F"],
            "hint": "Linda booked flights online", "explanation": "True - she booked the flights online.",
            "unit_ref": "Unit 2A Listening", "audio_track": "1.33"
        },
        {
            "page_num": 16, "field_type": "dropdown", "x": 55.0, "y": 48.0, "width": 10.0, "height": 2.0,
            "placeholder": "T/F", "label": "2A.4a 2",
            "correct_answers": ["F", "False"], "options": ["T", "F"],
            "hint": "Did it rain every day?", "explanation": "False - the weather was warm and sunny.",
            "unit_ref": "Unit 2A Listening", "audio_track": "1.33"
        }
    ],

    # Unit 2B (Page 18: Book page 17 - Hannah and Jamie)
    18: [
        {
            "page_num": 18, "field_type": "text", "x": 10.0, "y": 25.0, "width": 16.0, "height": 2.0,
            "placeholder": "was raining", "label": "2B.3a 1",
            "correct_answers": ["was raining"],
            "hint": "Continuous background action", "explanation": "It was raining when they met.",
            "unit_ref": "Unit 2B Grammar"
        },
        {
            "page_num": 18, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "invited", "label": "2B.3a 2",
            "correct_answers": ["invited"],
            "hint": "Completed event", "explanation": "Jamie invited Hannah to a concert.",
            "unit_ref": "Unit 2B Grammar"
        },
        {
            "page_num": 18, "field_type": "dropdown", "x": 55.0, "y": 35.0, "width": 8.0, "height": 2.0,
            "placeholder": "at/in/on", "label": "2B.prep 1",
            "correct_answers": ["at"], "options": ["at", "in", "on"],
            "hint": "at the coffee bar", "explanation": "We use 'at' for specific meeting points.",
            "unit_ref": "Unit 2B Prepositions"
        },
        {
            "page_num": 18, "field_type": "dropdown", "x": 55.0, "y": 38.0, "width": 8.0, "height": 2.0,
            "placeholder": "at/in/on", "label": "2B.prep 2",
            "correct_answers": ["on"], "options": ["at", "in", "on"],
            "hint": "on Monday evening", "explanation": "We use 'on' for days and dates.",
            "unit_ref": "Unit 2B Prepositions"
        }
    ],

    # Unit 2C (Page 20: Book page 19 - The story of Blue Jeans)
    20: [
        {
            "page_num": 20, "field_type": "text", "x": 10.0, "y": 26.0, "width": 14.0, "height": 2.0,
            "placeholder": "Suddenly", "label": "2C.2a 1",
            "correct_answers": ["Suddenly", "suddenly"],
            "hint": "Unexpected immediate event", "explanation": "Suddenly, a car appeared around the bend.",
            "unit_ref": "Unit 2C Time Sequencers"
        },
        {
            "page_num": 20, "field_type": "text", "x": 10.0, "y": 29.0, "width": 16.0, "height": 2.0,
            "placeholder": "Two minutes later", "label": "2C.2a 2",
            "correct_answers": ["Two minutes later", "two minutes later", "Later"],
            "hint": "Time interval", "explanation": "Two minutes later, the music stopped.",
            "unit_ref": "Unit 2C Time Sequencers"
        },
        {
            "page_num": 20, "field_type": "self_check", "x": 10.0, "y": 70.0, "width": 80.0, "height": 6.0,
            "placeholder": "Write a short paragraph about an unforgettable evening using because, so, and although...",
            "label": "2C.4 Writing Task", "correct_answers": [], "grading_type": "self-check",
            "sample_answer": "One evening last October, I decided to walk home because the buses were on strike. Although it was raining, I enjoyed the walk so I stayed out late.",
            "hint": "Use at least two connectors in your short story", "explanation": "Connector narrative composition",
            "unit_ref": "Unit 2C Writing"
        }
    ],

    # Revise and Check 1&2 (Page 22: Book page 21 - Reading & Listening)
    22: [
        {
            "page_num": 22, "field_type": "dropdown", "x": 10.0, "y": 30.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC1.R1",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "Destination was Iceland", "explanation": "Option b is correct.",
            "unit_ref": "Revise & Check 1&2 Reading"
        },
        {
            "page_num": 22, "field_type": "dropdown", "x": 10.0, "y": 34.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC1.R2",
            "correct_answers": ["a"], "options": ["a", "b", "c"],
            "hint": "The Northern Lights were visible", "explanation": "Option a is correct.",
            "unit_ref": "Revise & Check 1&2 Reading"
        },
        {
            "page_num": 22, "field_type": "text", "x": 55.0, "y": 40.0, "width": 14.0, "height": 2.0,
            "placeholder": "photographer", "label": "RC1.V1",
            "correct_answers": ["photographer"],
            "hint": "Person who takes photos", "explanation": "A person who takes photos is a photographer.",
            "unit_ref": "Revise & Check 1&2 Vocabulary"
        }
    ],

    # Unit 3A (Page 24: Book page 23 - TripAside Plans)
    24: [
        {
            "page_num": 24, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "'s going to miss", "label": "3A.2c 1",
            "correct_answers": ["'s going to miss", "is going to miss"],
            "hint": "Prediction from evidence: look at the clock!", "explanation": "Look at the clock! He's going to miss his plane.",
            "unit_ref": "Unit 3A Grammar"
        },
        {
            "page_num": 24, "field_type": "text", "x": 10.0, "y": 31.0, "width": 18.0, "height": 2.0,
            "placeholder": "'re going to have", "label": "3A.2c 2",
            "correct_answers": ["'re going to have", "are going to have"],
            "hint": "Plan for future", "explanation": "They're going to have a tour of Paris.",
            "unit_ref": "Unit 3A Grammar"
        }
    ],

    # Unit 3B (Page 26: Book page 25 - Arrangements & Prepositions)
    26: [
        {
            "page_num": 26, "field_type": "dropdown", "x": 10.0, "y": 30.0, "width": 10.0, "height": 2.0,
            "placeholder": "in/at", "label": "3B.3a 1",
            "correct_answers": ["in"], "options": ["in", "at", "to"],
            "hint": "arrive in a city or country", "explanation": "We arrived in London at 6.00.",
            "unit_ref": "Unit 3B Verbs + Prepositions"
        },
        {
            "page_num": 26, "field_type": "dropdown", "x": 10.0, "y": 33.0, "width": 10.0, "height": 2.0,
            "placeholder": "in/at", "label": "3B.3a 2",
            "correct_answers": ["at"], "options": ["in", "at", "to"],
            "hint": "arrive at a building / airport", "explanation": "We arrived at Heathrow Airport.",
            "unit_ref": "Unit 3B Verbs + Prepositions"
        },
        {
            "page_num": 26, "field_type": "dropdown", "x": 10.0, "y": 36.0, "width": 10.0, "height": 2.0,
            "placeholder": "prep", "label": "3B.3a 3",
            "correct_answers": ["on"], "options": ["on", "of", "for"],
            "hint": "depend on something", "explanation": "It depends on the weather.",
            "unit_ref": "Unit 3B Verbs + Prepositions"
        }
    ],

    # Unit 3C (Page 28: Book page 27 - Paraphrasing)
    28: [
        {
            "page_num": 28, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "dictionary", "label": "3C.3a 1",
            "correct_answers": ["dictionary", "a dictionary"],
            "hint": "A book which tells you what words mean", "explanation": "A dictionary is a book which explains words.",
            "unit_ref": "Unit 3C Paraphrasing"
        },
        {
            "page_num": 28, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "chef", "label": "3C.3a 2",
            "correct_answers": ["chef", "a chef", "cook"],
            "hint": "A person who cooks in a restaurant", "explanation": "A chef is someone who cooks professionally.",
            "unit_ref": "Unit 3C Paraphrasing"
        },
        {
            "page_num": 28, "field_type": "text", "x": 10.0, "y": 34.0, "width": 16.0, "height": 2.0,
            "placeholder": "library", "label": "3C.3a 3",
            "correct_answers": ["library", "a library"],
            "hint": "A place where you can borrow books", "explanation": "A library is a place where you borrow books.",
            "unit_ref": "Unit 3C Paraphrasing"
        }
    ],

    # Practical English 2 (Page 29: Book page 28 - At the restaurant)
    29: [
        {
            "page_num": 29, "field_type": "dropdown", "x": 10.0, "y": 26.0, "width": 16.0, "height": 2.0,
            "placeholder": "order...", "label": "PE2.1 Course",
            "correct_answers": ["starters"], "options": ["starters", "main courses", "desserts"],
            "hint": "First part of meal", "explanation": "Starters come first.",
            "unit_ref": "Practical English 2"
        },
        {
            "page_num": 29, "field_type": "text", "x": 10.0, "y": 30.0, "width": 20.0, "height": 2.0,
            "placeholder": "I'd like...", "label": "PE2.2 Order phrase",
            "correct_answers": ["I'd like the ravioli", "I'd like", "I would like"],
            "hint": "Polite formula to order food", "explanation": "I'd like the ravioli, please.",
            "unit_ref": "Practical English 2"
        },
        {
            "page_num": 29, "field_type": "dropdown", "x": 55.0, "y": 30.0, "width": 14.0, "height": 2.0,
            "placeholder": "water type", "label": "PE2.3 Water",
            "correct_answers": ["sparkling"], "options": ["still", "sparkling", "tap"],
            "hint": "Water with bubbles", "explanation": "Sparkling water has gas/bubbles.",
            "unit_ref": "Practical English 2"
        }
    ],

    # Unit 4A (Page 31: Book page 30 - Housework, make or do?)
    31: [
        {
            "page_num": 31, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 12.0, "height": 2.0,
            "placeholder": "make/do", "label": "4A.1 1 Ironing",
            "correct_answers": ["do"], "options": ["make", "do"],
            "hint": "do the ironing", "explanation": "We say 'do the ironing'.",
            "unit_ref": "Unit 4A Housework"
        },
        {
            "page_num": 31, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 12.0, "height": 2.0,
            "placeholder": "make/do", "label": "4A.1 2 Bed",
            "correct_answers": ["make"], "options": ["make", "do"],
            "hint": "make the bed", "explanation": "We say 'make the bed'.",
            "unit_ref": "Unit 4A Housework"
        },
        {
            "page_num": 31, "field_type": "text", "x": 55.0, "y": 35.0, "width": 18.0, "height": 2.0,
            "placeholder": "'ve just finished", "label": "4A.2 1",
            "correct_answers": ["'ve just finished", "have just finished"],
            "hint": "Action completed a moment ago", "explanation": "I've just finished the washing-up.",
            "unit_ref": "Unit 4A Grammar"
        },
        {
            "page_num": 31, "field_type": "text", "x": 55.0, "y": 38.0, "width": 18.0, "height": 2.0,
            "placeholder": "hasn't arrived yet", "label": "4A.2 2",
            "correct_answers": ["hasn't arrived yet", "has not arrived yet"],
            "hint": "Negative expectation at the end", "explanation": "The post hasn't arrived yet.",
            "unit_ref": "Unit 4A Grammar"
        }
    ],

    # Unit 4B (Page 33: Book page 32 - Shopping)
    33: [
        {
            "page_num": 33, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "fitting room", "label": "4B.1 1",
            "correct_answers": ["fitting room", "changing room"],
            "hint": "Where you try on clothes", "explanation": "A fitting room is where you try on clothes in a shop.",
            "unit_ref": "Unit 4B Shopping"
        },
        {
            "page_num": 33, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "receipt", "label": "4B.1 2",
            "correct_answers": ["receipt"],
            "hint": "Paper slip given when you pay", "explanation": "A receipt is proof of purchase.",
            "unit_ref": "Unit 4B Shopping"
        },
        {
            "page_num": 33, "field_type": "text", "x": 55.0, "y": 35.0, "width": 20.0, "height": 2.0,
            "placeholder": "Have you ever bought", "label": "4B.2 1",
            "correct_answers": ["Have you ever bought"],
            "hint": "Life experience question", "explanation": "Have you ever bought anything online?",
            "unit_ref": "Unit 4B Grammar"
        },
        {
            "page_num": 33, "field_type": "text", "x": 55.0, "y": 38.0, "width": 16.0, "height": 2.0,
            "placeholder": "bought", "label": "4B.2 2",
            "correct_answers": ["bought"],
            "hint": "Specific past time event", "explanation": "Yes, I bought a jacket yesterday.",
            "unit_ref": "Unit 4B Grammar"
        }
    ],

    # Unit 4C (Page 35: Book page 34 - Adjectives -ed & -ing)
    35: [
        {
            "page_num": 35, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "bored/boring", "label": "4C.1 1",
            "correct_answers": ["bored"], "options": ["bored", "boring"],
            "hint": "How the person feels (-ed)", "explanation": "He was bored during the long film.",
            "unit_ref": "Unit 4C Adjectives"
        },
        {
            "page_num": 35, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "bored/boring", "label": "4C.1 2",
            "correct_answers": ["boring"], "options": ["bored", "boring"],
            "hint": "Cause of the feeling (-ing)", "explanation": "The lecture was very boring.",
            "unit_ref": "Unit 4C Adjectives"
        },
        {
            "page_num": 35, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "something", "label": "4C.2 1",
            "correct_answers": ["something"],
            "hint": "An affirmative unspecified item", "explanation": "There is something in my eye.",
            "unit_ref": "Unit 4C Pronouns"
        },
        {
            "page_num": 35, "field_type": "text", "x": 55.0, "y": 38.0, "width": 14.0, "height": 2.0,
            "placeholder": "anybody", "label": "4C.2 2",
            "correct_answers": ["anybody", "anyone"],
            "hint": "Question about people", "explanation": "Did anybody call while I was out?",
            "unit_ref": "Unit 4C Pronouns"
        }
    ],

    # Revise and Check 3&4 (Page 37: Book page 36)
    37: [
        {
            "page_num": 37, "field_type": "dropdown", "x": 10.0, "y": 22.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC3.1",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "Have you ever...?", "explanation": "Have you ever met a famous person? (b)",
            "unit_ref": "Revise & Check 3&4"
        },
        {
            "page_num": 37, "field_type": "dropdown", "x": 10.0, "y": 25.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC3.2",
            "correct_answers": ["a"], "options": ["a", "b", "c"],
            "hint": "already / yet", "explanation": "I've already done my homework. (a)",
            "unit_ref": "Revise & Check 3&4"
        },
        {
            "page_num": 37, "field_type": "text", "x": 55.0, "y": 30.0, "width": 14.0, "height": 2.0,
            "placeholder": "checkout", "label": "RC3.V1",
            "correct_answers": ["checkout"],
            "hint": "Supermarket payment point", "explanation": "Pay at the checkout.",
            "unit_ref": "Revise & Check 3&4"
        }
    ],

    # Unit 5A (Page 39: Book page 38 - Comparatives, as...as)
    39: [
        {
            "page_num": 39, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "faster than", "label": "5A.1 1",
            "correct_answers": ["faster than", "faster"],
            "hint": "Comparative of fast", "explanation": "Life is faster than it used to be.",
            "unit_ref": "Unit 5A Comparatives"
        },
        {
            "page_num": 39, "field_type": "text", "x": 10.0, "y": 31.0, "width": 18.0, "height": 2.0,
            "placeholder": "more patient", "label": "5A.1 2",
            "correct_answers": ["more patient than", "more patient"],
            "hint": "Two-syllable adjective comparative", "explanation": "People are less patient today.",
            "unit_ref": "Unit 5A Comparatives"
        },
        {
            "page_num": 39, "field_type": "text", "x": 55.0, "y": 35.0, "width": 16.0, "height": 2.0,
            "placeholder": "as good as", "label": "5A.2 1",
            "correct_answers": ["as good as"],
            "hint": "as + adjective + as equality", "explanation": "This train isn't as good as the express.",
            "unit_ref": "Unit 5A Comparatives"
        }
    ],

    # Unit 5B (Page 41: Book page 40 - Superlatives & Lost Wallets)
    41: [
        {
            "page_num": 41, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "the most honest", "label": "5B.1 1",
            "correct_answers": ["the most honest", "most honest"],
            "hint": "Superlative of honest", "explanation": "Helsinki was the most honest city in the experiment.",
            "unit_ref": "Unit 5B Superlatives"
        },
        {
            "page_num": 41, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "the best", "label": "5B.1 2",
            "correct_answers": ["the best", "best"],
            "hint": "Irregular superlative of good", "explanation": "It was the best holiday I've ever had.",
            "unit_ref": "Unit 5B Superlatives"
        },
        {
            "page_num": 41, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "crowded", "label": "5B.2 1",
            "correct_answers": ["crowded"],
            "hint": "Full of people", "explanation": "The market was very crowded.",
            "unit_ref": "Unit 5B Vocabulary"
        }
    ],

    # Unit 5C (Page 43: Book page 42 - Quantifiers too / enough)
    43: [
        {
            "page_num": 43, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "much/many", "label": "5C.1 1",
            "correct_answers": ["too much"], "options": ["too much", "too many"],
            "hint": "Uncountable noun (sugar)", "explanation": "There is too much sugar in soda.",
            "unit_ref": "Unit 5C Quantifiers"
        },
        {
            "page_num": 43, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "much/many", "label": "5C.1 2",
            "correct_answers": ["too many"], "options": ["too much", "too many"],
            "hint": "Countable plural noun (calories)", "explanation": "You're eating too many calories.",
            "unit_ref": "Unit 5C Quantifiers"
        },
        {
            "page_num": 43, "field_type": "text", "x": 55.0, "y": 35.0, "width": 16.0, "height": 2.0,
            "placeholder": "not enough time", "label": "5C.2 1",
            "correct_answers": ["not enough time", "enough time", "enough"],
            "hint": "Insufficient duration", "explanation": "I don't have enough time to exercise.",
            "unit_ref": "Unit 5C Quantifiers"
        }
    ],

    # Practical English 3 (Page 45: Book page 44 - Taking something back)
    45: [
        {
            "page_num": 45, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "refund", "label": "PE3.1 1",
            "correct_answers": ["refund", "a refund"],
            "hint": "Getting money back", "explanation": "Can I have a refund, please?",
            "unit_ref": "Practical English 3"
        },
        {
            "page_num": 45, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "exchange", "label": "PE3.1 2",
            "correct_answers": ["exchange", "an exchange"],
            "hint": "Swapping for another size", "explanation": "Can I exchange it for a larger size?",
            "unit_ref": "Practical English 3"
        }
    ],

    # Unit 6A (Page 47: Book page 46 - Will / won't predictions)
    47: [
        {
            "page_num": 47, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "pass", "label": "6A.1 1 Opp",
            "correct_answers": ["pass"],
            "hint": "Opposite of fail", "explanation": "The opposite of fail an exam is pass.",
            "unit_ref": "Unit 6A Opposite Verbs"
        },
        {
            "page_num": 47, "field_type": "text", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "lend", "label": "6A.1 2 Opp",
            "correct_answers": ["lend"],
            "hint": "Opposite of borrow", "explanation": "The opposite of borrow money is lend.",
            "unit_ref": "Unit 6A Opposite Verbs"
        },
        {
            "page_num": 47, "field_type": "text", "x": 55.0, "y": 35.0, "width": 18.0, "height": 2.0,
            "placeholder": "'ll pass", "label": "6A.2 1",
            "correct_answers": ["'ll pass", "will pass"],
            "hint": "Optimistic prediction", "explanation": "Don't worry, you'll pass the exam!",
            "unit_ref": "Unit 6A Grammar"
        },
        {
            "page_num": 47, "field_type": "text", "x": 55.0, "y": 38.0, "width": 18.0, "height": 2.0,
            "placeholder": "won't rain", "label": "6A.2 2",
            "correct_answers": ["won't rain", "will not rain"],
            "hint": "Negative prediction", "explanation": "It won't rain tomorrow.",
            "unit_ref": "Unit 6A Grammar"
        }
    ],

    # Unit 6B (Page 49: Book page 48 - Promises & Offers)
    49: [
        {
            "page_num": 49, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "I'll help", "label": "6B.1 1",
            "correct_answers": ["I'll help you", "I'll help", "I will help"],
            "hint": "Spontaneous offer", "explanation": "That bag looks heavy. I'll help you with it.",
            "unit_ref": "Unit 6B Grammar"
        },
        {
            "page_num": 49, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "Shall I", "label": "6B.1 2",
            "correct_answers": ["Shall I", "shall I"],
            "hint": "Offer suggestion with I", "explanation": "Shall I open the window?",
            "unit_ref": "Unit 6B Grammar"
        },
        {
            "page_num": 49, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "call back", "label": "6B.2 1",
            "correct_answers": ["call back", "call you back"],
            "hint": "Return phone call", "explanation": "I'm busy now, I'll call back later.",
            "unit_ref": "Unit 6B Verb + Back"
        }
    ],

    # Unit 6C (Page 51: Book page 50 - Review of Verb Forms)
    51: [
        {
            "page_num": 51, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "dreamed", "label": "6C.1 1",
            "correct_answers": ["dreamed", "dreamt"],
            "hint": "Past of dream", "explanation": "Last night I dreamed about flying.",
            "unit_ref": "Unit 6C Grammar"
        },
        {
            "page_num": 51, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "Modifier", "label": "6C.2 Mod",
            "correct_answers": ["incredibly"], "options": ["incredibly", "quite", "a bit"],
            "hint": "Strongest emphasis modifier", "explanation": "It was an incredibly exciting dream.",
            "unit_ref": "Unit 6C Modifiers"
        }
    ],

    # Revise and Check 5&6 (Page 53: Book page 52)
    53: [
        {
            "page_num": 53, "field_type": "dropdown", "x": 10.0, "y": 22.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC5.1",
            "correct_answers": ["c"], "options": ["a", "b", "c"],
            "hint": "will win", "explanation": "I think Brazil will win the match. (c)",
            "unit_ref": "Revise & Check 5&6"
        },
        {
            "page_num": 53, "field_type": "dropdown", "x": 10.0, "y": 25.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC5.2",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "too much / too many", "explanation": "Don't drink too much coffee. (b)",
            "unit_ref": "Revise & Check 5&6"
        }
    ],

    # Unit 7A (Page 55: Book page 54 - Infinitive with to)
    55: [
        {
            "page_num": 55, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "to find", "label": "7A.1 1",
            "correct_answers": ["to find"],
            "hint": "infinitive with to", "explanation": "It's difficult to find a parking space.",
            "unit_ref": "Unit 7A Grammar"
        },
        {
            "page_num": 55, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "to meet", "label": "7A.1 2",
            "correct_answers": ["to meet"],
            "hint": "verb + to + verb", "explanation": "I decided to meet them at 8.00.",
            "unit_ref": "Unit 7A Grammar"
        },
        {
            "page_num": 55, "field_type": "text", "x": 55.0, "y": 35.0, "width": 16.0, "height": 2.0,
            "placeholder": "promised to", "label": "7A.2 1",
            "correct_answers": ["promised to", "promised"],
            "hint": "make a promise", "explanation": "He promised to phone me later.",
            "unit_ref": "Unit 7A Verbs + Infinitive"
        }
    ],

    # Unit 7B (Page 57: Book page 56 - Gerunds: verb + -ing)
    57: [
        {
            "page_num": 57, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "swimming", "label": "7B.1 1",
            "correct_answers": ["swimming"],
            "hint": "Subject of sentence (-ing)", "explanation": "Swimming is great exercise.",
            "unit_ref": "Unit 7B Grammar"
        },
        {
            "page_num": 57, "field_type": "text", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "cooking", "label": "7B.1 2",
            "correct_answers": ["cooking"],
            "hint": "like / hate + -ing", "explanation": "I really enjoy cooking dinner for friends.",
            "unit_ref": "Unit 7B Grammar"
        },
        {
            "page_num": 57, "field_type": "dropdown", "x": 55.0, "y": 35.0, "width": 10.0, "height": 2.0,
            "placeholder": "prep", "label": "7B.2 1",
            "correct_answers": ["at"], "options": ["at", "in", "of"],
            "hint": "good at doing something", "explanation": "She's very good at learning languages.",
            "unit_ref": "Unit 7B Prepositions"
        }
    ],

    # Unit 7C (Page 59: Book page 58 - Have to, must, mustn't)
    59: [
        {
            "page_num": 59, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "must/mustn't", "label": "7C.1 1",
            "correct_answers": ["mustn't"], "options": ["must", "mustn't", "don't have to"],
            "hint": "Prohibition", "explanation": "You mustn't park here; it's illegal.",
            "unit_ref": "Unit 7C Rules"
        },
        {
            "page_num": 59, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "obligation", "label": "7C.1 2",
            "correct_answers": ["have to"], "options": ["have to", "mustn't", "should"],
            "hint": "External rule", "explanation": "In Britain, cars have to drive on the left.",
            "unit_ref": "Unit 7C Rules"
        },
        {
            "page_num": 59, "field_type": "dropdown", "x": 55.0, "y": 35.0, "width": 12.0, "height": 2.0,
            "placeholder": "afraid...", "label": "7C.2 Adj",
            "correct_answers": ["of"], "options": ["of", "at", "with"],
            "hint": "afraid of spiders", "explanation": "Many people are afraid of spiders.",
            "unit_ref": "Unit 7C Adjectives + Prep"
        }
    ],

    # Practical English 4 (Page 61: Book page 60 - At a pharmacy)
    61: [
        {
            "page_num": 61, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "headache", "label": "PE4.1 1",
            "correct_answers": ["headache", "a headache"],
            "hint": "Pain in head", "explanation": "I have a bad headache.",
            "unit_ref": "Practical English 4"
        },
        {
            "page_num": 61, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "painkillers", "label": "PE4.1 2",
            "correct_answers": ["painkillers"],
            "hint": "Medicine for pain relief", "explanation": "Take these painkillers every four hours.",
            "unit_ref": "Practical English 4"
        }
    ],

    # Unit 8A (Page 63: Book page 62 - Should / shouldn't for advice)
    63: [
        {
            "page_num": 63, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "should see", "label": "8A.1 1",
            "correct_answers": ["should see", "should go to"],
            "hint": "Advice formula", "explanation": "You look ill. You should see a doctor.",
            "unit_ref": "Unit 8A Advice"
        },
        {
            "page_num": 63, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "shouldn't stay", "label": "8A.1 2",
            "correct_answers": ["shouldn't stay up", "should not stay", "shouldn't stay"],
            "hint": "Negative advice", "explanation": "You shouldn't stay up so late before an exam.",
            "unit_ref": "Unit 8A Advice"
        },
        {
            "page_num": 63, "field_type": "dropdown", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "Meaning of get", "label": "8A.2 get",
            "correct_answers": ["receive"], "options": ["receive", "become", "arrive"],
            "hint": "get an email", "explanation": "Here 'get' means receive.",
            "unit_ref": "Unit 8A Uses of Get"
        }
    ],

    # Unit 8B (Page 65: Book page 64 - First conditional)
    65: [
        {
            "page_num": 65, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "will be", "label": "8B.1 1",
            "correct_answers": ["will be", "'ll be"],
            "hint": "if + present, will + infinitive", "explanation": "If you don't leave now, you'll be late.",
            "unit_ref": "Unit 8B First Conditional"
        },
        {
            "page_num": 65, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "rains", "label": "8B.1 2",
            "correct_answers": ["rains"],
            "hint": "present simple in if clause", "explanation": "If it rains, we won't go to the beach.",
            "unit_ref": "Unit 8B First Conditional"
        },
        {
            "page_num": 65, "field_type": "dropdown", "x": 55.0, "y": 35.0, "width": 12.0, "height": 2.0,
            "placeholder": "wear/carry", "label": "8B.2 1",
            "correct_answers": ["wear"], "options": ["wear", "carry"],
            "hint": "Clothes on body", "explanation": "She always wears smart clothes.",
            "unit_ref": "Unit 8B Confusing Verbs"
        }
    ],

    # Unit 8C (Page 67: Book page 66 - Possessive Pronouns)
    67: [
        {
            "page_num": 67, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 10.0, "height": 2.0,
            "placeholder": "pronoun", "label": "8C.1 1",
            "correct_answers": ["mine"], "options": ["my", "mine", "me"],
            "hint": "Stands alone without noun", "explanation": "This book isn't yours, it's mine.",
            "unit_ref": "Unit 8C Possessive Pronouns"
        },
        {
            "page_num": 67, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 10.0, "height": 2.0,
            "placeholder": "pronoun", "label": "8C.1 2",
            "correct_answers": ["hers"], "options": ["her", "hers", "she"],
            "hint": "Belonging to her", "explanation": "That coat is hers.",
            "unit_ref": "Unit 8C Possessive Pronouns"
        },
        {
            "page_num": 67, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "politely", "label": "8C.2 1",
            "correct_answers": ["politely"],
            "hint": "Adverb form of polite", "explanation": "He asked politely for directions.",
            "unit_ref": "Unit 8C Adverbs of Manner"
        }
    ],

    # Revise and Check 7&8 (Page 69: Book page 68)
    69: [
        {
            "page_num": 69, "field_type": "dropdown", "x": 10.0, "y": 22.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC7.1",
            "correct_answers": ["a"], "options": ["a", "b", "c"],
            "hint": "should study", "explanation": "You should study more. (a)",
            "unit_ref": "Revise & Check 7&8"
        },
        {
            "page_num": 69, "field_type": "dropdown", "x": 10.0, "y": 25.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC7.2",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "First conditional", "explanation": "If I see him, I'll tell him. (b)",
            "unit_ref": "Revise & Check 7&8"
        }
    ],

    # Unit 9A (Page 71: Book page 70 - Second conditional)
    71: [
        {
            "page_num": 71, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "would buy", "label": "9A.1 1",
            "correct_answers": ["would buy", "'d buy"],
            "hint": "hypothetical result with would", "explanation": "If I won the lottery, I would buy a house.",
            "unit_ref": "Unit 9A Second Conditional", "audio_track": "4.16"
        },
        {
            "page_num": 71, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "had", "label": "9A.1 2",
            "correct_answers": ["had"],
            "hint": "past simple in hypothetical if clause", "explanation": "If I had more time, I would learn Spanish.",
            "unit_ref": "Unit 9A Second Conditional", "audio_track": "4.16"
        },
        {
            "page_num": 71, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "shark", "label": "9A.2 1",
            "correct_answers": ["shark"],
            "hint": "Large dangerous ocean fish", "explanation": "A shark is a large predator fish.",
            "unit_ref": "Unit 9A Animals"
        },
        {
            "page_num": 71, "field_type": "text", "x": 55.0, "y": 38.0, "width": 14.0, "height": 2.0,
            "placeholder": "mosquito", "label": "9A.2 2",
            "correct_answers": ["mosquito"],
            "hint": "Small flying insect that bites", "explanation": "A mosquito can transmit diseases.",
            "unit_ref": "Unit 9A Animals"
        }
    ],

    # Unit 9B (Page 73: Book page 72 - Present perfect + for/since)
    73: [
        {
            "page_num": 73, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 10.0, "height": 2.0,
            "placeholder": "for/since", "label": "9B.1 1",
            "correct_answers": ["for"], "options": ["for", "since"],
            "hint": "Period of time", "explanation": "I've lived here for ten years.",
            "unit_ref": "Unit 9B For and Since", "audio_track": "4.20"
        },
        {
            "page_num": 73, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 10.0, "height": 2.0,
            "placeholder": "for/since", "label": "9B.1 2",
            "correct_answers": ["since"], "options": ["for", "since"],
            "hint": "Starting point in the past", "explanation": "She's been afraid of heights since childhood.",
            "unit_ref": "Unit 9B For and Since", "audio_track": "4.20"
        },
        {
            "page_num": 73, "field_type": "text", "x": 55.0, "y": 35.0, "width": 16.0, "height": 2.0,
            "placeholder": "phobia", "label": "9B.2 1",
            "correct_answers": ["phobia"],
            "hint": "An irrational fear of something", "explanation": "A phobia is an extreme or irrational fear.",
            "unit_ref": "Unit 9B Vocabulary"
        }
    ],

    # Unit 9C (Page 75: Book page 74 - Present perfect vs past simple 2)
    75: [
        {
            "page_num": 75, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "How long have you", "label": "9C.1 1",
            "correct_answers": ["How long have you lived", "How long have you been"],
            "hint": "Duration up to present", "explanation": "How long have you lived in this town?",
            "unit_ref": "Unit 9C Grammar", "audio_track": "4.25"
        },
        {
            "page_num": 75, "field_type": "text", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "moved", "label": "9C.1 2",
            "correct_answers": ["did you move", "moved"],
            "hint": "Specific finished past point", "explanation": "When did you move here?",
            "unit_ref": "Unit 9C Grammar", "audio_track": "4.25"
        }
    ],

    # Practical English 5 (Page 77: Book page 76 - Asking directions)
    77: [
        {
            "page_num": 77, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "Could you tell me", "label": "PE5.1 Directions",
            "correct_answers": ["Could you tell me the way to", "Could you tell me"],
            "hint": "Polite formula to ask for directions", "explanation": "Could you tell me the way to Grand Central Station?",
            "unit_ref": "Practical English 5", "audio_track": "4.31"
        },
        {
            "page_num": 77, "field_type": "dropdown", "x": 55.0, "y": 32.0, "width": 14.0, "height": 2.0,
            "placeholder": "Ticket", "label": "PE5.2 Ticket type",
            "correct_answers": ["Return"], "options": ["Single", "Return"],
            "hint": "Round trip ticket", "explanation": "A return ticket allows travel both ways.",
            "unit_ref": "Practical English 5", "audio_track": "4.33"
        }
    ],

    # Unit 10A (Page 79: Book page 78 - Movement & Sports)
    79: [
        {
            "page_num": 79, "field_type": "dropdown", "x": 10.0, "y": 28.0, "width": 12.0, "height": 2.0,
            "placeholder": "prep", "label": "10A.1 1",
            "correct_answers": ["into"], "options": ["into", "out of", "over"],
            "hint": "Entering the net", "explanation": "He kicked the ball into the net.",
            "unit_ref": "Unit 10A Movement", "audio_track": "4.37"
        },
        {
            "page_num": 79, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 12.0, "height": 2.0,
            "placeholder": "prep", "label": "10A.1 2",
            "correct_answers": ["over"], "options": ["over", "under", "through"],
            "hint": "Above the bar", "explanation": "The athlete jumped over the high bar.",
            "unit_ref": "Unit 10A Movement", "audio_track": "4.37"
        },
        {
            "page_num": 79, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "athletics", "label": "10A.2 1",
            "correct_answers": ["athletics"],
            "hint": "Track and field sports", "explanation": "Athletics includes running, jumping, and throwing.",
            "unit_ref": "Unit 10A Sports", "audio_track": "4.39"
        }
    ],

    # Unit 10B (Page 81: Book page 80 - Phrasal verbs)
    81: [
        {
            "page_num": 81, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "turn it off", "label": "10B.1 1",
            "correct_answers": ["turn it off"],
            "hint": "Pronoun placed between verb and particle", "explanation": "The TV is loud. Please turn it off.",
            "unit_ref": "Unit 10B Phrasal Verbs", "audio_track": "4.42"
        },
        {
            "page_num": 81, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "wake up", "label": "10B.1 2",
            "correct_answers": ["wake up"],
            "hint": "Stop sleeping", "explanation": "What time do you usually wake up?",
            "unit_ref": "Unit 10B Phrasal Verbs", "audio_track": "4.42"
        },
        {
            "page_num": 81, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "give up", "label": "10B.2 1",
            "correct_answers": ["give up"],
            "hint": "Stop doing a habit", "explanation": "He decided to give up smoking.",
            "unit_ref": "Unit 10B Phrasal Verbs", "audio_track": "4.42"
        }
    ],

    # Unit 10C (Page 83: Book page 82 - The Passive)
    83: [
        {
            "page_num": 83, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "was invented", "label": "10C.1 1",
            "correct_answers": ["was invented by", "was invented"],
            "hint": "Past passive of invent", "explanation": "The telephone was invented by Alexander Graham Bell.",
            "unit_ref": "Unit 10C The Passive", "audio_track": "4.48"
        },
        {
            "page_num": 83, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "is made", "label": "10C.1 2",
            "correct_answers": ["is made"],
            "hint": "Present passive of make", "explanation": "This olive oil is made in Greece.",
            "unit_ref": "Unit 10C The Passive", "audio_track": "4.48"
        }
    ],

    # Revise and Check 9&10 (Page 85: Book page 84)
    85: [
        {
            "page_num": 85, "field_type": "dropdown", "x": 10.0, "y": 22.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC9.1",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "Second conditional", "explanation": "If I had more money, I'd travel. (b)",
            "unit_ref": "Revise & Check 9&10", "audio_track": "4.54"
        },
        {
            "page_num": 85, "field_type": "dropdown", "x": 10.0, "y": 25.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC9.2",
            "correct_answers": ["a"], "options": ["a", "b", "c"],
            "hint": "Passive voice", "explanation": "The book was written in 1920. (a)",
            "unit_ref": "Revise & Check 9&10", "audio_track": "4.54"
        }
    ],

    # Unit 11A (Page 87: Book page 86 - Used to)
    87: [
        {
            "page_num": 87, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "used to have", "label": "11A.1 1",
            "correct_answers": ["used to have"],
            "hint": "Past habitual state", "explanation": "I used to have long hair when I was younger.",
            "unit_ref": "Unit 11A Used To"
        },
        {
            "page_num": 87, "field_type": "text", "x": 10.0, "y": 31.0, "width": 18.0, "height": 2.0,
            "placeholder": "didn't use to like", "label": "11A.1 2",
            "correct_answers": ["didn't use to like", "did not use to like"],
            "hint": "Negative past habit", "explanation": "I didn't use to like vegetables as a child.",
            "unit_ref": "Unit 11A Used To"
        },
        {
            "page_num": 87, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "geography", "label": "11A.2 1",
            "correct_answers": ["geography"],
            "hint": "Study of world maps and countries", "explanation": "Geography is the study of the earth's features.",
            "unit_ref": "Unit 11A School Subjects"
        }
    ],

    # Unit 11B (Page 89: Book page 88 - Might for possibility)
    89: [
        {
            "page_num": 89, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "might rain", "label": "11B.1 1",
            "correct_answers": ["might rain"],
            "hint": "Possible future event", "explanation": "Take an umbrella; it might rain later.",
            "unit_ref": "Unit 11B Might"
        },
        {
            "page_num": 89, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "might not come", "label": "11B.1 2",
            "correct_answers": ["might not come"],
            "hint": "Negative possibility", "explanation": "She might not come to the party tonight.",
            "unit_ref": "Unit 11B Might"
        },
        {
            "page_num": 89, "field_type": "text", "x": 55.0, "y": 35.0, "width": 14.0, "height": 2.0,
            "placeholder": "decision", "label": "11B.2 1",
            "correct_answers": ["decision"],
            "hint": "Noun of decide", "explanation": "It's difficult to make a decision.",
            "unit_ref": "Unit 11B Word Building"
        }
    ],

    # Unit 11C (Page 91: Book page 90 - So, Neither + Auxiliaries)
    91: [
        {
            "page_num": 91, "field_type": "text", "x": 10.0, "y": 28.0, "width": 14.0, "height": 2.0,
            "placeholder": "So do I", "label": "11C.1 1",
            "correct_answers": ["So do I", "so do I"],
            "hint": "Agreement with 'I love chocolate'", "explanation": "I love chocolate. - So do I.",
            "unit_ref": "Unit 11C Agreement"
        },
        {
            "page_num": 91, "field_type": "text", "x": 10.0, "y": 31.0, "width": 14.0, "height": 2.0,
            "placeholder": "Neither can I", "label": "11C.1 2",
            "correct_answers": ["Neither can I", "neither can I"],
            "hint": "Agreement with 'I can't swim'", "explanation": "I can't swim. - Neither can I.",
            "unit_ref": "Unit 11C Agreement"
        }
    ],

    # Unit 12A (Page 95: Book page 94 - Past Perfect)
    95: [
        {
            "page_num": 95, "field_type": "text", "x": 10.0, "y": 28.0, "width": 18.0, "height": 2.0,
            "placeholder": "had already left", "label": "12A.1 1",
            "correct_answers": ["had already left", "had left"],
            "hint": "Action happened before another past action", "explanation": "When I arrived at the station, the train had already left.",
            "unit_ref": "Unit 12A Past Perfect"
        },
        {
            "page_num": 95, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "had lost", "label": "12A.1 2",
            "correct_answers": ["had lost"],
            "hint": "Earlier past event", "explanation": "He couldn't get into his flat because he had lost his keys.",
            "unit_ref": "Unit 12A Past Perfect"
        }
    ],

    # Unit 12B (Page 97: Book page 96 - Reported Speech)
    97: [
        {
            "page_num": 97, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "was", "label": "12B.1 1",
            "correct_answers": ["was", "he was"],
            "hint": "Tense shift from 'I am tired'", "explanation": "He said that he was tired.",
            "unit_ref": "Unit 12B Reported Speech"
        },
        {
            "page_num": 97, "field_type": "dropdown", "x": 10.0, "y": 31.0, "width": 12.0, "height": 2.0,
            "placeholder": "said/told", "label": "12B.1 2",
            "correct_answers": ["told"], "options": ["said", "told"],
            "hint": "told + person", "explanation": "She told me that she loved the film.",
            "unit_ref": "Unit 12B Say vs Tell"
        }
    ],

    # Unit 12C (Page 99: Book page 98 - Questions without auxiliaries)
    99: [
        {
            "page_num": 99, "field_type": "text", "x": 10.0, "y": 28.0, "width": 16.0, "height": 2.0,
            "placeholder": "Who wrote", "label": "12C.1 1",
            "correct_answers": ["Who wrote", "who wrote"],
            "hint": "Subject question (no did)", "explanation": "Who wrote Romeo and Juliet? (Shakespeare wrote it.)",
            "unit_ref": "Unit 12C Subject Questions"
        },
        {
            "page_num": 99, "field_type": "text", "x": 10.0, "y": 31.0, "width": 16.0, "height": 2.0,
            "placeholder": "What happened", "label": "12C.1 2",
            "correct_answers": ["What happened", "what happened"],
            "hint": "Subject question", "explanation": "What happened next?",
            "unit_ref": "Unit 12C Subject Questions"
        }
    ],

    # Revise and Check 11&12 (Page 101: Book page 100 - Final Course Review)
    101: [
        {
            "page_num": 101, "field_type": "dropdown", "x": 10.0, "y": 22.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC11.1",
            "correct_answers": ["a"], "options": ["a", "b", "c"],
            "hint": "Past perfect", "explanation": "He told me he had never been to Spain. (a)",
            "unit_ref": "Revise & Check 11&12"
        },
        {
            "page_num": 101, "field_type": "dropdown", "x": 10.0, "y": 25.0, "width": 8.0, "height": 2.0,
            "placeholder": "a/b/c", "label": "RC11.2",
            "correct_answers": ["b"], "options": ["a", "b", "c"],
            "hint": "Question without auxiliary", "explanation": "Who directed Titanic? (b)",
            "unit_ref": "Revise & Check 11&12"
        },
        {
            "page_num": 101, "field_type": "text", "x": 55.0, "y": 30.0, "width": 14.0, "height": 2.0,
            "placeholder": "maths", "label": "RC11.V1",
            "correct_answers": ["maths", "mathematics"],
            "hint": "School subject with numbers", "explanation": "Subject with numbers and equations is maths.",
            "unit_ref": "Revise & Check 11&12 Vocabulary"
        }
    ],

    # Grammar Bank 3A, 3B, 3C (Page 132: Book page 131)
    132: [
        {
            "page_num": 132, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "'m going to study", "label": "3A.a 1",
            "correct_answers": ["'m going to study", "am going to study"],
            "hint": "be going to + study", "explanation": "I'm going to study engineering next year.",
            "unit_ref": "Grammar Bank 3A"
        },
        {
            "page_num": 132, "field_type": "text", "x": 11.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "'re flying", "label": "3B.a 1",
            "correct_answers": ["'re flying", "are flying"],
            "hint": "present continuous for fixed future", "explanation": "We're flying to Rome on Friday.",
            "unit_ref": "Grammar Bank 3B"
        },
        {
            "page_num": 132, "field_type": "dropdown", "x": 56.5, "y": 70.0, "width": 12.0, "height": 1.8,
            "placeholder": "relative", "label": "3C.a 1",
            "correct_answers": ["who", "that"], "options": ["who", "which", "where"],
            "hint": "person", "explanation": "She's the woman who helped me.",
            "unit_ref": "Grammar Bank 3C"
        }
    ],

    # Grammar Bank 4A, 4B, 4C (Page 134: Book page 133)
    134: [
        {
            "page_num": 134, "field_type": "text", "x": 11.5, "y": 14.0, "width": 26.0, "height": 1.8,
            "placeholder": "have you done", "label": "4A.a 1",
            "correct_answers": ["Have you done", "have you done"],
            "hint": "present perfect of do", "explanation": "Have you done the washing-up yet?",
            "unit_ref": "Grammar Bank 4A"
        },
        {
            "page_num": 134, "field_type": "text", "x": 56.5, "y": 42.0, "width": 26.0, "height": 1.8,
            "placeholder": "went", "label": "4B.a 1",
            "correct_answers": ["went"],
            "hint": "past simple with last year", "explanation": "I went to Italy last year.",
            "unit_ref": "Grammar Bank 4B"
        }
    ],

    # Grammar Bank 5A, 5B, 5C (Page 136: Book page 135)
    136: [
        {
            "page_num": 136, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "taller than", "label": "5A.a 1",
            "correct_answers": ["taller than", "taller"],
            "hint": "comparative of tall", "explanation": "Mark is taller than his brother.",
            "unit_ref": "Grammar Bank 5A"
        },
        {
            "page_num": 136, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "the biggest", "label": "5B.a 1",
            "correct_answers": ["the biggest", "biggest"],
            "hint": "superlative of big", "explanation": "Russia is the biggest country in the world.",
            "unit_ref": "Grammar Bank 5B"
        }
    ],

    # Grammar Bank 6A, 6B, 6C (Page 138: Book page 137)
    138: [
        {
            "page_num": 138, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "'ll pass", "label": "6A.a 1",
            "correct_answers": ["will pass", "'ll pass"],
            "hint": "will + infinitive", "explanation": "I'm sure you will pass.",
            "unit_ref": "Grammar Bank 6A"
        },
        {
            "page_num": 138, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "Shall I", "label": "6B.a 1",
            "correct_answers": ["Shall I", "shall I"],
            "hint": "offer", "explanation": "Shall I carry that for you?",
            "unit_ref": "Grammar Bank 6B"
        }
    ],

    # Grammar Bank 7A, 7B, 7C (Page 140: Book page 139)
    140: [
        {
            "page_num": 140, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "to see", "label": "7A.a 1",
            "correct_answers": ["to see"],
            "hint": "want + to + verb", "explanation": "I want to see the doctor.",
            "unit_ref": "Grammar Bank 7A"
        },
        {
            "page_num": 140, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "reading", "label": "7B.a 1",
            "correct_answers": ["reading"],
            "hint": "enjoy + -ing", "explanation": "I enjoy reading historical novels.",
            "unit_ref": "Grammar Bank 7B"
        }
    ],

    # Grammar Bank 8A, 8B, 8C (Page 142: Book page 141)
    142: [
        {
            "page_num": 142, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "should", "label": "8A.a 1",
            "correct_answers": ["should"],
            "hint": "advice", "explanation": "You should take an aspirin.",
            "unit_ref": "Grammar Bank 8A"
        },
        {
            "page_num": 142, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "'ll call", "label": "8B.a 1",
            "correct_answers": ["will call", "'ll call"],
            "hint": "first conditional result", "explanation": "If she phones, I'll tell her.",
            "unit_ref": "Grammar Bank 8B"
        }
    ],

    # Grammar Bank 9A, 9B, 9C (Page 144: Book page 143)
    144: [
        {
            "page_num": 144, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "would you do", "label": "9A.a 1",
            "correct_answers": ["would you do"],
            "hint": "second conditional question", "explanation": "What would you do if you found a wallet?",
            "unit_ref": "Grammar Bank 9A"
        },
        {
            "page_num": 144, "field_type": "dropdown", "x": 56.5, "y": 42.0, "width": 10.0, "height": 1.8,
            "placeholder": "for/since", "label": "9B.a 1",
            "correct_answers": ["since"], "options": ["for", "since"],
            "hint": "point in time", "explanation": "since 2015",
            "unit_ref": "Grammar Bank 9B"
        }
    ],

    # Grammar Bank 10A, 10B, 10C (Page 146: Book page 145)
    146: [
        {
            "page_num": 146, "field_type": "dropdown", "x": 11.5, "y": 14.0, "width": 12.0, "height": 1.8,
            "placeholder": "movement", "label": "10A.a 1",
            "correct_answers": ["into"], "options": ["into", "over", "through"],
            "hint": "walk into the room", "explanation": "She walked into the room.",
            "unit_ref": "Grammar Bank 10A"
        },
        {
            "page_num": 146, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "was built", "label": "10C.a 1",
            "correct_answers": ["was built"],
            "hint": "past passive of build", "explanation": "The bridge was built in 1894.",
            "unit_ref": "Grammar Bank 10C"
        }
    ],

    # Grammar Bank 11A, 11B, 11C (Page 148: Book page 147)
    148: [
        {
            "page_num": 148, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "used to live", "label": "11A.a 1",
            "correct_answers": ["used to live"],
            "hint": "habitual past", "explanation": "We used to live in Manchester.",
            "unit_ref": "Grammar Bank 11A"
        },
        {
            "page_num": 148, "field_type": "text", "x": 56.5, "y": 42.0, "width": 20.0, "height": 1.8,
            "placeholder": "Neither do I", "label": "11C.a 1",
            "correct_answers": ["Neither do I", "neither do I"],
            "hint": "negative agreement", "explanation": "I don't like horror movies. - Neither do I.",
            "unit_ref": "Grammar Bank 11C"
        }
    ],

    # Grammar Bank 12A, 12B, 12C (Page 150: Book page 149)
    150: [
        {
            "page_num": 150, "field_type": "text", "x": 11.5, "y": 14.0, "width": 24.0, "height": 1.8,
            "placeholder": "had left", "label": "12A.a 1",
            "correct_answers": ["had left"],
            "hint": "past perfect", "explanation": "By the time we got there, the concert had left/started.",
            "unit_ref": "Grammar Bank 12A"
        },
        {
            "page_num": 150, "field_type": "text", "x": 56.5, "y": 42.0, "width": 24.0, "height": 1.8,
            "placeholder": "Who painted", "label": "12C.a 1",
            "correct_answers": ["Who painted", "who painted"],
            "hint": "subject question without did", "explanation": "Who painted the Mona Lisa?",
            "unit_ref": "Grammar Bank 12C"
        }
    ],

    # Vocabulary Bank: Describing a town or city (Page 157: Book page 156)
    157: [
        {
            "page_num": 157, "field_type": "text", "x": 10.0, "y": 24.0, "width": 14.0, "height": 1.8,
            "placeholder": "polluted", "label": "City 1 Opp",
            "correct_answers": ["polluted"], "hint": "Opposite of clean", "explanation": "polluted",
            "unit_ref": "Vocab Bank City"
        },
        {
            "page_num": 157, "field_type": "text", "x": 10.0, "y": 27.0, "width": 14.0, "height": 1.8,
            "placeholder": "dangerous", "label": "City 2 Opp",
            "correct_answers": ["dangerous"], "hint": "Opposite of safe", "explanation": "dangerous",
            "unit_ref": "Vocab Bank City"
        },
        {
            "page_num": 157, "field_type": "text", "x": 10.0, "y": 30.0, "width": 14.0, "height": 1.8,
            "placeholder": "noisy", "label": "City 3 Opp",
            "correct_answers": ["noisy"], "hint": "Opposite of quiet", "explanation": "noisy",
            "unit_ref": "Vocab Bank City"
        }
    ],

    # Vocabulary Bank: Opposite verbs (Page 158: Book page 157)
    158: [
        {
            "page_num": 158, "field_type": "text", "x": 10.0, "y": 24.0, "width": 14.0, "height": 1.8,
            "placeholder": "pass", "label": "Opp 1 fail",
            "correct_answers": ["pass"], "hint": "Opposite of fail", "explanation": "pass an exam",
            "unit_ref": "Vocab Bank Opposites"
        },
        {
            "page_num": 158, "field_type": "text", "x": 10.0, "y": 27.0, "width": 14.0, "height": 1.8,
            "placeholder": "lend", "label": "Opp 2 borrow",
            "correct_answers": ["lend"], "hint": "Opposite of borrow", "explanation": "lend money",
            "unit_ref": "Vocab Bank Opposites"
        },
        {
            "page_num": 158, "field_type": "text", "x": 10.0, "y": 30.0, "width": 14.0, "height": 1.8,
            "placeholder": "catch", "label": "Opp 3 miss",
            "correct_answers": ["catch"], "hint": "Opposite of miss the bus", "explanation": "catch the bus",
            "unit_ref": "Vocab Bank Opposites"
        }
    ],

    # Vocabulary Bank: Verb forms (Page 159: Book page 158)
    159: [
        {
            "page_num": 159, "field_type": "dropdown", "x": 10.0, "y": 24.0, "width": 16.0, "height": 1.8,
            "placeholder": "Form", "label": "VF 1 enjoy",
            "correct_answers": ["gerund", "-ing"], "options": ["infinitive", "gerund"],
            "hint": "enjoy + -ing", "explanation": "enjoy is followed by gerund (-ing)",
            "unit_ref": "Vocab Bank Verb Forms"
        },
        {
            "page_num": 159, "field_type": "dropdown", "x": 10.0, "y": 27.0, "width": 16.0, "height": 1.8,
            "placeholder": "Form", "label": "VF 2 decide",
            "correct_answers": ["infinitive", "to + verb"], "options": ["infinitive", "gerund"],
            "hint": "decide + to + verb", "explanation": "decide is followed by infinitive with to",
            "unit_ref": "Vocab Bank Verb Forms"
        }
    ],

    # Vocabulary Bank: Confusing verbs (Page 160: Book page 159)
    160: [
        {
            "page_num": 160, "field_type": "dropdown", "x": 10.0, "y": 24.0, "width": 14.0, "height": 1.8,
            "placeholder": "wear/carry", "label": "CV 1",
            "correct_answers": ["wear"], "options": ["wear", "carry"],
            "hint": "Clothes on body", "explanation": "wear clothes",
            "unit_ref": "Vocab Bank Confusing Verbs"
        },
        {
            "page_num": 160, "field_type": "dropdown", "x": 10.0, "y": 27.0, "width": 14.0, "height": 1.8,
            "placeholder": "wear/carry", "label": "CV 2",
            "correct_answers": ["carry"], "options": ["wear", "carry"],
            "hint": "Hold a bag in hand", "explanation": "carry a bag",
            "unit_ref": "Vocab Bank Confusing Verbs"
        },
        {
            "page_num": 160, "field_type": "dropdown", "x": 10.0, "y": 30.0, "width": 14.0, "height": 1.8,
            "placeholder": "meet/know", "label": "CV 3",
            "correct_answers": ["know"], "options": ["meet", "know"],
            "hint": "Have known for years", "explanation": "know someone for years",
            "unit_ref": "Vocab Bank Confusing Verbs"
        }
    ],

    # Vocabulary Bank: Animals and insects (Page 161: Book page 160)
    161: [
        {
            "page_num": 161, "field_type": "text", "x": 10.0, "y": 24.0, "width": 12.0, "height": 1.8,
            "placeholder": "dolphin", "label": "Anim 1",
            "correct_answers": ["dolphin"], "hint": "Intelligent sea mammal", "explanation": "dolphin",
            "unit_ref": "Vocab Bank Animals"
        },
        {
            "page_num": 161, "field_type": "text", "x": 10.0, "y": 27.0, "width": 12.0, "height": 1.8,
            "placeholder": "bee", "label": "Anim 2",
            "correct_answers": ["bee"], "hint": "Yellow and black insect making honey", "explanation": "bee",
            "unit_ref": "Vocab Bank Animals"
        },
        {
            "page_num": 161, "field_type": "text", "x": 10.0, "y": 30.0, "width": 12.0, "height": 1.8,
            "placeholder": "eagle", "label": "Anim 3",
            "correct_answers": ["eagle"], "hint": "Large bird of prey", "explanation": "eagle",
            "unit_ref": "Vocab Bank Animals"
        }
    ],

    # Vocabulary Bank: Expressing movement (Page 162: Book page 161)
    162: [
        {
            "page_num": 162, "field_type": "text", "x": 10.0, "y": 24.0, "width": 14.0, "height": 1.8,
            "placeholder": "into", "label": "Move 1",
            "correct_answers": ["into"], "hint": "Entering", "explanation": "into",
            "unit_ref": "Vocab Bank Movement"
        },
        {
            "page_num": 162, "field_type": "text", "x": 10.0, "y": 27.0, "width": 14.0, "height": 1.8,
            "placeholder": "out of", "label": "Move 2",
            "correct_answers": ["out of"], "hint": "Exiting", "explanation": "out of",
            "unit_ref": "Vocab Bank Movement"
        },
        {
            "page_num": 162, "field_type": "text", "x": 10.0, "y": 30.0, "width": 14.0, "height": 1.8,
            "placeholder": "through", "label": "Move 3",
            "correct_answers": ["through"], "hint": "Passing inside a tunnel or forest", "explanation": "through",
            "unit_ref": "Vocab Bank Movement"
        }
    ],

    # Vocabulary Bank: Phrasal verbs (Page 163: Book page 162)
    163: [
        {
            "page_num": 163, "field_type": "text", "x": 10.0, "y": 24.0, "width": 14.0, "height": 1.8,
            "placeholder": "look for", "label": "PV 1",
            "correct_answers": ["look for"], "hint": "Try to find", "explanation": "look for",
            "unit_ref": "Vocab Bank Phrasal Verbs"
        },
        {
            "page_num": 163, "field_type": "text", "x": 10.0, "y": 27.0, "width": 14.0, "height": 1.8,
            "placeholder": "give up", "label": "PV 2",
            "correct_answers": ["give up"], "hint": "Stop trying or stop a habit", "explanation": "give up",
            "unit_ref": "Vocab Bank Phrasal Verbs"
        },
        {
            "page_num": 163, "field_type": "text", "x": 10.0, "y": 30.0, "width": 14.0, "height": 1.8,
            "placeholder": "turn off", "label": "PV 3",
            "correct_answers": ["turn off", "switch off"], "hint": "Stop an electrical machine", "explanation": "turn off",
            "unit_ref": "Vocab Bank Phrasal Verbs"
        }
    ]
}
