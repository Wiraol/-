/* ===== ФОНОВАЯ МУЗЫКА ===== */
const bgMusic = document.getElementById('bg-music');
const musicPlayer = document.getElementById('music-player');
const musicToggle = document.getElementById('music-toggle');
const musicVolume = document.getElementById('music-volume');

bgMusic.volume = 0.5;

function startBgMusic() {
  bgMusic.play().catch(() => {});
  musicPlayer.classList.add('show');
}

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    musicToggle.textContent = '🔊';
  } else {
    bgMusic.pause();
    musicToggle.textContent = '🔇';
  }
  musicPlayer.classList.toggle('active');
});

musicVolume.addEventListener('input', () => {
  bgMusic.volume = musicVolume.value / 100;
  musicToggle.textContent = bgMusic.volume === 0 ? '🔇' : '🔊';
});