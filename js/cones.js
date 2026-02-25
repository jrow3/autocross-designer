// cones.js — Cone placement, dragging, deletion, rendering

const POINTER_SNAP_OFFSET_DEG = 0.000014; // ~5ft offset

const Cones = {
  cones: [],
  _nextId: 1,
  _map: null,
  _onSelect: null,   // callback when a cone is selected
  _onUpdate: null,    // callback when cones change

  init(map, { onSelect, onUpdate }) {
    this._map = map;
    this._onSelect = onSelect;
    this._onUpdate = onUpdate;
  },

  /** Find the nearest regular (non-pointer) cone to a given [lng, lat] */
  _findNearestRegularCone(lngLat) {
    let nearest = null;
    let minDist = Infinity;
    for (const c of this.cones) {
      if (c.type === 'pointer') continue;
      const dx = c.lngLat[0] - lngLat[0];
      const dy = c.lngLat[1] - lngLat[1];
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = c;
      }
    }
    return nearest;
  },

  /** Compute rotation angle (degrees) from pointer to target cone */
  _computePointerRotation(cone) {
    let target = null;

    // If locked to a specific target, use it (if it still exists)
    if (cone.lockedTargetId != null) {
      target = this.cones.find(c => c.id === cone.lockedTargetId && c.type !== 'pointer');
      if (!target) {
        // Locked target was deleted — clear lock
        cone.lockedTargetId = null;
      }
    }

    // Fall back to nearest regular cone
    if (!target) {
      target = this._findNearestRegularCone(cone.lngLat);
    }

    if (!target) return 0;
    const dx = target.lngLat[0] - cone.lngLat[0];
    const dy = target.lngLat[1] - cone.lngLat[1];
    // In image mode Y increases downward, so negate dy
    const adjustedDy = (App.mode === 'image') ? -dy : dy;
    return Math.atan2(dx, adjustedDy) * (180 / Math.PI);
  },

  /** Apply rotation CSS to a pointer cone's marker element */
  _applyPointerRotation(cone) {
    if (cone.type !== 'pointer') return;
    const angle = this._computePointerRotation(cone);
    const inner = cone.marker.getElement().querySelector('.marker-pointer');
    if (inner) {
      inner.style.transformOrigin = 'center 66%';
      inner.style.transform = `rotate(${angle}deg)`;
    }
  },

  /** Update rotation for all pointer cones */
  _updateAllPointerRotations() {
    for (const c of this.cones) {
      if (c.type === 'pointer') {
        this._applyPointerRotation(c);
      }
    }
  },

  /** Place a cone of the given type at lngLat */
  place(type, lngLat) {
    const id = this._nextId++;

    let placeLng = lngLat.lng;
    let placeLat = lngLat.lat;

    // Snap pointer cones near the nearest regular cone
    if (type === 'pointer') {
      const nearest = this._findNearestRegularCone([lngLat.lng, lngLat.lat]);
      if (nearest) {
        const dx = lngLat.lng - nearest.lngLat[0];
        const dy = lngLat.lat - nearest.lngLat[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          // Offset ~5ft from nearest cone in click direction
          let snapOffset = POINTER_SNAP_OFFSET_DEG;
          if (App.mode === 'image') {
            snapOffset = ImageMap.hasScale() ? (5 / ImageMap.getScale()) : 15;
          }
          placeLng = nearest.lngLat[0] + (dx / dist) * snapOffset;
          placeLat = nearest.lngLat[1] + (dy / dist) * snapOffset;
        }
      }
    }

    const el = this._createElement(type);

    const marker = window.createMarker({ element: el, draggable: true })
      .setLngLat([placeLng, placeLat])
      .addTo(this._map);

    const cone = { id, type, lngLat: [placeLng, placeLat], marker, lockedTargetId: null };
    this.cones.push(cone);

    // Update lngLat on drag
    marker.on('dragend', () => {
      const pos = marker.getLngLat();
      cone.lngLat = [pos.lng, pos.lat];

      // Drag-to-lock: if pointer cone dropped near a regular cone, lock onto it
      if (cone.type === 'pointer') {
        cone.lockedTargetId = null; // clear previous lock
        const screenPos = this._map.project(pos);
        let bestDist = 25; // pixel threshold
        let bestTarget = null;
        for (const c of this.cones) {
          if (c.type === 'pointer' || c.id === cone.id) continue;
          const cScreen = this._map.project(c.lngLat);
          const dx = cScreen.x - screenPos.x;
          const dy = cScreen.y - screenPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestTarget = c;
          }
        }
        if (bestTarget) {
          cone.lockedTargetId = bestTarget.id;
        }
      }

      this._updateAllPointerRotations();
      if (this._onUpdate) this._onUpdate();
    });

    // Click to select
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._onSelect) this._onSelect(cone);
    });

    // Right-click to delete
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.remove(id);
    });

    this._updateAllPointerRotations();
    if (this._onUpdate) this._onUpdate();
    return cone;
  },

  /** Remove a cone by id */
  remove(id) {
    const idx = this.cones.findIndex(c => c.id === id);
    if (idx === -1) return;
    this.cones[idx].marker.remove();
    this.cones.splice(idx, 1);
    this._updateAllPointerRotations();
    if (this._onUpdate) this._onUpdate();
  },

  /** Clear all cones */
  clearAll() {
    this.cones.forEach(c => c.marker.remove());
    this.cones = [];
    if (this._onUpdate) this._onUpdate();
  },

  /** Highlight a cone as selected */
  setSelected(cone) {
    // Remove previous selection
    this.cones.forEach(c => c.marker.getElement().classList.remove('selected'));
    if (cone) {
      cone.marker.getElement().classList.add('selected');
    }
  },

  /** Get cones data for serialization */
  getData() {
    return this.cones.map(c => ({
      id: c.id, type: c.type, lngLat: c.lngLat,
      lockedTargetId: c.lockedTargetId || null,
    }));
  },

  /** Load cones from saved data */
  loadData(data) {
    this.clearAll();
    // First pass: place all cones
    const idMap = {};
    data.forEach(d => {
      const cone = this.place(d.type, { lng: d.lngLat[0], lat: d.lngLat[1] });
      idMap[d.id] = cone;
    });
    // Second pass: restore locked targets (map old IDs to new IDs)
    data.forEach(d => {
      if (d.lockedTargetId != null && idMap[d.id] && idMap[d.lockedTargetId]) {
        idMap[d.id].lockedTargetId = idMap[d.lockedTargetId].id;
      }
    });
    this._updateAllPointerRotations();
  },

  /** Get cone count */
  count() {
    return this.cones.length;
  },

  /** Create the HTML element for a cone marker */
  _createElement(type) {
    const el = document.createElement('div');
    const zClass = type === 'pointer' ? 'cone-marker-pointer' : 'cone-marker-regular';
    el.className = 'cone-marker ' + zClass;

    switch (type) {
      case 'regular':
        el.innerHTML = '<div class="marker-regular"></div>';
        break;
      case 'pointer':
        el.innerHTML = '<div class="marker-pointer"></div>';
        break;
      case 'start-gate':
        el.innerHTML = '<div class="marker-start"></div>';
        break;
      case 'finish-gate':
        el.innerHTML = '<div class="marker-finish"></div>';
        break;
      default:
        el.innerHTML = '<div class="marker-regular"></div>';
    }

    return el;
  },
};
