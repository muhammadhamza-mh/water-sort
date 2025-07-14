const bottlesContainer = document.getElementById("bottlesContainer");
const resetButton = document.getElementById("resetButton");
const pourSound = document.getElementById("pourSound");
const levelIndicator = document.getElementById("levelIndicator");
const popupWin = document.getElementById("popupWin");
const nextLevelButton = document.getElementById("nextLevelButton");

let bottles = [];
let selectedBottle = null;
const MAX_LEVEL = 30;
let currentLevel = 1;

const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C74B50",
  "#AD8BFF", "#F38BA0", "#66D3FA", "#FF9F45", "#00C9A7"
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function generateLevel(level) {
  const colorCount = Math.min(2 + Math.floor(level / 2), COLORS.length);
  const totalBottles = colorCount + 2;
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

function renderBottles() {
  bottlesContainer.innerHTML = "";

  bottles.forEach((bottle, index) => {
    const bottleDiv = document.createElement("div");
    bottleDiv.className = "bottle";
    bottleDiv.dataset.index = index;

    bottle.forEach(color => {
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

  const bottleDiv = bottlesContainer.children[toIndex];
  bottleDiv.classList.add("pouring");
  setTimeout(() => bottleDiv.classList.remove("pouring"), 300);

  renderBottles();
  saveGameState();
}

function checkWin() {
  const allSorted = bottles.every(bottle =>
    bottle.length === 0 ||
    (bottle.length === 4 && bottle.every(color => color === bottle[0]))
  );

  if (allSorted) {
    setTimeout(() => {
      popupWin.classList.add("show");
    }, 600);
  }
}

function saveGameState() {
  const gameState = {
    bottles,
    currentLevel
  };
  localStorage.setItem("waterSortGameState", JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem("waterSortGameState");
  if (saved) {
    const state = JSON.parse(saved);
    bottles = state.bottles || [];
    currentLevel = state.currentLevel || 1;
    levelIndicator.textContent = `Level ${currentLevel}`;
    renderBottles();
  } else {
    generateLevel(currentLevel);
  }
}

resetButton.addEventListener("click", () => {
  generateLevel(currentLevel);
});

nextLevelButton.addEventListener("click", () => {
  popupWin.classList.remove("show");
  if (currentLevel < MAX_LEVEL) {
    currentLevel++;
    generateLevel(currentLevel);
  } else {
    alert(" You completed all 30 levels!");
  }
});

loadGameState();
