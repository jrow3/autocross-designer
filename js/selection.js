// selection.js — Multi-select & bulk move

const Selection = {
  _selected: [],       // array of { type, id, module } objects
  _boxEl: null,        // selection rectangle element
  _boxStart: null,     // {x, y} screen coords
  _draggingBulk: false,
  _dragOffsets: [],

  init() {
    // Create selection box element
    this._boxEl = document.createElement('div');
    this._boxEl.className = 'selection-box hidden';
    document.body.appendChild(this._boxEl);
  },

  /** Clear the selection */
  clear() {
    for (const item of this._selected) {
      const el = this._getMarkerElement(item);
      if (el) el.classList.remove('multi-selected');
    }
    this._selected = [];
  },

  /** Toggle an item in the selection (Shift+click) */
  toggle(type, id) {
    const idx = this._selected.findIndex(s => s.type === type && s.id === id);
    if (idx !== -1) {
      // Remove from selection
      const item = this._selected[idx];
      const el = this._getMarkerElement(item);
      if (el) el.classList.remove('multi-selected');
      this._selected.splice(idx, 1);
    } else {
      // Add to selection
      const item = { type, id };
      this._selected.push(item);
      const el = this._getMarkerElement(item);
      if (el) el.classList.add('multi-selected');
    }
  },

  /** Select all items */
  selectAll() {
    this.clear();
    // Select all cones
    for (const c of Cones.cones) {
      this._selected.push({ type: 'cone', id: c.id });
      c.marker.getElement().classList.add('multi-selected');
    }
    // Select all arrows
    if (typeof Arrows !== 'undefined') {
      for (const a of Arrows.arrows) {
        this._selected.push({ type: 'arrow', id: a.id });
        a.marker.getElement().classList.add('multi-selected');
      }
    }
    // Select all obstacles
    if (typeof Obstacles !== 'undefined') {
      for (const o of Obstacles.obstacles) {
        this._selected.push({ type: 'obstacle', id: o.id });
        o.marker.getElement().classList.add('multi-selected');
      }
    }
    // Select all workers
    if (typeof Workers !== 'undefined') {
      for (const w of Workers.stations) {
        this._selected.push({ type: 'worker', id: w.id });
        w.marker.getElement().classList.add('multi-selected');
      }
    }
  },

  /** Delete all selected items */
  deleteSelected() {
    if (this._selected.length === 0) return;
    History.push();

    for (const item of this._selected) {
      switch (item.type) {
        case 'cone':
          Cones.remove(item.id);
          break;
        case 'arrow':
          if (typeof Arrows !== 'undefined') Arrows.removeArrow(item.id);
          break;
        case 'obstacle':
          if (typeof Obstacles !== 'undefined') Obstacles.removeObstacle(item.id);
          break;
        case 'worker':
          if (typeof Workers !== 'undefined') Workers.removeStation(item.id);
          break;
      }
    }
    this._selected = [];
  },

  /** Check if an item is selected */
  isSelected(type, id) {
    return this._selected.some(s => s.type === type && s.id === id);
  },

  /** Get count of selected items */
  count() {
    return this._selected.length;
  },

  /** Start box selection */
  startBox(screenX, screenY) {
    this._boxStart = { x: screenX, y: screenY };
    this._boxEl.classList.remove('hidden');
    this._updateBox(screenX, screenY);
  },

  /** Update box selection during drag */
  updateBox(screenX, screenY) {
    if (!this._boxStart) return;
    this._updateBox(screenX, screenY);
  },

  /** End box selection */
  endBox(screenX, screenY) {
    if (!this._boxStart) return;

    const x1 = Math.min(this._boxStart.x, screenX);
    const y1 = Math.min(this._boxStart.y, screenY);
    const x2 = Math.max(this._boxStart.x, screenX);
    const y2 = Math.max(this._boxStart.y, screenY);

    // Only select if the box is at least 5px in both dimensions
    if (x2 - x1 > 5 && y2 - y1 > 5) {
      this.clear();
      this._selectInBox(x1, y1, x2, y2);
    }

    this._boxEl.classList.add('hidden');
    this._boxStart = null;
  },

  /** Update the visual selection box */
  _updateBox(screenX, screenY) {
    const x1 = Math.min(this._boxStart.x, screenX);
    const y1 = Math.min(this._boxStart.y, screenY);
    const w = Math.abs(screenX - this._boxStart.x);
    const h = Math.abs(screenY - this._boxStart.y);
    this._boxEl.style.left = x1 + 'px';
    this._boxEl.style.top = y1 + 'px';
    this._boxEl.style.width = w + 'px';
    this._boxEl.style.height = h + 'px';
  },

  /** Select all items within a screen-space bounding box */
  _selectInBox(x1, y1, x2, y2) {
    const project = (lngLat) => App.map.project(lngLat);

    // Check cones
    for (const c of Cones.cones) {
      const p = project(c.lngLat);
      if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) {
        this._selected.push({ type: 'cone', id: c.id });
        c.marker.getElement().classList.add('multi-selected');
      }
    }
    // Check arrows
    if (typeof Arrows !== 'undefined') {
      for (const a of Arrows.arrows) {
        const p = project(a.lngLat);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) {
          this._selected.push({ type: 'arrow', id: a.id });
          a.marker.getElement().classList.add('multi-selected');
        }
      }
    }
    // Check obstacles
    if (typeof Obstacles !== 'undefined') {
      for (const o of Obstacles.obstacles) {
        const p = project(o.lngLat);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) {
          this._selected.push({ type: 'obstacle', id: o.id });
          o.marker.getElement().classList.add('multi-selected');
        }
      }
    }
    // Check workers
    if (typeof Workers !== 'undefined') {
      for (const w of Workers.stations) {
        const p = project(w.lngLat);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) {
          this._selected.push({ type: 'worker', id: w.id });
          w.marker.getElement().classList.add('multi-selected');
        }
      }
    }
  },

  /** Get the marker element for a selected item */
  _getMarkerElement(item) {
    switch (item.type) {
      case 'cone': {
        const c = Cones.cones.find(c => c.id === item.id);
        return c ? c.marker.getElement() : null;
      }
      case 'arrow': {
        if (typeof Arrows === 'undefined') return null;
        const a = Arrows.arrows.find(a => a.id === item.id);
        return a ? a.marker.getElement() : null;
      }
      case 'obstacle': {
        if (typeof Obstacles === 'undefined') return null;
        const o = Obstacles.obstacles.find(o => o.id === item.id);
        return o ? o.marker.getElement() : null;
      }
      case 'worker': {
        if (typeof Workers === 'undefined') return null;
        const w = Workers.stations.find(w => w.id === item.id);
        return w ? w.marker.getElement() : null;
      }
    }
    return null;
  },
};
