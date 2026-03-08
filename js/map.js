const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDCNkkwM5InE1aDFRrMOC7qdElnsMCQ5uoxsIg4WnpIizZcrV0WdUYZDMYxSi30JHdexfl-6AJIgY8/pub?output=csv';

const map = L.map('map').setView([-5.1477, 119.4327], 14);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO'
}).addTo(map);

let allPlaces = [];
let markers = {};

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') { insideQuote = !insideQuote; }
        else if (char === ',' && !insideQuote) { result.push(current); current = ''; }
        else { current += char; }
    }
    result.push(current);
    return result;
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
        return obj;
    });
}

function getMarkerColor(type) {
    return type === 'Cafe' ? '#e65100' : '#2e7d32';
}

function createMarkerIcon(type) {
    const color = getMarkerColor(type);
    return L.divIcon({
        className: '',
        html: `<div style="
      background:${color};
      width:14px; height:14px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3)
    "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}

async function loadPlaces() {
    const response = await fetch(SHEET_URL);
    const text = await response.text();
    allPlaces = parseCSV(text);
    renderAll(allPlaces);
}

function renderAll(places) {
    // Clear existing markers
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    places.forEach((place, index) => {
        const lat = parseFloat(place['Lat']);
        const lng = parseFloat(place['Lng']);
        if (isNaN(lat) || isNaN(lng)) return;

        const marker = L.marker([lat, lng], { icon: createMarkerIcon(place['Type']) })
            .addTo(map);

        marker.on('click', () => selectPlace(index));
        markers[index] = marker;
    });

    renderList(places);
}

function selectPlace(index) {
    const place = allPlaces[index];
    map.setView([parseFloat(place['Lat']), parseFloat(place['Lng'])], 16);
    showDetail(place);

    // Highlight card
    document.querySelectorAll('.place-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`[data-index="${index}"]`);
    if (card) card.classList.add('active');
}

function renderList(places) {
    const list = document.getElementById('place-list');
    list.innerHTML = '';
    places.forEach((place, index) => {
        const originalIndex = allPlaces.indexOf(place);
        const card = document.createElement('div');
        card.className = 'place-card';
        card.dataset.index = originalIndex;
        card.innerHTML = `
      <div class="place-card-name">${place['Name']}</div>
      <div class="place-card-meta">
        <span class="badge badge-${place['Type'].toLowerCase()}">${place['Type']}</span>
      </div>
      <div class="place-card-address">${place['Alamat']}</div>
    `;
        card.addEventListener('click', () => selectPlace(originalIndex));
        list.appendChild(card);
    });
}

function keramaianClass(val) {
    if (val === 'Sepi') return 'keramaian-sepi';
    if (val === 'Ramai') return 'keramaian-ramai';
    return 'keramaian-sedang';
}

function showDetail(place) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    const mushollah = place['Mushollah'] === 'Ada'
        ? `Ada (${place['Rating_Mushollah']}/10)`
        : 'Tidak Ada';

    content.innerHTML = `
    <h2>${place['Name']}</h2>
    <div class="detail-type">${place['Type']}</div>
    <div class="detail-address">📌 ${place['Alamat']}</div>
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-item-label">🪑 Kapasitas Kursi</div>
        <div class="detail-item-value">${place['Kursi']} kursi</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">🚗 Parkir Mobil</div>
        <div class="detail-item-value">${place['Parkir_Mobil']} slot</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">📅 Weekday</div>
        <div class="detail-item-value ${keramaianClass(place['Keramaian_Weekday'])}">${place['Keramaian_Weekday']}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">🗓️ Weekend</div>
        <div class="detail-item-value ${keramaianClass(place['Keramaian_Weekend'])}">${place['Keramaian_Weekend']}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">🕌 Mushollah</div>
        <div class="detail-item-value">${mushollah}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">🚻 Toilet</div>
        <div class="detail-item-value">${place['Rating_Toilet']}/10</div>
      </div>
      <div class="detail-item" style="grid-column: span 2;">
        <div class="detail-item-label">🔊 Tingkat Kebisingan</div>
        <div class="detail-item-value">${place['Loudness']}/10</div>
      </div>
    </div>
  `;
    panel.classList.remove('hidden');
}

document.getElementById('close-detail').addEventListener('click', () => {
    document.getElementById('detail-panel').classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(c => c.classList.remove('active'));
});

loadPlaces();