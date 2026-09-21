/**
 * Exercises Module: Manages interactive fill-in blanks directly over textbook pages,
 * answer validation, score tracking, answer key reveal, and adding custom blanks.
 */

class ExercisesManager {
  constructor() {
    this.currentOverlays = {}; // { pageNum: [overlayObjs] }
    this.userAnswers = {};     // { pageNum: { overlayId: text } }
    this.scores = {};          // { pageNum: score }
    this.isAddingBlank = false;
    this.saveTimeout = null;

    this.pendingBlankCoords = null; // { pageNum, x, y }

    this.initGlobalEvents();
  }

  initGlobalEvents() {
    // Check answers button on toolbar
    document.getElementById('check-answers-btn')?.addEventListener('click', () => {
      if (window.viewer) this.checkAnswers(window.viewer.currentPage);
    });

    // Ask AI Tutor button on toolbar
    document.getElementById('ai-tutor-btn')?.addEventListener('click', () => {
      if (window.viewer) this.askAITutor(window.viewer.currentPage);
    });

    // AI Tutor Modal controls
    document.getElementById('close-ai-modal-btn')?.addEventListener('click', () => {
      this.closeAITutorModal();
    });
    document.getElementById('dismiss-ai-modal-btn')?.addEventListener('click', () => {
      this.closeAITutorModal();
    });

    // Reveal answer key button
    document.getElementById('reveal-answers-btn')?.addEventListener('click', () => {
      if (window.viewer) this.revealAnswers(window.viewer.currentPage);
    });

    // Reset answers button
    document.getElementById('reset-answers-btn')?.addEventListener('click', () => {
      if (window.viewer && confirm('Reset all answers on this page?')) {
        this.resetAnswers(window.viewer.currentPage);
      }
    });

    // Add Blank Tool toggle
    document.getElementById('add-blank-tool-btn')?.addEventListener('click', () => {
      if (window.app) {
        const nextMode = (window.app.currentTool === 'blank') ? 'read' : 'blank';
        window.app.setToolMode(nextMode);
      }
    });

    // Modal dialog controls for creating blanks
    document.getElementById('close-add-blank-modal-btn')?.addEventListener('click', () => {
      this.closeBlankModal();
    });
    document.getElementById('cancel-add-blank-btn')?.addEventListener('click', () => {
      this.closeBlankModal();
    });
    document.getElementById('confirm-add-blank-btn')?.addEventListener('click', () => {
      this.confirmCreateBlank();
    });
  }

  setAddBlankMode(active) {
    this.isAddingBlank = active;
    const btn = document.getElementById('add-blank-tool-btn');
    if (btn) btn.classList.toggle('active', active);

    document.querySelectorAll('.book-page-wrapper').forEach(w => {
      w.style.cursor = active ? 'crosshair' : 'default';
    });
  }

  toggleAddBlankMode() {
    if (window.app) {
      const nextMode = (this.isAddingBlank) ? 'read' : 'blank';
      window.app.setToolMode(nextMode);
    } else {
      this.setAddBlankMode(!this.isAddingBlank);
    }
  }

  async loadPageOverlays(pageNum) {
    const layer = document.getElementById(`overlays-page-${pageNum}`);
    if (!layer) return;

    try {
      const res = await fetch(`/api/overlays/${pageNum}`);
      const data = await res.json();
      this.currentOverlays[pageNum] = data.overlays || [];
      this.userAnswers[pageNum] = data.user_answers || {};
      this.scores[pageNum] = data.score || 0;

      this.renderOverlays(pageNum);
      this.updateSideExercisePanel(pageNum);
    } catch (err) {
      console.error('Error loading overlays for page', pageNum, err);
    }
  }

