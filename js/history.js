// history.js — Undo/redo state management (snapshot-based)

const History = {
  _undoStack: [],
  _redoStack: [],
  _maxSnapshots: 50,

  /** Take a snapshot of the current app state and push to undo stack */
  push() {
    const snapshot = this._captureState();
    this._undoStack.push(snapshot);
    if (this._undoStack.length > this._maxSnapshots) {
      this._undoStack.shift();
    }
    // Any new action clears the redo stack
    this._redoStack = [];
    this._updateButtons();
  },

  /** Undo: restore previous state */
  undo() {
    if (this._undoStack.length === 0) return;
    // Save current state to redo stack
    this._redoStack.push(this._captureState());
    // Pop and restore
    const snapshot = this._undoStack.pop();
    this._restoreState(snapshot);
    this._updateButtons();
  },

  /** Redo: re-apply undone state */
  redo() {
    if (this._redoStack.length === 0) return;
    // Save current state to undo stack
    this._undoStack.push(this._captureState());
    // Pop and restore
    const snapshot = this._redoStack.pop();
    this._restoreState(snapshot);
    this._updateButtons();
  },

  /** Capture current state as a plain object */
  _captureState() {
    return {
      cones: Cones.getData(),
      drivingLine: DrivingLine.getData(),
      measurements: Measurements.getData(),
      notes: Notes.getData(),
      obstacles: typeof Obstacles !== 'undefined' ? Obstacles.getData() : [],
      workers: typeof Workers !== 'undefined' ? Workers.getData() : [],
    };
  },

  /** Restore state from a snapshot */
  _restoreState(snapshot) {
    if (snapshot.cones) Cones.loadData(snapshot.cones);
    if (snapshot.drivingLine) DrivingLine.loadData(snapshot.drivingLine);
    if (snapshot.measurements) Measurements.loadData(snapshot.measurements);
    if (snapshot.notes) Notes.loadData(snapshot.notes);
    if (snapshot.obstacles && typeof Obstacles !== 'undefined') Obstacles.loadData(snapshot.obstacles);
    if (snapshot.workers && typeof Workers !== 'undefined') Workers.loadData(snapshot.workers);

    // Update UI
    if (typeof App !== 'undefined') {
      App._updateInfo();
    }
  },

  /** Update undo/redo button states */
  _updateButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = this._undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this._redoStack.length === 0;
  },

  /** Clear all history */
  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._updateButtons();
  },
};
