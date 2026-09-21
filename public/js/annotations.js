/**
 * Annotations Module: Handles pen drawings, highlighter, eraser,
 * custom click-to-write text boxes, sticky notes, and auto-saving.
 */

class AnnotationsManager {
  constructor() {
    this.currentTool = 'read'; // 'read', 'pen', 'highlighter', 'eraser', 'textbox', 'stickynote', 'blank'
    this.penColor = '#0284c7';
    this.penWidth = 3;
    this.highlighterColor = 'rgba(250, 204, 21, 0.4)'; // translucent yellow
    this.highlighterWidth = 20;

    this.pagesData = {}; // { pageNum: { strokes: [], text_boxes: [], sticky_notes: [] } }
    this.undoStack = {}; // { pageNum: [] }
    this.redoStack = {}; // { pageNum: [] }
    this.isDrawing = false;
    this.currentStroke = null;
    this.saveTimeout = null;

    this.initGlobalEvents();
  }

  initGlobalEvents() {
    // Pen options (colors)
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
        this.penColor = e.target.dataset.color;
      });
    });

    // Stroke width slider
    document.getElementById('stroke-width-slider')?.addEventListener('input', (e) => {
      this.penWidth = parseInt(e.target.value);
    });

    // Undo / Redo buttons
    document.getElementById('undo-btn')?.addEventListener('click', () => {
      if (window.viewer) this.undo(window.viewer.currentPage);
    });
    document.getElementById('redo-btn')?.addEventListener('click', () => {
      if (window.viewer) this.redo(window.viewer.currentPage);
    });
    document.getElementById('clear-annotations-btn')?.addEventListener('click', () => {
      if (window.viewer && confirm('Are you sure you want to clear all drawings and notes on this page?')) {
        this.clearPageAnnotations(window.viewer.currentPage);
      }
    });
  }

  setTool(tool) {
    this.currentTool = tool;
    const canvases = document.querySelectorAll('.page-canvas-layer');
    canvases.forEach(c => {
      if (['pen', 'highlighter', 'eraser'].includes(tool)) {
        c.classList.add('drawing-active');
      } else {
        c.classList.remove('drawing-active');
      }
    });

    // Toggle interactive mode on notes layers for textbox & stickynote
    const notesLayers = document.querySelectorAll('.page-notes-layer');
    notesLayers.forEach(nl => {
      if (['textbox', 'stickynote'].includes(tool)) {
        nl.classList.add('interactive-mode');
      } else {
        nl.classList.remove('interactive-mode');
      }
    });

    // Show/hide pen options toolbar
    const penOptions = document.getElementById('pen-options-bar');
    if (penOptions) {
      penOptions.style.display = ['pen', 'highlighter'].includes(tool) ? 'flex' : 'none';
    }
  }

  async initPageCanvas(pageNum) {
    const canvas = document.getElementById(`canvas-page-${pageNum}`);
    const notesLayer = document.getElementById(`notes-page-${pageNum}`);
    if (!canvas || !notesLayer) return;

    // Load data from server if not already loaded
    if (!this.pagesData[pageNum]) {
      try {
        const res = await fetch(`/api/annotations/${pageNum}`);
        const data = await res.json();
        this.pagesData[pageNum] = {
          strokes: data.strokes || [],
          text_boxes: data.text_boxes || [],
          sticky_notes: data.sticky_notes || []
        };
      } catch (err) {
        console.error('Error loading annotations:', err);
        this.pagesData[pageNum] = { strokes: [], text_boxes: [], sticky_notes: [] };
      }
    }

    // Attach canvas drawing listeners
    this.setupDrawingListeners(canvas, pageNum);

    // Attach click listener for text box & sticky note creation on notesLayer
    this.setupNotesLayerListeners(notesLayer, pageNum);

    // Redraw strokes
    this.redrawCanvas(pageNum);

    // Render text boxes and sticky notes
    this.renderNotesAndBoxes(pageNum);
  }

  setupDrawingListeners(canvas, pageNum) {
    const ctx = canvas.getContext('2d');

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pctX: ((e.clientX - rect.left) / rect.width) * 100,
        pctY: ((e.clientY - rect.top) / rect.height) * 100
      };
    };

    canvas.onmousedown = (e) => {
      if (!['pen', 'highlighter', 'eraser'].includes(this.currentTool)) return;
      this.isDrawing = true;
      const coords = getCoords(e);

      if (this.currentTool === 'eraser') {
        this.eraseAtPoint(pageNum, coords.pctX, coords.pctY);
        return;
      }

      this.saveUndoState(pageNum);

      this.currentStroke = {
        tool: this.currentTool,
        color: this.currentTool === 'highlighter' ? this.highlighterColor : this.penColor,
        width: this.currentTool === 'highlighter' ? this.highlighterWidth : this.penWidth,
        points: [{ x: coords.pctX, y: coords.pctY }]
      };

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    canvas.onmousemove = (e) => {
      if (!this.isDrawing) return;
      const coords = getCoords(e);

      if (this.currentTool === 'eraser') {
        this.eraseAtPoint(pageNum, coords.pctX, coords.pctY);
        return;
      }

      if (!this.currentStroke) return;
      this.currentStroke.points.push({ x: coords.pctX, y: coords.pctY });

      // Immediate draw
      ctx.lineWidth = this.currentStroke.width;
      ctx.strokeStyle = this.currentStroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (this.currentStroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (this.isDrawing && this.currentStroke) {
        if (this.currentStroke.points.length > 0) {
          this.pagesData[pageNum].strokes.push(this.currentStroke);
          this.scheduleSave(pageNum);
        }
        this.currentStroke = null;
        this.redrawCanvas(pageNum);
      }
      this.isDrawing = false;
    };

    canvas.onmouseup = stopDrawing;
    canvas.onmouseleave = stopDrawing;
  }

  setupNotesLayerListeners(notesLayer, pageNum) {
    notesLayer.onclick = (e) => {
      // Only clicks directly on blank area of notesLayer
      if (e.target !== notesLayer) return;

      const rect = notesLayer.getBoundingClientRect();
      const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
      const pctY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

      if (this.currentTool === 'textbox') {
        this.createTextBox(pageNum, pctX, pctY, 'Type your answer here...');
      } else if (this.currentTool === 'stickynote') {
        this.createStickyNote(pageNum, pctX, pctY, 'Notes / Grammar rule...');
      }
    };
  }

  redrawCanvas(pageNum) {
    const canvas = document.getElementById(`canvas-page-${pageNum}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const strokes = this.pagesData[pageNum]?.strokes || [];
    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.lineWidth = stroke.width;
      ctx.strokeStyle = stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      const p0 = stroke.points[0];
      ctx.moveTo((p0.x / 100) * canvas.width, (p0.y / 100) * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo((p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
      }
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
  }

  eraseAtPoint(pageNum, pctX, pctY) {
    const strokes = this.pagesData[pageNum]?.strokes;
    if (!strokes) return;

    const radius = 3.0; // percentage distance
    const initialLen = strokes.length;

    this.pagesData[pageNum].strokes = strokes.filter(stroke => {
      return !stroke.points.some(pt => {
        const dx = pt.x - pctX;
        const dy = pt.y - pctY;
        return Math.sqrt(dx * dx + dy * dy) < radius;
      });
    });

    if (this.pagesData[pageNum].strokes.length !== initialLen) {
      this.redrawCanvas(pageNum);
      this.scheduleSave(pageNum);
    }
  }

  // --- Click-to-Write Text Boxes ---
  createTextBox(pageNum, pctX, pctY, defaultText = '') {
    this.saveUndoState(pageNum);
    const boxId = 'box_' + Date.now();
    const newBox = {
      id: boxId,
      x: Math.max(1, Math.min(85, pctX)),
      y: Math.max(1, Math.min(95, pctY)),
      text: defaultText,
      color: '#1e40af', // Oxford Blue
      fontSize: 15
    };

    if (!this.pagesData[pageNum]) {
      this.pagesData[pageNum] = { strokes: [], text_boxes: [], sticky_notes: [] };
    }
    if (!this.pagesData[pageNum].text_boxes) {
      this.pagesData[pageNum].text_boxes = [];
    }

    this.pagesData[pageNum].text_boxes.push(newBox);
    this.renderNotesAndBoxes(pageNum);
    this.scheduleSave(pageNum);

    // Focus newly created box
    setTimeout(() => {
      const el = document.getElementById(boxId);
      if (el) {
        const content = el.querySelector('.text-content');
        if (content) {
          content.focus();
          document.execCommand('selectAll', false, null);
        }
      }
    }, 50);
  }

  // --- Sticky Notes ---
  createStickyNote(pageNum, pctX, pctY, defaultText = '') {
    this.saveUndoState(pageNum);
    const noteId = 'sticky_' + Date.now();
    const newSticky = {
      id: noteId,
      x: Math.max(1, Math.min(80, pctX)),
      y: Math.max(1, Math.min(90, pctY)),
      text: defaultText,
      color: '#fef08a',
      collapsed: false
    };

    if (!this.pagesData[pageNum]) {
      this.pagesData[pageNum] = { strokes: [], text_boxes: [], sticky_notes: [] };
    }
    if (!this.pagesData[pageNum].sticky_notes) {
      this.pagesData[pageNum].sticky_notes = [];
    }

    this.pagesData[pageNum].sticky_notes.push(newSticky);
    this.renderNotesAndBoxes(pageNum);
    this.scheduleSave(pageNum);
  }

  renderNotesAndBoxes(pageNum) {
    const notesLayer = document.getElementById(`notes-page-${pageNum}`);
    if (!notesLayer) return;
    notesLayer.innerHTML = '';

    const pageData = this.pagesData[pageNum] || { text_boxes: [], sticky_notes: [] };

    // Render Text Boxes
    (pageData.text_boxes || []).forEach(box => {
      const boxEl = document.createElement('div');
      boxEl.className = 'custom-text-box';
      boxEl.id = box.id;
      boxEl.style.left = `${box.x}%`;
      boxEl.style.top = `${box.y}%`;
      boxEl.style.color = box.color || '#1e40af';
      boxEl.style.fontSize = `${box.fontSize || 15}px`;

      const dragHandle = document.createElement('span');
      dragHandle.className = 'box-drag-handle';
      dragHandle.textContent = '⋮⋮';
      dragHandle.title = 'Drag to move';

      const content = document.createElement('div');
      content.className = 'text-content';
      content.contentEditable = true;
      content.innerText = box.text;

      content.oninput = () => {
        box.text = content.innerText;
        this.scheduleSave(pageNum);
      };

      content.onblur = () => {
        box.text = content.innerText;
        this.scheduleSave(pageNum);
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-box-btn';
      delBtn.innerHTML = '×';
      delBtn.title = 'Delete box';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.saveUndoState(pageNum);
        pageData.text_boxes = pageData.text_boxes.filter(b => b.id !== box.id);
        this.renderNotesAndBoxes(pageNum);
        this.scheduleSave(pageNum);
      };

      this.makeDraggable(boxEl, pageNum, (newX, newY) => {
        box.x = newX;
        box.y = newY;
        this.scheduleSave(pageNum);
      });

      boxEl.appendChild(dragHandle);
      boxEl.appendChild(content);
      boxEl.appendChild(delBtn);
      notesLayer.appendChild(boxEl);
    });

    // Render Sticky Notes
    (pageData.sticky_notes || []).forEach(note => {
      const stickyEl = document.createElement('div');
      stickyEl.className = `sticky-note ${note.collapsed ? 'collapsed' : ''}`;
      stickyEl.id = note.id;
      stickyEl.style.left = `${note.x}%`;
      stickyEl.style.top = `${note.y}%`;

      if (note.collapsed) {
        stickyEl.innerHTML = '📌';
        stickyEl.onclick = () => {
          note.collapsed = false;
          this.renderNotesAndBoxes(pageNum);
        };
      } else {
        const header = document.createElement('div');
        header.className = 'sticky-note-header';
        header.innerHTML = `<span>NOTE</span><div><button style="border:none;background:transparent;cursor:pointer;margin-right:4px;">_</button><button style="border:none;background:transparent;cursor:pointer;">×</button></div>`;

        const [collapseBtn, closeBtn] = header.querySelectorAll('button');
        collapseBtn.onclick = (e) => {
          e.stopPropagation();
          note.collapsed = true;
          this.renderNotesAndBoxes(pageNum);
        };
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          this.saveUndoState(pageNum);
          pageData.sticky_notes = pageData.sticky_notes.filter(n => n.id !== note.id);
          this.renderNotesAndBoxes(pageNum);
          this.scheduleSave(pageNum);
        };

        const body = document.createElement('div');
        body.className = 'sticky-note-body';
        body.contentEditable = true;
        body.innerText = note.text;

        body.oninput = () => {
          note.text = body.innerText;
          this.scheduleSave(pageNum);
        };

        body.onblur = () => {
          note.text = body.innerText;
          this.scheduleSave(pageNum);
        };

        stickyEl.appendChild(header);
        stickyEl.appendChild(body);
      }

      this.makeDraggable(stickyEl, pageNum, (newX, newY) => {
        note.x = newX;
        note.y = newY;
        this.scheduleSave(pageNum);
      });

      notesLayer.appendChild(stickyEl);
    });
  }

  makeDraggable(el, pageNum, onDrop) {
    let startX, startY, origX, origY;
    let isDragging = false;

    el.onmousedown = (e) => {
      // Don't drag if interacting with content or button
      if (e.target.isContentEditable || e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const parentRect = el.parentElement.getBoundingClientRect();
      origX = parseFloat(el.style.left);
      origY = parseFloat(el.style.top);

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const dxPct = ((moveEvt.clientX - startX) / parentRect.width) * 100;
        const dyPct = ((moveEvt.clientY - startY) / parentRect.height) * 100;

        const curX = Math.max(0, Math.min(95, origX + dxPct));
        const curY = Math.max(0, Math.min(95, origY + dyPct));

        el.style.left = `${curX}%`;
        el.style.top = `${curY}%`;
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          onDrop(parseFloat(el.style.left), parseFloat(el.style.top));
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  saveUndoState(pageNum) {
    if (!this.undoStack[pageNum]) this.undoStack[pageNum] = [];
    const currentState = JSON.parse(JSON.stringify(this.pagesData[pageNum] || { strokes: [], text_boxes: [], sticky_notes: [] }));
    this.undoStack[pageNum].push(currentState);
    if (this.undoStack[pageNum].length > 20) this.undoStack[pageNum].shift();
    this.redoStack[pageNum] = []; // clear redo on new action
  }

  undo(pageNum) {
    if (!this.undoStack[pageNum] || this.undoStack[pageNum].length === 0) return;
    if (!this.redoStack[pageNum]) this.redoStack[pageNum] = [];

    const currentState = JSON.parse(JSON.stringify(this.pagesData[pageNum]));
    this.redoStack[pageNum].push(currentState);

    const prevState = this.undoStack[pageNum].pop();
    this.pagesData[pageNum] = prevState;

    this.redrawCanvas(pageNum);
    this.renderNotesAndBoxes(pageNum);
    this.scheduleSave(pageNum);
  }

  redo(pageNum) {
    if (!this.redoStack[pageNum] || this.redoStack[pageNum].length === 0) return;

    const currentState = JSON.parse(JSON.stringify(this.pagesData[pageNum]));
    this.undoStack[pageNum].push(currentState);

    const nextState = this.redoStack[pageNum].pop();
    this.pagesData[pageNum] = nextState;

    this.redrawCanvas(pageNum);
    this.renderNotesAndBoxes(pageNum);
    this.scheduleSave(pageNum);
  }

  clearPageAnnotations(pageNum) {
    this.saveUndoState(pageNum);
    this.pagesData[pageNum] = { strokes: [], text_boxes: [], sticky_notes: [] };
    this.redrawCanvas(pageNum);
    this.renderNotesAndBoxes(pageNum);
    this.scheduleSave(pageNum);
  }

  scheduleSave(pageNum) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        const payload = this.pagesData[pageNum] || { strokes: [], text_boxes: [], sticky_notes: [] };
        await fetch(`/api/annotations/${pageNum}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (window.app) window.app.showToast('Annotations saved');
      } catch (err) {
        console.error('Save failed:', err);
      }
    }, 600);
  }
}

window.AnnotationsManager = AnnotationsManager;
