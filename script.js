// 💥 Controls & UI
const btnAutoMoves = document.getElementById("btnAutoMoves");
const btnSkipLevel = document.getElementById("btnSkipLevel");
const btnRemoveColor = document.getElementById("btnRemoveColor");
const btnAddBottle = document.getElementById("btnAddBottle");

const bottlesContainer = document.getElementById("bottlesContainer");
const resetButton = document.getElementById("resetButton");
const levelSelectScreen = document.getElementById("levelSelectScreen");
const levelButtonsContainer = document.getElementById("levelButtonsContainer");
const pourSound = document.getElementById("pourSound");
const levelIndicator = document.getElementById("levelIndicator");
const popupWin = document.getElementById("popupWin");
const nextLevelButton = document.getElementById("nextLevelButton");
const coinsDisplay = document.getElementById("coinDisplay");
const hintButton = document.getElementById("hintButton");
const pauseButton = document.getElementById("pauseButton");
const pauseMenu = document.getElementById("pauseMenu");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const playButton = document.getElementById("playButton");

let isPaused = false;
let bottles = [];
let selectedBottle = null;
let moveCount = 0;
let currentLevel = 1;
const MAX_LEVEL = 100;

let coins = parseInt(localStorage.getItem("coins")) || 0;
updateCoinDisplay();

// 🧠 Power-up usage tracking per level
let autoMovesUsed = 0;
let removedColorThisLevel = false;
let emptyBottlesUsed = 0;

const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C74B50",
  "#AD8BFF", "#F38BA0", "#66D3FA", "#FF9F45", "#00C9A7",
];

/* ========== Utility ========== */
function lockScroll(lock) {
  document.body.classList.toggle("modal-open", !!lock);
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseMenu.classList.remove("hidden");
    lockScroll(true);
  } else {
    pauseMenu.classList.add("hidden");
    lockScroll(false);
  }
}

// Hotkey 'P' to toggle pause
document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") togglePause();
});

pauseButton.addEventListener("click", togglePause);
document.getElementById("resumeButton").addEventListener("click", togglePause);
document.getElementById("quitButton").addEventListener("click", () => {
  popupWin.classList.remove("show");
  pauseMenu.classList.add("hidden");
  isPaused = false;
  lockScroll(false);
  gameScreen.classList.add("hidden");
  levelSelectScreen.classList.remove("hidden");
  renderLevelButtons();
});

playButton.addEventListener("click", () => {
  homeScreen.classList.add("hidden");
  levelSelectScreen.classList.remove("hidden");
  renderLevelButtons();
});

function renderLevelButtons() {
  const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel")) || 1;
  const levelStars = JSON.parse(localStorage.getItem("levelStars") || "{}");
  levelButtonsContainer.innerHTML = "";

  for (let i = 1; i <= MAX_LEVEL; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    const stars = levelStars[i] || 0;
    const starSpan = document.createElement("span");
    starSpan.textContent = " " + "★".repeat(stars);
    btn.appendChild(starSpan);

    if (i <= unlockedLevel) {
      btn.addEventListener("click", () => {
        currentLevel = i;
        levelSelectScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");
        generateLevel(currentLevel);
      });
    } else {
      btn.classList.add("locked");
    }

    levelButtonsContainer.appendChild(btn);
  }
}

function updateCoinDisplay() {
  coinsDisplay.textContent = `💰 ${coins}`;
  localStorage.setItem("coins", coins);
}

function spendCoins(amount) {
  if (coins >= amount) {
    coins -= amount;
    updateCoinDisplay();
    return true;
  } else {
    showNoCoinsPopup();
    return false;
  }
}

