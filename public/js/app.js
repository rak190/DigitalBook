/**
 * Main Application Orchestrator for Digital English Textbook
 */

class DigitalTextbookApp {
  constructor() {
    this.bookInfo = null;
    this.currentTool = 'read';
    this.activeDrawer = null;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.classMode = false;
    this.cleanMode = false;
    this.focusMode = false;
    this.lastUnitPage = 7;

    this.initTheme();
    this.initApp();
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.textContent = (this.theme === 'dark') ? '☀️' : '🌙';
  }

  toggleTheme() {
    this.theme = (this.theme === 'dark') ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.initTheme();
  }

  async initApp() {
    try {
      // 1. Fetch book info & TOC
      const res = await fetch('/api/book-info');
      this.bookInfo = await res.json();

      // 2. Initialize sub-managers
      window.viewer = new TextbookViewer();
      window.annotationsManager = new AnnotationsManager();
      window.exercisesManager = new ExercisesManager();
      window.audioManager = new AudioManager();
      window.vocabManager = new VocabularyManager();
      window.notesManager = new NotesManager();

      // 3. Render TOC and Thumbnails
      this.renderTOC();
      this.renderThumbnails();

      // 4. Load initial data
      window.vocabManager.loadVocabulary();
      window.notesManager.loadNotesAndBookmarks();
      this.loadProgress();
      this.loadMistakes();

      // 5. Initial render of viewer
      window.viewer.goToPage(7); // Start on Unit 1A (book page 6)

      // 6. Setup global UI bindings
      this.initUIBindings();

      // 7. Check last studied page
      this.checkContinueStudying();

    } catch (err) {
      console.error('Failed to initialize app:', err);
    }
  }

  initUIBindings() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Fullscreen toggle
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Class Mode Toggle
    document.getElementById('toggle-class-mode-btn')?.addEventListener('click', () => {
      this.toggleClassMode();
    });

    // Clean Mode Toggle (Screen Sharing)
    document.getElementById('toggle-clean-mode-btn')?.addEventListener('click', () => {
      this.toggleCleanMode();
    });

    // Focus / Presentation Mode Toggle
    document.getElementById('toggle-focus-mode-btn')?.addEventListener('click', () => {
      this.toggleFocusMode(true);
    });
    document.getElementById('exit-focus-btn')?.addEventListener('click', () => {
      this.toggleFocusMode(false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.focusMode) {
        this.toggleFocusMode(false);
      }
    });

