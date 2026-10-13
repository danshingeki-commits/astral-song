/**
 * ASTRAL BEATS - Motor ViviMusic & Agrupador de Pistas
 */

const YOUTUBE_API_KEY = 'AIzaSyBrrhapuhd8qHryfuvGpaIjunruu7gow8k';

let player = null;
let isPlayerReady = false;
let currentPlaylist = [];
let currentIndex = -1;
let historyTracks = [];
let progressTimer = null;

const speeds = [1.0, 0.75, 1.25];
let speedIdx = 0;

// Elementos
const tabHome = document.getElementById('tabHome');
const tabSearch = document.getElementById('tabSearch');
const tabLibrary = document.getElementById('tabLibrary');
const navButtons = document.querySelectorAll('.nav-button');

const heroList = document.getElementById('heroList');
const communityList = document.getElementById('communityList');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const libraryList = document.getElementById('libraryList');

const miniCover = document.getElementById('miniCover');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const miniPlayIcon = document.getElementById('miniPlayIcon');
const btnPlayMini = document.getElementById('btnPlayMini');
const miniProgressBar = document.getElementById('miniProgressBar');

const fullPlayer = document.getElementById('fullPlayer');
const triggerFullPlayer = document.getElementById('triggerFullPlayer');
const btnCloseFull = document.getElementById('btnCloseFull');
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

// Carga de API
function initEngine() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player('ytPlayer', {
    height: '1', width: '1',
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, fs: 0 },
    events: {
      onReady: () => {
        isPlayerReady = true;
        filtrarCategoria('Entrenamiento');
      },
      onStateChange: handleState
    }
  });
};

function handleState(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    miniPlayIcon.className = 'fas fa-pause';
    fullPlayIcon.className = 'fas fa-pause';
    startTimer();
  } else if (e.data === YT.PlayerState.PAUSED) {
    miniPlayIcon.className = 'fas fa-play';
    fullPlayIcon.className = 'fas fa-play';
    stopTimer();
  } else if (e.data === YT.PlayerState.ENDED) {
    nextTrack();
  }
}

// Búsqueda en API
async function apiSearch(query, max = 9) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${max}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map(item => ({
      id: item.id.videoId,
      title: decodeText(item.snippet.title),
      artist: decodeText(item.snippet.channelTitle),
      cover: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
    }));
  } catch {
    return [];
  }
}

function decodeText(str) {
  const t = document.createElement('textarea');
  t.innerHTML = str;
  return t.value;
}

