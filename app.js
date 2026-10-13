/**
 * ASTRAL BEATS - Spotify & ViMusic Engine
 */

const YOUTUBE_API_KEY = 'AIzaSyBrrhapuhd8qHryfuvGpaIjunruu7gow8k';

let player = null;
let isPlayerReady = false;
let currentPlaylist = [];
let currentIndex = -1;
let historyTracks = [];
let updateInterval = null;

const speeds = [1.0, 0.75, 1.25];
let speedIndex = 0;

// Elementos UI
const viewHome = document.getElementById('viewHome');
const viewSearch = document.getElementById('viewSearch');
const viewLibrary = document.getElementById('viewLibrary');
const navTabs = document.querySelectorAll('.nav-tab');

const quickPicks = document.getElementById('quickPicks');
const trendingPicks = document.getElementById('trendingPicks');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const libraryList = document.getElementById('libraryList');
const btnClearSearch = document.getElementById('btnClearSearch');

const miniPlayer = document.getElementById('miniPlayer');
const miniCover = document.getElementById('miniCover');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const miniPlayIcon = document.getElementById('miniPlayIcon');
const btnPlayMini = document.getElementById('btnPlayMini');
const miniProgressBar = document.getElementById('miniProgressBar');

const fullPlayer = document.getElementById('fullPlayer');
const openFullPlayerTrigger = document.getElementById('openFullPlayerTrigger');
const btnClosePlayer = document.getElementById('btnClosePlayer');
const fullCover = document.getElementById('fullCover');
const fullTitle = document.getElementById('fullTitle');
const fullArtist = document.getElementById('fullArtist');
const fullPlayIcon = document.getElementById('fullPlayIcon');
const btnPlayFull = document.getElementById('btnPlayFull');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSpeed = document.getElementById('btnSpeed');
const fullProgressBar = document.getElementById('fullProgressBar');
const fullProgressBox = document.getElementById('fullProgressBox');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');

// Saludo dinámico (Buenos días / tardes / noches)
const hour = new Date().getHours();
const greetingEl = document.getElementById('greetingText');
if (greetingEl) {
  greetingEl.innerText = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
}

// 1. CARGA INICIAL DEL REPRODUCTOR YOUTUBE
function inicializarMotor() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, fs: 0 },
    events: {
      onReady: () => {
        isPlayerReady = true;
        cargarFeed('Phonk slowed');
      },
      onStateChange: manejarEstado
    }
  });
};

function manejarEstado(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    miniPlayIcon.className = 'fas fa-pause';
    fullPlayIcon.className = 'fas fa-pause';
    iniciarProgreso();
  } else if (event.data === YT.PlayerState.PAUSED) {
    miniPlayIcon.className = 'fas fa-play';
    fullPlayIcon.className = 'fas fa-play';
    detenerProgreso();
  } else if (event.data === YT.PlayerState.ENDED) {
    siguientePista();
  }
}

// 2. PETICIONES A YOUTUBE API
async function buscarEnApi(query, max = 10) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${max}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map(i => ({
      id: i.id.videoId,
      title: decodificar(i.snippet.title),
      artist: decodificar(i.snippet.channelTitle),
      cover: i.snippet.thumbnails.high ? i.snippet.thumbnails.high.url : i.snippet.thumbnails.default.url
    }));
  } catch {
    return [];
  }
}

function decodificar(str) {
  const t = document.createElement('textarea');
  t.innerHTML = str;
  return t.value;
}

// 3. INICIO: CARGA AUTOMÁTICA DE CONTENIDO
async function cargarFeed(categoria) {
  quickPicks.innerHTML = '<div class="loader-item"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
  
  const tracks = await buscarEnApi(categoria, 6);
  quickPicks.innerHTML = '';
  
  tracks.forEach(track => {
    const card = document.createElement('div');
    card.className = 'feed-card';
    card.innerHTML = `
      <img src="${track.cover}" alt="Art">
      <div class="card-title">${track.title}</div>
      <div class="card-sub">${track.artist}</div>
    `;
    card.onclick = () => reproducir(track, tracks);
    quickPicks.appendChild(card);
  });

  const trends = await buscarEnApi('Latin Trap slowed', 6);
  trendingPicks.innerHTML = '';
  trends.forEach(track => {
    const card = document.createElement('div');
    card.className = 'h-card';
    card.innerHTML = `
      <img src="${track.cover}" alt="Art">
      <div class="card-title" style="margin-top:6px">${track.title}</div>
    `;
    card.onclick = () => reproducir(track, trends);
    trendingPicks.appendChild(card);
  });
}

