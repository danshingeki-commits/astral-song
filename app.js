/**
 * ASTRAL BEATS - Motor de Música Completa & Slowed
 */

let player;
let isPlayerReady = false;
let canciones = [];
let indiceActual = -1;
let updateInterval = null;

const velocidades = [1.0, 0.75, 1.25];
let velocidadIndex = 0;

// Servidores espejo para búsqueda sin límites
const INSTANCIAS_BUSQUEDA = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://yt.artemislena.eu'
];

// Elementos de la interfaz
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
// INICIALIZACIÓN DE LA API DE AUDIO
// ==========================================
window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('ytPlayer', {
    height: '200',
    width: '200',
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      fs: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady() {
  isPlayerReady = true;
  if (statusBadge) {
    statusBadge.innerText = 'ONLINE';
    statusBadge.style.color = '#00f2fe';
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    vinylDisc.classList.add('playing');
    playIcon.className = 'fas fa-pause';
    iniciarSeguimientoProgreso();
  } else if (event.data === YT.PlayerState.PAUSED) {
    vinylDisc.classList.remove('playing');
    playIcon.className = 'fas fa-play';
    detenerSeguimientoProgreso();
  } else if (event.data === YT.PlayerState.ENDED) {
    vinylDisc.classList.remove('playing');
    playIcon.className = 'fas fa-play';
    cancionSiguiente();
  }
}

// ==========================================
// BÚSQUEDA UNIVERSAL (Canciones Completas)
// ==========================================
async function buscarMusica() {
  const query = searchInput.value.trim();
  if (!query) return;

  trackList.innerHTML = `
    <div class="placeholder-msg">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Buscando versión completa en la nube...</p>
    </div>
  `;

  let resultados = null;

  for (let base of INSTANCIAS_BUSQUEDA) {
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          resultados = data;
          break;
        }
      }
    } catch (e) {
      // Intenta con el siguiente servidor en caso de error o demora
    }
  }

  if (!resultados || resultados.length === 0) {
    trackList.innerHTML = `
      <div class="placeholder-msg">
        <i class="fas fa-circle-exclamation"></i>
        <p>No se encontraron resultados o los servidores están ocupados. Intenta de nuevo.</p>
      </div>
    `;
    return;
  }

  canciones = resultados.map(item => ({
    id: item.videoId,
    titulo: item.title,
    artista: item.author || "Astral Music",
    portada: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`
  }));

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
    item.addEventListener('click', () => reproducirCancion(idx));
    trackList.appendChild(item);
  });
}

// ==========================================
// REPRODUCCIÓN & VELOCIDAD SLOWED
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
  const nuevaVelocidad = velocidades[velocidadIndex];

  player.setPlaybackRate(nuevaVelocidad);

  if (nuevaVelocidad === 0.75) {
    btnSpeed.innerText = '0.75x (Slowed)';
    btnSpeed.style.color = '#ec4899';
  } else if (nuevaVelocidad === 1.25) {
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

function iniciarSeguimientoProgreso() {
  detenerSeguimientoProgreso();
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

function detenerSeguimientoProgreso() {
  if (updateInterval) clearInterval(updateInterval);
}

progressBox.addEventListener('click', (e) => {
  if (!isPlayerReady || !player.getDuration) return;
  const total = player.getDuration();
  if (total > 0) {
    const rect = progressBox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const porcentaje = clickX / rect.width;
    player.seekTo(porcentaje * total, true);
  }
});

// ==========================================
// EVENTOS DE ENTRADA
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
btnSpeed.addEventListener('click', cambiarVelocidad);
