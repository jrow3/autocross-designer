// app.js — App init, state management, event wiring

const App = {
  activeTool: 'regular',  // current tool: regular, pointer, start-gate, finish-gate, select, drivingline, scale
  selectedCone: null,
  map: null,
  mode: 'map',           // 'map' or 'image'
  imageFileName: null,    // name of loaded image file (image mode only)
  _scalePoints: [],       // temp array for scale calibration clicks [{x,y}]
  _scaleMarkers: [],      // temp DOM elements for scale point display
  _scaleLine: null,       // temp SVG line overlay

  async init() {
    // Show mode selection banner
    const choice = await ImageMode.showBanner();
    this.mode = choice.mode;

    if (this.mode === 'map') {
      this._initMapMode();
    } else {
      this._initImageMode(choice.imageSrc, choice.fileName);
    }
  },

  /** Initialize in normal Mapbox map mode */
  _initMapMode() {
    // Set marker factory to real Mapbox markers
    window.createMarker = (opts) => new mapboxgl.Marker(opts);

    this.map = MapModule.init();

    this.map.on('load', () => {
      this._initModules();
    });
  },

  /** Initialize in image mode with a static image */
  _initImageMode(imageSrc, fileName) {
    this.imageFileName = fileName || 'Untitled';

    // Set marker factory to ImageMarker
    window.createMarker = (opts) => new ImageMarker(opts);

    // Hide search bar (no geo in image mode)
    document.getElementById('search-bar').classList.add('hidden');

    // Show image-mode-only toolbar sections
    document.querySelectorAll('.image-mode-only').forEach(el => el.classList.remove('hidden'));

    // Initialize the fake map adapter
    this.map = ImageMap;
    ImageMap.init('map', imageSrc);

    ImageMap.on('load', () => {
      this._initModules();

      // Restore saved scale for this image
      const savedScale = this._loadImageScale();
      if (savedScale) {
        this._setImageScale(savedScale, 'Calibrated (saved)');
      } else {
        // Auto-activate scale tool so user calibrates first
        this._setActiveTool('scale');
      }
    });
  },

  /** Shared module initialization (called after map/image loads) */
  _initModules() {
    Cones.init(this.map, {
      onSelect: (cone) => this._handleConeSelect(cone),
      onUpdate: () => this._updateInfo(),
    });

    Distance.init(this.map);

    DrivingLine.init(this.map, {
      onUpdate: () => this._updateInfo(),
    });

    Grid.init(this.map);

    // Wire up map click
    this.map.on('click', (e) => this._handleMapClick(e));

    // Wire up mousemove for distance measurement
    this.map.on('mousemove', (e) => this._handleMouseMove(e));

    // Wire up toolbar buttons
    this._setupToolbar();

    // Wire up sidebar
    this._setupSidebar();

    // Wire up grid controls
    this._setupGrid();

    // Wire up print
    this._setupPrint();

    // Wire up save/export/import
    this._setupStorage();

    // Load saved courses list
    this._refreshSavedList();

    // Set default tool active
    this._setActiveTool('regular');
  },

  /** Handle click on the map */
  _handleMapClick(e) {
    const lngLat = e.lngLat;

    switch (this.activeTool) {
      case 'regular':
      case 'pointer':
      case 'start-gate':
      case 'finish-gate':
        Cones.place(this.activeTool, lngLat);
        break;

      case 'select':
        // Clicking on empty map deselects
        this._deselectCone();
        break;

      case 'drivingline':
        DrivingLine.addWaypoint(lngLat);
        break;

      case 'scale':
        this._handleScaleClick(lngLat, e.point);
        break;
    }
  },

  /** Handle cone selection */
  _handleConeSelect(cone) {
    if (this.activeTool === 'select') {
      // Toggle selection
      if (this.selectedCone && this.selectedCone.id === cone.id) {
        this._deselectCone();
      } else {
        this.selectedCone = cone;
        Cones.setSelected(cone);
        Distance.setSelected(cone);
      }
    }
  },

  /** Deselect current cone */
  _deselectCone() {
    this.selectedCone = null;
    Cones.setSelected(null);
    Distance.setSelected(null);
    Distance.hideLabel();
  },

  /** Handle mousemove for distance labels */
  _handleMouseMove(e) {
    if (this.activeTool !== 'select' || !this.selectedCone) return;
    if (this.mode === 'image' && !ImageMap.hasScale()) return;

    // Find if hovering near another cone
    const hoverCone = this._findConeNear(e.point);
    if (hoverCone && hoverCone.id !== this.selectedCone.id) {
      Distance.showDistanceTo(hoverCone.lngLat);
    } else {
      Distance.hideLabel();
    }
  },

  /** Find a cone near a screen point (within ~20px) */
  _findConeNear(point) {
    let closest = null;
    let minDist = 25; // pixel threshold

    for (const cone of Cones.cones) {
      const projected = this.map.project(cone.lngLat);
      const dx = projected.x - point.x;
      const dy = projected.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = cone;
      }
    }
    return closest;
  },

  /** Set up toolbar button clicks */
  _setupToolbar() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._setActiveTool(btn.dataset.tool);
      });
    });

    document.getElementById('btn-clear-line').addEventListener('click', () => {
      DrivingLine.clear();
    });
  },

  /** Set the active tool and update button styles */
  _setActiveTool(tool) {
    // Clean up previous scale tool state
    if (this.activeTool === 'scale' && tool !== 'scale') {
      this._clearScaleVisuals();
      document.getElementById('scale-hint').classList.add('hidden');
    }

    this.activeTool = tool;
    this._deselectCone();

    // Update active button style
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Show scale hint when entering scale mode
    if (tool === 'scale') {
      this._scalePoints = [];
      this._clearScaleVisuals();
      const hint = document.getElementById('scale-hint');
      hint.textContent = 'Click the first point';
      hint.classList.remove('hidden');
    }

    // Change cursor
    if (this.mode === 'image') {
      // Always crosshair in image mode
      document.getElementById('map').style.cursor = 'crosshair';
    } else {
      const canvas = this.map.getCanvas();
      if (tool === 'select') {
        canvas.style.cursor = 'default';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
  },

  /** Set up grid toggle and rotation */
  _setupGrid() {
    const toggleBtn = document.getElementById('btn-grid-toggle');
    const rotationControl = document.getElementById('grid-rotation-control');
    const rotationSlider = document.getElementById('grid-rotation');
    const rotationNumber = document.getElementById('grid-rotation-number');
    const linesBtn = document.getElementById('btn-grid-lines');

    toggleBtn.addEventListener('click', () => {
      const active = Grid.toggle();
      toggleBtn.classList.toggle('active', active);
      if (active) {
        rotationControl.classList.remove('hidden');
      } else {
        rotationControl.classList.add('hidden');
      }
    });

    // Slider updates number input
    rotationSlider.addEventListener('input', () => {
      const deg = parseInt(rotationSlider.value, 10);
      rotationNumber.value = deg;
      Grid.setRotation(deg);
    });

    // Number input updates slider
    rotationNumber.addEventListener('input', () => {
      let deg = parseInt(rotationNumber.value, 10);
      if (isNaN(deg)) return;
      deg = Math.max(0, Math.min(360, deg));
      rotationSlider.value = deg;
      Grid.setRotation(deg);
    });

    // Light/Dark grid lines toggle
    let gridLineMode = 'light';
    linesBtn.addEventListener('click', () => {
      gridLineMode = gridLineMode === 'light' ? 'dark' : 'light';
      Grid.setLineMode(gridLineMode);
      const label = gridLineMode === 'dark' ? 'Dark' : 'Light';
      linesBtn.innerHTML = '<span class="tool-icon">&#9681;</span> ' + label;
    });
  },

  /** Set up sidebar toggle */
  _setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      toggle.textContent = sidebar.classList.contains('collapsed') ? '\u25B6' : '\u25C4';
    });
  },

  /** Set up print button */
  _setupPrint() {
    const printBtn = document.getElementById('btn-print');
    const dialog = document.getElementById('print-dialog');
    const includeGrid = document.getElementById('print-include-grid');
    const confirmBtn = document.getElementById('print-confirm');
    const cancelBtn = document.getElementById('print-cancel');

    printBtn.addEventListener('click', () => {
      // Default: check grid if grid is currently active
      includeGrid.checked = Grid.isActive();
      dialog.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
      dialog.classList.add('hidden');
    });

    confirmBtn.addEventListener('click', () => {
      dialog.classList.add('hidden');
      this._captureImage(includeGrid.checked);
    });
  },

  /** Capture the map + optional grid as a downloadable image */
  _captureImage(withGrid) {
    const mapCanvas = this.map.getCanvas();
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = mapCanvas.width;
    resultCanvas.height = mapCanvas.height;
    const ctx = resultCanvas.getContext('2d');

    // Draw the map (or image in image mode)
    ctx.drawImage(mapCanvas, 0, 0);

    // Draw cones (render markers onto canvas)
    const dpr = this.mode === 'image' ? 1 : window.devicePixelRatio;
    for (const cone of Cones.cones) {
      const pos = this.mode === 'image'
        ? { x: cone.lngLat[0], y: cone.lngLat[1] }
        : this.map.project(cone.lngLat);
      const x = pos.x * dpr;
      const y = pos.y * dpr;
      const scale = dpr;

      ctx.save();
      ctx.translate(x, y);

      if (cone.type === 'pointer') {
        const angle = Cones._computePointerRotation(cone);
        ctx.rotate(angle * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, -8 * scale);
        ctx.lineTo(-6 * scale, 6 * scale);
        ctx.lineTo(6 * scale, 6 * scale);
        ctx.closePath();
        ctx.fillStyle = '#a3e635';
        ctx.fill();
      } else if (cone.type === 'regular') {
        ctx.beginPath();
        ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8c00';
        ctx.fill();
        ctx.strokeStyle = '#cc7000';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
      } else if (cone.type === 'start-gate') {
        ctx.beginPath();
        ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
      } else if (cone.type === 'finish-gate') {
        ctx.beginPath();
        ctx.rect(-8 * scale, -8 * scale, 16 * scale, 16 * scale);
        ctx.fillStyle = '#888';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw grid if requested
    if (withGrid && Grid.isActive()) {
      const gridCanvas = document.getElementById('grid-canvas');
      ctx.drawImage(gridCanvas, 0, 0, gridCanvas.width, gridCanvas.height,
        0, 0, resultCanvas.width, resultCanvas.height);
    }

    // Download
    resultCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'autocross-course.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  },

  /** Set up save/export/import buttons */
  _setupStorage() {
    // Save
    document.getElementById('btn-save').addEventListener('click', () => {
      const name = prompt('Course name:');
      if (!name) return;

      const center = this.map.getCenter();
      const data = Storage.serialize(
        Cones.getData(),
        DrivingLine.getData(),
        center.toArray ? center.toArray() : [center.lng, center.lat],
        this.map.getZoom(),
        this.mode === 'image',
        this.imageFileName
      );
      Storage.save(name, data);
      this._refreshSavedList();
    });

    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
      const center = this.map.getCenter();
      const data = Storage.serialize(
        Cones.getData(),
        DrivingLine.getData(),
        center.toArray ? center.toArray() : [center.lng, center.lat],
        this.map.getZoom(),
        this.mode === 'image',
        this.imageFileName
      );
      Storage.exportJSON(data, 'autocross-course.json');
    });

    // Import
    const importFile = document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      Storage.importJSON(file).then(data => {
        this._loadCourseData(data);
        importFile.value = ''; // reset
      }).catch(err => {
        alert(err.message);
      });
    });
  },

  /** Load course data (from save or import) */
  _loadCourseData(data) {
    // Warn about mode mismatch
    if (data.imageMode && this.mode === 'map') {
      alert('Warning: This course was designed in image mode. Coordinates may not display correctly on the map.');
    } else if (!data.imageMode && this.mode === 'image') {
      alert('Warning: This course was designed in map mode. GPS coordinates will be used as pixel positions.');
    }

    if (data.cones) Cones.loadData(data.cones);
    if (data.drivingLine) DrivingLine.loadData(data.drivingLine);
    if (data.mapCenter && data.mapZoom && this.mode === 'map') {
      MapModule.flyTo(data.mapCenter, data.mapZoom);
    }
    // Restore image scale if present
    if (data.imageScale && this.mode === 'image') {
      this._setImageScale(data.imageScale, 'Calibrated (imported)');
    }
    this._updateInfo();
  },

  /** Refresh the saved courses list in sidebar */
  _refreshSavedList() {
    const list = document.getElementById('saved-list');
    const names = Storage.list();

    if (names.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:rgba(255,255,255,0.4)">No saved courses</div>';
      return;
    }

    list.innerHTML = names.map(name => `
      <div class="saved-item">
        <span data-name="${name}">${name}</span>
        <button data-delete="${name}" title="Delete">&times;</button>
      </div>
    `).join('');

    // Load on click
    list.querySelectorAll('span[data-name]').forEach(el => {
      el.addEventListener('click', () => {
        const data = Storage.load(el.dataset.name);
        if (data) this._loadCourseData(data);
      });
    });

    // Delete on click
    list.querySelectorAll('button[data-delete]').forEach(el => {
      el.addEventListener('click', () => {
        if (confirm(`Delete "${el.dataset.delete}"?`)) {
          Storage.remove(el.dataset.delete);
          this._refreshSavedList();
        }
      });
    });
  },

  /** Update course info in sidebar */
  _updateInfo() {
    document.getElementById('cone-count').textContent = `Cones: ${Cones.count()}`;

    const lineLen = Distance.totalLength(DrivingLine.waypoints);
    if (lineLen < 0) {
      document.getElementById('line-length').textContent = 'Line: N/A';
    } else {
      document.getElementById('line-length').textContent = lineLen > 0
        ? `Line: ${lineLen.toFixed(0)} ft`
        : 'Line: -- ft';
    }
  },
  // ===== Scale Calibration (Image Mode) =====

  /** Handle a click while in scale tool mode */
  _handleScaleClick(lngLat, screenPoint) {
    const imgCoord = [lngLat.lng, lngLat.lat];

    if (this._scalePoints.length === 0) {
      // First point
      this._scalePoints.push(imgCoord);
      this._addScalePointMarker(imgCoord);
      document.getElementById('scale-hint').textContent = 'Click the second point';
    } else if (this._scalePoints.length === 1) {
      // Second point
      this._scalePoints.push(imgCoord);
      this._addScalePointMarker(imgCoord);
      this._drawScaleLine();
      document.getElementById('scale-hint').classList.add('hidden');
      this._showScaleDialog();
    }
  },

  /** Add a visual dot at a scale calibration point */
  _addScalePointMarker(imgCoord) {
    const dot = document.createElement('div');
    dot.className = 'scale-point';
    dot.style.left = imgCoord[0] + 'px';
    dot.style.top = imgCoord[1] + 'px';
    // Place inside the image wrapper so it transforms with pan/zoom
    ImageMap._markerContainer.appendChild(dot);
    this._scaleMarkers.push(dot);
  },

  /** Draw a line between the two scale points on an SVG overlay */
  _drawScaleLine() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('scale-line-overlay');
    svg.setAttribute('width', ImageMap._imageWidth);
    svg.setAttribute('height', ImageMap._imageHeight);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', this._scalePoints[0][0]);
    line.setAttribute('y1', this._scalePoints[0][1]);
    line.setAttribute('x2', this._scalePoints[1][0]);
    line.setAttribute('y2', this._scalePoints[1][1]);
    line.setAttribute('stroke', '#f43f5e');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(line);

    ImageMap._markerContainer.appendChild(svg);
    this._scaleLine = svg;
  },

  /** Remove temp scale point markers and line */
  _clearScaleVisuals() {
    for (const el of this._scaleMarkers) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this._scaleMarkers = [];
    if (this._scaleLine && this._scaleLine.parentNode) {
      this._scaleLine.parentNode.removeChild(this._scaleLine);
    }
    this._scaleLine = null;
    this._scalePoints = [];
  },

  /** Show the scale distance input dialog */
  _showScaleDialog() {
    const dialog = document.getElementById('scale-dialog');
    const input = document.getElementById('scale-distance-input');
    const confirmBtn = document.getElementById('scale-confirm');
    const cancelBtn = document.getElementById('scale-cancel');

    input.value = '';
    dialog.classList.remove('hidden');
    input.focus();

    const cleanup = () => {
      dialog.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    };

    const onConfirm = () => {
      const distFeet = parseFloat(input.value);
      if (!distFeet || distFeet <= 0) {
        input.focus();
        return;
      }
      this._applyScale(distFeet);
      cleanup();
    };

    const onCancel = () => {
      this._clearScaleVisuals();
      cleanup();
    };

    const onKey = (e) => {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  },

  /** Apply the calibrated scale */
  _applyScale(distFeet) {
    const p1 = this._scalePoints[0];
    const p2 = this._scalePoints[1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const pixelDist = Math.sqrt(dx * dx + dy * dy);

    if (pixelDist === 0) {
      alert('The two points are the same. Please try again.');
      this._clearScaleVisuals();
      return;
    }

    const feetPerPixel = distFeet / pixelDist;
    this._setImageScale(feetPerPixel, `${distFeet.toFixed(1)} ft reference`);

    // Clean up visuals
    this._clearScaleVisuals();
  },

  /** Apply a scale value and update all dependent UI/modules */
  _setImageScale(feetPerPixel, statusText) {
    ImageMap.setScale(feetPerPixel);

    // Update status indicator
    const status = document.getElementById('scale-status');
    status.textContent = statusText;
    status.classList.add('calibrated');

    // Persist to localStorage keyed by image filename
    this._saveImageScale(feetPerPixel);

    // Refresh info (line length may now be available)
    this._updateInfo();

    // Redraw grid if active (cell size changed)
    if (Grid.isActive()) {
      Grid.setRotation(Grid._userRotation);
    }
  },

  /** Save scale for the current image to localStorage */
  _saveImageScale(feetPerPixel) {
    if (!this.imageFileName) return;
    try {
      const all = JSON.parse(localStorage.getItem('autocross-image-scales') || '{}');
      all[this.imageFileName] = feetPerPixel;
      localStorage.setItem('autocross-image-scales', JSON.stringify(all));
    } catch {}
  },

  /** Load saved scale for the current image from localStorage */
  _loadImageScale() {
    if (!this.imageFileName) return null;
    try {
      const all = JSON.parse(localStorage.getItem('autocross-image-scales') || '{}');
      return all[this.imageFileName] || null;
    } catch {
      return null;
    }
  },
};

// Boot the app
document.addEventListener('DOMContentLoaded', () => App.init());
