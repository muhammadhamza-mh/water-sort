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
const resumeButton = document.getElementById("resumeButton");
const quitButton = document.getElementById("quitButton");
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

const COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#C74B50",
  "#AD8BFF",
  "#F38BA0",
  "#66D3FA",
  "#FF9F45",
  "#00C9A7",
];

// Utility Functions
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseMenu.classList.remove("hidden");
  } else {
    pauseMenu.classList.add("hidden");
  }
}

// Hotkey 'P' to toggle pause
document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    togglePause();
  }
});

pauseButton.addEventListener("click", togglePause);
resumeButton.addEventListener("click", togglePause);
quitButton.addEventListener("click", () => {
  popupWin.classList.remove("show");
  pauseMenu.classList.add("hidden");
  isPaused = false;

  gameScreen.classList.add("hidden");
  levelSelectScreen.classList.remove("hidden");

  // 🛠 Refresh level buttons to show new unlocked level
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

    // Add stars as a span
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

// Shuffle array
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Level Generator
function generateLevel(level) {
  moveCount = 0;
  let colorCount, totalBottles;

  if (level <= 3) {
    colorCount = 2;
    totalBottles = 3;
  } else {
    colorCount = Math.min(10, 2 + Math.floor((level - 1) / 2));
    totalBottles = colorCount + 2;
  }

  const colorPool = [];
  for (let i = 0; i < colorCount; i++) {
    for (let j = 0; j < 4; j++) {
      colorPool.push(COLORS[i]);
    }
  }

  shuffle(colorPool);
  bottles = Array.from({ length: totalBottles }, () => []);

  let index = 0;
  while (colorPool.length > 0) {
    if (bottles[index].length < 4) {
      bottles[index].push(colorPool.pop());
    }
    index = (index + 1) % colorCount;
  }

  levelIndicator.textContent = `Level ${currentLevel}`;
  renderBottles();
  saveGameState();
}

// Render bottles
function renderBottles() {
  bottlesContainer.innerHTML = "";

  bottles.forEach((bottle, index) => {
    const bottleDiv = document.createElement("div");
    bottleDiv.className = "bottle";
    bottleDiv.dataset.index = index;

    bottle.forEach((color) => {
      const layer = document.createElement("div");
      layer.className = "layer";
      layer.style.background = color;
      bottleDiv.appendChild(layer);
    });

    bottleDiv.addEventListener("click", () => handleBottleClick(index));
    bottlesContainer.appendChild(bottleDiv);
  });
}

function handleBottleClick(index) {
  if (isPaused) return;
  const bottleEl = bottlesContainer.children[index];
  bottleEl.classList.add("bounce");
  setTimeout(() => bottleEl.classList.remove("bounce"), 300);

  if (selectedBottle === null) {
    if (bottles[index].length === 0) return;
    selectedBottle = index;
    highlightBottle(index, true);
  } else {
    if (selectedBottle === index) {
      highlightBottle(index, false);
      selectedBottle = null;
      return;
    }

    const from = bottles[selectedBottle];
    const to = bottles[index];

    if (canPour(from, to)) {
      pour(from, to, index);
      checkWin();
    }

    highlightBottle(selectedBottle, false);
    selectedBottle = null;
  }
}

function highlightBottle(index, highlight) {
  const bottle = bottlesContainer.children[index];
  bottle.style.borderColor = highlight ? "#fff" : "rgba(255,255,255,0.2)";
}

function canPour(from, to) {
  if (from.length === 0 || to.length >= 4) return false;
  if (to.length === 0) return true;
  return from[from.length - 1] === to[to.length - 1];
}

function pour(from, to, toIndex) {
  const movingColor = from[from.length - 1];
  let count = 0;

  for (let i = from.length - 1; i >= 0; i--) {
    if (from[i] === movingColor && to.length + count < 4) {
      count++;
    } else break;
  }

  for (let i = 0; i < count; i++) {
    to.push(from.pop());
  }

  moveCount++;

  const bottleDiv = bottlesContainer.children[toIndex];
  bottleDiv.classList.add("pouring");
  setTimeout(() => bottleDiv.classList.remove("pouring"), 300);

  renderBottles();
  saveGameState();
}

function calculateStars(moves, optimalMoves) {
  if (moves <= optimalMoves) return 3;
  if (moves <= optimalMoves + 4) return 2;
  return 1;
}

function checkWin() {
  const allSorted = bottles.every(
    (bottle) =>
      bottle.length === 0 ||
      (bottle.length === 4 && bottle.every((color) => color === bottle[0]))
  );

  if (allSorted) {
    setTimeout(() => {
      // 🧠 Calculate stars
      const optimalMoves = Math.floor(currentLevel * 1.5) + 3;
      const stars = calculateStars(moveCount, optimalMoves);

      // 💰 Reward based on stars
      let reward = stars === 3 ? 200 : stars === 2 ? 100 : 50;
      addCoins(reward);

      // 🎉 Show win popup with results
      document.getElementById(
        "scoreDisplay"
      ).textContent = `Score: ${moveCount}`;
      document.getElementById("starDisplay").textContent = "★".repeat(stars);
      document.getElementById("rewardDisplay").textContent = `+${reward} Coins`;
      popupWin.classList.add("show");

      // 🔓 Unlock next level if needed
      // 🔓 Unlock next level if needed
      const unlocked = parseInt(localStorage.getItem("unlockedLevel")) || 1;
      if (currentLevel >= unlocked && currentLevel < MAX_LEVEL) {
        localStorage.setItem("unlockedLevel", currentLevel + 1);
      }

      // ⭐ Save stars (but only if greater than previous)
      let savedStars = JSON.parse(localStorage.getItem("levelStars") || "{}");
      const previousStars = savedStars[currentLevel] || 0;

      if (stars > previousStars) {
        savedStars[currentLevel] = stars;
        localStorage.setItem("levelStars", JSON.stringify(savedStars));
      }
    }, 500);
  }
}

function saveGameState() {
  const gameState = {
    bottles,
    currentLevel,
    coins,
  };
  localStorage.setItem("waterSortGameState", JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem("waterSortGameState");
  if (saved) {
    const state = JSON.parse(saved);
    bottles = state.bottles || [];
    currentLevel = state.currentLevel || 1;
    coins = state.coins || 0;
    updateCoinDisplay();
    levelIndicator.textContent = `Level ${currentLevel}`;
    renderBottles();
  } else {
    generateLevel(currentLevel);
  }
}

// Hint logic
hintButton.addEventListener("click", () => {
  if (!spendCoins(100)) return;
  const move = findHintMove();
  if (move) {
    highlightHint(move.fromIndex, move.toIndex);
  } else {
    alert("No possible moves!");
  }
});

function findHintMove() {
  for (let fromIndex = 0; fromIndex < bottles.length; fromIndex++) {
    for (let toIndex = 0; toIndex < bottles.length; toIndex++) {
      if (fromIndex === toIndex) continue;

      const from = bottles[fromIndex];
      const to = bottles[toIndex];

      if (from.length === 0 || to.length >= 4) continue;
      if (to.length === 0 || from[from.length - 1] === to[to.length - 1]) {
        return { fromIndex, toIndex };
      }
    }
  }
  return null;
}

function highlightHint(fromIndex, toIndex) {
  const fromEl = bottlesContainer.children[fromIndex];
  const toEl = bottlesContainer.children[toIndex];
  fromEl.classList.add("hint");
  toEl.classList.add("hint");
  setTimeout(() => {
    fromEl.classList.remove("hint");
    toEl.classList.remove("hint");
  }, 1000);
}

function showNoCoinsPopup() {
  document.getElementById("popupNoCoins").classList.remove("hidden");
}

function closeNoCoinsPopup() {
  document.getElementById("popupNoCoins").classList.add("hidden");
}

// Event Listeners
resetButton.addEventListener("click", () => {
  generateLevel(currentLevel);
});

nextLevelButton.addEventListener("click", () => {
  popupWin.classList.remove("show");
  if (currentLevel < MAX_LEVEL) {
    currentLevel++;
    generateLevel(currentLevel);
  } else {
    alert("You completed all levels!");
  }
});
