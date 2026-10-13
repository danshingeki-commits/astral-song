/**
 * ASTRAL BEATS - Motor de Audio y Búsqueda en Línea
 */

// Elementos del DOM
const audioPlayer = document.getElementById('audioPlayer');
const vinylDisc = document.getElementById('vinylDisc');
const coverImg = document.getElementById('coverImg');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnPlay = document.getElementById('btnPlay');
const playIcon = document.getElementById('playIcon');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const trackList = document.getElementById('trackList');
const progressBox = document.getElementById('progressBox');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');

let canciones = [];
let indiceActual = -1;

// ==========================================
// BÚSQUEDA EN TIEMPO REAL (iTunes API)
// ==========================================
async function buscarMusica() {
  const query = searchInput.value.trim();
  if (!query) return;

  trackList.innerHTML = `
    <div class="placeholder-msg">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Buscando en la nube de Astral...</p>
    </div>
  `;

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      trackList.innerHTML = `
        <div class="placeholder-msg">
          <i class="fas fa-circle-exclamation"></i>
          <p>No se encontraron resultados para "${query}".</p>
        </div>
      `;
      return;
    }

    canciones = data.results.map(item => ({
      titulo: item.trackName,
      artista: item.artistName,
      portada: item.artworkUrl100.replace('100x100', '500x500'),
      audio: item.previewUrl
    }));

    renderizarLista();
  } catch (error) {
    trackList.innerHTML = `
      <div class="placeholder-msg">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Error de conexión. Verifica tu internet.</p>
      </div>
    `;
  }
}

function renderizarLista() {
  trackList.innerHTML = '';

  canciones.forEach((cancion, idx) => {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.innerHTML = `
      <img src="${cancion.portada}" alt="Cover">
      <div class="item-info">
        <div class="item-title">${cancion.titulo}</div>
        <div class="item-artist">${cancion.artista}</div>
      </div>
      <i class="fas fa-play item-play-icon"></i>
    `;
    item.addEventListener('click', () => reproducirCancion(idx));
    trackList.appendChild(item);
  });
}

// ==========================================
// CONTROL DE REPRODUCCIÓN
// ==========================================
function reproducirCancion(indice) {
  if (indice < 0 || indice >= canciones.length) return;
  indiceActual = indice;
  const cancion = canciones[indiceActual];

  trackTitle.innerText = cancion.titulo;
  trackArtist.innerText = cancion.artista;
  coverImg.src = cancion.portada;

  audioPlayer.src = cancion.audio;
  audioPlayer.play()
    .then(() => {
      vinylDisc.classList.add('playing');
      playIcon.className = 'fas fa-pause';
    })
    .catch(() => {
      // Manejo de restricciones de reproducción automática en navegadores móviles
    });
}

function alternarPlayPausa() {
  if (!audioPlayer.src) return;

  if (audioPlayer.paused) {
    audioPlayer.play();
    vinylDisc.classList.add('playing');
    playIcon.className = 'fas fa-pause';
  } else {
    audioPlayer.pause();
    vinylDisc.classList.remove('playing');
    playIcon.className = 'fas fa-play';
  }
}

function cancionSiguiente() {
  if (canciones.length === 0) return;
  const siguienteIndice = (indiceActual + 1) % canciones.length;
  reproducirCancion(siguienteIndice);
}

function cancionAnterior() {
  if (canciones.length === 0) return;
  const anteriorIndice = (indiceActual - 1 + canciones.length) % canciones.length;
  reproducirCancion(anteriorIndice);
}

// ==========================================
// BARRA DE PROGRESO Y TIEMPO
// ==========================================
function formatearSegundos(seg) {
  if (isNaN(seg)) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const progreso = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progreso}%`;
    currentTimeEl.innerText = formatearSegundos(audioPlayer.currentTime);
    totalDurationEl.innerText = formatearSegundos(audioPlayer.duration);
  }
});

audioPlayer.addEventListener('ended', () => {
  cancionSiguiente();
});

progressBox.addEventListener('click', (e) => {
  if (!audioPlayer.duration) return;
  const anchoContenedor = progressBox.clientWidth;
  const clickX = e.offsetX;
  audioPlayer.currentTime = (clickX / anchoContenedor) * audioPlayer.duration;
});

// ==========================================
// EVENTOS DE INTERFAZ
// ==========================================
btnSearch.addEventListener('click', buscarMusica);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    buscarMusica();
    searchInput.blur();
  }
});

btnPlay.addEventListener('click', alternarPlayPausa);
btnNext.addEventListener('click', cancionSiguiente);
btnPrev.addEventListener('click', cancionAnterior);
