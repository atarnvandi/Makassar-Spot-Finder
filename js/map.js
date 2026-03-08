// Inisialisasi peta
const map = L.map('map').setView([-5.1477, 119.4327], 13);

// Basemap OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// URL Google Sheets CSV
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5p7OM6dkZOMm02jolXCnpsUb4F5HGJVnBL1KrSA9Q0oq-deqEckYkkeE6dDWcR1VUQL-DjAyeDP9r/pub?output=csv';

// Fungsi parse CSV menjadi array of objects
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
    });
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Fungsi load dan tampilkan marker
async function loadMarkers() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const data = parseCSV(text);

        data.forEach(row => {
            const lat = parseFloat(row['Lat']);
            const lng = parseFloat(row['Lng']);

            if (isNaN(lat) || isNaN(lng)) return;

            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
          <strong>${row['Name']}</strong><br/>
          Tingkat: ${row['Tingkat']}<br/>
          ${row['Deskripsi']}<br/>
          <small>${row['Tanggal']}</small>
        `);
        });

    } catch (error) {
        console.error('Gagal load data:', error);
    }
}

loadMarkers();