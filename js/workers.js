// workers.js — Worker station markers

const Workers = {
  stations: [],
  _nextId: 1,
  _nextNumber: 1,
  _map: null,
  _onUpdate: null,

  init(map, { onUpdate }) {
    this._map = map;
    this._onUpdate = onUpdate;
  },

  /** Place a worker station at the given lngLat */
  placeStation(lngLat) {
    const id = this._nextId++;
    const number = this._nextNumber++;
    const lng = lngLat.lng !== undefined ? lngLat.lng : lngLat[0];
    const lat = lngLat.lat !== undefined ? lngLat.lat : lngLat[1];

    const el = document.createElement('div');
    el.className = 'worker-marker';
    el.innerHTML = `<span class="worker-number">${number}</span>`;

    const marker = window.createMarker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(this._map);

    const station = { id, number, lngLat: [lng, lat], marker };
    this.stations.push(station);

    marker.on('dragend', () => {
      const pos = marker.getLngLat();
      station.lngLat = [pos.lng, pos.lat];
      if (this._onUpdate) this._onUpdate();
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeStation(id);
    });

    if (this._onUpdate) this._onUpdate();
    return station;
  },

  /** Remove a station by id */
  removeStation(id) {
    const idx = this.stations.findIndex(s => s.id === id);
    if (idx === -1) return;
    this.stations[idx].marker.remove();
    this.stations.splice(idx, 1);
    if (this._onUpdate) this._onUpdate();
  },

  /** Clear all stations */
  clearAll() {
    this.stations.forEach(s => s.marker.remove());
    this.stations = [];
  },

  /** Get data for serialization */
  getData() {
    return this.stations.map(s => ({
      number: s.number,
      lngLat: s.lngLat,
    }));
  },

  /** Load stations from saved data */
  loadData(data) {
    this.clearAll();
    let maxNum = 0;
    data.forEach(d => {
      const id = this._nextId++;
      const el = document.createElement('div');
      el.className = 'worker-marker';
      el.innerHTML = `<span class="worker-number">${d.number}</span>`;

      const marker = window.createMarker({ element: el, draggable: true })
        .setLngLat(d.lngLat)
        .addTo(this._map);

      const station = { id, number: d.number, lngLat: d.lngLat.slice(), marker };
      this.stations.push(station);

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        station.lngLat = [pos.lng, pos.lat];
        if (this._onUpdate) this._onUpdate();
      });

      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeStation(id);
      });

      if (d.number > maxNum) maxNum = d.number;
    });
    this._nextNumber = maxNum + 1;
  },

  /** Render worker stations in sidebar */
  renderSidebar() {
    const list = document.getElementById('workers-list');
    if (!list) return;

    if (this.stations.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:rgba(255,255,255,0.4)">No worker stations</div>';
      return;
    }

    list.innerHTML = this.stations.map(s =>
      `<div class="worker-item" data-worker-id="${s.id}">
        <span class="worker-item-number">${s.number}</span>
        <span class="worker-item-text">Station ${s.number}</span>
      </div>`
    ).join('');

    list.querySelectorAll('.worker-item').forEach(el => {
      el.addEventListener('click', () => {
        const station = this.stations.find(s => s.id === parseInt(el.dataset.workerId));
        if (station) {
          const markerEl = station.marker.getElement();
          markerEl.classList.add('worker-highlight');
          setTimeout(() => markerEl.classList.remove('worker-highlight'), 1500);
          if (App.mode === 'map') {
            App.map.flyTo({ center: station.lngLat, speed: 2 });
          }
        }
      });
    });
  },

  /** Show all stations */
  show() {
    this.stations.forEach(s => {
      s.marker.getElement().style.display = '';
      if (s.marker._container) s.marker._container.style.display = '';
    });
  },

  /** Hide all stations */
  hide() {
    this.stations.forEach(s => {
      s.marker.getElement().style.display = 'none';
      if (s.marker._container) s.marker._container.style.display = 'none';
    });
  },

  /** Count */
  count() {
    return this.stations.length;
  },
};
