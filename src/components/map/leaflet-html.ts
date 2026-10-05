import type { ColorSchemeName } from '@/constants/theme';
import type { LatLng } from '@/services/geocoding';

export const DEFAULT_CENTER: LatLng = { latitude: -23.5505, longitude: -46.6333 };

export const APP_MESSAGE_SOURCE = 'essarota-app';
export const MAP_MESSAGE_SOURCE = 'essarota-map';

/**
 * Self-contained Leaflet page shared by the native WebView and the web iframe.
 * Receives `MapInboundMessage` and emits `MapOutboundMessage` as JSON strings.
 */
export function createLeafletHtml(initialScheme: ColorSchemeName, background: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${background}; }
  .leaflet-container { font-family: system-ui, -apple-system, sans-serif; }
  .leaflet-bottom { bottom: 28px; }
  .leaflet-control-attribution { font-size: 10px; border-radius: 6px 0 0 6px; }
  .dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9) saturate(0.6); }
  .dark .leaflet-control-attribution { background: rgba(18, 18, 24, 0.8); color: #A4A6C4; }
  .dark .leaflet-control-attribution a { color: #9AA0FF; }
  .er-origin { width: 18px; height: 18px; border-radius: 50%; border: 4px solid; box-sizing: border-box;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); }
  .er-pin { width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
    border: 3px solid; box-sizing: border-box; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
    display: flex; align-items: center; justify-content: center; }
  .er-pin::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: currentColor; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

  function send(message) {
    var payload = JSON.stringify(message);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(payload);
    } else if (window.parent !== window) {
      window.parent.postMessage({ source: '${MAP_MESSAGE_SOURCE}', payload: payload }, '*');
    }
  }

  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}], 12);
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
  var currentScheme = null;
  var originMarker = null;
  var destinationMarker = null;
  var line = null;
  var lastPointsKey = '';

  function setScheme(scheme) {
    if (scheme === currentScheme) return;
    currentScheme = scheme;
    document.body.classList.toggle('dark', scheme === 'dark');
  }

  function originIcon(colors) {
    return L.divIcon({
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: '<div class="er-origin" style="background:' + colors.origin + ';border-color:' + colors.markerBorder + '"></div>'
    });
  }

  function destinationIcon(colors) {
    return L.divIcon({
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      html: '<div class="er-pin" style="background:' + colors.destination + ';border-color:' + colors.markerBorder + ';color:' + colors.markerBorder + '"></div>'
    });
  }

  function placeMarker(marker, point, icon) {
    if (!point) {
      if (marker) map.removeLayer(marker);
      return null;
    }
    var latLng = [point.latitude, point.longitude];
    if (marker) {
      marker.setLatLng(latLng).setIcon(icon);
      return marker;
    }
    return L.marker(latLng, { icon: icon, keyboard: false }).addTo(map);
  }

  function update(state) {
    setScheme(state.scheme);
    originMarker = placeMarker(originMarker, state.origin, originIcon(state.colors));
    destinationMarker = placeMarker(destinationMarker, state.destination, destinationIcon(state.colors));

    if (line) { map.removeLayer(line); line = null; }
    if (state.origin && state.destination) {
      line = L.polyline(
        [[state.origin.latitude, state.origin.longitude], [state.destination.latitude, state.destination.longitude]],
        { color: state.colors.line, weight: 4, opacity: 0.9, dashArray: '2 10', lineCap: 'round' }
      ).addTo(map);
    }

    var pointsKey = JSON.stringify([state.origin, state.destination]);
    if (pointsKey === lastPointsKey) return;
    lastPointsKey = pointsKey;

    if (state.origin && state.destination) {
      map.flyToBounds(L.latLngBounds(
        [state.origin.latitude, state.origin.longitude],
        [state.destination.latitude, state.destination.longitude]
      ), { paddingTopLeft: [48, 80], paddingBottomRight: [48, 64], maxZoom: 16, duration: 0.8 });
    } else if (state.origin || state.destination) {
      var point = state.origin || state.destination;
      map.flyTo([point.latitude, point.longitude], 15, { duration: 0.8 });
    }
  }

  function receive(message) {
    if (message && message.type === 'update') update(message.state);
  }

  window.__essarotaReceive = receive;
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (data && data.source === '${APP_MESSAGE_SOURCE}') receive(JSON.parse(data.payload));
  });

  map.on('click', function (event) {
    send({ type: 'press', latitude: event.latlng.lat, longitude: event.latlng.lng });
  });

  setScheme('${initialScheme}');
  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
