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

    // Calibrate Tool toggle
    document.getElementById('calibrate-tool-btn')?.addEventListener('click', () => {
      if (window.app) {
        const nextMode = (window.app.currentTool === 'calibrate') ? 'read' : 'calibrate';
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

    // Calibration modal controls
    document.getElementById('close-calibration-modal-btn')?.addEventListener('click', () => {
      this.closeCalibrationModal();
    });
    document.getElementById('cancel-calibration-btn')?.addEventListener('click', () => {
      this.closeCalibrationModal();
    });
    document.getElementById('save-calibration-btn')?.addEventListener('click', () => {
      this.saveCalibrationModal();
    });
    document.getElementById('delete-calibration-btn')?.addEventListener('click', () => {
      this.deleteCalibrationModal();
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
    const isCalibrate = window.app && window.app.currentTool === 'calibrate';

    overlays.forEach(ov => {
      let elem;
      const fType = ov.field_type || 'text';
      const opts = Array.isArray(ov.options) ? ov.options : (typeof ov.options === 'string' ? JSON.parse(ov.options || '[]') : []);

      if (fType === 'textarea' || fType === 'self_check') {
        elem = document.createElement('textarea');
        elem.className = 'exercise-blank-input exercise-textarea';
        elem.placeholder = ov.placeholder || (fType === 'self_check' ? 'Write your answer...' : 'Write here...');
      } else if (fType === 'dropdown' || (fType === 'radio' && opts.length > 0)) {
        elem = document.createElement('select');
        elem.className = 'exercise-blank-input exercise-dropdown';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = ov.placeholder || (fType === 'radio' ? 'Choose option...' : 'Select...');
        elem.appendChild(defaultOpt);
        opts.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          elem.appendChild(o);
        });
      } else if (fType === 'checkbox') {
        elem = document.createElement('input');
        elem.type = 'checkbox';
        elem.className = 'exercise-blank-input exercise-checkbox';
        elem.checked = savedAnswers[ov.id] === 'true' || savedAnswers[ov.id] === true || savedAnswers[ov.id] === '1';
      } else {
        elem = document.createElement('input');
        elem.type = 'text';
        elem.className = 'exercise-blank-input';
        elem.placeholder = ov.placeholder || '';
      }

      elem.id = `blank-${ov.id}`;
      elem.dataset.overlayId = ov.id;
      elem.style.left = `${ov.x}%`;
      elem.style.top = `${ov.y}%`;
      elem.style.width = `${ov.width}%`;
      elem.style.height = `${ov.height}%`;
      if (fType !== 'checkbox') {
        elem.value = savedAnswers[ov.id] || '';
      }
      elem.autocomplete = 'off';
      elem.spellcheck = false;

      // Audio prompt on hover / focus if audio helper enabled
      if (ov.grading_type === 'self-check' || fType === 'self_check') {
        elem.title = `Self-check task. Model: ${ov.sample_answer || ov.correct_answers?.[0] || 'Open-ended answer'}`;
      } else if (ov.audio_track) {
        elem.title = `Listening track [${ov.audio_track}]. Hint: ${ov.hint || ov.label || ''}`;
      } else {
        elem.title = ov.hint ? `Hint: ${ov.hint}` : (ov.label || 'Fill in the blank');
      }

      if (isCalibrate) {
        elem.title = `[Calibrate] Click to edit (${ov.x}%, ${ov.y}%, ${ov.width}%, ${ov.height}%)`;
        elem.onclick = (e) => {
          e.stopPropagation();
          this.openCalibrationModal(ov, pageNum);
        };
      }

      elem.oninput = (e) => {
        if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
        this.userAnswers[pageNum][ov.id] = (fType === 'checkbox') ? (elem.checked ? 'true' : 'false') : e.target.value;
        elem.classList.remove('correct', 'incorrect', 'revealed');
        this.scheduleSaveAnswers(pageNum);
      };

      if (fType === 'dropdown' || fType === 'checkbox' || fType === 'radio') {
        elem.onchange = (e) => {
          if (!this.userAnswers[pageNum]) this.userAnswers[pageNum] = {};
          this.userAnswers[pageNum][ov.id] = (fType === 'checkbox') ? (elem.checked ? 'true' : 'false') : e.target.value;
          elem.classList.remove('correct', 'incorrect', 'revealed');
          this.scheduleSaveAnswers(pageNum);
        };
      }

      elem.onkeydown = (e) => {
        if (e.key === 'Enter') {
          if ((fType === 'textarea' || fType === 'self_check') && !e.ctrlKey) return;
          const allInputs = Array.from(layer.querySelectorAll('.exercise-blank-input'));
          const currentIdx = allInputs.indexOf(elem);
          if (currentIdx >= 0 && currentIdx < allInputs.length - 1) {
            allInputs[currentIdx + 1].focus();
          } else {
            this.checkAnswers(pageNum);
          }
        }
      };

      layer.appendChild(elem);
    });

    // Also attach click listener for creating new blanks when Add Blank or Calibrate mode is active
    const pageWrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (pageWrapper) {
      pageWrapper.onclick = (e) => {
        if (this.isAddingBlank) {
          if (e.target.classList.contains('exercise-blank-input')) return;
          const rect = pageWrapper.getBoundingClientRect();
          const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
          const pctY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
          this.showCreateBlankModal(pageNum, pctX, pctY);
        } else if (window.app && window.app.currentTool === 'calibrate') {
          if (e.target.classList.contains('exercise-blank-input')) return;
          const rect = pageWrapper.getBoundingClientRect();
          const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
          const pctY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
          this.openCalibrationModal({
            x: pctX,
            y: pctY,
            width: 15.0,
            height: 2.2,
            label: `Ex ${overlays.length + 1}`
          }, pageNum);
        }
      };
    }
  }

  openCalibrationModal(ov, pageNum = null) {
    const modal = document.getElementById('calibration-modal');
    if (!modal) return;
    const pNum = pageNum || (window.viewer ? window.viewer.currentPage : 7);

    document.getElementById('calib-id').value = ov.id || '';
    document.getElementById('calib-page-num').value = pNum;
    document.getElementById('calib-label').value = ov.label || '';
    document.getElementById('calib-field-type').value = ov.field_type || 'text';
    document.getElementById('calib-answers').value = Array.isArray(ov.correct_answers) ? ov.correct_answers.join(', ') : (ov.correct_answers || '');
    document.getElementById('calib-options').value = Array.isArray(ov.options) ? ov.options.join(', ') : (ov.options || '');
    document.getElementById('calib-grading-type').value = ov.grading_type || 'exact';
    document.getElementById('calib-audio-track').value = ov.audio_track || '';
    document.getElementById('calib-sample-answer').value = ov.sample_answer || '';
    document.getElementById('calib-hint').value = ov.hint || '';
    document.getElementById('calib-explanation').value = ov.explanation || '';
    document.getElementById('calib-x').value = ov.x !== undefined ? ov.x : 10;
    document.getElementById('calib-y').value = ov.y !== undefined ? ov.y : 10;
    document.getElementById('calib-w').value = ov.width !== undefined ? ov.width : 15;
    document.getElementById('calib-h').value = ov.height !== undefined ? ov.height : 2.2;

    const delBtn = document.getElementById('delete-calibration-btn');
    if (delBtn) delBtn.style.display = ov.id ? 'block' : 'none';

    modal.style.display = 'flex';
  }

  closeCalibrationModal() {
    const modal = document.getElementById('calibration-modal');
    if (modal) modal.style.display = 'none';
  }

  async saveCalibrationModal() {
    const id = document.getElementById('calib-id').value;
    const pageNum = parseInt(document.getElementById('calib-page-num').value) || (window.viewer ? window.viewer.currentPage : 7);
    const label = document.getElementById('calib-label').value.trim() || 'Question';
    const fieldType = document.getElementById('calib-field-type').value;
    const rawAnswers = document.getElementById('calib-answers').value.trim();
    const correctAnswers = rawAnswers ? rawAnswers.split(',').map(a => a.trim()).filter(Boolean) : [];
    const rawOptions = document.getElementById('calib-options').value.trim();
    const options = rawOptions ? rawOptions.split(',').map(o => o.trim()).filter(Boolean) : [];
    const gradingType = document.getElementById('calib-grading-type').value;
    const audioTrack = document.getElementById('calib-audio-track').value.trim();
    const sampleAnswer = document.getElementById('calib-sample-answer').value.trim();
    const hint = document.getElementById('calib-hint').value.trim();
    const explanation = document.getElementById('calib-explanation').value.trim();
    const x = parseFloat(document.getElementById('calib-x').value) || 10;
    const y = parseFloat(document.getElementById('calib-y').value) || 10;
    const width = parseFloat(document.getElementById('calib-w').value) || 15;
    const height = parseFloat(document.getElementById('calib-h').value) || 2.2;

    const payload = {
      page_num: pageNum,
      label,
      field_type: fieldType,
      correct_answers: correctAnswers,
      options,
      grading_type: gradingType,
      audio_track: audioTrack,
      sample_answer: sampleAnswer,
      hint,
      explanation,
      x,
      y,
      width,
      height,
      placeholder: (fieldType === 'dropdown' ? 'Select...' : 'Answer...')
    };

    try {
      const url = id ? `/api/overlays/${id}` : '/api/overlays';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (window.app) window.app.showToast('Overlay saved successfully!');
        this.closeCalibrationModal();
        await this.loadPageOverlays(pageNum);
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Save calibration failed:', err);
      alert('Network error saving overlay.');
    }
  }

  async deleteCalibrationModal() {
    const id = document.getElementById('calib-id').value;
    const pageNum = parseInt(document.getElementById('calib-page-num').value) || (window.viewer ? window.viewer.currentPage : 7);
    if (!id) return;
    if (!confirm('Are you sure you want to delete this overlay?')) return;

    try {
      const res = await fetch(`/api/overlays/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'deleted') {
        if (window.app) window.app.showToast('Overlay deleted.');
        this.closeCalibrationModal();
        await this.loadPageOverlays(pageNum);
      }
    } catch (err) {
      console.error('Delete overlay failed:', err);
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
          if (typeof window.app.loadProgress === 'function') window.app.loadProgress();
          if (typeof window.app.loadMistakes === 'function') window.app.loadMistakes();
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
        if (typeof window.app.loadProgress === 'function') window.app.loadProgress();
        if (typeof window.app.loadMistakes === 'function') window.app.loadMistakes();
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
    const tocItem = window.app ? window.app.findTocForPage(pageNum) : null;
    const bookP = (tocItem && tocItem.bookPage) ? tocItem.bookPage : Math.max(1, pageNum - 1);
    const unitTag = tocItem?.section || tocItem?.unit || (pageNum >= 127 && pageNum <= 150 ? 'Grammar Bank' : (pageNum >= 151 && pageNum <= 164 ? 'Vocab Bank' : 'Course Unit'));
    const pageTitle = tocItem?.title || `Page ${pageNum}`;

    const answeredCount = overlays.filter(ov => {
      const v = this.userAnswers[pageNum]?.[ov.id];
      return v !== undefined && v !== null && String(v).trim() !== '';
    }).length;
    const totalCount = overlays.length;
    const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    let html = `
      <!-- Page Context & Progress Card (Requirement 45) -->
      <div class="page-context-card" style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div>
            <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; background:rgba(2,132,199,0.15); color:var(--primary); padding:2px 6px; border-radius:4px;">
              ${unitTag}
            </span>
            <div style="font-weight:700; font-size:0.92rem; color:var(--text-primary); margin-top:3px;">
              ${pageTitle}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Textbook p.${bookP} (PDF Page ${pageNum})
            </div>
          </div>
          ${totalCount > 0 ? `<span style="font-size:0.75rem; font-weight:700; color:var(--primary);">${answeredCount}/${totalCount}</span>` : ''}
        </div>

        ${totalCount > 0 ? `
          <div style="width:100%; height:5px; background:var(--bg-dark); border-radius:3px; overflow:hidden; margin-bottom:10px;">
            <div style="height:100%; width:${progressPct}%; background:linear-gradient(90deg, #0284c7, #10b981); transition:width 0.3s ease;"></div>
          </div>
        ` : ''}

        <!-- Quick Action Shortcuts -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; margin-top:8px;">
          <button class="btn-outline mini" style="font-size:0.72rem; padding:4px 2px; text-align:center;" title="Check answers on this page" onclick="window.exercisesManager.checkAnswers(${pageNum})">✓ Check</button>
          <button class="btn-outline mini" style="font-size:0.72rem; padding:4px 2px; text-align:center;" title="Reset answers on this page" onclick="window.exercisesManager.resetAnswers(${pageNum})">🔄 Reset</button>
          <button class="btn-outline mini" style="font-size:0.72rem; padding:4px 2px; text-align:center;" title="Open study notes" onclick="window.app?.toggleDrawer('drawer-notes')">📝 Notes</button>
          <button class="btn-outline mini" style="font-size:0.72rem; padding:4px 2px; text-align:center;" title="Open audio player" onclick="window.app?.toggleDrawer('drawer-audio')">🎧 Audio</button>
        </div>
      </div>
    `;

    // Compact checking result banner
    if (checkResults && checkResults.results) {
      const isGood = (checkResults.score || 0) >= 70;
      html += `
        <div class="check-result-banner" style="background:${isGood ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}; border:1px solid ${isGood ? '#10b981' : '#ef4444'}; border-radius:8px; padding:10px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.88rem; color:${isGood ? '#10b981' : '#ef4444'};">
              ✓ ${checkResults.correct}/${checkResults.total} correct (${checkResults.score}%)
            </strong>
            <span style="font-size:0.72rem; font-weight:700; color:var(--text-secondary);">
              ${isGood ? '🎉 Well done!' : 'Review tips'}
            </span>
          </div>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn-outline mini" style="font-size:0.7rem;" onclick="window.app?.toggleDrawer('drawer-mistakes')">Review Mistakes</button>
            <button class="btn-outline mini" style="font-size:0.7rem;" onclick="window.exercisesManager.revealAnswers(${pageNum})">Show Answers</button>
            <button class="btn-outline mini" style="font-size:0.7rem;" onclick="window.exercisesManager.resetAnswers(${pageNum})">Try Again</button>
            <button class="btn-primary mini" style="font-size:0.7rem; background:linear-gradient(135deg,#4f46e5,#7c3aed); border:none;" onclick="window.exercisesManager.askAITutor(${pageNum})">🤖 AI Tutor</button>
          </div>
        </div>
      `;
    }

    // If no blanks exist on this page, show rich Page Learning Overview card (Requirement 45)
    if (overlays.length === 0) {
      html += `
        <div class="page-overview-card" style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="font-size:1.6rem;">📖</span>
            <div>
              <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">${pageTitle}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">Lesson Reading & Topic Overview</div>
            </div>
          </div>

          ${tocItem?.grammar ? `
            <div style="font-size:0.8rem; margin-bottom:6px; background:var(--bg-card); padding:6px 8px; border-radius:4px;">
              <strong>🎯 Grammar:</strong> <span style="color:var(--primary); font-weight:600;">${tocItem.grammar}</span>
            </div>
          ` : ''}

          ${tocItem?.vocabulary ? `
            <div style="font-size:0.8rem; margin-bottom:6px; background:var(--bg-card); padding:6px 8px; border-radius:4px;">
              <strong>🔤 Vocabulary:</strong> <span style="color:var(--primary); font-weight:600;">${tocItem.vocabulary}</span>
            </div>
          ` : ''}

          ${tocItem?.pronunciation ? `
            <div style="font-size:0.8rem; margin-bottom:10px; background:var(--bg-card); padding:6px 8px; border-radius:4px;">
              <strong>🗣 Pronunciation:</strong> <span style="color:var(--primary); font-weight:600;">${tocItem.pronunciation}</span>
            </div>
          ` : ''}

          <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4; margin-bottom:12px; border-top:1px solid var(--border-color); padding-top:8px;">
            This page provides course presentation, reading texts, and speaking activities. You can annotate directly on the page, listen to tracks, or add custom fill-in blanks:
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <button class="btn-outline" style="text-align:left; font-size:0.8rem; padding:8px 10px;" onclick="window.app?.toggleDrawer('drawer-audio')">
              🎧 Listen to Lesson Audio Tracks
            </button>
            <button class="btn-outline" style="text-align:left; font-size:0.8rem; padding:8px 10px;" onclick="window.app?.toggleDrawer('drawer-notes')">
              📝 Record Study Notes & Insights
            </button>
            <button class="btn-primary" style="text-align:left; font-size:0.8rem; padding:8px 10px;" onclick="window.exercisesManager.toggleAddBlankMode()">
              ➕ Add Interactive Blank to this Page
            </button>
          </div>
        </div>
      `;
      panel.innerHTML = html;
      return;
    }

    // Render interactive exercise cards
    overlays.forEach((ov, idx) => {
      const userVal = (this.userAnswers[pageNum] && this.userAnswers[pageNum][ov.id]) || '';
      const result = checkResults?.results?.[ov.id];
      const statusIcon = result ? (result.is_correct ? '✅' : '❌') : '✏️';
      const fType = ov.field_type || 'text';
      const opts = Array.isArray(ov.options) ? ov.options : (typeof ov.options === 'string' ? JSON.parse(ov.options || '[]') : []);

      let inputHtml = '';
      if (fType === 'textarea' || fType === 'self_check') {
        inputHtml = `
          <textarea class="exercise-panel-input" rows="2" style="width:100%; resize:vertical; font-family:inherit; margin-bottom:4px;"
            placeholder="${ov.placeholder || (fType === 'self_check' ? 'Write your answer...' : 'Answer...')}"
            oninput="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, this.value)">${userVal}</textarea>
        `;
      } else if (fType === 'dropdown') {
        let optsHtml = `<option value="">${ov.placeholder || 'Select...'}</option>`;
        opts.forEach(o => {
          optsHtml += `<option value="${o}" ${userVal === o ? 'selected' : ''}>${o}</option>`;
        });
        inputHtml = `
          <select class="exercise-panel-input" style="width:100%; margin-bottom:4px;"
            onchange="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, this.value)">${optsHtml}</select>
        `;
      } else if (fType === 'radio' && opts.length > 0) {
        inputHtml = `
          <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:4px;">
            ${opts.map((o, optIdx) => `
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="radio" name="side-radio-${ov.id}" value="${o}" ${userVal === o ? 'checked' : ''}
                  onchange="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, '${o.replace(/'/g, "\\'")}')">
                <span>${o}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else if (fType === 'checkbox') {
        inputHtml = `
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:6px; margin-bottom:4px; cursor:pointer;">
            <input type="checkbox" class="exercise-panel-input" ${userVal === 'true' ? 'checked' : ''}
              onchange="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, this.checked ? 'true' : 'false')">
            <span>${ov.placeholder || 'Correct / Selected'}</span>
          </label>
        `;
      } else {
        inputHtml = `
          <input type="text" class="exercise-panel-input" value="${userVal}" 
            placeholder="${ov.placeholder || 'Answer...'}"
            oninput="window.exercisesManager.onPanelInputChange(${pageNum}, ${ov.id}, this.value)">
        `;
      }

      html += `
        <div class="exercise-card" id="side-ex-card-${ov.id}">
          <div class="exercise-title">
            <span style="font-weight:700;">${ov.label || `Question ${idx + 1}`}</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span>${statusIcon}</span>
              <button class="delete-overlay-btn" title="Delete blank" onclick="window.exercisesManager.deleteBlank(${pageNum}, ${ov.id})">🗑</button>
            </div>
          </div>
          ${ov.hint ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">💡 Hint: ${ov.hint}</div>` : ''}
          <div class="exercise-input-row">
            ${inputHtml}
            <button class="btn-icon" title="Listen to question" onclick="window.audioManager.speakText('${(ov.hint || ov.label || 'Question ' + (idx + 1)).replace(/'/g, "\\'")}')">🔊</button>
            ${ov.audio_track ? `<button class="btn-icon" title="Play Listening Track ${ov.audio_track}" onclick="window.audioManager.selectTrack('${ov.audio_track}'); window.audioManager.play();">🎧</button>` : ''}
          </div>
          ${ov.sample_answer ? `
            <div style="font-size:0.75rem; color:#10b981; margin-top:4px; background:rgba(16,185,129,0.08); padding:4px 6px; border-radius:4px;">
              <strong>Model:</strong> ${ov.sample_answer}
            </div>
          ` : ''}
          ${ov.explanation ? `
            <div style="font-size:0.75rem; color:var(--primary); margin-top:4px;">
              ℹ️ ${ov.explanation}
            </div>
          ` : ''}
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
