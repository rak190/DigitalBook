/**
 * Viewer Module: Manages textbook rendering, zooming, panning,
 * single/spread page layouts, and coordinate transformations.
 */

class TextbookViewer {
  constructor() {
    this.currentPage = 7; // Start at Unit 1A (Book page 6)
    this.totalPages = 169;
    this.zoomLevel = 1.0; // 1.0 = 100%
    this.viewMode = 'single'; // 'single' or 'spread' (two-page)
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.panOffset = { x: 0, y: 0 };

    this.container = document.getElementById('viewport-container');
    this.spreadContainer = document.getElementById('book-spread-container');
    this.pageInput = document.getElementById('page-num-input');
    this.totalPagesSpan = document.getElementById('total-pages-span');
    this.unitPill = document.getElementById('current-unit-pill');
    this.zoomLevelSpan = document.getElementById('zoom-level-text');

    document.documentElement.style.setProperty('--zoom-scale', this.zoomLevel);
    this.initEvents();
  }

  initEvents() {
    // Navigation buttons
    document.getElementById('prev-page-btn')?.addEventListener('click', () => this.prevPage());
    document.getElementById('next-page-btn')?.addEventListener('click', () => this.nextPage());
    document.getElementById('first-page-btn')?.addEventListener('click', () => this.goToPage(1));
    document.getElementById('last-page-btn')?.addEventListener('click', () => this.goToPage(this.totalPages));

    // Page input
    this.pageInput?.addEventListener('change', (e) => {
      const p = parseInt(e.target.value);
      if (!isNaN(p) && p >= 1 && p <= this.totalPages) {
        this.goToPage(p);
      } else {
        this.updatePageUI();
      }
    });

    // Zoom controls
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
    document.getElementById('zoom-reset-btn')?.addEventListener('click', () => this.setZoom(1.0));
    document.getElementById('zoom-fit-btn')?.addEventListener('click', () => this.fitToWidth());

    // View mode toggle (single vs spread)
    document.getElementById('view-mode-btn')?.addEventListener('click', () => {
      this.viewMode = (this.viewMode === 'single') ? 'spread' : 'single';
      document.getElementById('view-mode-btn').classList.toggle('active', this.viewMode === 'spread');
      this.render();
    });

    // Panning when zoomed in
    this.container.addEventListener('mousedown', (e) => {
      if (window.app.currentTool === 'read' && this.zoomLevel > 1.0) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.container.scrollLeft -= dx;
        this.container.scrollTop -= dy;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (window.app.currentTool === 'read') {
          this.container.style.cursor = 'default';
        }
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Don't trigger when typing in inputs or text areas
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.nextPage();
      } else if (e.key === '+' || e.key === '=') {
        this.setZoom(this.zoomLevel + 0.15);
      } else if (e.key === '-') {
        this.setZoom(this.zoomLevel - 0.15);
      } else if (e.key === '0') {
        this.setZoom(1.0);
      }
    });
  }

  goToPage(pageNum) {
    if (pageNum < 1) pageNum = 1;
    if (pageNum > this.totalPages) pageNum = this.totalPages;
    
    // In spread mode, align to odd pages for book spreads
    if (this.viewMode === 'spread' && pageNum > 1 && pageNum % 2 === 1) {
      // Keep pageNum as is or adjust
    }

    this.currentPage = pageNum;
    this.updatePageUI();
    this.render();

    // Trigger page changed handlers
    if (window.app) {
      window.app.onPageChanged(this.currentPage);
    }
  }

  prevPage() {
    const step = (this.viewMode === 'spread') ? 2 : 1;
    this.goToPage(this.currentPage - step);
  }

  nextPage() {
    const step = (this.viewMode === 'spread') ? 2 : 1;
    this.goToPage(this.currentPage + step);
  }

  setZoom(level) {
    level = Math.max(0.5, Math.min(2.5, Math.round(level * 100) / 100));
    this.zoomLevel = level;
    this.spreadContainer.style.transform = `scale(${this.zoomLevel})`;
    document.documentElement.style.setProperty('--zoom-scale', this.zoomLevel);
    if (this.zoomLevelSpan) {
      this.zoomLevelSpan.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  fitToWidth() {
    const containerWidth = this.container.clientWidth - 48; // padding
    const pageWidth = 768; // standard display width for page
    const idealZoom = (this.viewMode === 'spread') ? containerWidth / (pageWidth * 2 + 16) : containerWidth / pageWidth;
    this.setZoom(idealZoom);
  }

  updatePageUI() {
    if (this.pageInput) this.pageInput.value = this.currentPage;
    if (this.totalPagesSpan) this.totalPagesSpan.textContent = `/ ${this.totalPages}`;

    const badge = document.getElementById('book-page-badge');
    if (badge) {
      const bookPage = Math.max(1, this.currentPage - 1);
      badge.textContent = `(Book p.${bookPage})`;
      badge.title = `Textbook page ${bookPage} (PDF file page ${this.currentPage})`;
    }

    // Update Unit badge / title
    if (window.app && window.app.bookInfo && window.app.bookInfo.toc) {
      const matched = window.app.findTocForPage(this.currentPage);
      if (matched && this.unitPill) {
        const prefix = matched.section ? `[${matched.section}] ` : '';
        this.unitPill.textContent = `${prefix}${matched.title}`;
        this.unitPill.title = matched.title;
      }
    }
  }

  render() {
    this.spreadContainer.innerHTML = '';
    const pagesToRender = (this.viewMode === 'spread' && this.currentPage < this.totalPages)
      ? [this.currentPage, this.currentPage + 1]
      : [this.currentPage];

    pagesToRender.forEach(pNum => {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'book-page-wrapper';
      pageWrapper.id = `page-wrapper-${pNum}`;
      pageWrapper.dataset.pageNum = pNum;

      // Base page image
      const img = document.createElement('img');
      img.className = 'book-page-image';
      img.id = `page-img-${pNum}`;
      img.src = `/api/pages/${pNum}`;
      img.alt = `Textbook Page ${pNum}`;
      img.style.width = '768px'; // Base width; canvas & layers scale proportionally

      // Canvas for drawing/strokes
      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas-layer';
      canvas.id = `canvas-page-${pNum}`;
      canvas.dataset.pageNum = pNum;

      // Overlays layer for exercise blanks
      const overlaysLayer = document.createElement('div');
      overlaysLayer.className = 'page-overlays-layer';
      overlaysLayer.id = `overlays-page-${pNum}`;
      overlaysLayer.dataset.pageNum = pNum;

      // Notes & custom textboxes layer
      const notesLayer = document.createElement('div');
      notesLayer.className = 'page-notes-layer';
      notesLayer.id = `notes-page-${pNum}`;
      notesLayer.dataset.pageNum = pNum;
      if (window.annotationsManager && ['textbox', 'stickynote'].includes(window.annotationsManager.currentTool)) {
        notesLayer.classList.add('interactive-mode');
      }

      pageWrapper.appendChild(img);
      pageWrapper.appendChild(canvas);
      pageWrapper.appendChild(overlaysLayer);
      pageWrapper.appendChild(notesLayer);
      this.spreadContainer.appendChild(pageWrapper);

      const initLayers = () => {
        canvas.width = img.clientWidth || 768;
        canvas.height = img.clientHeight || 968;
        if (window.annotationsManager) {
          window.annotationsManager.initPageCanvas(pNum);
        }
        if (window.exercisesManager) {
          window.exercisesManager.loadPageOverlays(pNum);
        }
      };

      if (img.complete && img.naturalWidth > 0) {
        initLayers();
      } else {
        img.onload = initLayers;
      }
    });

    this.setZoom(this.zoomLevel);
  }
}

window.TextbookViewer = TextbookViewer;