// Carga del feed estilo ViviMusic
async function filtrarCategoria(cat) {
  document.querySelectorAll('.vivi-chip').forEach(c => {
    c.classList.toggle('active', c.innerText.toLowerCase().includes(cat.toLowerCase()));
  });

  heroList.innerHTML = '<div class="empty-pixel-msg">Cargando destacados...</div>';
  communityList.innerHTML = '<div class="empty-pixel-msg">Cargando comunidad...</div>';

  const tracks = await apiSearch(cat + ' music', 9);

  // 1. Hero Carousel (Daily Discover)
  heroList.innerHTML = '';
  tracks.slice(0, 3).forEach(track => {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.innerHTML = `
      <img src="${track.cover}" alt="Art">
      <div class="hero-meta">
        <div class="hero-title">${track.title}</div>
        <div class="hero-sub">${track.artist}</div>
      </div>
    `;
    card.onclick = () => playTrack(track, tracks);
    heroList.appendChild(card);
  });

  // 2. Community Groups (Tarjetas de 3 canciones como ViviMusic)
  communityList.innerHTML = '';
  const grupo1 = tracks.slice(0, 3);
  const grupo2 = tracks.slice(3, 6);

  [ { title: `${cat} Top Hits`, tracks: grupo1 }, { title: 'Mix Recomendado', tracks: grupo2 } ].forEach(group => {
    if (group.tracks.length === 0) return;

    const card = document.createElement('div');
    card.className = 'grouped-card';

    let htmlTracks = '';
    group.tracks.forEach(t => {
      htmlTracks += `
        <div class="mini-track-item" onclick="event.stopPropagation(); playTrackById('${t.id}')">
          <img src="${t.cover}" alt="Art">
          <div class="mini-track-info">
            <div class="mini-track-title">${t.title}</div>
            <div class="mini-track-artist">${t.artist}</div>
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="grouped-card-header">
        <h3>${group.title}</h3>
        <span>ViviMusic Community</span>
      </div>
      ${htmlTracks}
      <div class="grouped-card-actions">
        <button class="btn-vivi-play" onclick="playPlaylist(${JSON.stringify(group.tracks).replace(/"/g, '&quot;')})">
          <i class="fas fa-play"></i> Play
        </button>
        <button class="btn-circle-action"><i class="fas fa-tower-broadcast"></i></button>
        <button class="btn-circle-action"><i class="fas fa-list-ul"></i></button>
      </div>
    `;
    communityList.appendChild(card);
  });
}

window.playPlaylist = (list) => {
  if (list && list.length > 0) playTrack(list[0], list);
};

window.playTrackById = async (id) => {
  const track = currentPlaylist.find(t => t.id === id);
  if (track) playTrack(track, currentPlaylist);
};

function playTrack(track, list) {
  if (!isPlayerReady) return;
  currentPlaylist = list || [track];
  currentIndex = currentPlaylist.findIndex(t => t.id === track.id);

  miniTitle.innerText = track.title;
  miniArtist.innerText = track.artist;
  miniCover.src = track.cover;

  fullTitle.innerText = track.title;
  fullArtist.innerText = track.artist;
  fullCover.src = track.cover;

  player.loadVideoById(track.id);
  player.setPlaybackRate(speeds[speedIdx]);

  if (!historyTracks.some(t => t.id === track.id)) {
    historyTracks.unshift(track);
    renderLibrary();
  }
}

function togglePlay() {
  if (!isPlayerReady) return;
  const s = player.getPlayerState();
  if (s === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
}

function nextTrack() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex + 1) % currentPlaylist.length;
  playTrack(currentPlaylist[currentIndex], currentPlaylist);
}

function prevTrack() {
  if (currentPlaylist.length === 0) return;
  currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  playTrack(currentPlaylist[currentIndex], currentPlaylist);
}

function cycleSpeed() {
  if (!isPlayerReady) return;
  speedIdx = (speedIdx + 1) % speeds.length;
  const spd = speeds[speedIdx];
  player.setPlaybackRate(spd);
  btnSpeed.innerText = spd === 0.75 ? '0.75x' : `${spd}x`;
}

// Tiempo
function fmt(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function startTimer() {
  stopTimer();
  progressTimer = setInterval(() => {
    if (player && player.getCurrentTime) {
      const cur = player.getCurrentTime();
      const dur = player.getDuration();
      if (dur > 0) {
        const pct = (cur / dur) * 100;
        miniProgressBar.style.width = `${pct}%`;
        fullProgressBar.style.width = `${pct}%`;
        currentTimeEl.innerText = fmt(cur);
        totalDurationEl.innerText = fmt(dur);
      }
    }
  }, 500);
}

function stopTimer() {
  if (progressTimer) clearInterval(progressTimer);
}

fullProgressBox.onclick = (e) => {
  if (!player || !player.getDuration) return;
  const rect = fullProgressBox.getBoundingClientRect();
  const seek = ((e.clientX - rect.left) / rect.width) * player.getDuration();
  player.seekTo(seek, true);
};

// Buscador
let searchDebounce = null;
searchInput.oninput = () => {
  const q = searchInput.value.trim();
  clearTimeout(searchDebounce);
  if (!q) {
    searchResults.innerHTML = '<div class="empty-pixel-msg">Escribe arriba para explorar</div>';
    return;
  }
  searchDebounce = setTimeout(async () => {
    const list = await apiSearch(q, 15);
    searchResults.innerHTML = '';
    list.forEach(t => {
      const row = document.createElement('div');
      row.className = 'search-row';
      row.innerHTML = `
        <img src="${t.cover}" alt="Art">
        <div style="flex:1;min-width:0;">
          <div class="search-row-title">${t.title}</div>
          <div class="search-row-artist">${t.artist}</div>
        </div>
        <i class="fas fa-play" style="color:var(--accent-blue);font-size:0.85rem;"></i>
      `;
      row.onclick = () => playTrack(t, list);
      searchResults.appendChild(row);
    });
  }, 450);
};

function renderLibrary() {
  libraryList.innerHTML = '';
  historyTracks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'search-row';
    row.innerHTML = `
      <img src="${t.cover}" alt="Art">
      <div style="flex:1;min-width:0;">
        <div class="search-row-title">${t.title}</div>
        <div class="search-row-artist">${t.artist}</div>
      </div>
    `;
    row.onclick = () => playTrack(t, historyTracks);
    libraryList.appendChild(row);
  });
}

// Navegación de Pestañas
navButtons.forEach(btn => {
  btn.onclick = () => {
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const tab = document.getElementById(btn.getAttribute('data-tab'));
    if (tab) tab.classList.add('active');
  };
});

// Eventos
triggerFullPlayer.onclick = () => fullPlayer.classList.add('open');
btnCloseFull.onclick = () => fullPlayer.classList.remove('open');
btnPlayMini.onclick = (e) => { e.stopPropagation(); togglePlay(); };
btnPlayFull.onclick = togglePlay;
btnNext.onclick = nextTrack;
btnPrev.onclick = prevTrack;
btnSpeed.onclick = cycleSpeed;

initEngine();
