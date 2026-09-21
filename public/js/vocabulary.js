/**
 * Vocabulary Module: Personal Vocabulary Bank, Word Search,
 * Spaced Repetition Flashcards with 3D Flip animation, and Audio Pronunciation.
 */

class VocabularyManager {
  constructor() {
    this.vocabList = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.flashcardIndex = 0;
    this.filteredFlashcards = [];

    this.initEvents();
  }

  initEvents() {
    // Search input
    document.getElementById('vocab-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderVocabList();
    });

    // Category filter
    document.getElementById('vocab-category-select')?.addEventListener('change', (e) => {
      this.currentCategory = e.target.value;
      this.renderVocabList();
    });

    // Add word form toggle
    document.getElementById('show-add-vocab-btn')?.addEventListener('click', () => {
      const form = document.getElementById('add-vocab-form-container');
      if (form) form.style.display = (form.style.display === 'none') ? 'block' : 'none';
    });

    // Save word button
    document.getElementById('save-new-vocab-btn')?.addEventListener('click', () => {
      this.saveNewWord();
    });

    // Flashcards buttons
    document.getElementById('start-flashcards-btn')?.addEventListener('click', () => {
      this.openFlashcardsModal();
    });
    document.getElementById('close-flashcards-btn')?.addEventListener('click', () => {
      document.getElementById('flashcard-modal-backdrop')?.classList.remove('open');
    });
    document.getElementById('flashcard-inner')?.addEventListener('click', () => {
      document.getElementById('flashcard-inner')?.classList.toggle('flipped');
    });
    document.getElementById('flashcard-prev-btn')?.addEventListener('click', () => this.prevFlashcard());
    document.getElementById('flashcard-next-btn')?.addEventListener('click', () => this.nextFlashcard());
    document.getElementById('flashcard-shuffle-btn')?.addEventListener('click', () => this.shuffleFlashcards());
  }

  async loadVocabulary() {
    try {
      const res = await fetch('/api/vocabulary');
      this.vocabList = await res.json();
      this.populateCategoryFilter();
      this.renderVocabList();
    } catch (err) {
      console.error('Error loading vocabulary:', err);
    }
  }

  populateCategoryFilter() {
    const select = document.getElementById('vocab-category-select');
    if (!select) return;

    const categories = new Set();
    this.vocabList.forEach(v => {
      if (v.category) categories.add(v.category);
    });

    let opts = `<option value="all">All Categories (${this.vocabList.length})</option>`;
    categories.forEach(cat => {
      const count = this.vocabList.filter(v => v.category === cat).length;
      opts += `<option value="${cat}">${cat} (${count})</option>`;
    });
    select.innerHTML = opts;
  }

  renderVocabList() {
    const container = document.getElementById('vocab-list-container');
    if (!container) return;

    let list = this.vocabList;
    if (this.currentCategory !== 'all') {
      list = list.filter(v => v.category === this.currentCategory);
    }
    if (this.searchQuery) {
      list = list.filter(v =>
        v.word.toLowerCase().includes(this.searchQuery) ||
        (v.definition && v.definition.toLowerCase().includes(this.searchQuery))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding: 24px; color: var(--text-muted);">No vocabulary words found.</p>`;
      return;
    }

    let html = '';
    list.forEach(v => {
      html += `
        <div class="vocab-card" id="vocab-${v.id}">
          <div class="vocab-header">
            <span class="vocab-word">${v.word}</span>
            <span class="vocab-pos">${v.pos || ''}</span>
          </div>
          ${v.phonetic ? `<div class="vocab-phonetic">${v.phonetic}</div>` : ''}
          <div class="vocab-definition">${v.definition || ''}</div>
          ${v.example ? `<div class="vocab-example">"${v.example}"</div>` : ''}
          <div class="vocab-actions">
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="btn-icon" title="Listen" onclick="window.audioManager.speakText('${v.word.replace(/'/g, "\\'")}')">🔊</button>
              <label style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:4px;">
                <input type="checkbox" ${v.learned ? 'checked' : ''} onchange="window.vocabManager.toggleLearned(${v.id})">
                ${v.learned ? 'Mastered' : 'Learning'}
              </label>
            </div>
            ${v.page_num ? `<span style="font-size:0.75rem; color:var(--primary); cursor:pointer;" onclick="window.viewer.goToPage(${v.page_num})">p.${v.page_num}</span>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async toggleLearned(id) {
    try {
      const res = await fetch(`/api/vocabulary/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      const item = this.vocabList.find(v => v.id === id);
      if (item) item.learned = data.learned;
      this.renderVocabList();
    } catch (err) {
      console.error('Toggle learned failed:', err);
    }
  }

  async saveNewWord() {
    const wordInput = document.getElementById('new-vocab-word');
    const posInput = document.getElementById('new-vocab-pos');
    const defInput = document.getElementById('new-vocab-def');
    const exInput = document.getElementById('new-vocab-ex');
    const catInput = document.getElementById('new-vocab-cat');

    const word = wordInput?.value?.trim();
    if (!word) {
      alert('Please enter a word');
      return;
    }

    const payload = {
      word: word,
      pos: posInput?.value?.trim() || '',
      definition: defInput?.value?.trim() || '',
      example: exInput?.value?.trim() || '',
      category: catInput?.value?.trim() || 'My Words',
      page_num: window.viewer ? window.viewer.currentPage : 1
    };

    try {
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (window.app) window.app.showToast(`Word "${word}" added!`);
        wordInput.value = '';
        if (posInput) posInput.value = '';
        if (defInput) defInput.value = '';
        if (exInput) exInput.value = '';
        document.getElementById('add-vocab-form-container').style.display = 'none';
        await this.loadVocabulary();
      }
    } catch (err) {
      console.error('Save word failed:', err);
    }
  }

  // --- Flashcards ---
  openFlashcardsModal() {
    this.filteredFlashcards = (this.currentCategory !== 'all')
      ? this.vocabList.filter(v => v.category === this.currentCategory)
      : [...this.vocabList];

    if (this.filteredFlashcards.length === 0) {
      alert('No vocabulary words to review.');
      return;
    }

    this.flashcardIndex = 0;
    this.updateFlashcardUI();
    document.getElementById('flashcard-modal-backdrop')?.classList.add('open');
  }

  updateFlashcardUI() {
    const card = this.filteredFlashcards[this.flashcardIndex];
    if (!card) return;

    // Reset flip
    document.getElementById('flashcard-inner')?.classList.remove('flipped');

    // Front
    document.getElementById('fc-word').textContent = card.word;
    document.getElementById('fc-phonetic').textContent = card.phonetic || '';
    document.getElementById('fc-pos').textContent = card.pos || '';

    // Back
    document.getElementById('fc-definition').textContent = card.definition || 'No definition available.';
    document.getElementById('fc-example').textContent = card.example ? `"${card.example}"` : '';

    // Index counter
    document.getElementById('fc-counter').textContent = `${this.flashcardIndex + 1} / ${this.filteredFlashcards.length}`;
  }

  prevFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.updateFlashcardUI();
    }
  }

  nextFlashcard() {
    if (this.flashcardIndex < this.filteredFlashcards.length - 1) {
      this.flashcardIndex++;
      this.updateFlashcardUI();
    }
  }

  shuffleFlashcards() {
    for (let i = this.filteredFlashcards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.filteredFlashcards[i], this.filteredFlashcards[j]] = [this.filteredFlashcards[j], this.filteredFlashcards[i]];
    }
    this.flashcardIndex = 0;
    this.updateFlashcardUI();
  }
}

window.VocabularyManager = VocabularyManager;