  renderOverlays(pageNum) {
    const layer = document.getElementById(`overlays-page-${pageNum}`);
    if (!layer) return;
    layer.innerHTML = '';

    const overlays = this.currentOverlays[pageNum] || [];
    const savedAnswers = this.userAnswers[pageNum] || {};

    overlays.forEach(ov => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'exercise-blank-input';
      input.id = `blank-${ov.id}`;
      input.dataset.overlayId = ov.id;
      input.style.left = `${ov.x}%`;
      input.style.top = `${ov.y}%`;
      input.style.width = `${ov.width}%`;
      input.style.height = `${ov.height}%`;
      input.placeholder = ov.placeholder || '';
      input.value = savedAnswers[ov.id] || '';
      input.autocomplete = 'off';
      input.spellcheck = false;

      // Audio prompt on hover / focus if audio helper enabled
      input.title = ov.hint ? `Hint: ${ov.hint}` : (ov.label || 'Fill in the blank');

      input.oninput = (e) => {
        if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
        this.userAnswers[pageNum][ov.id] = e.target.value;
        input.classList.remove('correct', 'incorrect', 'revealed');
        this.scheduleSaveAnswers(pageNum);
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this.checkAnswers(pageNum);
        }
      };

      layer.appendChild(input);
    });

    // Also attach click listener for creating new blanks when Add Blank mode is active
    const pageWrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (pageWrapper) {
      pageWrapper.onclick = (e) => {
        if (!this.isAddingBlank) return;
        // Don't trigger if clicked directly on an input
        if (e.target.classList.contains('exercise-blank-input')) return;

        const rect = pageWrapper.getBoundingClientRect();
        const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
        const pctY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

        this.showCreateBlankModal(pageNum, pctX, pctY);
      };
    }
  }

  showCreateBlankModal(pageNum, x, y) {
    this.pendingBlankCoords = { pageNum, x, y };
    const modal = document.getElementById('add-blank-modal-backdrop');
    if (modal) {
      modal.style.display = 'flex';
      const ansInput = document.getElementById('blank-modal-answer');
      if (ansInput) {
        ansInput.value = '';
        setTimeout(() => ansInput.focus(), 50);
      }
    }
  }

  closeBlankModal() {
    const modal = document.getElementById('add-blank-modal-backdrop');
    if (modal) modal.style.display = 'none';
    this.pendingBlankCoords = null;
  }

  confirmCreateBlank() {
    if (!this.pendingBlankCoords) return;
    const { pageNum, x, y } = this.pendingBlankCoords;

    const labelInput = document.getElementById('blank-modal-label');
    const answerInput = document.getElementById('blank-modal-answer');
    const hintInput = document.getElementById('blank-modal-hint');
    const placeholderInput = document.getElementById('blank-modal-placeholder');

    const label = labelInput?.value?.trim() || 'Q';
    const rawAnswers = answerInput?.value?.trim() || '';
    const answers = rawAnswers
      ? rawAnswers.split(',').map(a => a.trim()).filter(Boolean)
      : [];
    const hint = hintInput?.value?.trim() || '';
    const placeholder = placeholderInput?.value?.trim() || '...';

    const width = Math.min(40, Math.max(8, (answers[0] || placeholder).length * 1.6 + 4));

    this.createBlank(pageNum, {
      x: x,
      y: y,
      width: width,
      height: 2.0,
      placeholder: placeholder,
      label: label,
      correct_answers: answers,
      hint: hint,
      unit_ref: `Page ${pageNum} User Blank`
    });

    this.closeBlankModal();
  }

  async createBlank(pageNum, fieldData) {
    try {
      const payload = { page_num: pageNum, ...fieldData };
      const res = await fetch('/api/overlays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (window.app) window.app.showToast('Interactive blank added!');
        await this.loadPageOverlays(pageNum);
      }
    } catch (err) {
      console.error('Error creating blank:', err);
    }
  }

  async deleteBlank(pageNum, overlayId) {
    if (!confirm('Are you sure you want to delete this interactive blank?')) return;
    try {
      const res = await fetch(`/api/overlays/${overlayId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'deleted') {
        if (window.app) window.app.showToast('Blank deleted.');
        await this.loadPageOverlays(pageNum);
      }
    } catch (err) {
      console.error('Error deleting overlay blank:', err);
    }
  }

  async checkAnswers(pageNum) {
    // Harvest all current values directly from DOM inputs
    const layer = document.getElementById(`overlays-page-${pageNum}`);
    if (layer) {
      if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
      layer.querySelectorAll('.exercise-blank-input').forEach(input => {
        const ovId = input.dataset.overlayId;
        if (ovId) {
          this.userAnswers[pageNum][ovId] = input.value;
        }
      });
    }

    const answers = this.userAnswers[pageNum] || {};
    try {
      const res = await fetch(`/api/check-answers/${pageNum}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();

      if (data.results) {
        Object.entries(data.results).forEach(([ovId, resObj]) => {
          const input = document.getElementById(`blank-${ovId}`);
          if (!input) return;

          input.classList.remove('correct', 'incorrect', 'revealed');
          if (resObj.open_ended) {
            input.classList.add('correct');
          } else if (resObj.is_correct) {
            input.classList.add('correct');
          } else {
            input.classList.add('incorrect');
            if (resObj.hint) {
              input.title = `Incorrect. Hint: ${resObj.hint}`;
            }
          }
        });

        // Update score badge
        if (window.app) {
          const msg = `Exercise Result: ${data.correct} / ${data.total} (${data.score}%)`;
          window.app.showToast(msg);
        }
        this.updateSideExercisePanel(pageNum, data);
      }
    } catch (err) {
      console.error('Check answers failed:', err);
    }
  }

  revealAnswers(pageNum) {
    const overlays = this.currentOverlays[pageNum] || [];
    overlays.forEach(ov => {
      const input = document.getElementById(`blank-${ov.id}`);
      if (!input) return;

      if (ov.correct_answers && ov.correct_answers.length > 0) {
        input.value = ov.correct_answers[0];
        input.classList.remove('incorrect');
        input.classList.add('revealed');
        if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
        this.userAnswers[pageNum][ov.id] = input.value;
      }
    });

    if (window.app) window.app.showToast('Answer key revealed!');
    this.scheduleSaveAnswers(pageNum);
  }

  resetAnswers(pageNum) {
    const overlays = this.currentOverlays[pageNum] || [];
    overlays.forEach(ov => {
      const input = document.getElementById(`blank-${ov.id}`);
      if (input) {
        input.value = '';
        input.classList.remove('correct', 'incorrect', 'revealed');
      }
    });

    this.userAnswers[pageNum] = {};
    this.scheduleSaveAnswers(pageNum);
    this.updateSideExercisePanel(pageNum);
    if (window.app) window.app.showToast('Answers reset.');
  }

  scheduleSaveAnswers(pageNum) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        await fetch(`/api/answers/${pageNum}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: this.userAnswers[pageNum] || {} })
        });
      } catch (err) {
        console.error('Failed to save answers:', err);
      }
    }, 800);
  }

  async askAITutor(pageNum) {
    const layer = document.getElementById(`overlays-page-${pageNum}`);
    if (layer) {
      if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
      layer.querySelectorAll('.exercise-blank-input').forEach(input => {
        const ovId = input.dataset.overlayId;
        if (ovId) {
          this.userAnswers[pageNum][ovId] = input.value;
        }
      });
    }

    const modal = document.getElementById('ai-tutor-modal');
    const loading = document.getElementById('ai-tutor-loading');
    const results = document.getElementById('ai-tutor-results');
    if (modal) modal.style.display = 'flex';
    if (loading) loading.style.display = 'block';
    if (results) results.style.display = 'none';

    try {
      const res = await fetch('/api/ai-check-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_num: pageNum,
          answers: this.userAnswers[pageNum] || {}
        })
      });
      const data = await res.json();

      if (loading) loading.style.display = 'none';
      if (results) results.style.display = 'block';

      // Update badge
      const badge = document.getElementById('ai-mode-badge');
      if (badge) {
        badge.textContent = data.ai_powered ? 'Gemini 3.6 Flash' : 'Rule Engine';
        badge.style.background = data.ai_powered ? '#10b981' : '#6366f1';
      }

      // Update summary
      const summaryEl = document.getElementById('ai-summary-text');
      if (summaryEl) {
        summaryEl.textContent = data.teacher_summary || 'Evaluation completed.';
      }

      const correctCount = (data.correct !== undefined) ? data.correct : (data.correct_count ?? 0);
      const totalCount = (data.total !== undefined) ? data.total : (data.total_count ?? 0);

      // Update score badge
      const scoreBadge = document.getElementById('ai-score-badge');
      if (scoreBadge) {
        scoreBadge.textContent = `Score: ${data.score}% (${correctCount}/${totalCount})`;
      }

      // Render breakdown list
      const listEl = document.getElementById('ai-evaluations-list');
      if (listEl && data.evaluations) {
        listEl.innerHTML = '';
        Object.entries(data.evaluations).forEach(([ovId, ev]) => {
          const card = document.createElement('div');
          card.className = `ai-item-card ${ev.is_correct ? 'is-correct' : 'is-incorrect'}`;
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="font-size:0.85rem;">Item #${ovId}</strong>
              <span style="font-size:0.75rem; font-weight:700;">${ev.is_correct ? '✅ Correct' : '❌ Needs Review'}</span>
            </div>
            <div style="font-size:0.8rem; margin-bottom:2px;">Your Answer: <em>${ev.student_answer || '(empty)'}</em></div>
            ${!ev.is_correct ? `<div style="font-size:0.8rem; color:var(--primary); margin-bottom:2px;">Answer Key: <strong>${ev.correct_answer}</strong></div>` : ''}
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">${ev.explanation}</div>
            ${ev.grammar_tip ? `<div style="font-size:0.75rem; color:#6366f1; margin-top:3px;">💡 Tip: ${ev.grammar_tip}</div>` : ''}
          `;
          listEl.appendChild(card);

          // Also highlight on-page inputs
          const input = document.getElementById(`blank-${ovId}`);
          if (input) {
            input.classList.remove('correct', 'incorrect', 'revealed');
            input.classList.add(ev.is_correct ? 'correct' : 'incorrect');
            if (ev.grammar_tip) input.title = ev.grammar_tip;
          }
        });
      }

      if (window.app) {
        window.app.showToast(`AI Tutor: ${data.score}% (${correctCount}/${totalCount})`);
      }

    } catch (err) {
      console.error('AI check answers error:', err);
      if (loading) loading.style.display = 'none';
      if (results) results.style.display = 'block';
      const summaryEl = document.getElementById('ai-summary-text');
      if (summaryEl) summaryEl.textContent = 'Could not connect to AI service. Please check your connection.';
    }
  }

  closeAITutorModal() {
    const modal = document.getElementById('ai-tutor-modal');
    if (modal) modal.style.display = 'none';
  }

  updateSideExercisePanel(pageNum, checkResults = null) {
    const panel = document.getElementById('side-exercises-content');
    if (!panel) return;

    const overlays = this.currentOverlays[pageNum] || [];
    if (overlays.length === 0) {
      panel.innerHTML = `
        <div style="text-align:center; padding: 32px 16px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📝</div>
          <p style="font-weight:600; margin-bottom: 8px;">No exercise blanks on this page</p>
          <p style="font-size: 0.8rem; margin-bottom: 16px;">Use "Add Blank" or click "Write Notes" to add answers directly onto the book page.</p>
          <button class="btn-primary" onclick="window.exercisesManager.toggleAddBlankMode()">+ Add Blank to this Page</button>
        </div>
      `;
      return;
    }

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; gap: 6px;">
        <span style="font-weight:700; font-size:0.85rem;">p.${pageNum} Exercises (${overlays.length})</span>
        <div style="display:flex; gap:4px;">
          <button class="btn-success" style="font-size:0.75rem; padding:3px 8px;" onclick="window.exercisesManager.checkAnswers(${pageNum})">✓ Check</button>
          <button class="btn-primary" style="background:linear-gradient(135deg,#4f46e5,#7c3aed); border:none; font-size:0.75rem; padding:3px 8px;" onclick="window.exercisesManager.askAITutor(${pageNum})">🤖 AI Tutor</button>
        </div>
      </div>
    `;

    overlays.forEach((ov, idx) => {
      const userVal = (this.userAnswers[pageNum] && this.userAnswers[pageNum][ov.id]) || '';
      const result = checkResults?.results?.[ov.id];
      const statusIcon = result ? (result.is_correct ? '✅' : '❌') : '✏️';

      html += `
        <div class="exercise-card" id="side-ex-card-${ov.id}">
          <div class="exercise-title">
            <span>${ov.label || `Question ${idx + 1}`}</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span>${statusIcon}</span>
              <button class="delete-overlay-btn" title="Delete blank" onclick="window.exercisesManager.deleteBlank(${pageNum}, ${ov.id})">🗑</button>
            </div>
          </div>
          ${ov.hint ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">Hint: ${ov.hint}</div>` : ''}
          <div class="exercise-input-row">
            <input type="text" class="exercise-panel-input" value="${userVal}" 
              placeholder="${ov.placeholder || 'Answer...'}"
              oninput="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, this.value)">
            <button class="btn-icon" title="Listen to question" onclick="window.audioManager.speakText('${(ov.hint || ov.label || 'Question ' + (idx + 1)).replace(/'/g, "\\'")}')">🔊</button>
          </div>
          ${ov.explanation ? `<div style="font-size:0.75rem; color:var(--primary); margin-top:4px;">${ov.explanation}</div>` : ''}
        </div>
      `;
    });

    panel.innerHTML = html;
  }

  onPanelInputChange(pageNum, ovId, val) {
    if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
    this.userAnswers[pageNum][ovId] = val;

    // Sync corresponding on-page input
    const onPageInput = document.getElementById(`blank-${ovId}`);
    if (onPageInput) {
      onPageInput.value = val;
      onPageInput.classList.remove('correct', 'incorrect', 'revealed');
    }
    this.scheduleSaveAnswers(pageNum);
  }
}

window.ExercisesManager = ExercisesManager;
