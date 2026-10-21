/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Map Controller: Multi-Provider GIS Engine & Multi-Mode Visualization
 * Providers: Google Maps Platform, CARTO / OpenStreetMap, ESRI ArcGIS World, OpenTopoMap
 * Viewing Modes: Dark Night Patrol, Executive Light, Satellite Hybrid, Topographic Terrain, Detailed Streets
 * Dynamic Overlays: Live Highway Traffic, Fatality Heatmap Density, Risk Pin Toggles
 * ============================================================================
 */

const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }, { weight: 1.5 }]
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#d97706" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#78350f" }, { weight: 1 }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#fef3c7" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }, { weight: 2 }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#030712" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }]
  }
];

const GOOGLE_MAPS_LIGHT_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#94a3b8" }, { weight: 1.5 }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fed7aa" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f97316" }, { weight: 1 }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#9a3412" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bae6fd" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0284c7" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dcfce7" }] }
];

const GOOGLE_MAPS_SILVER_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] }
];

const GOOGLE_MAPS_ATMOSPHERIC_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b1523" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#050b12" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#60a5fa" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#172e48" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0284c7" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0369a1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#02070e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] }
];

const GOOGLE_MAPS_CANVAS_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#070a0f" }] },
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#131924" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#030407" }] }
];

class MapController {
  constructor(elementId = "map") {
    this.elementId = elementId;
    if (typeof window !== "undefined") {
      window.mapCtrl = this;
      window.mapController = this;
    }
    this.currentProvider = CONFIG.MAP.PREFERRED_ENGINE || "google";
    this.currentMode = CONFIG.MAP.CURRENT_MODE || "satellite";
    
    // Google Maps Instances
    this.googleMap = null;
    this.trafficLayer = null;
    this.googleHeatmapLayer = null;
    this.googleCustomHeatCanvas = null;
    this.HeatmapLayerClass = null;
    this.isTrafficOn = true;
    this.isHeatmapOn = CONFIG.MAP.DEFAULT_HEATMAP !== undefined ? CONFIG.MAP.DEFAULT_HEATMAP : true;
    this.areMarkersVisible = true;
    this.googleMarkers = new Map();
    this.currentInfoWindow = null;

    // Heatmap Controls & Customization
    this.heatmapRadius = 48;
    this.heatmapOpacity = 0.85;
    this.heatmapWeight = "fatalities"; // 'fatalities' | 'accidents' | 'score'

    // High-Fatality Highway Corridors Polylines
    this.isCorridorsOn = true;
    this.corridorsData = [];
    this.googleCorridorLines = [];
    this.leafletCorridorLayer = null;

    // Highway Emergency Trauma Care Centers
    this.isTraumaOn = false;
    this.traumaData = [];
    this.googleTraumaMarkers = [];
    this.leafletTraumaLayer = null;

    // Highway Speed Cameras & Radar Gantries
    this.isSpeedCamerasOn = false;
    this.speedCamerasData = [];
    this.googleSpeedCameraMarkers = [];
    this.leafletSpeedCameraLayer = null;

    // Hazardous Mountain Ghats & Hairpin Bends
    this.isHazardousGhatsOn = false;
    this.hazardousGhatsData = [];
    this.googleHazardousGhatMarkers = [];
    this.leafletHazardousGhatLayer = null;

    // Danger Buffer Impact Radii (5km / 15km zones)
    this.isRiskBuffersOn = false;
    this.googleRiskCircles = [];
    this.leafletRiskCirclesLayer = null;

    // 3D Oblique Perspective Mode
    this.is3DMode = false;

    // Highway Distance & Risk Measurement Tool
    this.isMeasuring = false;
    this.measurePoints = [];
    this.googleMeasurePolyline = null;
    this.googleMeasureMarkers = [];
    this.leafletMeasurePolyline = null;
    this.leafletMeasureMarkers = [];
    this.userLocationMarker = null;

    // Leaflet Instances (Multi-Provider Support)
    this.leafletMap = null;
    this.leafletTileLayer = null;
    this.leafletMarkersLayer = null;
    this.leafletHeatmapLayer = null;
    this.leafletMarkers = new Map();

    // Stored Hotspots Data & View State
    this.hotspots = [];
    this.savedCenter = CONFIG.MAP.INITIAL_CENTER;
    this.savedZoom = CONFIG.MAP.INITIAL_ZOOM;

    // Initialize Map
    this.init();
  }

  async init() {
    if (this.currentProvider === "google") {
      const loaded = await this.ensureGoogleMapsLoaded();
      if (loaded) {
        await this.initGoogleMap();
      } else {
        console.warn("Google Maps API delayed or blocked, falling back to CARTO Leaflet.");
        this.currentProvider = "carto";
        this.initLeafletMap();
      }
    } else {
      this.initLeafletMap();
    }
  }

  /**
   * Ensures Google Maps script and required libraries are fully loaded before use.
   */
  async ensureGoogleMapsLoaded() {
    if (this.googleMapsReady && window.google?.maps?.Map) return true;

    // Wait for window.google.maps stub or script load
    let waitCount = 0;
    while ((!window.google || !window.google.maps) && waitCount < 30) {
      await new Promise(r => setTimeout(r, 100));
      waitCount++;
    }

    if (!window.google || !window.google.maps) {
      return false;
    }

    // Dynamic library import for Maps JavaScript API
    if (typeof window.google.maps.importLibrary === "function") {
      try {
        const [, , , viz] = await Promise.all([
          window.google.maps.importLibrary("maps"),
          window.google.maps.importLibrary("core"),
          window.google.maps.importLibrary("marker"),
          window.google.maps.importLibrary("visualization")
        ]);
        if (viz && viz.HeatmapLayer) {
          this.HeatmapLayerClass = viz.HeatmapLayer;
          window._GoogleHeatmapLayerClass = viz.HeatmapLayer;
          try {
            if (!window.google.maps.visualization) {
              window.google.maps.visualization = { HeatmapLayer: viz.HeatmapLayer };
            } else {
              window.google.maps.visualization.HeatmapLayer = viz.HeatmapLayer;
            }
          } catch (_) {
            // Ignored if window.google.maps.visualization is read-only
          }
        }
      } catch (libErr) {
        console.warn("Notice loading Google Maps dynamic libraries:", libErr);
      }
    }

    // Wait for Map constructor to be accessible
    let readyCount = 0;
    while (!window.google?.maps?.Map && readyCount < 20) {
      await new Promise(r => setTimeout(r, 100));
      readyCount++;
    }

    this.googleMapsReady = Boolean(window.google?.maps?.Map);
    return this.googleMapsReady;
  }

