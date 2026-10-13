/**
 * ASTRAL BEATS - Motor de Streaming Completo & Slowed
 */

let player = null;
let isPlayerReady = false;
let canciones = [];
let indiceActual = -1;
let updateInterval = null;
const YOUTUBE_API_KEY = 'AIzaSyBrrhapuhd8qHryfuvGpaIjunruu7gow8k';

const velocidades = [1.0, 0.75, 1.25];
let velocidadIndex = 0;

// Servidores abiertos de alta velocidad con soporte para navegador
const SERVIDORES_STREAM = [
  'https://api.piped.privacydev.net',
  'https://pipedapi.tokhmi.xyz',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.colinslegacy.com'
];

// Elementos del DOM
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
const statusBadge = document.getElementById('statusBadge');

// ==========================================
// CARGA DINÁMICA DE LA API DE REPRODUCCIÓN
// ==========================================
function cargarMotorAudio() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const primerScript = document.getElementsByTagName('script')[0];
  primerScript.parentNode.insertBefore(tag, primerScript);
}

window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      fs: 0
    },
    events: {
      onReady: () => {
        isPlayerReady = true;
        if (statusBadge) {
          statusBadge.innerText = 'ONLINE';
          statusBadge.style.color = '#00f2fe';
        }
      },
      onStateChange: manejarCambioEstado
    }
  });
};

function manejarCambioEstado(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    vinylDisc.classList.add('playing');
    playIcon.className = 'fas fa-pause';
    iniciarProgreso();
  } else if (event.data === YT.PlayerState.PAUSED) {
    vinylDisc.classList.remove('playing');
    playIcon.className = 'fas fa-play';
    detenerProgreso();
  } else if (event.data === YT.PlayerState.ENDED) {
    vinylDisc.classList.remove('playing');
    playIcon.className = 'fas fa-play';
    cancionSiguiente();
  }
}

// ==========================================
// BÚSQUEDA ONLINE DE CANCIONES COMPLETAS
// ==========================================
async function buscarMusica() {
  const query = searchInput.value.trim();
  if (!query) return;

  trackList.innerHTML = `
    <div class="placeholder-msg">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Buscando en la nube de streaming...</p>
    </div>
  `;

  let resultados = null;

  for (let servidor of SERVIDORES_STREAM) {
    try {
      const url = `${servidor}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          resultados = items.filter(v => v.url && v.title);
          if (resultados.length > 0) break;
        }
      }
    } catch (e) {
      // Si un servidor falla, salta al siguiente de respaldo
    }
  }

  if (!resultados || resultados.length === 0) {
    trackList.innerHTML = `
      <div class="placeholder-msg">
        <i class="fas fa-circle-exclamation"></i>
        <p>No se obtuvieron resultados en este momento. Prueba de nuevo en unos segundos.</p>
      </div>
    `;
    return;
  }

  canciones = resultados.slice(0, 15).map(item => {
    const videoId = item.url.replace('/watch?v=', '');
    return {
      id: videoId,
      titulo: item.title,
      artista: item.uploaderName || "Astral Music",
      portada: item.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  });

  renderizarLista();
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
    item.onclick = () => reproducirCancion(idx);
    trackList.appendChild(item);
  });
}

// ==========================================
// CONTROLES DE AUDIO & SLOWED
// ==========================================
function reproducirCancion(indice) {
  if (!isPlayerReady || indice < 0 || indice >= canciones.length) return;
  indiceActual = indice;
  const cancion = canciones[indiceActual];

  trackTitle.innerText = cancion.titulo;
  trackArtist.innerText = cancion.artista;
  coverImg.src = cancion.portada;

  player.loadVideoById(cancion.id);
  player.setPlaybackRate(velocidades[velocidadIndex]);
}

function alternarPlayPausa() {
  if (!isPlayerReady) return;
  const estado = player.getPlayerState();

  if (estado === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function cambiarVelocidad() {
  if (!isPlayerReady) return;
  velocidadIndex = (velocidadIndex + 1) % velocidades.length;
  const vel = velocidades[velocidadIndex];

  player.setPlaybackRate(vel);

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
  const siguiente = (indiceActual + 1) % canciones.length;
  reproducirCancion(siguiente);
}

function cancionAnterior() {
  if (canciones.length === 0) return;
  const anterior = (indiceActual - 1 + canciones.length) % canciones.length;
  reproducirCancion(anterior);
}

// ==========================================
// BARRA DE TIEMPO Y PROGRESO
// ==========================================
function formatearSegundos(seg) {
  if (isNaN(seg) || seg < 0) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function iniciarProgreso() {
  detenerProgreso();
  updateInterval = setInterval(() => {
    if (player && player.getCurrentTime && player.getDuration) {
      const actual = player.getCurrentTime();
      const total = player.getDuration();

      if (total > 0) {
        const porcentaje = (actual / total) * 100;
        progressBar.style.width = `${porcentaje}%`;
        currentTimeEl.innerText = formatearSegundos(actual);
        totalDurationEl.innerText = formatearSegundos(total);
      }
    }
  }, 500);
}

function detenerProgreso() {
  if (updateInterval) clearInterval(updateInterval);
}

progressBox.onclick = function(e) {
  if (!isPlayerReady || !player.getDuration) return;
  const total = player.getDuration();
  if (total > 0) {
    const rect = progressBox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const porcentaje = clickX / rect.width;
    player.seekTo(porcentaje * total, true);
  }
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

// Inicia el motor
cargarMotorAudio();
