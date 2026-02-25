// map.js — Mapbox setup, satellite view, location search

// ====================================================
// PASTE YOUR MAPBOX ACCESS TOKEN BELOW
// ====================================================
const MAPBOX_TOKEN = 'REDACTED_MAPBOX_TOKEN';

const MapModule = {
  map: null,

  /** Initialize the Mapbox map */
  init() {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-121.1094, 37.4080], // San Jose, CA default
      zoom: 17,
      preserveDrawingBuffer: true,
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    this._setupSearch();
    return this.map;
  },

  /** Get the map instance */
  getMap() {
    return this.map;
  },

  /** Fly to a specific location */
  flyTo(lngLat, zoom) {
    this.map.flyTo({ center: lngLat, zoom: zoom || 17 });
  },

  /** Set up the search bar functionality */
  _setupSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const suggestions = document.getElementById('search-suggestions');

    const doSearch = () => {
      const query = input.value.trim();
      if (!query) return;
      this._hideSuggestions();

      // Check if it's coordinates (lat, lng)
      const coordMatch = query.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          this.flyTo([lng, lat]);
          return;
        }
      }

      // Geocoding search
      this._geocode(query);
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
      if (e.key === 'Escape') this._hideSuggestions();
    });

    // Show cached suggestions on input
    input.addEventListener('input', () => {
      const prefix = input.value.trim();
      if (prefix.length < 2) {
        this._hideSuggestions();
        return;
      }

      const matches = GeoCache.suggest(prefix);
      if (matches.length === 0) {
        this._hideSuggestions();
        return;
      }

      suggestions.innerHTML = matches.map(m =>
        `<div class="suggestion-item" data-lng="${m.lngLat[0]}" data-lat="${m.lngLat[1]}">${m.displayName}</div>`
      ).join('');
      suggestions.classList.remove('hidden');

      suggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
          const lng = parseFloat(el.dataset.lng);
          const lat = parseFloat(el.dataset.lat);
          input.value = el.textContent;
          this._hideSuggestions();
          this.flyTo([lng, lat]);
        });
      });
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-bar') && !e.target.closest('#search-suggestions')) {
        this._hideSuggestions();
      }
    });
  },

  /** Hide the suggestion dropdown */
  _hideSuggestions() {
    document.getElementById('search-suggestions').classList.add('hidden');
  },

  /** Geocode a search query using Mapbox Geocoding API */
  _geocode(query) {
    // Check cache first
    const cached = GeoCache.lookup(query);
    if (cached) {
      this.flyTo(cached.lngLat);
      return;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;
          const displayName = feature.place_name || query;
          // Store in cache
          GeoCache.store(query, [lng, lat], displayName);
          this.flyTo([lng, lat]);
        } else {
          alert('Location not found');
        }
      })
      .catch(() => alert('Search failed — check your Mapbox token'));
  },
};