// 4. CONTROL DE REPRODUCCIÓN
function reproducir(track, lista) {
  if (!isPlayerReady) return;
  currentPlaylist = lista || [track];
  currentIndex = currentPlaylist.findIndex(t => t.id === track.id);

  miniTitle.innerText = track.title;
  miniArtist.innerText = track.artist;
  miniCover.src = track.cover;

  fullTitle.innerText = track.title;
  fullArtist.innerText = track.artist;
  fullCover.src = track.cover;

  player.loadVideoById(track.id);
  player.setPlaybackRate(speeds[speedIndex]);

  // Guardar en biblioteca/historial sin duplicados inmediatos
  if (!historyTracks.some(t => t.id === track.id)) {
    historyTracks.unshift(track);
    actualizarBiblioteca();
  }
}

function alternarPlay() {
  if (!isPlayerReady) return;
  const s = player.getPlayerState();
  if (s === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function siguientePista() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex + 1) % currentPlaylist.length;
  reproducir(currentPlaylist[currentIndex], currentPlaylist);
}

function anteriorPista() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  reproducir(currentPlaylist[currentIndex], currentPlaylist);
}

function cambiarVelocidad() {
  if (!isPlayerReady) return;
  speedIndex = (speedIndex + 1) % speeds.length;
  const vel = speeds[speedIndex];
  player.setPlaybackRate(vel);
  btnSpeed.innerText = vel === 0.75 ? '0.75x (Slowed)' : `${vel}x`;
}

// 5. BARRA DE TIEMPO
function formatear(s) {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function iniciarProgreso() {
  detenerProgreso();
  updateInterval = setInterval(() => {
    if (player && player.getCurrentTime) {
      const cur = player.getCurrentTime();
      const dur = player.getDuration();
      if (dur > 0) {
        const pct = (cur / dur) * 100;
        miniProgressBar.style.width = `${pct}%`;
        fullProgressBar.style.width = `${pct}%`;
        currentTimeEl.innerText = formatear(cur);
        totalDurationEl.innerText = formatear(dur);
      }
    }
  }, 500);
}

function detenerProgreso() {
  if (updateInterval) clearInterval(updateInterval);
}

fullProgressBox.onclick = (e) => {
  if (!player || !player.getDuration) return;
  const rect = fullProgressBox.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const seekTime = (clickX / rect.width) * player.getDuration();
  player.seekTo(seekTime, true);
};

// 6. BUSCADOR
let timerDebounce = null;
searchInput.oninput = () => {
  const q = searchInput.value.trim();
  btnClearSearch.style.display = q ? 'block' : 'none';
  clearTimeout(timerDebounce);
  if (!q) {
    searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-magnifying-glass"></i><p>Escribe algo para buscar</p></div>';
    return;
  }
  timerDebounce = setTimeout(async () => {
    const res = await buscarEnApi(q, 15);
    renderizarResultados(res);
  }, 400);
};

btnClearSearch.onclick = () => {
  searchInput.value = '';
  btnClearSearch.style.display = 'none';
  searchResults.innerHTML = '';
};

function renderizarResultados(items) {
  searchResults.innerHTML = '';
  items.forEach(track => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <img src="${track.cover}" alt="art">
      <div class="track-meta">
        <div class="title">${track.title}</div>
        <div class="artist">${track.artist}</div>
      </div>
      <i class="fas fa-play" style="color:#1db954; font-size: 0.9rem;"></i>
    `;
    row.onclick = () => reproducir(track, items);
    searchResults.appendChild(row);
  });
}

function actualizarBiblioteca() {
  libraryList.innerHTML = '';
  historyTracks.forEach(track => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <img src="${track.cover}" alt="art">
      <div class="track-meta">
        <div class="title">${track.title}</div>
        <div class="artist">${track.artist}</div>
      </div>
    `;
    row.onclick = () => reproducir(track, historyTracks);
    libraryList.appendChild(row);
  });
}

// 7. EVENTOS DE NAVEGACIÓN Y VISTAS
navTabs.forEach(tab => {
  tab.onclick = () => {
    navTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(tab.getAttribute('data-view'));
    if (target) target.classList.add('active');
  };
});

// Mini Player & Full Player toggles
openFullPlayerTrigger.onclick = () => fullPlayer.classList.add('open');
btnClosePlayer.onclick = () => fullPlayer.classList.remove('open');

btnPlayMini.onclick = (e) => { e.stopPropagation(); alternarPlay(); };
btnPlayFull.onclick = alternarPlay;
btnNext.onclick = siguientePista;
btnPrev.onclick = anteriorPista;
btnSpeed.onclick = cambiarVelocidad;

inicializarMotor();