function addCoins(amount) {
  coins += amount;
  updateCoinDisplay();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ========== Level Generation ========== */
function generateLevel(level) {
  moveCount = 0;
  autoMovesUsed = 0;
  removedColorThisLevel = false;
  emptyBottlesUsed = 0;
  let numColors;
  if (level <= 2) numColors = 2;      // Level 1–2 → only 2 colors
  else if (level <= 4) numColors = 3; // Level 3–4 → 3 colors
  else numColors = Math.min(3 + Math.floor(level / 2), COLORS.length);

  let bottleCount = numColors + 2; // still give 2 extra bottles



  const colorPool = [];
  for (let i = 0; i < numColors; i++) {
    for (let j = 0; j < 4; j++) colorPool.push(COLORS[i]);
  }
  shuffle(colorPool);

  bottles = Array.from({ length: bottleCount }, () => []);

  // Fill only first (bottleCount - 2) bottles
  let idx = 0;
  while (colorPool.length) {
    const targetIndex = idx % (bottleCount - 2);
    if (bottles[targetIndex].length < 4) {
      bottles[targetIndex].push(colorPool.pop());
    }
    idx++;
  }

  renderBottles();
  levelIndicator.textContent = `Level ${level}`;
  saveGameState();
}

/* ========== Rendering & Interaction ========== */
function renderBottles() {
  bottlesContainer.innerHTML = "";
  bottles.forEach((bottle, i) => {
    const div = document.createElement("div");
    div.classList.add("bottle");
    div.dataset.index = i;

    bottle.forEach((color) => {
      const layer = document.createElement("div");
      layer.classList.add("layer");
      layer.style.background = color;
      div.appendChild(layer);
    });

    div.addEventListener("click", () => selectBottle(i));
    bottlesContainer.appendChild(div);
  });
}

function selectBottle(index) {
  if (isPaused) return;
  const bottle = bottles[index];

  const el = bottlesContainer.querySelector(`[data-index="${index}"]`);
  el.classList.add("bounce");
  setTimeout(() => el.classList.remove("bounce"), 300);

  if (selectedBottle === null) {
    if (bottle.length === 0) return;
    selectedBottle = index;
  } else {
    if (selectedBottle === index) {
      selectedBottle = null;
      return;
    }
    pour(selectedBottle, index);
    selectedBottle = null;
  }
}

function pour(from, to) {
  if (from === to) return;
  const source = bottles[from];
  const target = bottles[to];

  if (source.length === 0 || target.length === 4) return;

  const color = source[source.length - 1];
  let moveable = 0;
  for (let i = source.length - 1; i >= 0; i--) {
    if (source[i] === color) moveable++;
    else break;
  }

  const space = 4 - target.length;
  if (target.length > 0 && target[target.length - 1] !== color) return;

  const moved = Math.min(moveable, space);
  for (let i = 0; i < moved; i++) target.push(source.pop());

  // Sound (safe guard for autoplay policies)
  try { pourSound.currentTime = 0; pourSound.play(); } catch {}

  renderBottles();
  moveCount++;
  saveGameState();
  checkWin();
}

/* ========== Win Check & Popup ========== */
function checkWin() {
  const solved = bottles.every(
    (b) => b.length === 0 || (b.length === 4 && b.every((c) => c === b[0]))
  );
  if (!solved) return;

  let stars = 1;
  if (moveCount <= currentLevel * 1.2) stars = 3;
  else if (moveCount <= currentLevel * 1.5) stars = 2;

  document.getElementById("starDisplay").textContent = "★".repeat(stars);
  document.getElementById("scoreDisplay").textContent = `Score: ${moveCount}`;
  document.getElementById("rewardDisplay").textContent = `+${100 * stars} Coins`;

  addCoins(100 * stars);
  popupWin.classList.add("show");    // .popup + .show => visible center overlay
  lockScroll(true);

  // Unlock next level
  const unlocked = parseInt(localStorage.getItem("unlockedLevel")) || 1;
  if (currentLevel === unlocked && currentLevel < MAX_LEVEL) {
    localStorage.setItem("unlockedLevel", unlocked + 1);
  }

  // Save best stars
  const levelStars = JSON.parse(localStorage.getItem("levelStars") || "{}");
  if (!levelStars[currentLevel] || stars > levelStars[currentLevel]) {
    levelStars[currentLevel] = stars;
  }
  localStorage.setItem("levelStars", JSON.stringify(levelStars));
}

nextLevelButton.addEventListener("click", () => {
  popupWin.classList.remove("show");
  lockScroll(false);
  if (currentLevel < MAX_LEVEL) {
    currentLevel++;
    generateLevel(currentLevel);
  } else {
    alert("You completed all levels!");
  }
});

/* ========== Buttons & Power-ups ========== */
resetButton.addEventListener("click", () => generateLevel(currentLevel));

hintButton.addEventListener("click", () => {
  if (!spendCoins(100)) return;

  const moves = [];
  for (let i = 0; i < bottles.length; i++) {
    for (let j = 0; j < bottles.length; j++) {
      if (i === j) continue;
      const s = bottles[i], t = bottles[j];
      if (s.length === 0 || t.length === 4) continue;
      const color = s[s.length - 1];
      if (t.length === 0 || t[t.length - 1] === color) moves.push([i, j]);
    }
  }

  if (moves.length > 0) {
    const [from, to] = moves[Math.floor(Math.random() * moves.length)];
    const fromEl = bottlesContainer.querySelector(`[data-index="${from}"]`);
    const toEl = bottlesContainer.querySelector(`[data-index="${to}"]`);
    fromEl.classList.add("hint"); toEl.classList.add("hint");
    setTimeout(() => { fromEl.classList.remove("hint"); toEl.classList.remove("hint"); }, 1200);
  } else {
    alert("No possible moves!");
  }
});

// Auto 3 Moves (max 2 per level)
btnAutoMoves.addEventListener("click", () => {
  if (autoMovesUsed >= 2) return alert("Auto-move limit reached!");
  if (!spendCoins(200)) return;
  autoMovesUsed++;

  let steps = 0;
  const tryStep = () => {
    if (steps >= 3) return;
    for (let i = 0; i < bottles.length; i++) {
      for (let j = 0; j < bottles.length; j++) {
        if (i === j) continue;
        const s = bottles[i], t = bottles[j];
        if (s.length === 0 || t.length === 4) continue;
        const color = s[s.length - 1];
        if (t.length === 0 || t[t.length - 1] === color) {
          pour(i, j);
          steps++;
          setTimeout(tryStep, 350);
          return;
        }
      }
    }
  };
  tryStep();
});

// Skip Level (advance)
btnSkipLevel.addEventListener("click", () => {
  if (!spendCoins(500)) return;
  if (currentLevel < MAX_LEVEL) {
    currentLevel++;
    generateLevel(currentLevel);
  } else {
    alert("You completed all levels!");
  }
});

// Remove One Random Color (once per level)
btnRemoveColor.addEventListener("click", () => {
  if (removedColorThisLevel) return alert("You already removed a color this level.");
  if (!spendCoins(150)) return;

  const allColors = new Set();
  bottles.forEach(b => b.forEach(c => allColors.add(c)));
  const arr = [...allColors];
  if (arr.length === 0) return alert("No colors to remove.");

  const randomColor = arr[Math.floor(Math.random() * arr.length)];
  bottles.forEach(b => {
    for (let i = b.length - 1; i >= 0; i--) if (b[i] === randomColor) b.splice(i, 1);
  });

  removedColorThisLevel = true;
  renderBottles();
  saveGameState();
  checkWin();
});

// Add Empty Bottle (x2 per level)
btnAddBottle.addEventListener("click", () => {
  if (emptyBottlesUsed >= 2) return alert("You can only add 2 empty bottles per level.");
  if (!spendCoins(250)) return;

  bottles.push([]);
  emptyBottlesUsed++;
  renderBottles();
  saveGameState();
});

/* ========== Save / Load ========== */
function saveGameState() {
  const gameState = {
    bottles, currentLevel, coins, moveCount,
    autoMovesUsed, removedColorThisLevel, emptyBottlesUsed,
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
  const saved = JSON.parse(localStorage.getItem("gameState") || "null");
  if (saved) {
    bottles = saved.bottles || [];
    currentLevel = saved.currentLevel || 1;
    coins = saved.coins || 0;
    moveCount = saved.moveCount || 0;
    autoMovesUsed = saved.autoMovesUsed || 0;
    removedColorThisLevel = saved.removedColorThisLevel || false;
    emptyBottlesUsed = saved.emptyBottlesUsed || 0;

    updateCoinDisplay();
    levelIndicator.textContent = `Level ${currentLevel}`;
    renderBottles();
  } else {
    generateLevel(currentLevel);
  }
}

/* ========== No Coins Popup helpers ========== */
function showNoCoinsPopup() {
  document.getElementById("popupNoCoins").classList.remove("hidden");
  lockScroll(true);
}
function closeNoCoinsPopup() {
  document.getElementById("popupNoCoins").classList.add("hidden");
  lockScroll(false);
}

/* ========== Start ========== */
window.onload = () => {
  loadGameState();
};