  /**
   * Initializes Google Maps Platform Engine
   */
  async initGoogleMap() {
    const el = document.getElementById(this.elementId);
    if (!el) return;

    this.saveCurrentViewState();

    // Clear previous DOM contents
    el.innerHTML = "";
    el.className = "";

    try {
      const isLoaded = await this.ensureGoogleMapsLoaded();
      if (!isLoaded || !window.google?.maps?.Map) {
        throw new Error("Google Maps Map constructor not available");
      }

      const center = { lat: this.savedCenter[0], lng: this.savedCenter[1] };

      let initialMapType = "roadmap";
      let initialStyles = GOOGLE_MAPS_DARK_STYLE;

      if (this.currentMode === "dark") {
        initialStyles = GOOGLE_MAPS_DARK_STYLE;
        initialMapType = "roadmap";
      } else if (this.currentMode === "light") {
        initialStyles = GOOGLE_MAPS_LIGHT_STYLE;
        initialMapType = "roadmap";
      } else if (this.currentMode === "satellite") {
        initialStyles = [];
        initialMapType = "hybrid";
      } else if (this.currentMode === "terrain") {
        initialStyles = [];
        initialMapType = "terrain";
      } else if (this.currentMode === "streets") {
        initialStyles = [];
        initialMapType = "roadmap";
      }

      // Safe control position fallback: RIGHT_CENTER is 8 in Google Maps API
      const rightCenterPos = (window.google?.maps?.ControlPosition?.RIGHT_CENTER) ?? 8;

      this.googleMap = new google.maps.Map(el, {
        center: center,
        zoom: this.savedZoom,
        minZoom: CONFIG.MAP.MIN_ZOOM,
        maxZoom: CONFIG.MAP.MAX_ZOOM,
        mapTypeId: initialMapType,
        styles: initialStyles,
        mapId: CONFIG.MAP.MAP_ID || "DEMO_MAP_ID",
        internalUsageAttributionIds: [CONFIG.GOOGLE_MAPS_ATTRIBUTION_ID || "gmp_mcp_codeassist_v1_aistudio"],
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: true,
        scaleControl: true,
        rotateControl: true,
        tilt: this.is3DMode ? 45 : 0,
        zoomControlOptions: {
          position: rightCenterPos
        }
      });

      // Track pan/zoom for seamless provider switching and LOD marker fidelity
      this.googleMap.addListener("center_changed", () => {
        const c = this.googleMap.getCenter();
        if (c) this.savedCenter = [c.lat(), c.lng()];
      });
      this.googleMap.addListener("zoom_changed", () => {
        const newZoom = this.googleMap.getZoom() || this.savedZoom;
        const wasCompact = this.savedZoom <= 7;
        const isCompact = newZoom <= 7;
        this.savedZoom = newZoom;
        if (wasCompact !== isCompact && this.hotspots && this.hotspots.length > 0) {
          this.plotGoogleHotspots(this.hotspots);
        }
      });

      // Live cursor telemetry coordinates
      this.googleMap.addListener("mousemove", (e) => {
        if (e.latLng) {
          this.updateTelemetryCoordinates(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Measurement tool click listener for Google Maps
      this.googleMap.addListener("click", (e) => {
        if (this.isMeasuring && e.latLng) {
          this.handleMapClickMeasurement(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Initialize Real-Time Traffic Layer
      if (window.google?.maps?.TrafficLayer) {
        this.trafficLayer = new google.maps.TrafficLayer();
        if (this.isTrafficOn) {
          this.trafficLayer.setMap(this.googleMap);
        }
      }

      this.currentProvider = "google";
      console.log("Google Maps Platform engine initialized successfully.");

      // Re-plot hotspots, heatmap, corridors, and trauma centers
      if (this.hotspots && this.hotspots.length > 0) {
        this.plotGoogleHotspots(this.hotspots);
        if (this.isHeatmapOn) {
          this.updateGoogleHeatmap();
        }
      }

      if (this.isCorridorsOn) {
        this.loadAndRenderCorridors();
      }

      if (this.isTraumaOn) {
        this.loadAndRenderTrauma();
      }

      if (this.isSpeedCamerasOn) {
        this.loadAndRenderSpeedCameras();
      }

      if (this.isHazardousGhatsOn) {
        this.loadAndRenderHazardousGhats();
      }

      if (this.isRiskBuffersOn) {
        this.renderGoogleRiskBuffers();
      }

      // Real-time mouse movement listener for live telemetry coordinates
      this.googleMap.addListener("mousemove", (e) => {
        if (e.latLng) {
          this.updateTelemetryCoordinates(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Measurement tool click listener for Google Maps
      this.googleMap.addListener("click", (e) => {
        if (this.isMeasuring && e.latLng) {
          this.handleMapClickMeasurement(e.latLng.lat(), e.latLng.lng());
        }
      });

      this.updateEngineUiBadge();
      this.updateModeUiButtons();
    } catch (err) {
      console.error("Failed to initialize Google Maps:", err);
      this.currentProvider = "carto";
      this.initLeafletMap();
    }
  }

  /**
   * Initializes Leaflet Multi-Provider Engine (CARTO, ESRI, OpenTopoMap)
   */
  initLeafletMap() {
    const el = document.getElementById(this.elementId);
    if (!el) return;

    this.saveCurrentViewState();

    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }

    el.innerHTML = "";
    el.className = "";

    this.leafletMap = L.map(this.elementId, {
      center: this.savedCenter,
      zoom: this.savedZoom,
      minZoom: CONFIG.MAP.MIN_ZOOM,
      maxZoom: CONFIG.MAP.MAX_ZOOM,
      zoomControl: false
    });

    L.control.zoom({ position: "topright" }).addTo(this.leafletMap);
    L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(this.leafletMap);

    this.leafletMap.on("moveend", () => {
      const c = this.leafletMap.getCenter();
      this.savedCenter = [c.lat, c.lng];
      this.savedZoom = this.leafletMap.getZoom();
    });

    this.leafletMap.on("zoomend", () => {
      const newZoom = this.leafletMap.getZoom();
      const wasCompact = this.savedZoom <= 7;
      const isCompact = newZoom <= 7;
      this.savedZoom = newZoom;
      if (wasCompact !== isCompact && this.hotspots && this.hotspots.length > 0) {
        this.plotLeafletHotspots(this.hotspots);
      }
      if (this.isHeatmapOn && this.leafletHeatmapLayer) {
        this.updateLeafletHeatmap();
      }
    });

    // Mount requested tile provider and mode
    this.updateLeafletTiles();

    this.leafletMarkersLayer = L.layerGroup().addTo(this.leafletMap);

    console.log(`Leaflet engine initialized with provider: ${this.currentProvider}`);

    if (this.hotspots && this.hotspots.length > 0) {
      this.plotLeafletHotspots(this.hotspots);
      if (this.isHeatmapOn) {
        this.updateLeafletHeatmap();
      }
    }

    if (this.isCorridorsOn) {
      this.loadAndRenderCorridors();
    }

    if (this.isTraumaOn) {
      this.loadAndRenderTrauma();
    }

    if (this.isSpeedCamerasOn) {
      this.loadAndRenderSpeedCameras();
    }

    if (this.isHazardousGhatsOn) {
      this.loadAndRenderHazardousGhats();
    }

    if (this.isRiskBuffersOn) {
      this.renderLeafletRiskBuffers();
    }

    this.leafletMap.on("mousemove", (e) => {
      if (e.latlng) {
        this.updateTelemetryCoordinates(e.latlng.lat, e.latlng.lng);
      }
    });

    // Measurement tool click listener for Leaflet
    this.leafletMap.on("click", (e) => {
      if (this.isMeasuring && e.latlng) {
        this.handleMapClickMeasurement(e.latlng.lat, e.latlng.lng);
      }
    });

    this.updateEngineUiBadge();
    this.updateModeUiButtons();
  }

  /**
   * Updates Leaflet Tile Layer based on currentProvider & currentMode
   */
  updateLeafletTiles() {
    if (!this.leafletMap) return;

    if (this.leafletTileLayer) {
      this.leafletMap.removeLayer(this.leafletTileLayer);
      this.leafletTileLayer = null;
    }
    if (this.leafletLabelsLayer) {
      this.leafletMap.removeLayer(this.leafletLabelsLayer);
      this.leafletLabelsLayer = null;
    }

    const { tileUrl, attribution, maxZoom, subdomains, labelsUrl } = this.getLeafletTileConfig();

    this.leafletTileLayer = L.tileLayer(tileUrl, {
      attribution: attribution,
      maxZoom: maxZoom || 19,
      subdomains: subdomains || "abcd",
      detectRetina: true
    }).addTo(this.leafletMap);

    if (labelsUrl) {
      this.leafletLabelsLayer = L.tileLayer(labelsUrl, {
        maxZoom: maxZoom || 19,
        subdomains: subdomains || "",
        pane: "overlayPane",
        detectRetina: true
      }).addTo(this.leafletMap);
    }
  }

  /**
   * Determines active tile URL and attribution based on provider and mode
   */
  getLeafletTileConfig() {
    const provider = this.currentProvider;
    const mode = this.currentMode;

    // 1. ESRI ArcGIS World
    if (provider === "esri") {
      const attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community';
      if (mode === "satellite") {
        return {
          tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          labelsUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          attribution,
          maxZoom: 19,
          subdomains: ""
        };
      } else if (mode === "terrain") {
        return {
          tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          attribution,
          maxZoom: 18,
          subdomains: ""
        };
      } else if (mode === "dark") {
        return {
          tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
          maxZoom: 19,
          subdomains: "abcd"
        };
      } else {
        return {
          tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          attribution,
          maxZoom: 19,
          subdomains: ""
        };
      }
    }

    // 2. OpenTopoMap
    if (provider === "opentopo") {
      const topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      if (mode === "dark") {
        return {
          tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
          subdomains: "abcd"
        };
      } else if (mode === "satellite") {
        return {
          tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          labelsUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
          subdomains: ""
        };
      } else {
        return {
          tileUrl: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          attribution: topoAttr,
          maxZoom: 17,
          subdomains: "abc"
        };
      }
    }

    // 3. CARTO / OpenStreetMap (Default)
    const cartoAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (mode === "light") {
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: cartoAttr,
        maxZoom: 19,
        subdomains: "abcd"
      };
    } else if (mode === "satellite") {
      return {
        tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        labelsUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite Photography',
        maxZoom: 19,
        subdomains: ""
      };
    } else if (mode === "terrain") {
      return {
        tileUrl: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: 'Map style: &copy; OpenTopoMap, SRTM Relief',
        maxZoom: 17,
        subdomains: "abc"
      };
    } else if (mode === "streets") {
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: cartoAttr,
        maxZoom: 19,
        subdomains: "abcd"
      };
    } else if (mode === "monochrome") {
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        attribution: cartoAttr,
        maxZoom: 19,
        subdomains: "abcd"
      };
    } else if (mode === "atmospheric") {
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: 'Atmospheric Radar &copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
        subdomains: "abcd"
      };
    } else if (mode === "risk_canvas") {
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        attribution: 'Casualty Canvas &copy; CARTO',
        maxZoom: 19,
        subdomains: "abcd"
      };
    } else {
      // Dark mode default
      return {
        tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: cartoAttr,
        maxZoom: 19,
        subdomains: "abcd"
      };
    }
  }

  /**
   * Save current map center and zoom level across engine transitions
   */
  saveCurrentViewState() {
    if (this.currentProvider === "google" && this.googleMap) {
      const c = this.googleMap.getCenter();
      if (c) this.savedCenter = [c.lat(), c.lng()];
      this.savedZoom = this.googleMap.getZoom() || this.savedZoom;
    } else if (this.leafletMap) {
      const c = this.leafletMap.getCenter();
      this.savedCenter = [c.lat, c.lng];
      this.savedZoom = this.leafletMap.getZoom();
    }
  }

  /**
   * Switch Active Map Provider: 'google', 'carto', 'esri', 'opentopo'
   */
  switchProvider(providerId) {
    if (providerId === this.currentProvider) return;

    this.saveCurrentViewState();
    const prevProvider = this.currentProvider;
    this.currentProvider = providerId;

    if (providerId === "google") {
      this.ensureGoogleMapsLoaded().then(loaded => {
        if (loaded) {
          if (this.leafletMap) {
            this.leafletMap.remove();
            this.leafletMap = null;
          }
          this.initGoogleMap();
        } else {
          alert("Google Maps Platform is loading or not available in this browser environment.");
          this.currentProvider = prevProvider;
          this.updateEngineUiBadge();
        }
      });
    } else {
      // Leaflet-based providers
      if (prevProvider === "google") {
        if (this.googleMap) {
          this.googleMap = null;
        }
        this.initLeafletMap();
      } else {
        // Already on Leaflet, just switch tiles
        this.updateLeafletTiles();
        this.updateEngineUiBadge();
      }
    }
  }

  /**
   * Set Viewing Mode: 'satellite', 'dark', 'light', 'terrain', 'streets', 'monochrome', 'atmospheric', 'risk_canvas'
   */
  setViewingMode(modeId) {
    this.currentMode = modeId;

    if (this.currentProvider === "google" && this.googleMap) {
      if (modeId === "dark") {
        this.googleMap.setOptions({ styles: GOOGLE_MAPS_DARK_STYLE });
        this.googleMap.setMapTypeId("roadmap");
      } else if (modeId === "light") {
        this.googleMap.setOptions({ styles: GOOGLE_MAPS_LIGHT_STYLE });
        this.googleMap.setMapTypeId("roadmap");
      } else if (modeId === "satellite") {
        this.googleMap.setOptions({ styles: [] });
        this.googleMap.setMapTypeId("hybrid");
      } else if (modeId === "terrain") {
        this.googleMap.setOptions({ styles: [] });
        this.googleMap.setMapTypeId("terrain");
      } else if (modeId === "streets") {
        this.googleMap.setOptions({ styles: [] });
        this.googleMap.setMapTypeId("roadmap");
      } else if (modeId === "monochrome") {
        this.googleMap.setOptions({ styles: GOOGLE_MAPS_SILVER_STYLE });
        this.googleMap.setMapTypeId("roadmap");
      } else if (modeId === "atmospheric") {
        this.googleMap.setOptions({ styles: GOOGLE_MAPS_ATMOSPHERIC_STYLE });
        this.googleMap.setMapTypeId("roadmap");
      } else if (modeId === "risk_canvas") {
        this.googleMap.setOptions({ styles: GOOGLE_MAPS_CANVAS_STYLE });
        this.googleMap.setMapTypeId("roadmap");
      }
    } else if (this.leafletMap) {
      this.updateLeafletTiles();
    }

    this.updateModeUiButtons();
  }

  /**
   * Toggle Real-Time Live Traffic Layer
   */
  toggleTraffic() {
    this.isTrafficOn = !this.isTrafficOn;

    if (this.currentProvider === "google" && this.trafficLayer) {
      this.trafficLayer.setMap(this.isTrafficOn ? this.googleMap : null);
    }

    const trafficDot = document.getElementById("trafficStatusDot");
    const trafficBtn = document.getElementById("btnToggleTraffic");
    if (trafficDot) {
      trafficDot.className = `traffic-badge-dot ${this.isTrafficOn ? '' : 'off'}`;
    }
    if (trafficBtn) {
      trafficBtn.classList.toggle("active", this.isTrafficOn);
    }

    return this.isTrafficOn;
  }

  /**
   * Toggle Fatality Density Heatmap
   */
  toggleHeatmap() {
    this.isHeatmapOn = !this.isHeatmapOn;

    if (this.currentProvider === "google") {
      this.updateGoogleHeatmap();
    } else {
      this.updateLeafletHeatmap();
    }

    const btn = document.getElementById("btnToggleHeatmap");
    if (btn) {
      btn.classList.toggle("active", this.isHeatmapOn);
    }

    const mapEl = document.getElementById(this.elementId);
    if (mapEl) {
      mapEl.classList.toggle("heatmap-mode-active", this.isHeatmapOn);
    }

    // Adjust Google marker pins opacity so thermal clustering shines through
    if (this.currentProvider === "google" && this.googleMarkers) {
      this.googleMarkers.forEach(item => {
        if (item.marker && item.marker.setOpacity) {
          item.marker.setOpacity(this.isHeatmapOn ? 0.7 : 1.0);
        }
      });
    }

    const hudBadge = document.getElementById("heatmapActiveIndicator");
    if (hudBadge) {
      hudBadge.style.display = this.isHeatmapOn ? "inline-block" : "none";
    }

    const legendSpectrum = document.getElementById("legendSpectrumBox");
    if (legendSpectrum) {
      legendSpectrum.style.opacity = this.isHeatmapOn ? "1" : "0.35";
    }

    const totalCount = this.hotspots ? this.hotspots.length : 0;
    this.showNotificationToast(
      this.isHeatmapOn
        ? `🔥 Accident Density Heatmap: Enabled (${totalCount} Blackspots clustered)`
        : "Heatmap Layer: Disabled",
      this.isHeatmapOn ? "info" : "info"
    );

    return this.isHeatmapOn;
  }

  /**
   * Customizes Heatmap Radius (15 - 80px)
   */
  setHeatmapRadius(radius) {
    this.heatmapRadius = parseInt(radius, 10) || 48;
    if (this.isHeatmapOn) {
      if (this.currentProvider === "google") {
        if (this.googleHeatmapLayer) {
          this.googleHeatmapLayer.set("radius", this.heatmapRadius);
        } else {
          this.updateGoogleHeatmap();
        }
      } else {
        this.updateLeafletHeatmap();
      }
    }
  }

  /**
   * Customizes Heatmap Weight Metric ('fatalities', 'accidents', 'score')
   */
  setHeatmapWeight(weightMetric) {
    this.heatmapWeight = weightMetric;
    if (this.isHeatmapOn) {
      if (this.currentProvider === "google") {
        this.updateGoogleHeatmap();
      } else {
        this.updateLeafletHeatmap();
      }
    }
  }

  /**
   * Customizes Heatmap Opacity (0.2 - 1.0)
   */
  setHeatmapOpacity(opacity) {
    this.heatmapOpacity = parseFloat(opacity) || 0.85;
    if (this.isHeatmapOn) {
      if (this.currentProvider === "google") {
        if (this.googleHeatmapLayer) {
          this.googleHeatmapLayer.set("opacity", this.heatmapOpacity);
        } else {
          this.updateGoogleHeatmap();
        }
      } else {
        this.updateLeafletHeatmap();
      }
    }
  }

  /**
   * Toggle Hotspot Markers Visibility
   */
  toggleMarkers() {
    this.areMarkersVisible = !this.areMarkersVisible;

    if (this.currentProvider === "google") {
      this.googleMarkers.forEach(item => {
        if (!item.marker) return;
        if (typeof item.marker.setVisible === "function") {
          item.marker.setVisible(this.areMarkersVisible);
        } else if (item.marker.map !== undefined) {
          item.marker.map = this.areMarkersVisible ? this.googleMap : null;
        }
      });
    } else if (this.leafletMap && this.leafletMarkersLayer) {
      if (this.areMarkersVisible) {
        if (!this.leafletMap.hasLayer(this.leafletMarkersLayer)) {
          this.leafletMap.addLayer(this.leafletMarkersLayer);
        }
      } else {
        if (this.leafletMap.hasLayer(this.leafletMarkersLayer)) {
          this.leafletMap.removeLayer(this.leafletMarkersLayer);
        }
      }
    }

    const btn = document.getElementById("btnToggleMarkers");
    if (btn) {
      btn.classList.toggle("active", this.areMarkersVisible);
    }

    return this.areMarkersVisible;
  }

  /**
   * Updates Google Maps Heatmap Layer with Dynamic Libraries and Multi-Scale Weights
   */
  async updateGoogleHeatmap() {
    if (!this.googleMap) return;

    if (this.googleHeatmapLayer) {
      this.googleHeatmapLayer.setMap(null);
      this.googleHeatmapLayer = null;
    }

    if (this.googleCustomHeatCanvas) {
      this.googleCustomHeatCanvas.setMap(null);
      this.googleCustomHeatCanvas = null;
    }

    if (!this.isHeatmapOn || !this.hotspots || this.hotspots.length === 0) return;

    // Safely retrieve HeatmapLayer constructor
    let HeatmapLayerClass = this.HeatmapLayerClass || window._GoogleHeatmapLayerClass;
    if (!HeatmapLayerClass && window.google?.maps?.visualization?.HeatmapLayer) {
      HeatmapLayerClass = window.google.maps.visualization.HeatmapLayer;
    }

    // Try dynamic library import if not already available
    if (!HeatmapLayerClass && typeof window.google?.maps?.importLibrary === "function") {
      try {
        const viz = await window.google.maps.importLibrary("visualization");
        if (viz && viz.HeatmapLayer) {
          HeatmapLayerClass = viz.HeatmapLayer;
          this.HeatmapLayerClass = viz.HeatmapLayer;
          window._GoogleHeatmapLayerClass = viz.HeatmapLayer;
        }
      } catch (e) {
        console.warn("Could not import Google visualization library:", e);
      }
    }

    if (!HeatmapLayerClass && window.google?.maps?.visualization?.HeatmapLayer) {
      HeatmapLayerClass = window.google.maps.visualization.HeatmapLayer;
    }

    if (HeatmapLayerClass) {
      try {
        const points = this.hotspots.map(spot => {
          const lat = parseFloat(spot.latitude);
          const lng = parseFloat(spot.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          let weight = 1;
          if (this.heatmapWeight === "accidents") {
            weight = Math.max(1, (spot.total_accidents || 10) * 0.5);
          } else if (this.heatmapWeight === "score") {
            weight = Math.max(1, (spot.hotspot_score || 30) / 7);
          } else {
            // 'fatalities' metric (default)
            weight = Math.max(1, (spot.total_deaths || 4) * 1.8);
          }

          const location = (window.google?.maps?.LatLng)
            ? new google.maps.LatLng(lat, lng)
            : { lat, lng };

          return { location, weight };
        }).filter(Boolean);

        const dataArray = (window.google?.maps?.MVCArray)
          ? new google.maps.MVCArray(points)
          : points;

        this.googleHeatmapLayer = new HeatmapLayerClass({
          data: dataArray,
          map: this.googleMap,
          radius: this.heatmapRadius || 48,
          opacity: this.heatmapOpacity || 0.85,
          gradient: [
            "rgba(0, 0, 0, 0)",
            "rgba(6, 182, 212, 0.45)",
            "rgba(59, 130, 246, 0.75)",
            "rgba(16, 185, 129, 0.85)",
            "rgba(234, 179, 8, 0.92)",
            "rgba(249, 115, 22, 0.98)",
            "rgba(239, 68, 68, 1)",
            "rgba(185, 28, 28, 1)"
          ]
        });
        console.log(`Google Maps Heatmap active: ${points.length} points rendered.`);
        return;
      } catch (err) {
        console.warn("Failed to create native Google HeatmapLayer, falling back to Canvas overlay:", err);
      }
    }

    // Fallback: Canvas Overlay on Google Maps
    this.renderGoogleCanvasHeatmap();
  }

  /**
   * Renders Canvas Heatmap Overlay on Google Maps (Fallback when visualization library unavailable)
   */
  renderGoogleCanvasHeatmap() {
    if (!this.googleMap || !window.google?.maps?.OverlayView) return;
    if (!this.isHeatmapOn || !this.hotspots || this.hotspots.length === 0) return;

    const self = this;
    const overlay = new google.maps.OverlayView();
    let canvas = null;

    overlay.onAdd = function() {
      canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "10";
      const panes = this.getPanes();
      const targetPane = panes ? (panes.overlayLayer || panes.mapPane) : null;
      if (targetPane) targetPane.appendChild(canvas);
    };

    overlay.draw = function() {
      if (!canvas || !self.googleMap) return;
      const projection = this.getProjection();
      if (!projection) return;

      const bounds = self.googleMap.getBounds();
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nePixel = projection.fromLatLngToDivPixel(ne);
      const swPixel = projection.fromLatLngToDivPixel(sw);
      if (!nePixel || !swPixel) return;

      const left = Math.min(swPixel.x, nePixel.x);
      const top = Math.min(nePixel.y, swPixel.y);
      const width = Math.max(10, Math.abs(nePixel.x - swPixel.x));
      const height = Math.max(10, Math.abs(swPixel.y - nePixel.y));

      canvas.style.left = left + "px";
      canvas.style.top = top + "px";
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);

      self.hotspots.forEach(spot => {
        const lat = parseFloat(spot.latitude);
        const lng = parseFloat(spot.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (!pos) return;

        const x = pos.x - left;
        const y = pos.y - top;

        let weight = (self.heatmapWeight === "accidents")
          ? (spot.total_accidents || 10) / 90
          : (self.heatmapWeight === "score")
          ? (spot.hotspot_score || 30) / 85
          : (spot.total_deaths || 4) / 45;
        weight = Math.min(1.0, Math.max(0.25, weight));

        const radius = self.heatmapRadius || 48;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(239, 68, 68, ${0.95 * weight})`);
        grad.addColorStop(0.35, `rgba(249, 115, 22, ${0.8 * weight})`);
        grad.addColorStop(0.65, `rgba(234, 179, 8, ${0.6 * weight})`);
        grad.addColorStop(0.85, `rgba(16, 185, 129, ${0.35 * weight})`);
        grad.addColorStop(1, "rgba(6, 182, 212, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    overlay.onRemove = function() {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
    };

    overlay.setMap(this.googleMap);
    this.googleCustomHeatCanvas = overlay;
  }

  /**
   * Updates Leaflet Heatmap Layer with Dynamic Weights and Radiant Color Gradients
   */
  updateLeafletHeatmap() {
    if (!this.leafletMap) return;

    if (this.leafletHeatmapLayer) {
      this.leafletMap.removeLayer(this.leafletHeatmapLayer);
      this.leafletHeatmapLayer = null;
    }

    if (!this.isHeatmapOn || !this.hotspots || this.hotspots.length === 0) return;

    const heatPoints = this.hotspots.map(spot => {
      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return null;

      let intensity = 0.5;
      if (this.heatmapWeight === "accidents") {
        intensity = Math.min(1.0, Math.max(0.25, (spot.total_accidents || 10) / 80));
      } else if (this.heatmapWeight === "score") {
        intensity = Math.min(1.0, Math.max(0.3, (spot.hotspot_score || 30) / 75));
      } else {
        // fatalities
        intensity = Math.min(1.0, Math.max(0.3, (spot.total_deaths || 4) / 40));
      }

      return [lat, lng, intensity];
    }).filter(Boolean);

    if (typeof window.L?.heatLayer === "function") {
      const currentZoom = this.leafletMap.getZoom() || 5;
      // In leaflet-heat, the intensity factor is f = 1 / 2^max(0, min(maxZoom - zoom, 12)).
      // Setting effectiveMaxZoom close to the current zoom level ensures points never vanish into 0 alpha!
      const effectiveMaxZoom = Math.min(8, Math.max(5, currentZoom));

      this.leafletHeatmapLayer = L.heatLayer(heatPoints, {
        radius: this.heatmapRadius || 50,
        blur: Math.round((this.heatmapRadius || 50) * 0.55),
        maxZoom: effectiveMaxZoom,
        max: 0.95,
        minOpacity: 0.45,
        gradient: {
          0.1: "#06b6d4",
          0.25: "#3b82f6",
          0.45: "#10b981",
          0.65: "#f59e0b",
          0.82: "#f97316",
          1.0: "#ef4444"
        }
      }).addTo(this.leafletMap);
      console.log(`Leaflet Heatmap active: ${heatPoints.length} points rendered at zoom ${currentZoom}.`);
    } else {
      this.renderLeafletFallbackHeatCircles();
    }
  }

  /**
   * Fallback Multi-Ring Radiant Thermal Circles for Leaflet
   */
  renderLeafletFallbackHeatCircles() {
    if (!this.leafletMap || !this.hotspots) return;
    this.leafletHeatmapLayer = L.layerGroup();

    this.hotspots.forEach(spot => {
      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const deaths = spot.total_deaths || 5;
      const baseRadiusMeters = Math.max(35000, deaths * 1800);

      const outerRing = L.circle([lat, lng], {
        radius: baseRadiusMeters,
        fillColor: "#06b6d4",
        fillOpacity: 0.18,
        stroke: false
      });
      const midRing = L.circle([lat, lng], {
        radius: baseRadiusMeters * 0.6,
        fillColor: "#f59e0b",
        fillOpacity: 0.35,
        stroke: false
      });
      const core = L.circle([lat, lng], {
        radius: baseRadiusMeters * 0.3,
        fillColor: "#ef4444",
        fillOpacity: 0.65,
        stroke: false
      });

      this.leafletHeatmapLayer.addLayer(outerRing);
      this.leafletHeatmapLayer.addLayer(midRing);
      this.leafletHeatmapLayer.addLayer(core);
    });

    this.leafletHeatmapLayer.addTo(this.leafletMap);
  }

  // ==========================================================================
  // HIGHWAY CORRIDORS & POLYLINES (MoRTH Priority Stretches)
  // ==========================================================================

  /**
   * Loads and Renders High-Fatality Highway Corridors
   */
  async loadAndRenderCorridors() {
    try {
      if (!this.corridorsData || this.corridorsData.length === 0) {
        if (window.accidentService && typeof window.accidentService.getCorridorPolylines === "function") {
          this.corridorsData = await window.accidentService.getCorridorPolylines();
        }
      }

      if (!this.corridorsData || this.corridorsData.length === 0) return;

      if (this.currentProvider === "google" && this.googleMap) {
        this.renderGoogleCorridors();
      } else if (this.leafletMap) {
        this.renderLeafletCorridors();
      }
    } catch (err) {
      console.warn("Notice loading corridor polylines:", err);
    }
  }

  /**
   * Renders Google Maps Highway Corridor Polylines
   */
  renderGoogleCorridors() {
    this.googleCorridorLines.forEach(line => line.setMap(null));
    this.googleCorridorLines = [];

    if (!this.isCorridorsOn || !this.googleMap || !this.corridorsData) return;

    this.corridorsData.forEach(corridor => {
      if (!corridor.coordinates || corridor.coordinates.length < 2) return;

      const path = corridor.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }));
      const color = corridor.color || "#ef4444";

      // Outer glow polyline
      const glowPolyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.35,
        strokeWeight: 9,
        map: this.googleMap
      });

      // Core sharp polyline
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: 4,
        map: this.googleMap
      });

      const infoHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px; color:#0f172a; min-width:260px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:#ef4444; font-weight:700; margin-bottom:4px;">
            🛣️ High-Fatality Corridor
          </div>
          <div style="font-size:1rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            ${corridor.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.4; color:#334155; margin-bottom:8px;">
            <strong>Highway:</strong> ${corridor.highway} &bull; <strong>Length:</strong> ${corridor.length_km} km<br>
            <strong>Annual Casualties:</strong> ${corridor.fatal_accidents_annual} deaths<br>
            <strong>Critical Blackspots:</strong> ${corridor.blackspots_count} verified clusters
          </div>
          <div style="font-size:0.72rem; color:#64748b; background:#f1f5f9; padding:5px 8px; border-radius:4px;">
            <strong>Hazard Factors:</strong> ${(corridor.hazard_factors || []).join(", ")}
          </div>
        </div>
      `;

      const clickHandler = (e) => {
        if (this.currentInfoWindow) this.currentInfoWindow.close();
        this.currentInfoWindow = new google.maps.InfoWindow({
          content: infoHtml,
          position: e.latLng,
          maxWidth: 320
        });
        this.currentInfoWindow.open(this.googleMap);
      };

      polyline.addListener("click", clickHandler);
      glowPolyline.addListener("click", clickHandler);

      this.googleCorridorLines.push(glowPolyline, polyline);
    });
  }

  /**
   * Renders Leaflet Highway Corridor Polylines
   */
  renderLeafletCorridors() {
    if (this.leafletCorridorLayer) {
      this.leafletMap.removeLayer(this.leafletCorridorLayer);
      this.leafletCorridorLayer = null;
    }

    if (!this.isCorridorsOn || !this.leafletMap || !this.corridorsData) return;

    this.leafletCorridorLayer = L.layerGroup();

    this.corridorsData.forEach(corridor => {
      if (!corridor.coordinates || corridor.coordinates.length < 2) return;

      const color = corridor.color || "#ef4444";

      // Outer glow line
      const glowLine = L.polyline(corridor.coordinates, {
        color: color,
        weight: 9,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round"
      });

      // Core sharp line
      const line = L.polyline(corridor.coordinates, {
        color: color,
        weight: 4,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round"
      });

      const popupContent = `
        <div style="padding:4px; min-width:240px;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#ef4444; font-weight:700; margin-bottom:3px;">
            🛣️ MoRTH High-Fatality Corridor
          </div>
          <div style="font-size:0.95rem; font-weight:800; color:#f8fafc; margin-bottom:5px;">
            ${corridor.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#cbd5e1; margin-bottom:6px;">
            <strong>Highway:</strong> ${corridor.highway} &bull; <strong>Length:</strong> ${corridor.length_km} km<br>
            <strong>Annual Fatalities:</strong> ${corridor.fatal_accidents_annual}<br>
            <strong>Blackspots:</strong> ${corridor.blackspots_count} locations
          </div>
          <div style="font-size:0.7rem; color:#94a3b8; background:rgba(30,41,59,0.7); padding:5px 7px; border-radius:4px;">
            <strong>Hazards:</strong> ${(corridor.hazard_factors || []).join(", ")}
          </div>
        </div>
      `;

      line.bindPopup(popupContent, { maxWidth: 300, className: "custom-hotspot-popup" });
      glowLine.bindPopup(popupContent, { maxWidth: 300, className: "custom-hotspot-popup" });
      this.leafletCorridorLayer.addLayer(glowLine);
      this.leafletCorridorLayer.addLayer(line);
    });

    this.leafletCorridorLayer.addTo(this.leafletMap);
  }

  /**
   * Toggle Corridors Layer
   */
  toggleCorridors() {
    this.isCorridorsOn = !this.isCorridorsOn;

    if (this.currentProvider === "google") {
      this.renderGoogleCorridors();
    } else {
      this.renderLeafletCorridors();
    }

    const btn = document.getElementById("btnToggleCorridors");
    if (btn) {
      btn.classList.toggle("active", this.isCorridorsOn);
    }

    return this.isCorridorsOn;
  }

  // ==========================================================================
  // TRAUMA CARE HOSPITALS ALONG CORRIDORS
  // ==========================================================================

  /**
   * Loads and Renders Emergency Trauma Care Centers
   */
  async loadAndRenderTrauma() {
    try {
      if (!this.traumaData || this.traumaData.length === 0) {
        if (window.accidentService && typeof window.accidentService.getTraumaCenters === "function") {
          this.traumaData = await window.accidentService.getTraumaCenters();
        }
      }

      if (!this.traumaData || this.traumaData.length === 0) return;

      if (this.currentProvider === "google" && this.googleMap) {
        this.renderGoogleTrauma();
      } else if (this.leafletMap) {
        this.renderLeafletTrauma();
      }
    } catch (err) {
      console.warn("Notice loading trauma centers:", err);
    }
  }

  /**
   * Renders Google Maps Trauma Care Markers
   */
  renderGoogleTrauma() {
    this.googleTraumaMarkers.forEach(m => m.setMap(null));
    this.googleTraumaMarkers = [];

    if (!this.isTraumaOn || !this.googleMap || !this.traumaData) return;

    this.traumaData.forEach(hospital => {
      const lat = parseFloat(hospital.latitude);
      const lng = parseFloat(hospital.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const svgHospital = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
            <rect x="13" y="7" width="6" height="18" fill="#ffffff" rx="1"/>
            <rect x="7" y="13" width="18" height="6" fill="#ffffff" rx="1"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15)
      };

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.googleMap,
        title: `${hospital.name} (Emergency Trauma)`,
        icon: svgHospital
      });

      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px; color:#0f172a; min-width:250px;">
          <div style="font-size:0.72rem; text-transform:uppercase; color:#0284c7; font-weight:700; margin-bottom:4px;">
            🏥 Emergency Trauma Care Center
          </div>
          <div style="font-size:0.95rem; font-weight:800; color:#0f172a; margin-bottom:5px;">
            ${hospital.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#334155; margin-bottom:6px;">
            <strong>Level:</strong> Level ${hospital.level} Apex Facility<br>
            <strong>Location:</strong> ${hospital.city}, ${hospital.state}<br>
            <strong>Corridor Served:</strong> ${hospital.highway}<br>
            <strong>ICU Beds:</strong> ${hospital.icu_beds} Emergency Beds
          </div>
          <div style="font-size:0.76rem; color:#ffffff; background:#0284c7; padding:6px 10px; border-radius:6px; font-weight:700; text-align:center;">
            🚨 24x7 Ambulance Helpline: ${hospital.emergency_hotline}
          </div>
        </div>
      `;

      marker.addListener("click", () => {
        if (this.currentInfoWindow) this.currentInfoWindow.close();
        this.currentInfoWindow = new google.maps.InfoWindow({
          content: popupHtml,
          position: { lat, lng },
          maxWidth: 320
        });
        this.currentInfoWindow.open(this.googleMap, marker);
      });

      this.googleTraumaMarkers.push(marker);
    });
  }

  /**
   * Renders Leaflet Trauma Care Markers
   */
  renderLeafletTrauma() {
    if (this.leafletTraumaLayer) {
      this.leafletMap.removeLayer(this.leafletTraumaLayer);
      this.leafletTraumaLayer = null;
    }

    if (!this.isTraumaOn || !this.leafletMap || !this.traumaData) return;

    this.leafletTraumaLayer = L.layerGroup();

    this.traumaData.forEach(hospital => {
      const lat = parseFloat(hospital.latitude);
      const lng = parseFloat(hospital.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const hospitalIcon = L.divIcon({
        className: "custom-leaflet-hospital-wrapper",
        html: `
          <div style="width:28px; height:28px; border-radius:50%; background:#0284c7; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.5); cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: hospitalIcon });
      const popupContent = `
        <div style="padding:4px; min-width:240px;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#38bdf8; font-weight:700; margin-bottom:3px;">
            🏥 Emergency Trauma Care Center
          </div>
          <div style="font-size:0.92rem; font-weight:800; color:#f8fafc; margin-bottom:5px;">
            ${hospital.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#cbd5e1; margin-bottom:6px;">
            <strong>Classification:</strong> Level ${hospital.level} Apex Facility<br>
            <strong>City:</strong> ${hospital.city}, ${hospital.state}<br>
            <strong>Corridor:</strong> ${hospital.highway} (~${hospital.distance_to_blackspot_km || 4} km away)<br>
            <strong>ICU Beds:</strong> ${hospital.icu_beds} Emergency Units
          </div>
          <div style="font-size:0.76rem; color:#ffffff; background:#0284c7; padding:6px 8px; border-radius:6px; font-weight:700; text-align:center;">
            🚨 24x7 Ambulance Helpline: ${hospital.emergency_hotline}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300, className: "custom-hotspot-popup" });
      this.leafletTraumaLayer.addLayer(marker);
    });

    this.leafletTraumaLayer.addTo(this.leafletMap);
  }

  /**
   * Toggle Trauma Care Layer
   */
  toggleTrauma() {
    this.isTraumaOn = !this.isTraumaOn;

    if (this.currentProvider === "google") {
      this.renderGoogleTrauma();
    } else {
      this.renderLeafletTrauma();
    }

    const btn = document.getElementById("btnToggleTrauma");
    if (btn) {
      btn.classList.toggle("active", this.isTraumaOn);
    }

    return this.isTraumaOn;
  }

  // ==========================================================================
  // HIGHWAY DISTANCE & RISK MEASUREMENT TOOL
  // ==========================================================================

  /**
   * Toggles Interactive Highway Distance & Risk Measurement Tool
   */
  toggleMeasureTool() {
    this.isMeasuring = !this.isMeasuring;

    const btn = document.getElementById("btnToggleMeasure");
    if (btn) {
      btn.classList.toggle("active", this.isMeasuring);
    }

    const hud = document.getElementById("measureHudBar");
    if (hud) {
      hud.style.display = this.isMeasuring ? "flex" : "none";
    }

    if (!this.isMeasuring) {
      this.clearMeasure();
    }

    return this.isMeasuring;
  }

  /**
   * Handles user click on map to add measurement waypoint
   */
  handleMapClickMeasurement(lat, lng) {
    if (!this.isMeasuring) return;

    this.measurePoints.push({ lat, lng });
    this.updateMeasureVisualization();
    this.calculateMeasurementRisk();
  }

  /**
   * Updates measurement polyline and waypoint markers across providers
   */
  updateMeasureVisualization() {
    // 1. Google Maps
    if (this.currentProvider === "google" && this.googleMap) {
      if (this.googleMeasurePolyline) {
        this.googleMeasurePolyline.setMap(null);
      }
      this.googleMeasureMarkers.forEach(m => m.setMap(null));
      this.googleMeasureMarkers = [];

      if (this.measurePoints.length > 0) {
        this.measurePoints.forEach((pt, idx) => {
          const m = new google.maps.Marker({
            position: pt,
            map: this.googleMap,
            label: {
              text: `${idx + 1}`,
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "bold"
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#6366f1",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
          this.googleMeasureMarkers.push(m);
        });

        if (this.measurePoints.length >= 2) {
          this.googleMeasurePolyline = new google.maps.Polyline({
            path: this.measurePoints,
            geodesic: true,
            strokeColor: "#6366f1",
            strokeOpacity: 0.9,
            strokeWeight: 4,
            strokeDasharray: "4, 4",
            map: this.googleMap
          });
        }
      }
    }

    // 2. Leaflet
    if (this.leafletMap) {
      if (this.leafletMeasurePolyline) {
        this.leafletMap.removeLayer(this.leafletMeasurePolyline);
        this.leafletMeasurePolyline = null;
      }
      this.leafletMeasureMarkers.forEach(m => this.leafletMap.removeLayer(m));
      this.leafletMeasureMarkers = [];

      if (this.measurePoints.length > 0) {
        this.measurePoints.forEach((pt, idx) => {
          const circle = L.circleMarker([pt.lat, pt.lng], {
            radius: 8,
            fillColor: "#6366f1",
            color: "#ffffff",
            weight: 2,
            fillOpacity: 1
          }).addTo(this.leafletMap);
          circle.bindTooltip(`${idx + 1}`, { permanent: true, direction: "center", className: "measure-tooltip" });
          this.leafletMeasureMarkers.push(circle);
        });

        if (this.measurePoints.length >= 2) {
          const latLngs = this.measurePoints.map(p => [p.lat, p.lng]);
          this.leafletMeasurePolyline = L.polyline(latLngs, {
            color: "#6366f1",
            weight: 4,
            dashArray: "6, 6",
            opacity: 0.9
          }).addTo(this.leafletMap);
        }
      }
    }
  }

  /**
   * Calculates Total Distance and Correlating Blackspot Risk along Route
   */
  calculateMeasurementRisk() {
    if (this.measurePoints.length < 2) {
      const distEl = document.getElementById("measureDistanceValue");
      if (distEl) distEl.textContent = "0.0 km";
      const riskEl = document.getElementById("measureRiskValue");
      if (riskEl) riskEl.textContent = "Click map to measure route...";
      return;
    }

    // Haversine distance summation
    let totalDistKm = 0;
    for (let i = 0; i < this.measurePoints.length - 1; i++) {
      const p1 = this.measurePoints[i];
      const p2 = this.measurePoints[i + 1];
      totalDistKm += this.calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng);
    }

    // Check for nearby blackspots within 15 km buffer of any waypoint
    let nearbySpots = [];
    if (this.hotspots && this.hotspots.length > 0) {
      nearbySpots = this.hotspots.filter(spot => {
        const sLat = parseFloat(spot.latitude);
        const sLng = parseFloat(spot.longitude);
        if (isNaN(sLat) || isNaN(sLng)) return false;

        return this.measurePoints.some(pt => {
          return this.calculateHaversine(pt.lat, pt.lng, sLat, sLng) <= 18.0;
        });
      });
    }

    const criticalCount = nearbySpots.filter(s => s.hotspot_tier === "Critical").length;
    const distEl = document.getElementById("measureDistanceValue");
    if (distEl) distEl.textContent = `${totalDistKm.toFixed(1)} km`;

    const riskEl = document.getElementById("measureRiskValue");
    if (riskEl) {
      let riskLevel = "Low Risk";
      let color = "#3b82f6";

      if (criticalCount >= 2 || nearbySpots.length >= 4) {
        riskLevel = "CRITICAL HAZARD";
        color = "#ef4444";
      } else if (criticalCount === 1 || nearbySpots.length >= 2) {
        riskLevel = "HIGH RISK";
        color = "#f97316";
      } else if (nearbySpots.length > 0) {
        riskLevel = "MODERATE RISK";
        color = "#eab308";
      }

      riskEl.innerHTML = `
        <span style="color:${color}; font-weight:700;">${riskLevel}</span> &bull; 
        ${nearbySpots.length} Blackspot${nearbySpots.length === 1 ? '' : 's'} (${criticalCount} Critical) within corridor
      `;
    }
  }

  /**
   * Clear active measurements
   */
  clearMeasure() {
    this.measurePoints = [];
    if (this.googleMeasurePolyline) {
      this.googleMeasurePolyline.setMap(null);
      this.googleMeasurePolyline = null;
    }
    this.googleMeasureMarkers.forEach(m => m.setMap(null));
    this.googleMeasureMarkers = [];

    if (this.leafletMeasurePolyline && this.leafletMap) {
      this.leafletMap.removeLayer(this.leafletMeasurePolyline);
      this.leafletMeasurePolyline = null;
    }
    this.leafletMeasureMarkers.forEach(m => this.leafletMap && this.leafletMap.removeLayer(m));
    this.leafletMeasureMarkers = [];

    const distEl = document.getElementById("measureDistanceValue");
    if (distEl) distEl.textContent = "0.0 km";
    const riskEl = document.getElementById("measureRiskValue");
    if (riskEl) riskEl.textContent = "Click map to measure route...";
  }

  /**
   * Helper Haversine formula
   */
  calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ==========================================================================
  // GEOLOCATION ("NEAR ME") RISK RADAR
  // ==========================================================================

  /**
   * Finds user's location via GPS, zooms to position, and evaluates nearest blackspot risk
   */
  locateUser() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const btn = document.getElementById("btnLocateUser");
    if (btn) btn.classList.add("active");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (btn) btn.classList.remove("active");

        // Pan to position
        if (this.currentProvider === "google" && this.googleMap) {
          this.googleMap.panTo({ lat, lng });
          this.googleMap.setZoom(13);

          if (this.userLocationMarker) this.userLocationMarker.setMap(null);
          this.userLocationMarker = new google.maps.Marker({
            position: { lat, lng },
            map: this.googleMap,
            title: "Your GPS Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#38bdf8",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3
            }
          });
        } else if (this.leafletMap) {
          this.leafletMap.flyTo([lat, lng], 13, { duration: 1.5 });

          if (this.userLocationMarker) this.leafletMap.removeLayer(this.userLocationMarker);
          this.userLocationMarker = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: "#38bdf8",
            color: "#ffffff",
            weight: 3,
            fillOpacity: 1
          }).addTo(this.leafletMap);
        }

        // Find nearest blackspot
        if (this.hotspots && this.hotspots.length > 0) {
          let closestSpot = null;
          let minDist = Infinity;

          this.hotspots.forEach(spot => {
            const sLat = parseFloat(spot.latitude);
            const sLng = parseFloat(spot.longitude);
            if (isNaN(sLat) || isNaN(sLng)) return;
            const dist = this.calculateHaversine(lat, lng, sLat, sLng);
            if (dist < minDist) {
              minDist = dist;
              closestSpot = spot;
            }
          });

          if (closestSpot) {
            this.showNotificationToast(
              `📍 Nearest Blackspot: ${closestSpot.road_name} (${minDist.toFixed(1)} km away &bull; ${closestSpot.hotspot_tier} Tier)`,
              minDist < 10 ? "critical" : "info"
            );
          }
        }
      },
      (err) => {
        if (btn) btn.classList.remove("active");
        console.warn("Geolocation access denied or unavailable:", err.message);
        // Fallback to Delhi NCR center
        this.showNotificationToast("Geolocation not permitted in browser; displaying central highway network.", "info");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  /**
   * Notification toast utility
   */
  showNotificationToast(msg, type = "info") {
    let toast = document.getElementById("mapFloatingToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mapFloatingToast";
      toast.style.cssText = `
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 500;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f8fafc;
        padding: 8px 16px;
        border-radius: 24px;
        font-size: 0.8rem;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    if (type === "critical") {
      toast.style.borderColor = "#ef4444";
      toast.style.boxShadow = "0 0 16px rgba(239, 68, 68, 0.4)";
    } else {
      toast.style.borderColor = "#38bdf8";
      toast.style.boxShadow = "0 0 16px rgba(56, 189, 248, 0.3)";
    }

    toast.innerHTML = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(10px)";
    }, 4500);
  }

  /**
   * Plot Hotspots from DB across active engine with real-time view confirmation
   */
  plotHotspots(hotspots, options = {}) {
    this.hotspots = hotspots || [];

    if (this.currentProvider === "google" && this.googleMap) {
      this.plotGoogleHotspots(hotspots);
      if (this.isHeatmapOn) {
        this.updateGoogleHeatmap();
      }
    } else if (this.leafletMap) {
      this.plotLeafletHotspots(hotspots);
      if (this.isHeatmapOn) {
        this.updateLeafletHeatmap();
      }
    }

    // Auto-fit bounds when filters are active or requested
    if (options.fitBounds) {
      this.fitBoundsToHotspots(this.hotspots);
    }

    // Update real-time on-map confirmation HUD
    const msg = options.isRealtime
      ? `⚡ Real-Time DB Event: ${options.realtimeTable || 'DB'} ${options.realtimeType || 'Update'}`
      : (this.hotspots.length > 0 ? "Live Map View Updated" : "0 Corridors Match Query");
    this.showMapLiveConfirmation(msg, this.hotspots.length, options.isRealtime);

    // Empty state overlay handling
    const emptyOverlay = document.getElementById("mapEmptyOverlay");
    if (emptyOverlay) {
      emptyOverlay.style.display = this.hotspots.length === 0 ? "flex" : "none";
    }
  }

  /**
   * Smoothly pans and adjusts zoom to contain all filtered hotspots
   */
  fitBoundsToHotspots(hotspots, maxZoom = 13) {
    if (!hotspots || hotspots.length === 0) return;

    const validCoords = [];
    hotspots.forEach(spot => {
      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        validCoords.push({ lat, lng });
      }
    });

    if (validCoords.length === 0) return;

    // Single hotspot match -> zoom directly into that corridor
    if (validCoords.length === 1) {
      const { lat, lng } = validCoords[0];
      if (this.currentProvider === "google" && this.googleMap) {
        this.googleMap.panTo({ lat, lng });
        this.googleMap.setZoom(15);
      } else if (this.leafletMap) {
        this.leafletMap.flyTo([lat, lng], 15, { duration: 1 });
      }
      return;
    }

    // Multiple hotspots -> calculate enclosing bounding box
    if (this.currentProvider === "google" && this.googleMap && window.google?.maps?.LatLngBounds) {
      const bounds = new google.maps.LatLngBounds();
      validCoords.forEach(c => bounds.extend(c));
      this.googleMap.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (this.leafletMap) {
      const bounds = validCoords.map(c => [c.lat, c.lng]);
      this.leafletMap.fitBounds(bounds, { padding: [60, 60], maxZoom: maxZoom });
    }
  }

  /**
   * Displays on-map live confirmation HUD pulse
   */
  showMapLiveConfirmation(message, count, isRealtime = false) {
    const hud = document.getElementById("mapViewLiveHud");
    const textEl = document.getElementById("liveHudText");
    const countEl = document.getElementById("liveHudCount");
    if (!hud || !textEl || !countEl) return;

    textEl.textContent = message;
    countEl.textContent = `${count} ${count === 1 ? 'Corridor' : 'Corridors'}`;

    hud.classList.remove("live-updated", "realtime-event");
    void hud.offsetWidth; // trigger reflow
    hud.classList.add(isRealtime ? "realtime-event" : "live-updated");

    clearTimeout(this._hudTimer);
    this._hudTimer = setTimeout(() => {
      hud.classList.remove("live-updated", "realtime-event");
      textEl.textContent = "Live GIS View Active";
    }, 4500);
  }

  /**
   * Google Maps Hotspot Plotter (AdvancedMarkerElement + LOD Fallback)
   */
  async plotGoogleHotspots(hotspots) {
    this.googleMarkers.forEach(m => {
      if (m.marker) {
        if (typeof m.marker.setMap === "function") {
          m.marker.setMap(null);
        } else if (m.marker.map !== undefined) {
          m.marker.map = null;
        }
      }
    });
    this.googleMarkers.clear();

    if (!this.googleMap || !window.google?.maps?.LatLngBounds) return;
    if (!hotspots || hotspots.length === 0) return;

    let AdvancedMarkerElement = null;
    try {
      if (window.google.maps.importLibrary) {
        const markerLib = await google.maps.importLibrary("marker");
        AdvancedMarkerElement = markerLib?.AdvancedMarkerElement;
      } else if (window.google.maps.marker?.AdvancedMarkerElement) {
        AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement;
      }
    } catch (e) {
      console.warn("Notice checking AdvancedMarkerElement library:", e);
    }

    const bounds = new google.maps.LatLngBounds();
    const currentZoom = this.googleMap.getZoom() || this.savedZoom;
    const isCompact = currentZoom <= 7;

    hotspots.forEach(spot => {
      if (!spot.latitude || !spot.longitude) return;

      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const pos = { lat, lng };
      const pinColor = this.getScoreColor(spot.hotspot_score);
      const score = Math.round(spot.hotspot_score || 0);
      const tierClass = `tier-${(spot.hotspot_tier || 'Low').toLowerCase()}`;
      const isCritical = spot.hotspot_tier === 'Critical';
      const popupHtml = this.generatePopupHtml(spot);

      let marker = null;

      if (AdvancedMarkerElement) {
        try {
          const markerContent = document.createElement("div");
          markerContent.className = `custom-hotspot-marker ${tierClass} ${isCompact ? 'compact-dot' : ''}`;
          markerContent.style.cursor = "pointer";
          markerContent.innerHTML = `
            ${isCritical ? '<div class="marker-pulse"></div>' : ''}
            <div class="marker-pin">
              <span class="marker-pin-inner">${score}</span>
            </div>
          `;

          marker = new AdvancedMarkerElement({
            map: this.areMarkersVisible ? this.googleMap : null,
            position: pos,
            title: `${spot.road_name || 'Highway'} (${spot.hotspot_tier} - Score ${score})`,
            content: markerContent
          });

          markerContent.addEventListener("click", () => {
            if (this.currentInfoWindow) {
              this.currentInfoWindow.close();
            }
            this.currentInfoWindow = new google.maps.InfoWindow({
              content: popupHtml,
              maxWidth: 320
            });
            this.currentInfoWindow.open({
              anchor: marker,
              map: this.googleMap
            });
            this.googleMap.panTo(pos);
            this.loadLiveWeatherForPopup(spot.location_id, spot.latitude, spot.longitude);
          });
        } catch (advErr) {
          console.warn("AdvancedMarkerElement instance notice, fallback to Marker:", advErr);
          marker = null;
        }
      }

      if (!marker) {
        const svgIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
                </filter>
              </defs>
              <path d="M17 0 C7.6 0 0 7.6 0 17 C0 27.5 17 42 17 42 C17 42 34 27.5 34 17 C34 7.6 26.4 0 17 0 Z" fill="${pinColor}" filter="url(#shadow)"/>
              <circle cx="17" cy="16" r="11" fill="#0f172a"/>
              <text x="17" y="20" font-family="'JetBrains Mono', sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${score}</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(isCompact ? 20 : 34, isCompact ? 25 : 42),
          anchor: new google.maps.Point(isCompact ? 10 : 17, isCompact ? 25 : 42)
        };

        marker = new google.maps.Marker({
          position: pos,
          map: this.areMarkersVisible ? this.googleMap : null,
          title: `${spot.road_name} (${spot.hotspot_tier} - ${score})`,
          icon: svgIcon,
          opacity: this.isHeatmapOn ? 0.7 : 1.0,
          visible: this.areMarkersVisible
        });

        marker.addListener("mouseover", () => {
          marker.setOpacity(1.0);
        });
        marker.addListener("mouseout", () => {
          marker.setOpacity(this.isHeatmapOn ? 0.7 : 1.0);
        });

        marker.addListener("click", () => {
          if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
          }
          this.currentInfoWindow = new google.maps.InfoWindow({
            content: popupHtml,
            maxWidth: 320
          });
          this.currentInfoWindow.open(this.googleMap, marker);
          this.googleMap.panTo(pos);
          this.loadLiveWeatherForPopup(spot.location_id, spot.latitude, spot.longitude);
        });
      }

      this.googleMarkers.set(spot.location_id, { marker, pos, popupHtml, spot });
      bounds.extend(pos);
    });
  }

  /**
   * Leaflet Hotspot Plotter (with Dynamic LOD Radar Dot Support)
   */
  plotLeafletHotspots(hotspots) {
    if (!this.leafletMap || !this.leafletMarkersLayer) return;

    this.leafletMarkersLayer.clearLayers();
    this.leafletMarkers.clear();

    if (!hotspots || hotspots.length === 0) return;

    const bounds = [];
    const currentZoom = this.leafletMap.getZoom() || this.savedZoom;
    const isCompact = currentZoom <= 7;

    hotspots.forEach(spot => {
      if (!spot.latitude || !spot.longitude) return;

      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const tierClass = `tier-${(spot.hotspot_tier || 'Low').toLowerCase()}`;
      const isCritical = spot.hotspot_tier === 'Critical';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker-wrapper',
        html: `
          <div class="custom-hotspot-marker ${tierClass} ${isCompact ? 'compact-dot' : ''}">
            ${isCritical ? '<div class="marker-pulse"></div>' : ''}
            <div class="marker-pin">
              <span class="marker-pin-inner">${Math.round(spot.hotspot_score || 0)}</span>
            </div>
          </div>
        `,
        iconSize: isCompact ? [18, 18] : [32, 32],
        iconAnchor: isCompact ? [9, 9] : [16, 32],
        popupAnchor: isCompact ? [0, -10] : [0, -32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      const popupHtml = this.generatePopupHtml(spot);
      marker.bindPopup(popupHtml, { maxWidth: 320, className: 'custom-hotspot-popup' });

      marker.on('click', () => {
        this.leafletMap.panTo([lat, lng]);
      });

      marker.on('popupopen', () => {
        this.loadLiveWeatherForPopup(spot.location_id, spot.latitude, spot.longitude);
      });

      this.leafletMarkersLayer.addLayer(marker);
      this.leafletMarkers.set(spot.location_id, marker);
      bounds.push([lat, lng]);
    });

    if (!this.areMarkersVisible && this.leafletMap.hasLayer(this.leafletMarkersLayer)) {
      this.leafletMap.removeLayer(this.leafletMarkersLayer);
    }
  }

  /**
   * Generates formatted Section 9 compliant popup card
   */
  generatePopupHtml(spot) {
    const formattedDate = spot.last_accident_date
      ? new Date(spot.last_accident_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "Not Recorded";

    const tier = spot.hotspot_tier || "Low";
    const tierBadgeClass = `badge-${tier.toLowerCase()}`;
    const latNum = parseFloat(spot.latitude);
    const lngNum = parseFloat(spot.longitude);
    const exactCoordsText = (!isNaN(latNum) && !isNaN(lngNum))
      ? `${latNum.toFixed(6)}° N, ${lngNum.toFixed(6)}° E`
      : "GPS Coordinates Under Survey";
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
    const chainageText = spot.locality && spot.locality.includes("Km")
      ? spot.locality.substring(spot.locality.indexOf("Km"))
      : (spot.locality || "Survey Pillar");

    return `
      <div class="hotspot-popup-card">
        <div class="hotspot-popup-header">
          <span class="hotspot-popup-title">ACCIDENT HOTSPOT</span>
          <span class="badge ${tierBadgeClass}">${tier} Risk</span>
        </div>
        <div class="hotspot-popup-body">
          <div class="popup-location-block">
            <h4>${spot.road_name || 'Highway Corridor'}</h4>
            <p>${spot.locality ? spot.locality + ', ' : ''}${spot.district_name || ''}, ${spot.state_name || ''}</p>
          </div>

          <!-- Exact Survey-Grade Geodetic Coordinates Card -->
          <div class="popup-exact-location-card">
            <div class="popup-coords-row">
              <div class="coords-pill">
                <span class="coords-icon">🎯</span>
                <span class="coords-text">${exactCoordsText}</span>
              </div>
              <button type="button" class="btn-copy-coords" onclick="window.copyExactCoordinates(${latNum}, ${lngNum}, event, this)" title="Copy exact GPS coordinates to clipboard">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy GPS</span>
              </button>
            </div>
            <div class="popup-coords-meta">
              <span><strong>Datum:</strong> WGS-84 (EPSG:4326)</span>
              <span><strong>Chainage:</strong> ${chainageText}</span>
            </div>
            <div class="popup-external-links">
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-action-btn btn-gmaps" onclick="window.openGoogleMapsLocation(${latNum}, ${lngNum}, event, this)" title="Open exact satellite pin on Google Maps">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Google Maps
              </a>
              <button type="button" class="popup-action-btn btn-zoom-in" onclick="window.zoomToExactBlackspot(${latNum}, ${lngNum}, event, this)" title="Fly in to road level (17x)">
                🔍 Road View (17x)
              </button>
            </div>
          </div>

          <div class="popup-stats-row">
            <div class="popup-stat-item">
              <div class="stat-label">Total</div>
              <div class="stat-num">${spot.total_accidents || 0}</div>
            </div>
            <div class="popup-stat-item">
              <div class="stat-label">Deaths</div>
              <div class="stat-num stat-deaths">${spot.total_deaths || 0}</div>
            </div>
            <div class="popup-stat-item">
              <div class="stat-label">Injured</div>
              <div class="stat-num stat-injured">${spot.total_injuries || 0}</div>
            </div>
          </div>

          <div class="popup-meta-list">
            <div class="popup-meta-row">
              <span class="meta-lbl">Corridor / No.</span>
              <span class="meta-val" style="font-weight:700; color:#93c5fd;">${spot.road_number || 'N/A'}</span>
            </div>
            <div class="popup-meta-row">
              <span class="meta-lbl">Common Cause</span>
              <span class="meta-val">${spot.dominant_cause || 'N/A'}</span>
            </div>
            <div class="popup-meta-row">
              <span class="meta-lbl">Dominant Vehicle</span>
              <span class="meta-val">${spot.dominant_vehicle || 'Heavy Commercial'}</span>
            </div>
            <div class="popup-meta-row">
              <span class="meta-lbl">Official Source</span>
              <span class="meta-val" style="font-size:0.7rem;">${spot.primary_source || 'MoRTH'}</span>
            </div>
          </div>

          <div class="hotspot-score-box">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">Calculated Hotspot Score</span>
            <span class="hotspot-score-num" style="color:${this.getScoreColor(spot.hotspot_score)}">${spot.hotspot_score || 0}</span>
          </div>

          <div class="popup-live-weather-card">
            <div class="popup-weather-header">
              <span class="pulse-radar-dot"></span>
              <strong>Live Atmospheric Risk (Open-Meteo)</strong>
            </div>
            <div id="live-weather-box-${spot.location_id}" class="popup-weather-data">
              <span style="color:#94a3b8; font-size:0.7rem;">Connecting satellite & atmospheric radar...</span>
            </div>
          </div>
        </div>

        <div class="hotspot-popup-footer">
          <span>Last Recorded:</span>
          <strong>${formattedDate}</strong>
        </div>
      </div>
    `;
  }

  loadLiveWeatherForPopup(locId, lat, lng) {
    setTimeout(async () => {
      const box = document.getElementById(`live-weather-box-${locId}`);
      if (!box || !window.liveDataService) return;
      try {
        const w = await window.liveDataService.fetchLiveAtmosphericRisk(lat, lng);
        if (w) {
          box.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:700; color:#f8fafc; font-size:0.8rem;">🌡️ ${w.temperature}°C &nbsp;•&nbsp; 💧 ${w.humidity}% RH</span>
              <span style="font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(0,0,0,0.4); color:${w.conditionColor || '#38bdf8'}; border:1px solid ${w.conditionColor || '#38bdf8'}40;">${w.condition}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#94a3b8;">
              <span>💨 Wind: ${w.windSpeed} km/h</span>
              <span>👁️ Visibility: ${w.visibilityKm} km</span>
              <span>🕒 Live</span>
            </div>
          `;
        }
      } catch (_) {
        box.innerHTML = `<span style="color:#94a3b8; font-size:0.68rem;">Live atmospheric sensors standing by.</span>`;
      }
    }, 100);
  }

  getScoreColor(score) {
    if (score >= 75) return "#ef4444";
    if (score >= 50) return "#f97316";
    if (score >= 25) return "#eab308";
    return "#3b82f6";
  }

  /**
   * Smoothly pans to coordinates for real-time GIS event streaming
   */
  flyToCoords(lat, lng, zoomLevel = 14) {
    this.zoomToExactCoordinates(lat, lng, zoomLevel);
  }

  /**
   * Directly zooms and pans to precise coordinates with high-resolution LOD
   */
  zoomToExactCoordinates(lat, lng, zoomLevel = 17) {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;

    if (this.currentProvider === "google" && this.googleMap) {
      this.googleMap.panTo({ lat: numLat, lng: numLng });
      this.googleMap.setZoom(zoomLevel);
    } else if (this.leafletMap) {
      this.leafletMap.flyTo([numLat, numLng], zoomLevel, { duration: 1.2 });
    }

    this.pulseHighlightTarget(numLat, numLng);
    this.updateTelemetryCoordinates(numLat, numLng);
  }

  /**
   * Pings an animated neon target reticle on the focused location
   */
  pulseHighlightTarget(lat, lng) {
    const mapEl = document.getElementById(this.elementId);
    if (!mapEl) return;

    const existing = document.getElementById("activeTargetReticle");
    if (existing) existing.remove();

    const reticle = document.createElement("div");
    reticle.id = "activeTargetReticle";
    reticle.className = "exact-target-reticle";
    reticle.style.left = "50%";
    reticle.style.top = "50%";
    mapEl.appendChild(reticle);

    setTimeout(() => {
      if (reticle.parentNode) reticle.remove();
    }, 3600);
  }

  /**
   * Smoothly pans and focuses on a hotspot with Survey-Grade Exactness (Zoom 16.5)
   */
  focusLocation(locationId) {
    if (!locationId) return;

    // Check if locationId is raw coordinates: e.g. "11.9612, 78.0723"
    if (typeof locationId === "string" && locationId.includes(",")) {
      const parts = locationId.split(",");
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        this.zoomToExactCoordinates(lat, lng, 16.5);
        return;
      }
    }

    // Canonical & shorthand alias dictionary
    const aliases = {
      "loc-up-yamuna-m88": "loc-up-yamuna-mathura",
      "loc-ka-mysuru-exp-ramanagara": "loc-ka-bengaluru-mysuru-ramanagara",
      "loc-jh-koderma-ghat": "loc-jh-koderma-valley",
      "loc-rj-dudu-nh48": "loc-rj-jaipur-kishangarh",
      "loc-or-rasulgarh-chowk": "loc-or-cuttack-rasulgarh",
      "loc-or-rasulgarh-square": "loc-or-cuttack-rasulgarh",
      "loc-ap-madhurawada-nh16": "loc-ap-vizag-nh16",
      "loc-ka-blr-ecity-elevated": "loc-ka-electronic-city",
      "loc-tg-hyd-orr-patancheru": "loc-ts-orr-shamshabad",
      "loc-tn-chennai-ecr": "loc-tn-ecr-mahabalipuram",
      "loc-mh-pune-satara-katraj": "loc-mh-navale-bridge",
      "gis-nh48-katraj-tunnel": "loc-mh-navale-bridge"
    };

    const targetId = aliases[locationId] || locationId;
    const targetZoom = 16.5; // High precision road/interchange level

    if (this.currentProvider === "google" && this.googleMap) {
      let data = this.googleMarkers.get(locationId) || this.googleMarkers.get(targetId);
      
      // If not directly found, fuzzy search all plotted markers
      if (!data) {
        const query = locationId.replace(/^loc-[a-z]+-/, "").replace(/-/g, " ").toLowerCase();
        for (const [id, markerData] of this.googleMarkers.entries()) {
          const s = markerData.spot || {};
          const hay = `${id} ${s.road_name || ""} ${s.locality || ""} ${s.city || ""} ${s.district_name || ""} ${s.state_name || ""}`.toLowerCase();
          if (hay.includes(query) || (query.length > 3 && query.split(" ").some(w => w.length > 3 && hay.includes(w)))) {
            data = markerData;
            break;
          }
        }
      }

      if (data) {
        this.googleMap.panTo(data.pos);
        this.googleMap.setZoom(targetZoom);
        if (this.currentInfoWindow) {
          this.currentInfoWindow.close();
        }
        this.currentInfoWindow = new google.maps.InfoWindow({
          content: data.popupHtml,
          maxWidth: 340
        });
        if (data.marker && data.marker.map !== undefined) {
          this.currentInfoWindow.open({
            anchor: data.marker,
            map: this.googleMap
          });
        } else {
          this.currentInfoWindow.open(this.googleMap, data.marker);
        }
        if (data.spot) {
          this.loadLiveWeatherForPopup(data.spot.location_id, data.spot.latitude, data.spot.longitude);
          this.updateTelemetryCoordinates(data.spot.latitude, data.spot.longitude);
        }
        this.pulseHighlightTarget(data.pos.lat, data.pos.lng);
      }
    } else if (this.leafletMap) {
      let marker = this.leafletMarkers.get(locationId) || this.leafletMarkers.get(targetId);
      
      if (!marker) {
        const query = locationId.replace(/^loc-[a-z]+-/, "").replace(/-/g, " ").toLowerCase();
        for (const [id, m] of this.leafletMarkers.entries()) {
          const s = m.spot || {};
          const hay = `${id} ${s.road_name || ""} ${s.locality || ""} ${s.city || ""}`.toLowerCase();
          if (hay.includes(query) || (query.length > 3 && query.split(" ").some(w => w.length > 3 && hay.includes(w)))) {
            marker = m;
            break;
          }
        }
      }

      if (marker) {
        const pos = marker.getLatLng();
        this.leafletMap.flyTo(pos, targetZoom, { duration: 1.2 });
        marker.openPopup();
        if (marker.spot) {
          this.updateTelemetryCoordinates(marker.spot.latitude, marker.spot.longitude);
        }
        this.pulseHighlightTarget(pos.lat, pos.lng);
      }
    }
  }

  /**
   * Resets map view to all-India perspective
   */
  resetView() {
    this.savedCenter = CONFIG.MAP.INITIAL_CENTER;
    this.savedZoom = CONFIG.MAP.INITIAL_ZOOM;

    if (this.currentProvider === "google" && this.googleMap) {
      this.googleMap.panTo({ lat: CONFIG.MAP.INITIAL_CENTER[0], lng: CONFIG.MAP.INITIAL_CENTER[1] });
      this.googleMap.setZoom(CONFIG.MAP.INITIAL_ZOOM);
    } else if (this.leafletMap) {
      this.leafletMap.flyTo(CONFIG.MAP.INITIAL_CENTER, CONFIG.MAP.INITIAL_ZOOM, { duration: 1 });
    }
  }

  updateEngineUiBadge() {
    const badge = document.getElementById("activeMapEngineLabel");
    if (badge) {
      const providerNames = {
        google: "Google Maps Platform",
        carto: "CARTO / OpenStreetMap",
        esri: "ESRI ArcGIS World",
        opentopo: "OpenTopoMap"
      };
      badge.textContent = providerNames[this.currentProvider] || this.currentProvider;
    }

    const select = document.getElementById("selectMapProvider");
    if (select && select.value !== this.currentProvider) {
      select.value = this.currentProvider;
    }
  }

  updateModeUiButtons() {
    const chips = document.querySelectorAll(".mode-chip");
    chips.forEach(chip => {
      const mode = chip.getAttribute("data-mode");
      chip.classList.toggle("active", mode === this.currentMode);
    });

    const btnHeatmap = document.getElementById("btnToggleHeatmap");
    if (btnHeatmap) {
      btnHeatmap.classList.toggle("active", this.isHeatmapOn);
    }

    const btnTraffic = document.getElementById("btnToggleTraffic");
    if (btnTraffic) {
      btnTraffic.classList.toggle("active", this.isTrafficOn);
    }

    const btnMarkers = document.getElementById("btnToggleMarkers");
    if (btnMarkers) {
      btnMarkers.classList.toggle("active", this.areMarkersVisible);
    }

    const btnSpeed = document.getElementById("btnToggleSpeedCameras");
    if (btnSpeed) {
      btnSpeed.classList.toggle("active", this.isSpeedCamerasOn);
    }

    const btnGhats = document.getElementById("btnToggleGhats");
    if (btnGhats) {
      btnGhats.classList.toggle("active", this.isHazardousGhatsOn);
    }

    const btnBuffers = document.getElementById("btnToggleRiskBuffers");
    if (btnBuffers) {
      btnBuffers.classList.toggle("active", this.isRiskBuffersOn);
    }

    const btn3D = document.getElementById("btnToggle3D");
    if (btn3D) {
      btn3D.classList.toggle("active", this.is3DMode);
    }
  }

  // ==========================================================================
  // HIGHWAY SPEED CAMERAS & RADAR INTERCEPTORS
  // ==========================================================================
  async loadAndRenderSpeedCameras() {
    try {
      if (!this.speedCamerasData || this.speedCamerasData.length === 0) {
        if (window.accidentService && typeof window.accidentService.getSpeedCameras === "function") {
          this.speedCamerasData = await window.accidentService.getSpeedCameras();
        }
      }

      if (!this.speedCamerasData || this.speedCamerasData.length === 0) return;

      if (this.currentProvider === "google" && this.googleMap) {
        this.renderGoogleSpeedCameras();
      } else if (this.leafletMap) {
        this.renderLeafletSpeedCameras();
      }
    } catch (err) {
      console.warn("Notice loading speed cameras:", err);
    }
  }

  renderGoogleSpeedCameras() {
    this.googleSpeedCameraMarkers.forEach(m => m.setMap(null));
    this.googleSpeedCameraMarkers = [];

    if (!this.isSpeedCamerasOn || !this.googleMap || !this.speedCamerasData) return;

    this.speedCamerasData.forEach(cam => {
      const lat = parseFloat(cam.latitude);
      const lng = parseFloat(cam.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const svgCamera = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#6366f1" stroke="#ffffff" stroke-width="2"/>
            <path d="M9 13h2l1.5-2h7l1.5 2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="#ffffff"/>
            <circle cx="16" cy="19" r="3.5" fill="#6366f1"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14)
      };

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.googleMap,
        title: `${cam.location_name} (Speed Limit: ${cam.speed_limit_kmh} km/h)`,
        icon: svgCamera
      });

      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px; color:#0f172a; min-width:250px;">
          <div style="font-size:0.72rem; text-transform:uppercase; color:#6366f1; font-weight:700; margin-bottom:4px;">
            📹 Radar Interceptor & Speed Camera
          </div>
          <div style="font-size:0.95rem; font-weight:800; color:#0f172a; margin-bottom:4px;">
            ${cam.location_name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#334155; margin-bottom:6px;">
            <strong>Highway:</strong> ${cam.highway} &bull; <strong>State:</strong> ${cam.state}<br>
            <strong>Enforcement Type:</strong> ${cam.type}<br>
            <strong>Radar Direction:</strong> ${cam.direction}<br>
            <strong>Camera Status:</strong> <span style="color:#10b981; font-weight:700;">● ${cam.status}</span>
          </div>
          <div style="font-size:0.82rem; background:#fee2e2; color:#991b1b; padding:5px 8px; border-radius:6px; font-weight:800; text-align:center;">
            🛑 Monitored Speed Limit: ${cam.speed_limit_kmh} km/h
          </div>
        </div>
      `;

      marker.addListener("click", () => {
        if (this.currentInfoWindow) this.currentInfoWindow.close();
        this.currentInfoWindow = new google.maps.InfoWindow({
          content: popupHtml,
          position: { lat, lng },
          maxWidth: 300
        });
        this.currentInfoWindow.open(this.googleMap);
      });

      this.googleSpeedCameraMarkers.push(marker);
    });
  }

  renderLeafletSpeedCameras() {
    if (this.leafletSpeedCameraLayer) {
      this.leafletMap.removeLayer(this.leafletSpeedCameraLayer);
      this.leafletSpeedCameraLayer = null;
    }

    if (!this.isSpeedCamerasOn || !this.leafletMap || !this.speedCamerasData) return;

    this.leafletSpeedCameraLayer = L.layerGroup();

    this.speedCamerasData.forEach(cam => {
      const lat = parseFloat(cam.latitude);
      const lng = parseFloat(cam.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const camIcon = L.divIcon({
        className: "custom-leaflet-camera-wrapper",
        html: `
          <div style="width:26px; height:26px; border-radius:50%; background:#6366f1; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.4); cursor:pointer;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([lat, lng], { icon: camIcon });
      const popupContent = `
        <div style="padding:4px; min-width:240px;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#818cf8; font-weight:700; margin-bottom:3px;">
            📹 Radar Interceptor & Speed Camera
          </div>
          <div style="font-size:0.92rem; font-weight:800; color:#f8fafc; margin-bottom:4px;">
            ${cam.location_name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#cbd5e1; margin-bottom:6px;">
            <strong>Highway:</strong> ${cam.highway} &bull; <strong>State:</strong> ${cam.state}<br>
            <strong>Enforcement Type:</strong> ${cam.type}<br>
            <strong>Radar Direction:</strong> ${cam.direction}
          </div>
          <div style="font-size:0.8rem; background:#dc2626; color:#ffffff; padding:5px 8px; border-radius:6px; font-weight:800; text-align:center;">
            🛑 Speed Limit: ${cam.speed_limit_kmh} km/h
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300, className: "custom-hotspot-popup" });
      this.leafletSpeedCameraLayer.addLayer(marker);
    });

    this.leafletSpeedCameraLayer.addTo(this.leafletMap);
  }

  toggleSpeedCameras() {
    this.isSpeedCamerasOn = !this.isSpeedCamerasOn;
    if (this.isSpeedCamerasOn) {
      this.loadAndRenderSpeedCameras();
    } else {
      this.googleSpeedCameraMarkers.forEach(m => m.setMap(null));
      this.googleSpeedCameraMarkers = [];
      if (this.leafletSpeedCameraLayer && this.leafletMap) {
        this.leafletMap.removeLayer(this.leafletSpeedCameraLayer);
        this.leafletSpeedCameraLayer = null;
      }
    }
    const btn = document.getElementById("btnToggleSpeedCameras");
    if (btn) btn.classList.toggle("active", this.isSpeedCamerasOn);
    return this.isSpeedCamerasOn;
  }

  // ==========================================================================
  // HAZARDOUS MOUNTAIN GHATS & HAIRPIN BENDS
  // ==========================================================================
  async loadAndRenderHazardousGhats() {
    try {
      if (!this.hazardousGhatsData || this.hazardousGhatsData.length === 0) {
        if (window.accidentService && typeof window.accidentService.getHazardousGhats === "function") {
          this.hazardousGhatsData = await window.accidentService.getHazardousGhats();
        }
      }

      if (!this.hazardousGhatsData || this.hazardousGhatsData.length === 0) return;

      if (this.currentProvider === "google" && this.googleMap) {
        this.renderGoogleHazardousGhats();
      } else if (this.leafletMap) {
        this.renderLeafletHazardousGhats();
      }
    } catch (err) {
      console.warn("Notice loading hazardous ghats:", err);
    }
  }

  renderGoogleHazardousGhats() {
    this.googleHazardousGhatMarkers.forEach(m => m.setMap(null));
    this.googleHazardousGhatMarkers = [];

    if (!this.isHazardousGhatsOn || !this.googleMap || !this.hazardousGhatsData) return;

    this.hazardousGhatsData.forEach(ghat => {
      const lat = parseFloat(ghat.latitude);
      const lng = parseFloat(ghat.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const svgMountain = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <polygon points="16,4 30,28 2,28" fill="#d97706" stroke="#ffffff" stroke-width="2"/>
            <polygon points="16,11 23,24 9,24" fill="#ffffff" opacity="0.9"/>
            <line x1="16" y1="18" x2="16" y2="20" stroke="#d97706" stroke-width="2"/>
            <circle cx="16" cy="22" r="1" fill="#d97706"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15)
      };

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.googleMap,
        title: `${ghat.name} (${ghat.hairpin_bends} Hairpins - ${ghat.gradient_pct}% Gradient)`,
        icon: svgMountain
      });

      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px; color:#0f172a; min-width:260px;">
          <div style="font-size:0.72rem; text-transform:uppercase; color:#d97706; font-weight:700; margin-bottom:4px;">
            ⛰️ Hazardous Mountain Ghat & Hairpin Pass
          </div>
          <div style="font-size:0.95rem; font-weight:800; color:#0f172a; margin-bottom:4px;">
            ${ghat.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#334155; margin-bottom:6px;">
            <strong>Highway:</strong> ${ghat.highway} &bull; <strong>State:</strong> ${ghat.state}<br>
            <strong>Elevation:</strong> ${ghat.elevation_m}m &bull; <strong>Length:</strong> ${ghat.length_km} km<br>
            <strong>Steep Gradient:</strong> <span style="color:#dc2626; font-weight:700;">${ghat.gradient_pct}% slope</span><br>
            <strong>Sharp Hairpin Bends:</strong> <span style="font-weight:700;">${ghat.hairpin_bends} hairpin curves</span><br>
            <strong>Risk Warning:</strong> ${ghat.hazard_description}
          </div>
          <div style="font-size:0.72rem; background:#fef3c7; color:#92400e; padding:5px 8px; border-radius:6px; font-weight:700;">
            ⚠️ Runaway Escape Ramp: ${ghat.escape_ramp_available ? "Installed at Descent Base" : "Not Available — Use Engine Braking"}
          </div>
        </div>
      `;

      marker.addListener("click", () => {
        if (this.currentInfoWindow) this.currentInfoWindow.close();
        this.currentInfoWindow = new google.maps.InfoWindow({
          content: popupHtml,
          position: { lat, lng },
          maxWidth: 320
        });
        this.currentInfoWindow.open(this.googleMap);
      });

      this.googleHazardousGhatMarkers.push(marker);
    });
  }

  renderLeafletHazardousGhats() {
    if (this.leafletHazardousGhatLayer) {
      this.leafletMap.removeLayer(this.leafletHazardousGhatLayer);
      this.leafletHazardousGhatLayer = null;
    }

    if (!this.isHazardousGhatsOn || !this.leafletMap || !this.hazardousGhatsData) return;

    this.leafletHazardousGhatLayer = L.layerGroup();

    this.hazardousGhatsData.forEach(ghat => {
      const lat = parseFloat(ghat.latitude);
      const lng = parseFloat(ghat.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const ghatIcon = L.divIcon({
        className: "custom-leaflet-ghat-wrapper",
        html: `
          <div style="width:28px; height:28px; border-radius:6px; background:#d97706; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.5); cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: ghatIcon });
      const popupContent = `
        <div style="padding:4px; min-width:240px;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#fbbf24; font-weight:700; margin-bottom:3px;">
            ⛰️ Hazardous Mountain Ghat & Hairpin Pass
          </div>
          <div style="font-size:0.92rem; font-weight:800; color:#f8fafc; margin-bottom:4px;">
            ${ghat.name}
          </div>
          <div style="font-size:0.78rem; line-height:1.45; color:#cbd5e1; margin-bottom:6px;">
            <strong>Highway:</strong> ${ghat.highway} &bull; <strong>State:</strong> ${ghat.state}<br>
            <strong>Steep Gradient:</strong> ${ghat.gradient_pct}% slope<br>
            <strong>Hairpin Bends:</strong> ${ghat.hairpin_bends} curves<br>
            <strong>Risk Warning:</strong> ${ghat.hazard_description}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300, className: "custom-hotspot-popup" });
      this.leafletHazardousGhatLayer.addLayer(marker);
    });

    this.leafletHazardousGhatLayer.addTo(this.leafletMap);
  }

  toggleHazardousGhats() {
    this.isHazardousGhatsOn = !this.isHazardousGhatsOn;
    if (this.isHazardousGhatsOn) {
      this.loadAndRenderHazardousGhats();
    } else {
      this.googleHazardousGhatMarkers.forEach(m => m.setMap(null));
      this.googleHazardousGhatMarkers = [];
      if (this.leafletHazardousGhatLayer && this.leafletMap) {
        this.leafletMap.removeLayer(this.leafletHazardousGhatLayer);
        this.leafletHazardousGhatLayer = null;
      }
    }
    const btn = document.getElementById("btnToggleGhats");
    if (btn) btn.classList.toggle("active", this.isHazardousGhatsOn);
    return this.isHazardousGhatsOn;
  }

  // ==========================================================================
  // DANGER BUFFER IMPACT RADIUS (5km High Impact / 12km Alert Circles)
  // ==========================================================================
  renderGoogleRiskBuffers() {
    this.googleRiskCircles.forEach(c => c.setMap(null));
    this.googleRiskCircles = [];

    if (!this.isRiskBuffersOn || !this.googleMap || !this.hotspots) return;

    this.hotspots.forEach(spot => {
      if (spot.hotspot_tier !== "Critical" && spot.hotspot_tier !== "High") return;

      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isCritical = spot.hotspot_tier === "Critical";
      const color = isCritical ? "#ef4444" : "#f59e0b";

      const innerCircle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: color,
        fillOpacity: isCritical ? 0.22 : 0.14,
        map: this.googleMap,
        center: { lat, lng },
        radius: 5000
      });

      const outerCircle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.35,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 0.05,
        map: this.googleMap,
        center: { lat, lng },
        radius: 12000
      });

      this.googleRiskCircles.push(innerCircle, outerCircle);
    });
  }

  renderLeafletRiskBuffers() {
    if (this.leafletRiskCirclesLayer) {
      this.leafletMap.removeLayer(this.leafletRiskCirclesLayer);
      this.leafletRiskCirclesLayer = null;
    }

    if (!this.isRiskBuffersOn || !this.leafletMap || !this.hotspots) return;

    this.leafletRiskCirclesLayer = L.layerGroup();

    this.hotspots.forEach(spot => {
      if (spot.hotspot_tier !== "Critical" && spot.hotspot_tier !== "High") return;

      const lat = parseFloat(spot.latitude);
      const lng = parseFloat(spot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isCritical = spot.hotspot_tier === "Critical";
      const color = isCritical ? "#ef4444" : "#f59e0b";

      const innerCircle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: isCritical ? 0.2 : 0.12,
        radius: 5000,
        weight: 1.5
      });

      const outerCircle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.05,
        radius: 12000,
        weight: 1
      });

      this.leafletRiskCirclesLayer.addLayer(innerCircle);
      this.leafletRiskCirclesLayer.addLayer(outerCircle);
    });

    this.leafletRiskCirclesLayer.addTo(this.leafletMap);
  }

  toggleRiskBuffers() {
    this.isRiskBuffersOn = !this.isRiskBuffersOn;
    if (this.currentProvider === "google" && this.googleMap) {
      this.renderGoogleRiskBuffers();
    } else if (this.leafletMap) {
      this.renderLeafletRiskBuffers();
    }
    const btn = document.getElementById("btnToggleRiskBuffers");
    if (btn) btn.classList.toggle("active", this.isRiskBuffersOn);
    return this.isRiskBuffersOn;
  }

  // ==========================================================================
  // 3D OBLIQUE PERSPECTIVE TILT (45° VIEW)
  // ==========================================================================
  toggle3DTilt() {
    this.is3DMode = !this.is3DMode;

    if (this.currentProvider === "google" && this.googleMap) {
      if (this.is3DMode) {
        this.googleMap.setTilt(45);
        this.googleMap.setHeading(35);
      } else {
        this.googleMap.setTilt(0);
        this.googleMap.setHeading(0);
      }
    }

    const btn = document.getElementById("btnToggle3D");
    if (btn) btn.classList.toggle("active", this.is3DMode);

    const hudPitch = document.getElementById("telemetryBearing");
    if (hudPitch) {
      hudPitch.textContent = this.is3DMode ? "45° 3D" : "0° Nadir";
    }
    return this.is3DMode;
  }

  // ==========================================================================
  // FULLSCREEN TOGGLE
  // ==========================================================================
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // ==========================================================================
  // REAL-TIME TELEMETRY COORDINATES & MAP PARAMETERS HUD
  // ==========================================================================
  updateTelemetryCoordinates(lat, lng) {
    const coordsEl = document.getElementById("telemetryCoords");
    if (coordsEl && typeof lat === "number" && typeof lng === "number") {
      coordsEl.textContent = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
    }

    const zoomEl = document.getElementById("telemetryZoom");
    if (zoomEl) {
      const currentZoom = (this.currentProvider === "google" && this.googleMap) 
        ? Math.round(this.googleMap.getZoom()) 
        : (this.leafletMap ? Math.round(this.leafletMap.getZoom()) : this.savedZoom);
      zoomEl.textContent = `${currentZoom || this.savedZoom}x`;
    }
  }
}

// Global Exact Location Utilities & Interaction Handlers
if (typeof window !== "undefined") {
  // Floating Toast Notification System
  window.showCoordinateToast = (message, icon = "🎯") => {
    try {
      if (typeof document === "undefined") return;
      let toast = document.getElementById("geodeticActionToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "geodeticActionToast";
        toast.className = "geodetic-toast";
        document.body.appendChild(toast);
      }
      toast.innerHTML = `<span class="geodetic-toast-icon">${icon}</span><span>${message}</span>`;
      toast.classList.add("show");
      if (window._toastTimeout) clearTimeout(window._toastTimeout);
      window._toastTimeout = setTimeout(() => {
        if (toast) toast.classList.remove("show");
      }, 3400);
    } catch (e) {
      console.warn("Toast notification warning:", e);
    }
  };

  // 1. Exact GPS Coordinates Copy Handler (Multi-Tier Iframe & Cross-Browser Safe)
  window.copyExactCoordinates = (lat, lng, event, btn) => {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;
    const text = `${numLat.toFixed(6)}, ${numLng.toFixed(6)}`;

    // Tier 1: Synchronous execCommand via hidden textarea (100% works inside sandboxed iframes)
    let copied = false;
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      copied = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (e) {
      copied = false;
    }

    // Tier 2: Modern Async Clipboard API fallback
    if (!copied && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        copied = true;
      }).catch(() => {});
    }

    // Button visual state update
    let targetBtn = (btn && btn !== window && btn.nodeType === 1) ? btn : null;
    if (!targetBtn && event) {
      if (event.currentTarget && event.currentTarget.nodeType === 1) {
        targetBtn = event.currentTarget;
      } else if (event.target && event.target.closest) {
        targetBtn = event.target.closest("button");
      }
    }
    if (targetBtn) {
      const originalHtml = targetBtn.innerHTML;
      targetBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span style="color:#10b981; font-weight:700;">Copied!</span>
      `;
      targetBtn.style.borderColor = "#10b981";
      targetBtn.style.background = "rgba(16, 185, 129, 0.25)";
      setTimeout(() => {
        if (targetBtn) {
          targetBtn.innerHTML = originalHtml;
          targetBtn.style.borderColor = "";
          targetBtn.style.background = "";
        }
      }, 2500);
    }

    window.showCoordinateToast(`GPS Coordinates Copied: ${text}`, "📋");
  };

  // 2. Open Google Maps Exact Pin in New Window / Tab
  window.openGoogleMapsLocation = (lat, lng, event, btn) => {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${numLat.toFixed(6)},${numLng.toFixed(6)}`;

    let opened = false;
    try {
      const w = window.open(gmapsUrl, "_blank", "noopener,noreferrer");
      if (w && !w.closed && typeof w.closed !== "undefined") {
        opened = true;
      }
    } catch (e) {
      opened = false;
    }

    if (!opened) {
      try {
        const a = document.createElement("a");
        a.href = gmapsUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        opened = true;
      } catch (e) {}
    }

    // Button visual state
    let targetBtn = (btn && btn !== window && btn.nodeType === 1) ? btn : null;
    if (!targetBtn && event) {
      if (event.currentTarget && event.currentTarget.nodeType === 1) targetBtn = event.currentTarget;
      else if (event.target && event.target.closest) targetBtn = event.target.closest(".popup-action-btn");
    }
    if (targetBtn) {
      const oldHtml = targetBtn.innerHTML;
      targetBtn.innerHTML = `<span style="color:#34d399; font-weight:700;">✓ Opening...</span>`;
      setTimeout(() => {
        if (targetBtn) targetBtn.innerHTML = oldHtml;
      }, 2000);
    }

    // Switch to satellite mode if in Google Maps provider
    const ctrl = window.mapCtrl || window.mapController;
    if (ctrl && ctrl.currentProvider === "google" && ctrl.googleMap) {
      ctrl.setMapMode("satellite");
    }

    window.showCoordinateToast(`Launching Google Maps: ${numLat.toFixed(5)}°, ${numLng.toFixed(5)}°`, "🛰️");
  };

  // 3. Road View (17x) Street & Corridor Level Zoom
  window.zoomToExactBlackspot = (lat, lng, event, btn) => {
    if (event) {
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      if (typeof event.preventDefault === "function") event.preventDefault();
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;

    const ctrl = window.mapCtrl || window.mapController;
    if (ctrl) {
      ctrl.zoomToExactCoordinates(numLat, numLng, 17);
    }

    // Button visual state feedback
    let targetBtn = (btn && btn !== window && btn.nodeType === 1) ? btn : null;
    if (!targetBtn && event) {
      if (event.currentTarget && event.currentTarget.nodeType === 1) targetBtn = event.currentTarget;
      else if (event.target && event.target.closest) targetBtn = event.target.closest(".popup-action-btn");
    }
    if (targetBtn) {
      const oldHtml = targetBtn.innerHTML;
      targetBtn.innerHTML = `🔍 <strong style="color:#38bdf8;">Zoomed 17x!</strong>`;
      targetBtn.style.borderColor = "#38bdf8";
      setTimeout(() => {
        if (targetBtn) {
          targetBtn.innerHTML = oldHtml;
          targetBtn.style.borderColor = "";
        }
      }, 2500);
    }

    window.showCoordinateToast(`Road View Focused (17x Zoom): ${numLat.toFixed(5)}°, ${numLng.toFixed(5)}°`, "🔍");
  };
}

window.MapController = MapController;
