const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menuOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub = document.getElementById('overlaySub');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

const TILE_SIZE = 20;
const TILE_COUNT = canvas.width / TILE_SIZE;

const COLORS = {
  bg: '#0f380f',
  snakeHead: '#9bbc0f',
  snakeBody: '#8bac0f',
  food: '#d6f542'
};

// Web Audio setup for retro 8-bit sound
let audioCtx = null;

function playEatSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square'; // Classic 8-bit square wave
  const now = audioCtx.currentTime;

  // Quick two-note rising chirp (523Hz -> 784Hz)
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.setValueAtTime(783.99, now + 0.05);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
let gameLoop = null;
let gameSpeed = 110;
let isPaused = false;

highScoreEl.textContent = highScore;

function initGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameSpeed = 110;
  isPaused = false;
  scoreEl.textContent = score;

  spawnFood();
  menuOverlay.classList.add('hidden');

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(tick, gameSpeed);
  draw();
}

function togglePause() {
  if (!menuOverlay.classList.contains('hidden')) return;

  isPaused = !isPaused;

  if (isPaused) {
    clearInterval(gameLoop);
    gameLoop = null;
    draw();
  } else {
    gameLoop = setInterval(tick, gameSpeed);
    draw();
  }
}

function spawnFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * TILE_COUNT);
    food.y = Math.floor(Math.random() * TILE_COUNT);
    valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
  }
}

function tick() {
  if (isPaused) return;

  direction = nextDirection;

  const head = {
    x: (snake[0].x + direction.x + TILE_COUNT) % TILE_COUNT,
    y: (snake[0].y + direction.y + TILE_COUNT) % TILE_COUNT
  };

  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    playEatSound();
    score += 10;
    scoreEl.textContent = score;

    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }

    if (score % 50 === 0 && gameSpeed > 55) {
      gameSpeed -= 5;
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, gameSpeed);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.food;
  ctx.fillRect(
    food.x * TILE_SIZE + 2,
    food.y * TILE_SIZE + 2,
    TILE_SIZE - 4,
    TILE_SIZE - 4
  );

  snake.forEach((seg, index) => {
    ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
    ctx.fillRect(
      seg.x * TILE_SIZE + 1,
      seg.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  });

  if (isPaused) {
    ctx.fillStyle = 'rgba(15, 56, 15, 0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#9bbc0f';
    ctx.font = 'bold 36px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 12);

    ctx.font = 'bold 14px "Courier New", Courier, monospace';
    ctx.fillText('PRESS P TO RESUME', canvas.width / 2, canvas.height / 2 + 22);
  }
}

function gameOver() {
  clearInterval(gameLoop);
  gameLoop = null;
  isPaused = false;
  overlayTitle.textContent = 'GAME OVER';
  overlaySub.textContent = `FINAL SCORE: ${score}`;
  startBtn.textContent = 'PLAY AGAIN';
  menuOverlay.classList.remove('hidden');
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if ((key === 'enter' || key === ' ') && !menuOverlay.classList.contains('hidden')) {
    e.preventDefault();
    initGame();
    return;
  }

  if (key === 'p' || key === 'escape') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (isPaused) return;

  if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
    e.preventDefault();
    nextDirection = { x: 0, y: -1 };
  } else if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
    e.preventDefault();
    nextDirection = { x: 0, y: 1 };
  } else if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
    e.preventDefault();
    nextDirection = { x: -1, y: 0 };
  } else if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
    e.preventDefault();
    nextDirection = { x: 1, y: 0 };
  }
});

startBtn.addEventListener('click', initGame);

ctx.fillStyle = COLORS.bg;
ctx.fillRect(0, 0, canvas.width, canvas.height);