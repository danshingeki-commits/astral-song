/**
 * ASTRAL BEATS - Motor Nativo Sin Anuncios
 */

const YOUTUBE_API_KEY = 'AIzaSyBrrhapuhd8qHryfuvGpaIjunruu7gow8k';
const BACKEND_URL = 'https://astral-api-xasv.onrender.com';

const velocidades = [1.0, 0.75, 1.25];
let velocidadIndex = 0;

let canciones = [];
let indiceActual = -1;
let cargandoAudio = false;

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
const btnSpeed = document.getElementById('btnSpeed');
const trackList = document.getElementById('trackList');
const progressBox = document.getElementById('progressBox');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');

// ==========================================
// BÚSQUEDA RÁPIDA (YouTube Data API v3)
// ==========================================
async function buscarMusica() {
  const query = searchInput.value.trim();
  if (!query) return;

  trackList.innerHTML = `
    <div class="placeholder-msg">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Consultando catálogo universal...</p>
    </div>
  `;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      trackList.innerHTML = `
        <div class="placeholder-msg">
          <i class="fas fa-triangle-exclamation"></i>
          <p>${data.error.message}</p>
        </div>
      `;
      return;
    }

    if (!data.items || data.items.length === 0) {
      trackList.innerHTML = `
        <div class="placeholder-msg">
          <i class="fas fa-circle-exclamation"></i>
          <p>No se encontraron resultados para "${query}".</p>
        </div>
      `;
      return;
    }

    canciones = data.items.map(item => ({
      id: item.id.videoId,
      titulo: decodificarTexto(item.snippet.title),
      artista: decodificarTexto(item.snippet.channelTitle),
      portada: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
    }));

    renderizarLista();
  } catch (err) {
    trackList.innerHTML = `
      <div class="placeholder-msg">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Error de conexión al buscar música.</p>
      </div>
    `;
  }
}

function decodificarTexto(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
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
      <i class="fas fa-play item-play-icon" id="icon-${idx}"></i>
    `;
    item.onclick = () => reproducirCancion(idx);
    trackList.appendChild(item);
  });
}

// ==========================================
// REPRODUCCIÓN NATIVA SIN PUBLICIDAD
// ==========================================
async function reproducirCancion(indice) {
  if (indice < 0 || indice >= canciones.length || cargandoAudio) return;

  indiceActual = indice;
  const cancion = canciones[indiceActual];

  trackTitle.innerText = cancion.titulo;
  trackArtist.innerText = "Extrayendo audio sin anuncios...";
  coverImg.src = cancion.portada;

  cargandoAudio = true;
  playIcon.className = 'fas fa-spinner fa-spin';

  try {
    const res = await fetch(`${BACKEND_URL}/audio/${cancion.id}`);
    const data = await res.json();

    if (!data.audio_url) {
      throw new Error("No stream found");
    }

    audioPlayer.src = data.audio_url;
    audioPlayer.playbackRate = velocidades[velocidadIndex];

    await audioPlayer.play();

    trackArtist.innerText = cancion.artista;
    vinylDisc.classList.add('playing');
    playIcon.className = 'fas fa-pause';
  } catch (err) {
    trackArtist.innerText = "Error al cargar pista. Intenta con otra.";
    playIcon.className = 'fas fa-play';
    vinylDisc.classList.remove('playing');
  } finally {
    cargandoAudio = false;
  }
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

function cambiarVelocidad() {
  velocidadIndex = (velocidadIndex + 1) % velocidades.length;
  const vel = velocidades[velocidadIndex];

  audioPlayer.playbackRate = vel;

  if (vel === 0.75) {
    btnSpeed.innerText = '0.75x (Slowed)';
    btnSpeed.style.color = '#ec4899';
  } else if (vel === 1.25) {
    btnSpeed.innerText = '1.25x (Fast)';
    btnSpeed.style.color = '#a855f7';
  } else {
    btnSpeed.innerText = '1.0x';
    btnSpeed.style.color = '#00f2fe';
  }
}

function cancionSiguiente() {
  if (canciones.length === 0) return;
  const sig = (indiceActual + 1) % canciones.length;
  reproducirCancion(sig);
}

function cancionAnterior() {
  if (canciones.length === 0) return;
  const ant = (indiceActual - 1 + canciones.length) % canciones.length;
  reproducirCancion(ant);
}

// ==========================================
// TIEMPO Y PROGRESO
// ==========================================
function formatearSegundos(seg) {
  if (isNaN(seg) || seg < 0) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const porcentaje = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${porcentaje}%`;
    currentTimeEl.innerText = formatearSegundos(audioPlayer.currentTime);
    totalDurationEl.innerText = formatearSegundos(audioPlayer.duration);
  }
});

audioPlayer.addEventListener('ended', () => {
  cancionSiguiente();
});

progressBox.onclick = function(e) {
  if (!audioPlayer.duration) return;
  const rect = progressBox.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const porcentaje = clickX / rect.width;
  audioPlayer.currentTime = porcentaje * audioPlayer.duration;
};

// ==========================================
// EVENTOS
// ==========================================
btnSearch.onclick = buscarMusica;
searchInput.onkeydown = (e) => {
  if (e.key === 'Enter') {
    buscarMusica();
    searchInput.blur();
  }
};
btnPlay.onclick = alternarPlayPausa;
btnNext.onclick = cancionSiguiente;
btnPrev.onclick = cancionAnterior;
btnSpeed.onclick = cambiarVelocidad;
