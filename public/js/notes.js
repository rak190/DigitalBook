/**
 * Notes & Bookmarks Module: Personal study notes, bookmarks,
 * and learning progress tracking.
 */

class NotesManager {
  constructor() {
    this.bookmarks = [];
    this.notes = [];

    this.initEvents();
  }

  initEvents() {
    // Bookmark button on toolbar
    document.getElementById('bookmark-toggle-btn')?.addEventListener('click', () => {
      this.toggleBookmark();
    });

    // Add note button
    document.getElementById('save-new-note-btn')?.addEventListener('click', () => {
      this.saveNote();
    });

    // Backup & Restore buttons
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      if (window.app && typeof window.app.exportUserData === 'function') window.app.exportUserData();
    });
    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
      if (window.app && typeof window.app.importUserData === 'function') window.app.importUserData(e);
    });
    document.getElementById('reset-study-data-btn')?.addEventListener('click', () => {
      if (window.app && typeof window.app.resetProgress === 'function') window.app.resetProgress();
    });
  }

  async loadNotesAndBookmarks() {
    try {
      const [notesRes, bmRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/bookmarks')
      ]);
      this.notes = await notesRes.json();
      this.bookmarks = await bmRes.json();

      this.renderNotes();
      this.renderBookmarks();
      this.updateBookmarkButton();
    } catch (err) {
      console.error('Error loading notes/bookmarks:', err);
    }
  }

  updateBookmarkButton() {
    const curPage = window.viewer ? window.viewer.currentPage : 1;
    const isBookmarked = this.bookmarks.some(b => b.page_num === curPage);
    const btn = document.getElementById('bookmark-toggle-btn');
    if (btn) {
      btn.classList.toggle('active', isBookmarked);
      btn.title = isBookmarked ? 'Remove Bookmark' : 'Bookmark this page';
    }
  }

  async toggleBookmark() {
    const curPage = window.viewer ? window.viewer.currentPage : 1;
    const isBookmarked = this.bookmarks.some(b => b.page_num === curPage);

    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks/${curPage}`, { method: 'DELETE' });
        this.bookmarks = this.bookmarks.filter(b => b.page_num !== curPage);
        if (window.app) window.app.showToast(`Bookmark removed from Page ${curPage}`);
      } else {
        const title = prompt('Bookmark title or label (optional):', `Page ${curPage}`) || `Page ${curPage}`;
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_num: curPage, title: title })
        });
        this.bookmarks.push({ page_num: curPage, title: title });
        if (window.app) window.app.showToast(`Page ${curPage} bookmarked!`);
      }
      this.updateBookmarkButton();
      this.renderBookmarks();
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  }

  renderBookmarks() {
    const container = document.getElementById('bookmarks-list-container');
    if (!container) return;

    if (this.bookmarks.length === 0) {
      container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px;">No bookmarks yet. Click the bookmark icon in the top bar to bookmark pages.</p>`;
      return;
    }

    let html = '';
    this.bookmarks.forEach(b => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:6px;">
          <span style="font-size:0.85rem; font-weight:600; cursor:pointer; color:var(--primary);" onclick="window.viewer.goToPage(${b.page_num})">
            🔖 ${b.title || `Page ${b.page_num}`}
          </span>
          <button class="btn-icon" style="width:24px; height:24px;" onclick="window.notesManager.removeBookmark(${b.page_num})">×</button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  async removeBookmark(pageNum) {
    try {
      await fetch(`/api/bookmarks/${pageNum}`, { method: 'DELETE' });
      this.bookmarks = this.bookmarks.filter(b => b.page_num !== pageNum);
      this.updateBookmarkButton();
      this.renderBookmarks();
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  }

  async saveNote() {
    const titleInput = document.getElementById('new-note-title');
    const contentInput = document.getElementById('new-note-content');
    const content = contentInput?.value?.trim();

    if (!content) {
      alert('Please enter note content');
      return;
    }

    const curPage = window.viewer ? window.viewer.currentPage : 1;
    const title = titleInput?.value?.trim() || `Notes on Page ${curPage}`;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_num: curPage, title: title, content: content })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (window.app) window.app.showToast('Note saved!');
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        await this.loadNotesAndBookmarks();
      }
    } catch (err) {
      console.error('Save note failed:', err);
    }
  }

  renderNotes() {
    const container = document.getElementById('notes-list-container');
    if (!container) return;

    if (this.notes.length === 0) {
      container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px;">No notes yet. Type a note above to record grammar explanations or study tips!</p>`;
      return;
    }

    let html = '';
    this.notes.forEach(n => {
      html += `
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:10px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
            <strong style="font-size:0.85rem; color:var(--primary); cursor:pointer;" onclick="window.viewer.goToPage(${n.page_num})">
              ${n.title} (p.${n.page_num})
            </strong>
            <button class="btn-icon" style="width:20px; height:20px; font-size:11px;" onclick="window.notesManager.deleteNote(${n.id})">×</button>
          </div>
          <div style="font-size:0.82rem; color:var(--text-primary); white-space:pre-wrap;">${n.content}</div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  async deleteNote(id) {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      this.notes = this.notes.filter(n => n.id !== id);
      this.renderNotes();
    } catch (err) {
      console.error('Delete note failed:', err);
    }
  }
}

window.NotesManager = NotesManager;
