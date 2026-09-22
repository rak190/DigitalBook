/**
 * Audio Module: Multi-source Audio Controller supporting authentic Oxford MP3 playback,
 * seek scrubbing, speed adjustment, in-app drag & drop MP3 uploader, floating draggable widget,
 * and seamless fallback to Web Speech TTS & listening scripts.
 */

class AudioManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.preferredVoice = null;
    this.speechRate = 0.9;
    this.playbackSpeed = 1.0;

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedAudioUrl = null;
    this.isRecording = false;
    this.recordingStartTime = 0;
    this.recordingTimer = null;

    this.audioElement = new Audio();
    this.isPlaying = false;
    this.realTracks = {}; // { trackId: { filename, size, url } }
    this.currentTrackId = '1.2';

    this.tracks = [
      // --- Unit 1A ---
      {
        id: '1.2',
        unit: 'Unit 1A',
        page: 7,
        title: '1.2 Getting to know you (Questions 1–18)',
        script: `1 Where are you from?\n2 Where were you born?\n3 Where do you live?\n4 Do you live in a house or a flat?\n5 Do you have any brothers and sisters?\n6 Do you have any pets?\n7 What do you do?\n8 What time do you get up during the week?\n9 Where do you usually have lunch?\n10 What time do you usually go to bed?\n11 Where did you learn English before?\n12 Can you speak any other languages? Which?\n13 What kind of music do you listen to?\n14 What TV programmes or series do you watch?\n15 Do you do any sport or exercise? What?\n16 What kind of books or magazines do you read?\n17 How often do you go to the cinema?\n18 What did you do last weekend?`
      },
      {
        id: '1.3',
        unit: 'Unit 1A',
        page: 7,
        title: '1.3 Rhythm & Intonation practice',
        script: `Where are you from?\nWhere were you born?\nWhere do you live?\nDo you live in a house or a flat?\nDo you have any brothers and sisters?\nDo you have any pets?`
      },
      {
        id: '1.4',
        unit: 'Unit 1A',
        page: 7,
        title: '1.4 Grammar: Word order in questions',
        script: `Can you speak any other languages?\nWhere did you learn English before?\nWhat kind of music do you listen to?\nWhat time do you usually go to bed?`
      },
      {
        id: '1.5',
        unit: 'Unit 1A',
        page: 8,
        title: '1.5 Pronunciation: The alphabet vowel sound chant',
        script: `train /eɪ/ A H J K\ntree /iː/ B C D E G P T V\negg /e/ F L M N S X Z\nbike /aɪ/ I Y\nboot /uː/ Q U W\nclock /ɒ/ O\nhorse /ɔː/ R`
      },
      {
        id: '1.6',
        unit: 'Unit 1A',
        page: 8,
        title: '1.6 Pronunciation: Alphabet letters',
        script: `A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`
      },
      {
        id: '1.7',
        unit: 'Unit 1A',
        page: 8,
        title: '1.7 Pronunciation: Spelling names and emails',
        script: `1 George - G-E-O-R-G-E\n2 Celia - C-E-L-I-A\n3 Wayne - W-A-Y-N-E\n4 john.smith@gmail.com (dot / at)`
      },
      {
        id: '1.8',
        unit: 'Unit 1A',
        page: 8,
        title: '1.8 Abbreviations (BBC, CNN, UK, USA, VIP)',
        script: `1 BBC - British Broadcasting Corporation\n2 CNN - Cable News Network\n3 UK - United Kingdom\n4 USA - United States of America\n5 VIP - Very Important Person\n6 USB - Universal Serial Bus`
      },
      {
        id: '1.9',
        unit: 'Unit 1A',
        page: 8,
        title: '1.9 Listening: Wayne Roberts Student Info Form',
        script: `Receptionist: Good morning. Can I help you?\nWayne: Yes, I'm here for the English course.\nReceptionist: What's your surname, please?\nWayne: Roberts.\nReceptionist: How do you spell that?\nWayne: R-O-B-E-R-T-S.\nReceptionist: And your first name?\nWayne: Wayne. W-A-Y-N-E.\nReceptionist: Where are you from?\nWayne: I'm from Manchester.\nReceptionist: What's your address here in London?\nWayne: 14 Dangerford Road, Flat 2. London SE21 8GP.\nReceptionist: What's your mobile number?\nWayne: 07956 432 189.\nReceptionist: And your email address?\nWayne: w.roberts99@mail.com.`
      },
      {
        id: '1.10',
        unit: 'Unit 1A',
        page: 8,
        title: '1.10 Listening: Situations and conversations 1–6',
        script: `Conversation 1: Checking into a hotel\nConversation 2: Asking for a delivery address\nConversation 3: Booking a train ticket\nConversation 4: Leaving a voicemail message\nConversation 5: Paying by credit card\nConversation 6: Registering at a library`
      },

      // --- Unit 1B ---
      {
        id: '1.11',
        unit: 'Unit 1B',
        page: 9,
        title: '1.11 Describing Fathers (Appearance & Personality)',
        script: `Woman 1: My dad's quite tall and has short dark curly hair. He's very friendly and always smiling.\nWoman 2: Well, my father's average height with grey wavy hair and a moustache. He's very clever and quiet.\nWoman 3: My dad is medium height, a bit overweight, with brown eyes and a lovely warm smile. He's really generous and funny!`
      },
      {
        id: '1.12',
        unit: 'Unit 1B',
        page: 9,
        title: '1.12 Charlotte Describing Clint',
        script: `Charlotte: My dad's 52. He's a teacher in Birmingham. He's medium height, a bit overweight, with brown eyes and a lovely warm smile. He's really generous and funny, an extrovert who loves talking to people.`
      },
      {
        id: '1.13',
        unit: 'Unit 1B',
        page: 9,
        title: '1.13 Vocabulary: Personality Adjectives',
        script: `friendly - unfriendly\ntalkative - quiet\ngenerous - mean\nkind - unkind\nlazy - hard-working\nfunny - serious\nclever - stupid\nshy - extrovert`
      },
      {
        id: '1.14',
        unit: 'Unit 1B',
        page: 9,
        title: '1.14 Pronunciation: Final -s and -es',
        script: `/s/ likes, laughs, works\n/z/ lives, wears, plays\n/ɪz/ watches, finishes, relaxes`
      },
      {
        id: '1.15',
        unit: 'Unit 1B',
        page: 10,
        title: "1.15 Listening: Charlotte's Dates - John vs Sebastian",
        script: `John: Hi Charlotte! Nice to meet you. Do you come here often?\nCharlotte: No, first time. What do you do, John?\nJohn: I'm a graphic designer. I love art and independent movies.\n\nSebastian: Good evening! Sorry I'm a bit late, parking was terrible.\nCharlotte: Don't worry at all. Are you ready to order?`
      },
      {
        id: '1.16',
        unit: 'Unit 1B',
        page: 10,
        title: "1.16 Listening: Charlotte's Choice",
        script: `Presenter: So Charlotte, who did you like better: John or Sebastian?\nCharlotte: Well, John was very interesting and funny, but Sebastian was really kind and easy to talk to.`
      },
      {
        id: '1.17',
        unit: 'Unit 1B',
        page: 10,
        title: '1.17 Pronunciation: Sentence Stress',
        script: `What does he look like?\nHe's tall with short dark hair.\nWhat is he like?\nHe's very generous and funny.`
      },

      // --- Unit 1C ---
      {
        id: '1.19',
        unit: 'Unit 1C',
        page: 11,
        title: '1.19 Vocabulary: Things you wear',
        script: `1 cardigan\n2 coat\n3 dress\n4 jacket\n5 jeans\n6 shirt\n7 skirt\n8 suit\n9 sweater\n10 trousers\n11 T-shirt`
      },
      {
        id: '1.20',
        unit: 'Unit 1C',
        page: 11,
        title: '1.20 Pronunciation: The /ə/ sound',
        script: `cardigan, trainers, necklace, bracelet, sweater, trousers`
      },
      {
        id: '1.21',
        unit: 'Unit 1C',
        page: 11,
        title: '1.21 Pronunciation: Rhythm & Sentence stress',
        script: `What's she wearing?\nShe's wearing a blue dress and black shoes.\nWho are they talking to?\nThey're talking to the teacher.`
      },
      {
        id: '1.22',
        unit: 'Unit 1C',
        page: 12,
        title: "1.22 Listening: Vermeer's 'The Milkmaid' (Part 1)",
        script: `Guide: The Milkmaid is an oil painting on canvas by the Dutch artist Johannes Vermeer. It is currently in the Rijksmuseum in Amsterdam.\nIn the picture, a maidservant is pouring milk into a squat earthenware container on a table.`
      },
      {
        id: '1.23',
        unit: 'Unit 1C',
        page: 12,
        title: "1.23 Listening: Vermeer's 'The Milkmaid' (Part 2)",
        script: `Guide: Look at the light coming through the window on the left. Vermeer was a master of depicting light and shadows. Notice the bread on the table and the basket hanging on the wall.`
      },
      {
        id: '1.24',
        unit: 'Unit 1C',
        page: 12,
        title: '1.24 Grammar: Prepositions of place',
        script: `in the middle\non the left\non the right\nin front of\nbehind\nbetween\nnext to\nabove\nunder`
      },
      {
        id: '1.25',
        unit: 'Unit 1C',
        page: 12,
        title: '1.25 Speaking: Describing a painting',
        script: `In the background there is a room with a white wall. In the foreground there is a table with bread and a jug.`
      },

      // --- Practical English 1 ---
      {
        id: '1.26',
        unit: 'Practical English 1',
        page: 13,
        title: '1.26 Practical English: Calling Reception',
        script: `Receptionist: Hello, reception.\nRob: Hello. This is room 613.\nReceptionist: How can I help you?\nRob: There's a problem with the air conditioning. It isn't working, and it's very hot in my room.\nReceptionist: I'm sorry, sir. I'll send somebody up to look at it right now.\nRob: Thank you.\n\nReceptionist: Good evening, reception.\nRob: Hello. I'm sorry to bother you again. This is room 613.\nReceptionist: How can I help?\nRob: I have a problem with the Wi-Fi. I can't get a signal.\nReceptionist: I'm sorry, sir. I'll connect you to IT.`
      },
      {
        id: '1.27',
        unit: 'Practical English 1',
        page: 13,
        title: '1.27 Practical English: Social English',
        script: `1 Rob: Here you are.\n2 Jenny: That's very kind of you.\n3 Rob: What would you like to drink?\n4 Jenny: A coffee, please.\n5 Rob: Can I have two coffees, please?`
      },
      {
        id: '1.28',
        unit: 'Practical English 1',
        page: 14,
        title: '1.28 Practical English: Jenny & Rob in London',
        script: `Jenny: Hi, Rob! Welcome to the London office.\nRob: Thanks Jenny, it's great to be here finally.\nJenny: Did you have a good flight?\nRob: Yes, no problems at all.`
      },
      {
        id: '1.29',
        unit: 'Practical English 1',
        page: 14,
        title: '1.29 Practical English: In a coffee shop',
        script: `Barista: Can I help you?\nRob: What would you like, Jenny?\nJenny: An espresso, please.\nRob: Single or double?\nJenny: Double, please.\nRob: And a regular latte for me, please.\nBarista: To have here or take away?\nRob: Take away, please.`
      },
      {
        id: '1.30',
        unit: 'Practical English 1',
        page: 14,
        title: '1.30 Practical English: Useful phrases',
        script: `Can I help you?\nTo have here or take away?\nHow much is that?\nHere's your change.`
      },

      // --- Unit 2A ---
      {
        id: '1.31',
        unit: 'Unit 2A',
        page: 15,
        title: "1.31 Marta's Story - A holiday in France (Part 1)",
        script: `Marta's story: This happened two years ago. I'm Spanish, but I was in Ireland at the time because I had a job in Dublin. Some friends of mine who lived in Lyon, in France, invited me to come and stay, so I decided to have a short holiday, a long weekend, from Friday to Tuesday. I looked for cheap flights, but I couldn't find any direct ones. The only thing I could find was Ryanair from Dublin to Brussels and then Air France from Brussels to Lyon.`
      },
      {
        id: '1.32',
        unit: 'Unit 2A',
        page: 15,
        title: '1.32 Grammar: Past Simple Regular & Irregular',
        script: `Regular: arrive - arrived, stay - stayed, invite - invited, want - wanted\nIrregular: go - went, have - had, see - saw, buy - bought, fly - flew, leave - left`
      },
      {
        id: '1.33',
        unit: 'Unit 2A',
        page: 15,
        title: '1.33 Pronunciation: Regular Past Endings -ed',
        script: `/d/ arrived, stayed, listened\n/t/ looked, booked, asked\n/ɪd/ invited, decided, wanted`
      },
      {
        id: '1.34',
        unit: 'Unit 2A',
        page: 16,
        title: "1.34 Marta's Story (Part 2)",
        script: `Marta: When I arrived at Brussels airport, I was so relieved. But then I looked at the departures board and saw that my flight to Lyon was delayed by four hours! I had to sit in the airport waiting and waiting.`
      },
      {
        id: '1.35',
        unit: 'Unit 2A',
        page: 16,
        title: '1.35 Vocabulary: Holiday Phrases',
        script: `go abroad\ngo camping\ngo for a walk\ngo on holiday\ngo out at night\ngo sightseeing\ngo skiing\ngo swimming\ntake photos\nbuy souvenirs\nsunbathe on the beach\nhave a good time\nspend money\nrent an apartment\nhire a bicycle\nbook a flight online`
      },
      {
        id: '1.36',
        unit: 'Unit 2A',
        page: 16,
        title: '1.36 Grammar: Past Simple Questions',
        script: `Did you go abroad last year?\nWhere did you stay?\nWho did you go with?\nDid you have a good time?`
      },
      {
        id: '1.37',
        unit: 'Unit 2A',
        page: 16,
        title: '1.37 Pronunciation: Question Intonation',
        script: `Did you go with friends?\nWas the weather good?\nWhere did you go?\nWhat did you do?`
      },
      {
        id: '1.38',
        unit: 'Unit 2A',
        page: 16,
        title: '1.38 Speaking: My Last Holiday',
        script: `Interview with student describing their best or worst holiday, including destination, companions, accommodation, and activities.`
      },

      // --- Unit 2B ---
      {
        id: '1.39',
        unit: 'Unit 2B',
        page: 17,
        title: "1.39 That's me in the picture! (Photo stories)",
        script: `Narrator: A famous photograph can tell a whole story. In this photo, I was standing on the bridge in Venice and it was raining heavily.`
      },
      {
        id: '1.40',
        unit: 'Unit 2B',
        page: 17,
        title: '1.40 Grammar: Past Continuous Forms',
        script: `Positive: I was walking, They were playing\nNegative: He wasn't wearing, We weren't sleeping\nQuestion: Was it raining? Were you waiting?`
      },
      {
        id: '1.41',
        unit: 'Unit 2B',
        page: 18,
        title: '1.41 Looking at the photo',
        script: `Speaker: Look at the man on the right. What was he doing? He was carrying a large black umbrella.`
      },
      {
        id: '1.42',
        unit: 'Unit 2B',
        page: 18,
        title: '1.42 Story behind the photo',
        script: `Photographer: I was walking along the river Thames when suddenly I noticed this wonderful reflection in the water.`
      },
      {
        id: '1.43',
        unit: 'Unit 2B',
        page: 18,
        title: '1.43 Pronunciation: /w/ and /v/ sounds',
        script: `/w/ was, were, water, waiting, weather\n/v/ very, video, vacation, visited`
      },
      {
        id: '1.44',
        unit: 'Unit 2B',
        page: 18,
        title: '1.44 Listening: Other famous photos',
        script: `Expert: The story behind the iconic photograph taken during the festival in 1969.`
      },

      // --- Unit 2C ---
      {
        id: '1.45',
        unit: 'Unit 2C',
        page: 19,
        title: '1.45 One dark October evening - Hannah & Jamie',
        script: `Hannah met Jamie in the summer of 2018. It was Hannah's 21st birthday and she and her friends went to a club. They wanted to dance, but they couldn't because the music wasn't very good. Suddenly, a great song came on and Hannah went to speak to the DJ.`
      },
      {
        id: '1.46',
        unit: 'Unit 2C',
        page: 19,
        title: '1.46 Grammar: Time sequencers & connectors',
        script: `because: She went home because she was tired.\nso: She was tired, so she went home.\nbut: It was raining, but they went out.\nalthough: Although it was raining, they went out.`
      },
      {
        id: '1.47',
        unit: 'Unit 2C',
        page: 19,
        title: '1.47 Pronunciation: Sentence stress with connectors',
        script: `Although they were late, they caught the train.\nHe didn't study, so he failed the exam.`
      },
      {
        id: '1.48',
        unit: 'Unit 2C',
        page: 20,
        title: '1.48 Hannah & Jamie (Part 2)',
        script: `Jamie phoned Hannah every day, and they went out together every weekend. They fell in love quickly.`
      },
      {
        id: '1.49',
        unit: 'Unit 2C',
        page: 20,
        title: '1.49 Hannah & Jamie (Part 3)',
        script: `One evening in October, Jamie called Hannah and invited her to dinner at a French restaurant.`
      },
      {
        id: '1.50',
        unit: 'Unit 2C',
        page: 20,
        title: '1.50 The end of the story',
        script: `Hannah was crossing the street outside the restaurant when a car came around the corner without stopping.`
      },
      {
        id: '1.51',
        unit: 'Unit 2C',
        page: 20,
        title: '1.51 Listening comprehension',
        script: `Review questions and comprehension check about Hannah and Jamie's dramatic story.`
      },

      // --- Revise & Check 1&2 ---
      {
        id: '1.53',
        unit: 'Revise & Check 1&2',
        page: 21,
        title: '1.53 Revise & Check 1&2 Listening & Video',
        script: `Short interviews in the street with native speakers answering questions about their background, daily routines, and holidays.`
      },

      // --- Disc 4: Unit 9A ---
      {
        id: '4.16',
        unit: 'Unit 9A',
        page: 71,
        title: '4.16 Beware of the dog (Animals & Insects)',
        script: `1 butterfly\n2 camel\n3 crocodile\n4 dolphin\n5 elephant\n6 fly\n7 gorilla\n8 kangaroo\n9 lion\n10 monkey\n11 mosquito\n12 mouse\n13 rabbit\n14 shark\n15 sheep\n16 spider\n17 tiger\n18 whale`
      },
      {
        id: '4.17',
        unit: 'Unit 9A',
        page: 71,
        title: '4.17 Grammar: Second conditional',
        script: `If I had a million dollars, I'd travel around the world.\nWhat would you do if a dog attacked you?\nIf she knew the answer, she would tell you.`
      },
      {
        id: '4.18',
        unit: 'Unit 9A',
        page: 72,
        title: '4.18 Pronunciation: Word stress in animals',
        script: `butterfly, crocodile, elephant, kangaroo, mosquito`
      },
      {
        id: '4.19',
        unit: 'Unit 9A',
        page: 72,
        title: '4.19 Speaking: Animal encounters',
        script: `What would you do if you were on a beach and you saw a shark?`
      },

      // --- Disc 4: Unit 9B ---
      {
        id: '4.20',
        unit: 'Unit 9B',
        page: 73,
        title: '4.20 Fearof.net (Phobias & Fears)',
        script: `Expert: Today we are talking about fears and phobias. A phobia is an extreme or irrational fear of something.`
      },
      {
        id: '4.21',
        unit: 'Unit 9B',
        page: 73,
        title: '4.21 Grammar: Present perfect + for and since',
        script: `How long have you lived here?\nI've lived here for five years.\nShe has known him since 2015.`
      },
      {
        id: '4.22',
        unit: 'Unit 9B',
        page: 74,
        title: '4.22 Pronunciation: Sentence stress',
        script: `How long have you been afraid of flying?\nSince I was a child.`
      },
      {
        id: '4.23',
        unit: 'Unit 9B',
        page: 74,
        title: '4.23 Listening: Overcoming phobias',
        script: `Interview with a therapist explaining how exposure therapy helps patients overcome fear of spiders.`
      },
      {
        id: '4.24',
        unit: 'Unit 9B',
        page: 74,
        title: '4.24 Speaking: How long have you...?',
        script: `Practice asking and answering questions with how long, for, and since.`
      },

      // --- Disc 4: Unit 9C ---
      {
        id: '4.25',
        unit: 'Unit 9C',
        page: 75,
        title: '4.25 Scream queens (Biographies)',
        script: `Narrator: A biography of a famous film director and their greatest masterpieces.`
      },
      {
        id: '4.26',
        unit: 'Unit 9C',
        page: 75,
        title: '4.26 Grammar: Present perfect or past simple? (2)',
        script: `Did you see that film last night?\nHave you ever seen a horror film in 3D?`
      },
      {
        id: '4.27',
        unit: 'Unit 9C',
        page: 75,
        title: '4.27 Pronunciation: /ɔː/ sound and word stress',
        script: `saw, bought, thought, audience, author`
      },
      {
        id: '4.28',
        unit: 'Unit 9C',
        page: 76,
        title: '4.28 Listening: Film directors',
        script: `Documentary on the life and directing career of Alfred Hitchcock.`
      },
      {
        id: '4.29',
        unit: 'Unit 9C',
        page: 76,
        title: '4.29 Speaking: Life story quiz',
        script: `Interview activity testing chronological biography milestones.`
      },

      // --- Disc 4: Practical English 5 ---
      {
        id: '4.31',
        unit: 'Practical English 5',
        page: 77,
        title: '4.31 Asking how to get there (Directions)',
        script: `Excuse me, could you tell me the way to Grand Central Station?\nGo straight down this street, turn left at the traffic lights, and it's on your right.`
      },
      {
        id: '4.32',
        unit: 'Practical English 5',
        page: 77,
        title: '4.32 Giving directions in New York',
        script: `Take the subway line 4 uptown to 42nd Street.`
      },
      {
        id: '4.33',
        unit: 'Practical English 5',
        page: 77,
        title: '4.33 At the train station',
        script: `A ticket to Boston, please.\nSingle or return?\nReturn, please.`
      },
      {
        id: '4.34',
        unit: 'Practical English 5',
        page: 78,
        title: '4.34 Buying train tickets',
        script: `Standard class or first class?\nWhich platform does it leave from?\nPlatform 3.`
      },
      {
        id: '4.35',
        unit: 'Practical English 5',
        page: 78,
        title: '4.35 Rob and Jenny: Saying goodbye',
        script: `Jenny: Have a safe journey back to London, Rob!\nRob: Thanks Jenny. It's been an amazing trip.`
      },
      {
        id: '4.36',
        unit: 'Practical English 5',
        page: 78,
        title: '4.36 Useful phrases: Directions & Travel',
        script: `Could you tell me how to get to...?\nTurn left, turn right, go past the church.\nHow many stops is that?`
      },

      // --- Disc 4: Unit 10A ---
      {
        id: '4.37',
        unit: 'Unit 10A',
        page: 79,
        title: '4.37 Into the net (Sports & movement)',
        script: `football, tennis, basketball, golf, athletics, swimming, cycling`
      },
      {
        id: '4.38',
        unit: 'Unit 10A',
        page: 79,
        title: '4.38 Grammar: Expressing movement',
        script: `into the net, out of the stadium, across the road, over the wall, through the tunnel, under the bridge`
      },
      {
        id: '4.39',
        unit: 'Unit 10A',
        page: 79,
        title: '4.39 Pronunciation: Word stress in sports',
        script: `athletics, basketball, gymnastics, volleyball`
      },
      {
        id: '4.40',
        unit: 'Unit 10A',
        page: 80,
        title: '4.40 Listening: The greatest sporting moment',
        script: `Commentary on historic Olympic and World Cup victories.`
      },
      {
        id: '4.41',
        unit: 'Unit 10A',
        page: 80,
        title: '4.41 Speaking: Sports commentary',
        script: `Role-play simulating a live stadium football commentary.`
      },

      // --- Disc 4: Unit 10B ---
      {
        id: '4.42',
        unit: 'Unit 10B',
        page: 81,
        title: '4.42 Early birds (Phrasal verbs)',
        script: `wake up, get up, turn off, turn on, look after, look for, try on, give up, put on, take off`
      },
      {
        id: '4.43',
        unit: 'Unit 10B',
        page: 81,
        title: '4.43 Grammar: Word order of phrasal verbs',
        script: `Turn the TV off / Turn off the TV / Turn it off (Pronoun must go between verb and particle)`
      },
      {
        id: '4.44',
        unit: 'Unit 10B',
        page: 81,
        title: '4.44 Pronunciation: Linking in phrasal verbs',
        script: `wake_up, turn_it_off, pick_it_up`
      },
      {
        id: '4.45',
        unit: 'Unit 10B',
        page: 82,
        title: '4.45 Listening: Morning routines',
        script: `Three people discuss whether they are morning larks or night owls.`
      },
      {
        id: '4.46',
        unit: 'Unit 10B',
        page: 82,
        title: '4.46 Speaking: Are you a morning person?',
        script: `Questionnaire and questionnaire analysis on sleep and daily productivity.`
      },

      // --- Disc 4: Unit 10C ---
      {
        id: '4.48',
        unit: 'Unit 10C',
        page: 83,
        title: '4.48 International inventions',
        script: `The telephone was invented by Alexander Graham Bell.\nThe first modern bicycle was designed in the 19th century.`
      },
      {
        id: '4.49',
        unit: 'Unit 10C',
        page: 83,
        title: '4.49 Grammar: The passive (is made, was built)',
        script: `Active: Bell invented the telephone.\nPassive: The telephone was invented by Bell.`
      },
      {
        id: '4.50',
        unit: 'Unit 10C',
        page: 83,
        title: '4.50 Pronunciation: /ʃ/, /tʃ/, and /dʒ/',
        script: `/ʃ/ Polish, Russian, invention\n/tʃ/ French, Chinese, watch\n/dʒ/ German, Japanese, bridge`
      },
      {
        id: '4.51',
        unit: 'Unit 10C',
        page: 84,
        title: '4.51 Listening: Inventions that changed history',
        script: `Historians discuss the printing press, antibiotics, and the World Wide Web.`
      },
      {
        id: '4.52',
        unit: 'Unit 10C',
        page: 84,
        title: '4.52 Inventions quiz',
        script: `Trivia quiz on who designed, directed, and created famous world landmarks.`
      },
      {
        id: '4.53',
        unit: 'Unit 10C',
        page: 84,
        title: '4.53 Speaking: Did you know...?',
        script: `Students present facts about inventions from their country.`
      },

      // --- Disc 4: Revise & Check 9&10 ---
      {
        id: '4.54',
        unit: 'Revise & Check 9&10',
        page: 85,
        title: '4.54 Revise & Check 9&10 Listening & Video',
        script: `Street interviews in New York with residents discussing their fears, sports, and favorite gadgets.`
      },

      // --- Backwards Compatibility Aliases ---
      {
        id: '2.1',
        unit: 'Unit 2A',
        page: 15,
        title: "2.1 Marta's Story (Alias for 1.31)",
        script: `Marta's story: This happened two years ago. I'm Spanish, but I was in Ireland at the time because I had a job in Dublin. Some friends of mine who lived in Lyon, in France, invited me to come and stay, so I decided to have a short holiday, a long weekend, from Friday to Tuesday. I looked for cheap flights, but I couldn't find any direct ones. The only thing I could find was Ryanair from Dublin to Brussels and then Air France from Brussels to Lyon.`
      },
      {
        id: '2.10',
        unit: 'Unit 2C',
        page: 19,
        title: '2.10 One dark October evening (Alias for 1.45)',
        script: `Hannah met Jamie in the summer of 2018. It was Hannah's 21st birthday and she and her friends went to a club. They wanted to dance, but they couldn't because the music wasn't very good. Suddenly, a great song came on and Hannah went to speak to the DJ.`
      }
    ];

    this.initVoices();
    this.initRecorderEvents();
    this.initDrawerAudioPlayer();
    this.initFloatingAudioPlayer();
    this.initAudioDropzone();
    this.loadAudioStatus();
    this.setupAudioElementEvents();
  }

  async loadAudioStatus() {
    try {
      const res = await fetch('/api/audio/status');
      const data = await res.json();
      this.realTracks = data.tracks || {};
      this.updateTrackBadge();
      this.renderAudioChecklist();
    } catch (err) {
      console.warn('Could not fetch audio status:', err);
    }
  }

  updateTrackBadge() {
    const curId = this.currentTrackId;
    const isAuthentic = Boolean(this.realTracks[curId]);
    const badge = document.getElementById('audio-source-badge');
    if (badge) {
      if (isAuthentic) {
        badge.textContent = 'Authentic MP3';
        badge.className = 'audio-badge authentic';
      } else {
        badge.textContent = 'TTS Fallback';
        badge.className = 'audio-badge tts';
      }
    }
  }

  renderAudioChecklist() {
    const container = document.getElementById('audio-tracks-checklist');
    const summary = document.getElementById('audio-checklist-summary');
    if (!container) return;

    let html = '';
    let readyCount = 0;

    this.tracks.forEach(t => {
      const isReady = Boolean(this.realTracks[t.id]);
      if (isReady) readyCount++;
      html += `
        <div class="audio-track-item">
          <div>
            <strong>[${t.id}]</strong> ${t.title}
          </div>
          <div>
            ${isReady
              ? '<span style="color: #059669; font-weight:700;">🟢 Authentic MP3</span>'
              : '<span style="color: #d97706; font-weight:600;">🟡 TTS Transcript</span>'
            }
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (summary) {
      summary.textContent = `${readyCount} of ${this.tracks.length} Authentic Tracks Available`;
    }
  }

  setupAudioElementEvents() {
    this.audioElement.addEventListener('timeupdate', () => {
      const cur = this.audioElement.currentTime || 0;
      const dur = this.audioElement.duration || 0;
      const curSpan = document.getElementById('float-audio-current-time');
      const durSpan = document.getElementById('float-audio-duration');
      const seekbar = document.getElementById('float-audio-seekbar');

      if (curSpan) curSpan.textContent = this.formatTime(cur);
      if (durSpan && !isNaN(dur) && dur > 0) durSpan.textContent = this.formatTime(dur);
      if (seekbar && dur > 0) {
        seekbar.value = (cur / dur) * 100;
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayPauseUI(true);
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
    });
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updatePlayPauseUI(playing) {
    const playBtn = document.getElementById('play-track-btn');
    const floatPlayBtn = document.getElementById('float-audio-play-btn');

    if (playBtn) playBtn.innerHTML = playing ? '⏸ Pause' : '▶ Play Track';
    if (floatPlayBtn) floatPlayBtn.innerHTML = playing ? '⏸' : '▶';
  }

  populateTrackSelect(selectEl) {
    if (!selectEl) return;
    const curVal = selectEl.value;
    selectEl.innerHTML = '';
    const units = {};
    this.tracks.forEach(t => {
      const u = t.unit || 'Other';
      if (!units[u]) units[u] = [];
      units[u].push(t);
    });
    for (const [unitName, trks] of Object.entries(units)) {
      const group = document.createElement('optgroup');
      group.label = unitName;
      trks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `[${t.id}] ${t.title}`;
        group.appendChild(opt);
      });
      selectEl.appendChild(group);
    }
    if (curVal) selectEl.value = curVal;
  }

  onPageChanged(pageNum) {
    const matchingTrack = this.tracks.find(t => t.page === pageNum);
    if (matchingTrack) {
      if (!this.isPlaying) {
        this.currentTrackId = matchingTrack.id;
        const drawerSelect = document.getElementById('audio-track-select');
        const floatSelect = document.getElementById('float-audio-track-select');
        const display = document.getElementById('listening-script-display');

        if (drawerSelect && drawerSelect.value !== matchingTrack.id) drawerSelect.value = matchingTrack.id;
        if (floatSelect && floatSelect.value !== matchingTrack.id) floatSelect.value = matchingTrack.id;
        if (display) display.textContent = matchingTrack.script;

        this.updateTrackBadge();
      }
    }
  }

  initDrawerAudioPlayer() {
    const select = document.getElementById('audio-track-select');
    const playBtn = document.getElementById('play-track-btn');
    const stopBtn = document.getElementById('stop-track-btn');
    const rateSlider = document.getElementById('audio-rate-slider');
    const rateLabel = document.getElementById('audio-rate-label');
    const display = document.getElementById('listening-script-display');

    if (select) {
      this.populateTrackSelect(select);

      select.addEventListener('change', () => {
        this.selectTrack(select.value);
      });

      if (display && this.tracks.length > 0) {
        display.textContent = this.tracks[0].script;
      }
    }

    playBtn?.addEventListener('click', () => {
      this.togglePlay();
    });

    stopBtn?.addEventListener('click', () => {
      this.stop();
    });

    document.getElementById('skip-back-10-btn')?.addEventListener('click', () => {
      this.skipTime(-10);
    });

    document.getElementById('skip-fwd-10-btn')?.addEventListener('click', () => {
      this.skipTime(10);
    });

    rateSlider?.addEventListener('input', (e) => {
      this.setSpeed(parseFloat(e.target.value));
      if (rateLabel) rateLabel.textContent = `${this.playbackSpeed}x`;
    });
  }

  initFloatingAudioPlayer() {
    const widget = document.getElementById('floating-audio-widget');
    const header = document.getElementById('floating-audio-header');
    const select = document.getElementById('float-audio-track-select');
    const playBtn = document.getElementById('float-audio-play-btn');
    const prevBtn = document.getElementById('float-audio-prev-track');
    const nextBtn = document.getElementById('float-audio-next-track');
    const minBtn = document.getElementById('float-audio-min-btn');
    const closeBtn = document.getElementById('float-audio-close-btn');
    const dockBtn = document.getElementById('float-audio-dock-btn');
    const seekbar = document.getElementById('float-audio-seekbar');
    const openUploaderBtn = document.getElementById('open-audio-uploader-btn');

    if (select) {
      this.populateTrackSelect(select);
      select.addEventListener('change', () => {
        this.selectTrack(select.value);
      });
    }

    playBtn?.addEventListener('click', () => {
      this.togglePlay();
    });

    prevBtn?.addEventListener('click', () => {
      const curIdx = this.tracks.findIndex(t => t.id === this.currentTrackId);
      if (curIdx > 0) {
        this.selectTrack(this.tracks[curIdx - 1].id);
        this.play();
      }
    });

    nextBtn?.addEventListener('click', () => {
      const curIdx = this.tracks.findIndex(t => t.id === this.currentTrackId);
      if (curIdx < this.tracks.length - 1) {
        this.selectTrack(this.tracks[curIdx + 1].id);
        this.play();
      }
    });

    // Speed preset buttons
    document.querySelectorAll('.audio-speed-group .speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(btn.dataset.speed || 1.0);
        this.setSpeed(speed);
      });
    });

    // Seek bar scrub
    seekbar?.addEventListener('input', (e) => {
      if (this.audioElement.duration) {
        const targetTime = (parseFloat(e.target.value) / 100) * this.audioElement.duration;
        this.audioElement.currentTime = targetTime;
      }
    });

    // Minimize toggle
    minBtn?.addEventListener('click', () => {
      widget?.classList.toggle('minimized');
      minBtn.textContent = widget?.classList.contains('minimized') ? '+' : '−';
    });

    // Close floating widget
    closeBtn?.addEventListener('click', () => {
      if (widget) widget.style.display = 'none';
    });

    // Dock toggle
    dockBtn?.addEventListener('click', () => {
      if (widget) widget.style.display = 'none';
      if (window.app) window.app.toggleDrawer('drawer-audio', 'toggle-audio-btn');
    });

    // Open Uploader
    openUploaderBtn?.addEventListener('click', () => {
      this.openDropzoneModal();
    });

    // Dragging support for floating player
    if (header && widget) {
      let isDraggingWidget = false;
      let startX, startY, origLeft, origTop;

      header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
        isDraggingWidget = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = widget.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingWidget) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newLeft = Math.max(10, Math.min(window.innerWidth - widget.offsetWidth - 10, origLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - widget.offsetHeight - 10, origTop + dy));
        widget.style.left = `${newLeft}px`;
        widget.style.top = `${newTop}px`;
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
      });

      window.addEventListener('mouseup', () => {
        isDraggingWidget = false;
        document.body.style.userSelect = '';
      });
    }

    // Toggle button in header tools
    document.getElementById('toggle-floating-audio-btn')?.addEventListener('click', () => {
      if (!widget) return;
      if (widget.style.display === 'none' || !widget.style.display) {
        widget.style.display = 'block';
        if (window.app) window.app.showToast('Floating Audio Player opened');
      } else {
        widget.style.display = 'none';
      }
    });
  }

  selectTrack(trackId) {
    this.currentTrackId = trackId;
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    const drawerSelect = document.getElementById('audio-track-select');
    const floatSelect = document.getElementById('float-audio-track-select');
    const display = document.getElementById('listening-script-display');

    if (drawerSelect && drawerSelect.value !== trackId) drawerSelect.value = trackId;
    if (floatSelect && floatSelect.value !== trackId) floatSelect.value = trackId;
    if (display) display.textContent = track.script;

    this.updateTrackBadge();

    // If already playing, switch track smoothly
    if (this.isPlaying) {
      this.play();
    }
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
    this.speechRate = speed;
    this.audioElement.playbackRate = speed;

    document.querySelectorAll('.audio-speed-group .speed-btn').forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.speed) === speed);
    });

    const rateLabel = document.getElementById('audio-rate-label');
    if (rateLabel) rateLabel.textContent = `${speed}x`;

    const rateSlider = document.getElementById('audio-rate-slider');
    if (rateSlider) rateSlider.value = speed;
  }

  play() {
    const curId = this.currentTrackId;
    const track = this.tracks.find(t => t.id === curId);
    if (!track) return;

    if (this.realTracks[curId]) {
      // Authentic MP3
      const targetUrl = new URL(this.realTracks[curId].url, window.location.origin).href;
      if (this.audioElement.src !== targetUrl) {
        this.audioElement.src = this.realTracks[curId].url;
      }
      this.audioElement.playbackRate = this.playbackSpeed;
      this.audioElement.play().catch(e => console.warn('Audio play error:', e));
      this.isPlaying = true;
      this.updatePlayPauseUI(true);
      if (window.app) window.app.showToast(`Playing authentic audio track [${track.id}]`);
    } else {
      // Fallback to Web Speech Synthesis with onend/onerror completion handling
      this.audioElement.pause();
      this.isPlaying = true;
      this.updatePlayPauseUI(true);
      this.speakTrackText(track.script, this.playbackSpeed);
      if (window.app) window.app.showToast(`Playing transcript via TTS for [${track.id}]`);
    }
  }

  pause() {
    this.audioElement.pause();
    if (this.synth) this.synth.cancel();
    this.isPlaying = false;
    this.updatePlayPauseUI(false);
  }

  stop() {
    this.pause();
    this.audioElement.currentTime = 0;
    const seekbar = document.getElementById('float-audio-seekbar');
    if (seekbar) seekbar.value = 0;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  skipTime(seconds) {
    if (this.audioElement && !isNaN(this.audioElement.duration)) {
      const nextTime = Math.max(0, Math.min(this.audioElement.duration, this.audioElement.currentTime + seconds));
      this.audioElement.currentTime = nextTime;
      if (window.app) window.app.showToast(`${seconds > 0 ? '+' : ''}${seconds}s (${Math.round(nextTime)}s)`);
    } else {
      if (window.app) window.app.showToast('Audio skip available during playback');
    }
  }

  // --- In-App Dropzone & MP3 Uploading ---
  initAudioDropzone() {
    const modal = document.getElementById('audio-dropzone-modal');
    const closeBtn = document.getElementById('close-audio-modal-btn');
    const doneBtn = document.getElementById('done-audio-modal-btn');
    const dropArea = document.getElementById('audio-drop-area');
    const fileInput = document.getElementById('audio-file-input');
    const browseBtn = document.getElementById('browse-audio-btn');

    closeBtn?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
    doneBtn?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });

    browseBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.uploadAudioFiles(e.target.files);
      }
    });

    if (dropArea) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.remove('drag-over');
        });
      });

      dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.uploadAudioFiles(files);
        }
      });
    }
  }

  openDropzoneModal() {
    const modal = document.getElementById('audio-dropzone-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadAudioStatus();
    }
  }

  async uploadAudioFiles(fileList) {
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPercent = document.getElementById('upload-progress-percent');

    if (progressContainer) progressContainer.style.display = 'block';

    const formData = new FormData();
    let count = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
        formData.append(`file_${i}`, file);
        count++;
      }
    }

    if (count === 0) {
      if (window.app) window.app.showToast('Please select .mp3 or audio files.');
      if (progressContainer) progressContainer.style.display = 'none';
      return;
    }

    try {
      if (progressBar) progressBar.style.width = '60%';
      if (progressPercent) progressPercent.textContent = '60%';

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (progressBar) progressBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';

      setTimeout(async () => {
        if (progressContainer) progressContainer.style.display = 'none';
        if (data.status === 'success') {
          if (window.app) window.app.showToast(`Successfully uploaded ${data.count} audio tracks!`);
          await this.loadAudioStatus();
        }
      }, 500);

    } catch (err) {
      console.error('Audio upload failed:', err);
      if (progressContainer) progressContainer.style.display = 'none';
      if (window.app) window.app.showToast('Upload failed: ' + err.message);
    }
  }

  initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      try {
        this.voices = this.synth.getVoices() || [];
        this.preferredVoice = this.voices.find(v => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK'))
          || this.voices.find(v => v.lang.includes('en-US'))
          || this.voices.find(v => v.lang.startsWith('en'));
      } catch (e) {}
    };

    loadVoices();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speakTrackText(text, rate = null) {
    if (!this.synth) return;
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    if (!text || !text.trim()) {
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = rate || this.playbackSpeed || this.speechRate;
    utterance.pitch = 1.0;

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    utterance.onend = () => {
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.updatePlayPauseUI(false);
    };

    this.synth.speak(utterance);
  }

  speakText(text, rate = null) {
    if (!this.synth) return;
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    if (!text || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = rate || this.speechRate;
    utterance.pitch = 1.0;

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    this.synth.speak(utterance);
  }

  speakSelection() {
    const selection = window.getSelection().toString();
    if (selection && selection.trim()) {
      this.speakText(selection);
      if (window.app) window.app.showToast(`Pronouncing: "${selection.trim()}"`);
    } else {
      if (window.app) window.app.showToast('Please highlight/select some English text first');
    }
  }

  // --- Voice Recorder for Speaking Practice ---
  initRecorderEvents() {
    // Floating recorder
    document.getElementById('record-toggle-btn')?.addEventListener('click', () => {
      this.toggleRecording();
    });
    document.getElementById('play-recording-btn')?.addEventListener('click', () => {
      this.playRecording();
    });

    // Drawer recorder
    document.getElementById('drawer-record-toggle-btn')?.addEventListener('click', () => {
      this.toggleRecording();
    });
    document.getElementById('drawer-play-recording-btn')?.addEventListener('click', () => {
      this.playRecording();
    });
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        if (this.recordedAudioUrl) URL.revokeObjectURL(this.recordedAudioUrl);
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);

        const playBtn = document.getElementById('play-recording-btn');
        if (playBtn) playBtn.disabled = false;
        const drawerPlayBtn = document.getElementById('drawer-play-recording-btn');
        if (drawerPlayBtn) drawerPlayBtn.disabled = false;
        if (window.app) window.app.showToast('Recording saved! Listen or practice again.');

        // Persist to server via /api/recordings
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result;
            const pNum = window.viewer ? window.viewer.currentPage : 1;
            const elapsedSec = Math.max(1, Math.floor((Date.now() - this.recordingStartTime) / 1000));
            await fetch('/api/recordings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                page_num: pNum,
                title: `Speaking Practice (p.${pNum})`,
                audio_data: base64Data,
                duration_sec: elapsedSec
              })
            });
            this.loadPageRecordings(pNum);
          };
        } catch (saveErr) {
          console.error('Error saving recording to server:', saveErr);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      const toggleBtn = document.getElementById('record-toggle-btn');
      if (toggleBtn) {
        toggleBtn.innerHTML = '⏹ Stop';
        toggleBtn.classList.add('active');
      }
      const drawerToggleBtn = document.getElementById('drawer-record-toggle-btn');
      if (drawerToggleBtn) {
        drawerToggleBtn.innerHTML = '⏹ Stop Recording';
        drawerToggleBtn.classList.add('active');
      }

      const pulse = document.getElementById('record-pulse-indicator');
      if (pulse) pulse.style.display = 'block';

      this.recordingTimer = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        const formatted = `${mins}:${secs}`;
        const timerEl = document.getElementById('record-timer');
        if (timerEl) timerEl.textContent = formatted;
        const drawerTimerEl = document.getElementById('drawer-record-timer');
        if (drawerTimerEl) drawerTimerEl.textContent = formatted;
      }, 500);

    } catch (err) {
      console.error('Microphone error:', err);
      if (window.app) window.app.showToast('Microphone access denied or unavailable.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
      this.isRecording = false;
      clearInterval(this.recordingTimer);

      const toggleBtn = document.getElementById('record-toggle-btn');
      if (toggleBtn) {
        toggleBtn.innerHTML = '🎙 Record Speaking';
        toggleBtn.classList.remove('active');
      }
      const drawerToggleBtn = document.getElementById('drawer-record-toggle-btn');
      if (drawerToggleBtn) {
        drawerToggleBtn.innerHTML = '🎙 Record Answer';
        drawerToggleBtn.classList.remove('active');
      }

      const pulse = document.getElementById('record-pulse-indicator');
      if (pulse) pulse.style.display = 'none';
    }
  }

  playRecording() {
    if (!this.recordedAudioUrl) return;
    const audio = new Audio(this.recordedAudioUrl);
    audio.play();
  }

  playBase64Audio(dataUrl) {
    if (!dataUrl) return;
    const audio = new Audio(dataUrl);
    audio.play();
  }

  async loadPageRecordings(pageNum) {
    const listEl = document.getElementById('drawer-recordings-list');
    if (!listEl) return;
    try {
      const res = await fetch(`/api/recordings/${pageNum}`);
      const recordings = await res.json();
      if (!recordings || recordings.length === 0) {
        listEl.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:6px;">No recordings on this page yet.</div>';
        return;
      }
      let html = '';
      recordings.forEach(r => {
        html += `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); font-size:0.75rem;">
            <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">
              <strong>${r.title || 'Recording'}</strong> (${r.duration_sec || 0}s)
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn-icon" style="width:22px; height:22px; font-size:10px;" title="Play" onclick="window.audioManager.playBase64Audio('${r.audio_data ? r.audio_data.replace(/'/g, "\\'") : ''}')">▶</button>
              <button class="btn-icon" style="width:22px; height:22px; font-size:10px; color:#ef4444;" title="Delete" onclick="window.audioManager.deleteRecording(${r.id}, ${pageNum})">✕</button>
            </div>
          </div>
        `;
      });
      listEl.innerHTML = html;
    } catch (err) {
      console.error('Failed to load page recordings:', err);
    }
  }

  async deleteRecording(recId, pageNum) {
    try {
      await fetch(`/api/recordings/${recId}`, { method: 'DELETE' });
      this.loadPageRecordings(pageNum);
      if (window.app) window.app.showToast('Recording deleted.');
    } catch (e) {
      console.error('Delete recording error:', e);
    }
  }

  onPageChanged(pageNum) {
    this.updateTrackBadge();
    this.loadPageRecordings(pageNum);
  }
}

window.AudioManager = AudioManager;