    // Teacher Quick-Jump
    const jumpInput = document.getElementById('teacher-book-jump-input');
    const jumpBtn = document.getElementById('teacher-book-jump-btn');
    const executeJump = () => {
      const bookP = parseInt(jumpInput?.value);
      if (!isNaN(bookP) && bookP >= 1) {
        this.jumpToBookPage(bookP);
      }
    };
    jumpBtn?.addEventListener('click', executeJump);
    jumpInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeJump();
    });

    // Teacher Jump Shortcuts (Grammar Bank, Vocab Bank, Sound Bank)
    document.querySelectorAll('.jump-pill[data-target-page]').forEach(pill => {
      pill.addEventListener('click', () => {
        const target = parseInt(pill.dataset.targetPage);
        if (!isNaN(target)) {
          if (window.viewer && window.viewer.currentPage < 120) {
            this.lastUnitPage = window.viewer.currentPage;
          }
          window.viewer.goToPage(target);
        }
      });
    });

    document.getElementById('teacher-return-unit-btn')?.addEventListener('click', () => {
      if (window.viewer) {
        window.viewer.goToPage(this.lastUnitPage || 7);
        this.showToast(`Returned to Unit on page ${this.lastUnitPage || 7}`);
      }
    });

    // Tool Mode buttons
    document.querySelectorAll('.tool-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.setToolMode(mode);
      });
    });

    // Drawer toggles
    const drawerButtons = [
      { id: 'toggle-toc-btn', drawer: 'drawer-toc' },
      { id: 'toggle-thumbs-btn', drawer: 'drawer-thumbs' },
      { id: 'toggle-exercises-btn', drawer: 'drawer-exercises' },
      { id: 'toggle-vocab-btn', drawer: 'drawer-vocab' },
      { id: 'toggle-audio-btn', drawer: 'drawer-audio' },
      { id: 'toggle-notes-btn', drawer: 'drawer-notes' },
      { id: 'toggle-progress-btn', drawer: 'drawer-progress' },
      { id: 'toggle-mistakes-btn', drawer: 'drawer-mistakes' }
    ];

    drawerButtons.forEach(({ id, drawer }) => {
      document.getElementById(id)?.addEventListener('click', () => {
        this.toggleDrawer(drawer, id);
      });
    });

    // Unified sidebar tab switching
    document.querySelectorAll('.unified-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const drawerId = btn.dataset.drawer;
        this.toggleDrawer(drawerId);
      });
    });

    // Collapsible Left Floating Toolbar toggle
    const collapseBtn = document.getElementById('toolbar-collapse-toggle');
    const floatingBar = document.getElementById('floating-tools-bar');
    collapseBtn?.addEventListener('click', () => {
      floatingBar?.classList.toggle('collapsed');
      const isCollapsed = floatingBar?.classList.contains('collapsed');
      collapseBtn.textContent = isCollapsed ? '▶' : '◀';
    });

    // Close drawer buttons
    document.querySelectorAll('.close-drawer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllDrawers();
      });
    });

    // Progress & Mistakes Dashboard bindings
    document.getElementById('metric-mistakes-card')?.addEventListener('click', () => {
      this.toggleDrawer('drawer-mistakes', 'toggle-mistakes-btn');
    });
    document.getElementById('refresh-mistakes-btn')?.addEventListener('click', () => {
      this.loadMistakes();
    });
    const resumeHandler = () => {
      const p = (this.progressData && this.progressData.lastStudiedPage) || 7;
      if (window.viewer) window.viewer.goToPage(p);
      const banner = document.getElementById('continue-studying-banner');
      if (banner) banner.style.display = 'none';
      this.showToast(`Resumed studying on Page ${p}`);
    };
    document.getElementById('resume-study-btn')?.addEventListener('click', resumeHandler);
    document.getElementById('continue-banner-resume-btn')?.addEventListener('click', resumeHandler);
    document.getElementById('continue-banner-dismiss-btn')?.addEventListener('click', () => {
      const banner = document.getElementById('continue-studying-banner');
      if (banner) banner.style.display = 'none';
      sessionStorage.setItem('dismissed_continue_banner', '1');
    });
    document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
      this.resetProgress();
    });
    document.getElementById('reset-study-data-btn')?.addEventListener('click', () => {
      this.resetProgress();
    });

    // Zoom preset selector
    document.getElementById('zoom-preset-select')?.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && window.viewer) {
        window.viewer.setZoom(val);
      }
    });

    // Global Search bindings
    document.getElementById('global-search-btn')?.addEventListener('click', () => {
      this.openGlobalSearch();
    });
    document.getElementById('close-search-modal-btn')?.addEventListener('click', () => {
      this.closeGlobalSearch();
    });
    let searchDebounce = null;
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.executeGlobalSearch(e.target.value.trim());
      }, 250);
    });
    document.querySelectorAll('.search-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.search-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeSearchFilter = pill.dataset.filter;
        this.renderFilteredSearchResults();
      });
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
        return;
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
        e.preventDefault();
        this.openGlobalSearch();
        return;
      }
      if (e.key === 'Escape') {
        const searchModal = document.getElementById('global-search-modal');
        if (searchModal && searchModal.style.display === 'flex') {
          this.closeGlobalSearch();
        }
      }
    });

    // TTS on text selection
    document.getElementById('pronounce-selection-btn')?.addEventListener('click', () => {
      window.audioManager.speakSelection();
    });

    // TOC search
    document.getElementById('toc-search')?.addEventListener('input', (e) => {
      this.renderTOC(e.target.value.toLowerCase());
    });

    // Export / Import
    document.getElementById('export-data-btn')?.addEventListener('click', () => this.exportUserData());
    document.getElementById('import-file-input')?.addEventListener('change', (e) => this.importUserData(e));
  }

  setToolMode(mode) {
    const prevMode = this.currentTool;
    this.currentTool = mode;
    document.querySelectorAll('.tool-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    window.annotationsManager.setTool(mode);

    if (window.exercisesManager) {
      window.exercisesManager.setAddBlankMode(mode === 'blank');
    }

    if (mode === 'calibrate') {
      document.getElementById('viewport-container')?.classList.add('calibration-mode-active');
      this.showToast('📐 Calibration Mode: Click any blank to edit coords, or click & drag on page to place a new blank');
      if (window.viewer && window.exercisesManager) {
        window.exercisesManager.loadPageOverlays(window.viewer.currentPage);
      }
    } else {
      document.getElementById('viewport-container')?.classList.remove('calibration-mode-active');
      if (prevMode === 'calibrate' && window.viewer && window.exercisesManager) {
        window.exercisesManager.loadPageOverlays(window.viewer.currentPage);
      }
    }

    if (mode === 'read') {
      document.querySelectorAll('.book-page-wrapper').forEach(w => w.style.cursor = 'default');
    } else if (['pen', 'highlighter', 'eraser'].includes(mode)) {
      document.querySelectorAll('.book-page-wrapper').forEach(w => w.style.cursor = 'crosshair');
    } else if (['textbox', 'stickynote'].includes(mode)) {
      document.querySelectorAll('.book-page-wrapper').forEach(w => w.style.cursor = 'cell');
      this.showToast(`Click anywhere on page to place ${mode === 'textbox' ? 'Text Box' : 'Sticky Note'}`);
    } else if (mode === 'blank') {
      document.querySelectorAll('.book-page-wrapper').forEach(w => w.style.cursor = 'crosshair');
      this.showToast('Click anywhere on page to place an interactive blank');
    }
  }

  toggleDrawer(drawerId, btnId = null) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    const wasAnyOpen = this.activeDrawer !== null;
    const isTabSwitch = wasAnyOpen && this.activeDrawer !== drawerId && !isOpen;

    // Reset states
    document.querySelectorAll('.sidebar-panel').forEach(d => {
      if (isTabSwitch) d.classList.add('no-slide');
      d.classList.remove('open');
    });
    document.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.unified-tab-btn').forEach(b => b.classList.remove('active'));

    if (!isOpen) {
      drawer.classList.add('open');
      this.activeDrawer = drawerId;
      if (btnId) {
        document.getElementById(btnId)?.classList.add('active');
      } else {
        const shortName = drawerId.replace('drawer-', '');
        document.getElementById(`toggle-${shortName}-btn`)?.classList.add('active');
      }
      document.querySelectorAll(`.unified-tab-btn[data-drawer="${drawerId}"]`).forEach(b => b.classList.add('active'));

      // Auto-scroll to active thumbnail if thumbs drawer opened
      if (drawerId === 'drawer-thumbs' && window.viewer) {
        setTimeout(() => {
          const activeThumb = document.getElementById(`thumb-card-${window.viewer.currentPage}`);
          if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
        }, 150);
      }
    } else {
      this.activeDrawer = null;
    }

    if (isTabSwitch) {
      setTimeout(() => {
        document.querySelectorAll('.sidebar-panel').forEach(d => d.classList.remove('no-slide'));
      }, 50);
    }

    const recorder = document.getElementById('speaking-recorder-widget');
    if (recorder) {
      if (this.activeDrawer) {
        recorder.classList.add('drawer-open');
      } else {
        recorder.classList.remove('drawer-open');
      }
    }
  }

  closeAllDrawers() {
    document.querySelectorAll('.sidebar-panel').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.unified-tab-btn').forEach(b => b.classList.remove('active'));
    this.activeDrawer = null;
    const recorder = document.getElementById('speaking-recorder-widget');
    if (recorder) recorder.classList.remove('drawer-open');
  }

  onPageChanged(pageNum) {
    // 1. Highlight active TOC item
    document.querySelectorAll('.toc-item').forEach(item => {
      const p = parseInt(item.dataset.page);
      item.classList.toggle('active', p === pageNum);
    });

    // 2. Highlight active thumbnail
    document.querySelectorAll('.thumbnail-card').forEach(card => {
      const p = parseInt(card.dataset.page);
      card.classList.toggle('active', p === pageNum);
      if (p === pageNum && this.activeDrawer === 'drawer-thumbs') {
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });

    // 3. Update bookmark button
    if (window.notesManager) {
      window.notesManager.updateBookmarkButton();
    }

    // 4. Update Book page number badge and Teacher Jump input
    let bookPage = Math.max(1, pageNum - 1);
    if (this.bookInfo && this.bookInfo.toc) {
      const match = this.bookInfo.toc.find(item => item.page === pageNum);
      if (match && match.bookPage) bookPage = match.bookPage;
    }
    const badge = document.getElementById('book-page-badge');
    if (badge) {
      badge.textContent = `(Book p.${bookPage})`;
      badge.title = `Printed Textbook Page ${bookPage} (PDF file page ${pageNum})`;
    }
    const jumpInput = document.getElementById('teacher-book-jump-input');
    if (jumpInput && document.activeElement !== jumpInput) {
      jumpInput.value = bookPage;
    }

    // Keep track of current unit page for teacher return button
    if (pageNum < 120) {
      this.lastUnitPage = pageNum;
    }

    // Update audio track selection & badge for the active page
    if (window.audioManager) {
      if (typeof window.audioManager.onPageChanged === 'function') {
        window.audioManager.onPageChanged(pageNum);
      } else {
        window.audioManager.updateTrackBadge();
      }
    }

    // 5. Update progress to server
    fetch(`/api/progress/${pageNum}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_spent_sec: 5 })
    }).catch(() => {});
  }

  toggleClassMode() {
    this.classMode = !this.classMode;
    document.body.classList.toggle('class-mode-active', this.classMode);
    const btn = document.getElementById('toggle-class-mode-btn');
    if (btn) btn.classList.toggle('active', this.classMode);
    if (this.classMode && window.viewer) {
      window.viewer.viewMode = 'single';
      window.viewer.fitToWidth();
    }
    this.showToast(this.classMode ? '💻 Online Class Mode ON (Split-screen ready)' : 'Class Mode OFF');
  }

  toggleCleanMode() {
    this.cleanMode = !this.cleanMode;
    document.body.classList.toggle('screen-share-clean-mode', this.cleanMode);
    const btn = document.getElementById('toggle-clean-mode-btn');
    if (btn) {
      btn.classList.toggle('active', this.cleanMode);
      btn.innerHTML = this.cleanMode
        ? '<span class="btn-icon-part">👁️</span> <span class="btn-label-part">Show Answers</span>'
        : '<span class="btn-icon-part">👁️</span> <span class="btn-label-part">Hide Answers</span>';
    }
    this.showToast(this.cleanMode ? '👁️ Screen Sharing Clean Mode ON: Answers & Keys hidden' : 'Clean Mode OFF: Answers visible');
  }

  toggleFocusMode(active) {
    this.focusMode = active;
    document.body.classList.toggle('focus-mode-active', this.focusMode);
    if (this.focusMode) {
      this.closeAllDrawers();
      this.showToast('🔲 Focus Presentation Mode (Press Esc to exit)');
    } else {
      this.showToast('Exited Focus Mode');
    }
  }

  jumpToBookPage(bookPageNum) {
    if (window.viewer && window.viewer.currentPage < 120) {
      this.lastUnitPage = window.viewer.currentPage;
    }

    if (this.bookInfo && this.bookInfo.toc) {
      const match = this.bookInfo.toc.find(item => item.bookPage === bookPageNum);
      if (match) {
        window.viewer.goToPage(match.page);
        this.showToast(`Jumped to Book p.${bookPageNum} (${match.title})`);
        return;
      }
    }

    // Fallback standard offset: PDF page = printed book page + 1
    const targetPdfPage = Math.min(this.bookInfo?.totalPages || 169, Math.max(1, bookPageNum + 1));
    window.viewer.goToPage(targetPdfPage);
    this.showToast(`Jumped to Book p.${bookPageNum} (Page ${targetPdfPage})`);
  }

  findTocForPage(pageNum) {
    if (!this.bookInfo || !this.bookInfo.toc) return null;
    const toc = this.bookInfo.toc;
    let closest = null;
    for (let i = 0; i < toc.length; i++) {
      if (toc[i].page <= pageNum) {
        closest = toc[i];
      } else {
        break;
      }
    }
    return closest;
  }

  renderTOC(filter = '') {
    const listContainer = document.getElementById('toc-list-container');
    if (!listContainer || !this.bookInfo) return;

    let items = this.bookInfo.toc;
    if (filter) {
      items = items.filter(i =>
        i.title.toLowerCase().includes(filter) ||
        (i.unit && i.unit.toLowerCase().includes(filter)) ||
        (i.grammar && i.grammar.toLowerCase().includes(filter)) ||
        (i.vocabulary && i.vocabulary.toLowerCase().includes(filter))
      );
    }

    let html = '';
    items.forEach(item => {
      const unitLabel = item.section ? item.section : (item.unit || 'Bank');
      const grammarInfo = item.grammar ? `<div><strong>G:</strong> ${item.grammar}</div>` : '';
      const vocabInfo = item.vocabulary ? `<div><strong>V:</strong> ${item.vocabulary}</div>` : '';

      html += `
        <div class="toc-item ${window.viewer && window.viewer.currentPage === item.page ? 'active' : ''}" 
             data-page="${item.page}" onclick="window.viewer.goToPage(${item.page})">
          <span class="toc-unit-tag">${unitLabel}</span>
          <div class="toc-unit-title">${item.title}</div>
          <div class="toc-meta">
            ${grammarInfo}
            ${vocabInfo}
            <span style="font-size:0.7rem; color:var(--text-muted);">Textbook page ${item.bookPage} (Page ${item.page})</span>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  renderThumbnails() {
    const grid = document.getElementById('thumbnails-grid-container');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 169; i++) {
      html += `
        <div class="thumbnail-card ${i === 7 ? 'active' : ''}" data-page="${i}" onclick="window.viewer.goToPage(${i})">
          <img class="thumbnail-img" loading="lazy" src="/api/thumbnails/${i}" alt="p.${i}">
          <span class="thumbnail-badge">p.${i}</span>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast-container';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  async exportUserData() {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EnglishFile_StudyBackup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Study progress exported successfully!');
    } catch (err) {
      alert('Export failed: ' + err);
    }
  }

  async importUserData(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        this.showToast('Study data imported successfully!');
        setTimeout(() => location.reload(), 1000);
      }
    } catch (err) {
      alert('Import failed: ' + err);
    }
  }

  async checkContinueStudying() {
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();
      this.progressData = data;
      const lastP = data.lastStudiedPage;
      if (lastP && lastP > 1 && !sessionStorage.getItem('dismissed_continue_banner')) {
        const banner = document.getElementById('continue-studying-banner');
        const text = document.getElementById('continue-banner-text');
        if (banner && text) {
          const matched = this.findTocForPage(lastP);
          const title = matched ? ` (${matched.title})` : '';
          text.innerHTML = `Welcome back! Continue studying on <strong>Page ${lastP}</strong>${title}?`;
          banner.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('Check continue studying error:', e);
    }
  }

  async loadProgress() {
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();
      this.progressData = data;

      const completionEl = document.getElementById('metric-completion');
      const completionFill = document.getElementById('metric-completion-fill');
      if (completionEl) completionEl.textContent = `${data.bookCompletion || 0}%`;
      if (completionFill) completionFill.style.width = `${Math.min(100, data.bookCompletion || 0)}%`;

      const accEl = document.getElementById('metric-accuracy');
      const accFill = document.getElementById('metric-accuracy-fill');
      if (accEl) accEl.textContent = `${data.accuracy || 0}%`;
      if (accFill) accFill.style.width = `${Math.min(100, data.accuracy || 0)}%`;

      const pagesEl = document.getElementById('metric-pages');
      if (pagesEl) pagesEl.textContent = `${data.visitedPages || 0} / 169`;

      const qEl = document.getElementById('metric-questions');
      if (qEl) qEl.textContent = `${data.totalQuestionsAttempted || 0}`;

      const mEl = document.getElementById('metric-mistakes');
      if (mEl) mEl.textContent = `${data.unresolvedMistakes || 0}`;

      const timeEl = document.getElementById('metric-time');
      if (timeEl) {
        const sec = data.timeSpentSec || 0;
        const mins = Math.floor(sec / 60);
        timeEl.textContent = mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }

      const lastPText = document.getElementById('progress-last-page-text');
      if (lastPText) {
        const matched = this.findTocForPage(data.lastStudiedPage || 7);
        const title = matched ? matched.title : `Page ${data.lastStudiedPage || 7}`;
        lastPText.textContent = `Last studied: Page ${data.lastStudiedPage || 7} — ${title}`;
      }

      this.renderUnitsProgressList();
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  }

  renderUnitsProgressList() {
    const list = document.getElementById('units-progress-list');
    if (!list || !this.bookInfo || !this.bookInfo.toc) return;

    const units = this.bookInfo.toc.filter(item => item.unit || item.type === 'bank');
    let html = '';
    units.forEach(u => {
      html += `
        <div class="unit-progress-item" onclick="window.viewer.goToPage(${u.page})">
          <div class="unit-progress-info">
            <span class="unit-progress-title">${u.section || u.unit || 'Bank'}: ${u.title}</span>
            <span class="unit-progress-desc">Textbook p.${u.bookPage} (PDF p.${u.page})</span>
          </div>
          <button class="btn-outline" style="font-size:0.72rem; padding:2px 6px;">Jump ➔</button>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  async loadMistakes() {
    try {
      const res = await fetch('/api/mistakes');
      const list = await res.json();
      const container = document.getElementById('mistakes-list-container');
      const badge = document.getElementById('mistakes-count-badge');
      if (badge) {
        badge.textContent = `${list.length} item${list.length === 1 ? '' : 's'} to review`;
      }

      if (!container) return;
      if (list.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
            <div style="font-size:2.5rem; margin-bottom:8px;">🎉</div>
            <p style="font-weight:600; margin-bottom:4px;">No Unresolved Mistakes!</p>
            <p style="font-size:0.8rem;">Every exercise item you answered has been verified correct.</p>
          </div>
        `;
        return;
      }

      let html = '';
      list.forEach(m => {
        html += `
          <div class="mistake-card" id="mistake-card-${m.id}">
            <div class="mistake-header">
              <span class="mistake-tag">Page ${m.page_num} — ${m.question_label || 'Exercise'}</span>
              <span style="font-size:0.7rem; color:var(--text-muted);">${m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</span>
            </div>
            <div class="mistake-answers-row">
              <div>Your answer: <span class="student-ans">${m.student_answer || '(empty)'}</span></div>
              <div>Correct answer: <span class="correct-ans">${m.correct_answer || ''}</span></div>
            </div>
            ${m.explanation ? `<div style="font-size:0.78rem; color:var(--text-secondary);">${m.explanation}</div>` : ''}
            <div class="mistake-actions">
              <button class="btn-outline mini" onclick="window.viewer.goToPage(${m.page_num})">📖 Go to Page</button>
              <button class="btn-success mini" onclick="window.app.resolveMistake(${m.id})">✓ Mark Resolved</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    }
  }

  async resolveMistake(mId) {
    try {
      const res = await fetch(`/api/mistakes/${mId}/resolve`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        const card = document.getElementById(`mistake-card-${mId}`);
        if (card) card.remove();
        this.loadProgress();
        this.loadMistakes();
        this.showToast('Mistake marked as resolved!');
      }
    } catch (err) {
      console.error('Failed to resolve mistake:', err);
    }
  }

  async resetProgress() {
    if (!confirm('Are you sure you want to reset ALL study progress, answers, mistakes, notes, bookmarks, custom blanks, and recordings? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        this.showToast('All study data reset successfully.');
        this.loadProgress();
        this.loadMistakes();
        if (window.vocabManager) window.vocabManager.loadVocabulary();
        if (window.notesManager) window.notesManager.loadNotesAndBookmarks();
        if (window.viewer) {
          const curP = window.viewer.currentPage;
          if (window.exercisesManager) window.exercisesManager.loadPageOverlays(curP);
          if (window.audioManager) window.audioManager.loadPageRecordings(curP);
          if (window.annotationsManager) window.annotationsManager.loadAnnotations(curP);
        }
      } else {
        alert('Reset failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Reset failed: ' + err);
    }
  }

  openGlobalSearch() {
    const modal = document.getElementById('global-search-modal');
    const input = document.getElementById('global-search-input');
    if (modal) {
      modal.style.display = 'flex';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
      this.executeGlobalSearch('');
    }
  }

  closeGlobalSearch() {
    const modal = document.getElementById('global-search-modal');
    if (modal) modal.style.display = 'none';
  }

  async executeGlobalSearch(q) {
    const container = document.getElementById('global-search-results');
    const counter = document.getElementById('search-results-counter');
    if (!container) return;

    if (!q || q.length < 2) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px;">
          Type at least 2 characters to search across the complete Oxford English File textbook.
        </div>
      `;
      if (counter) counter.textContent = '0 results';
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = data.results || [];
      this.currentSearchResults = results;
      this.renderFilteredSearchResults();
    } catch (e) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Search failed.</p>`;
    }
  }

  renderFilteredSearchResults() {
    const container = document.getElementById('global-search-results');
    const counter = document.getElementById('search-results-counter');
    if (!container) return;

    const filter = this.activeSearchFilter || 'all';
    let filtered = this.currentSearchResults || [];
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.type === filter);
    }

    if (counter) counter.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:28px; color:var(--text-muted);">No matching results found.</div>`;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      let badgeClass = 'badge-unit';
      if (item.type === 'vocab') badgeClass = 'badge-vocab';
      else if (item.type === 'exercise') badgeClass = 'badge-exercise';
      else if (item.type === 'note' || item.type === 'bookmark') badgeClass = 'badge-note';

      html += `
        <div class="search-result-card" onclick="window.app.onSearchResultClick(${item.pageNum})">
          <div class="search-result-header">
            <span class="search-badge ${badgeClass}">${item.category || item.type}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">Book p.${item.bookPage} (Page ${item.pageNum})</span>
          </div>
          <div class="search-title">${item.title}</div>
          <div class="search-snippet">${item.snippet || ''}</div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  onSearchResultClick(pageNum) {
    this.closeGlobalSearch();
    if (window.viewer) {
      window.viewer.goToPage(pageNum);
      this.showToast(`Jumped to Page ${pageNum}`);
    }
  }
}

// Instantiate app on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new DigitalTextbookApp();
});
