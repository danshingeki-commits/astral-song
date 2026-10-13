/**
 * ASTRAL BEATS - Motor Oficial de YouTube & Slowed
 */

let player = null;
let isPlayerReady = false;
let canciones = [];
let indiceActual = -1;
let updateInterval = null;

// Clave oficial configurada
const YOUTUBE_API_KEY = 'AIzaSyBrrhapuhd8qHryfuvGpaIjunruu7gow8k';

const velocidades = [1.0, 0.75, 1.25];
let velocidadIndex = 0;

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

// Carga del reproductor nativo
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

// Búsqueda directa con la API oficial
async function buscarMusica() {
  const query = searchInput.value.trim();
  if (!query) return;

  trackList.innerHTML = `
    <div class="placeholder-msg">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando catálogo en alta fidelidad...</p>
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
          <p>No se encontraron pistas para "${query}".</p>
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
  } catch (error) {
    trackList.innerHTML = `
      <div class="placeholder-msg">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Error de conexión al consultar el catálogo.</p>
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
      <i class="fas fa-play item-play-icon"></i>
    `;
    item.onclick = () => reproducirCancion(idx);
    trackList.appendChild(item);
  });
}

// Controles y velocidad
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

// Progreso y tiempo
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

// Eventos
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

cargarMotorAudio();
