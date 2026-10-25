const SAVE_KEY = "coinRushSave_v1";

const initialState = {
  coins: 0,
  totalEarned: 0,
  totalClicks: 0,
  clickLevel: 0,
  autoLevel: 0,
  megaLevel: 0,
  bonusReadyAt: 0,
  missionDate: "",
  missionClicks: 0,
  missionEarned: 0,
  clickMissionClaimed: false,
  earnMissionClaimed: false
};

let state = loadGame();
let toastTimer;
let bonusTimer;

const el = (id) => document.getElementById(id);
const coinsEl = el("coins");
const perClickEl = el("perClick");
const perSecondEl = el("perSecond");
const totalClicksEl = el("totalClicks");
const clickUpgrade = el("clickUpgrade");
const autoUpgrade = el("autoUpgrade");
const megaUpgrade = el("megaUpgrade");

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    const loaded = saved ? { ...initialState, ...saved } : { ...initialState };
    // Missões reiniciam uma vez por dia, sem apagar o saldo ou as melhorias.
    if (loaded.missionDate !== todayKey()) {
      loaded.missionDate = todayKey();
      loaded.missionClicks = 0;
      loaded.missionEarned = 0;
      loaded.clickMissionClaimed = false;
      loaded.earnMissionClaimed = false;
    }
    return loaded;
  } catch {
    return { ...initialState, missionDate: todayKey() };
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function formatNumber(number) {
  return Math.floor(number).toLocaleString("pt-BR");
}

function clickPower() {
  return 1 + state.clickLevel + state.megaLevel * 10;
}

function coinsPerSecond() {
  return state.autoLevel;
}

function clickCost() {
  return Math.floor(25 * Math.pow(1.55, state.clickLevel));
}

function autoCost() {
  return Math.floor(75 * Math.pow(1.6, state.autoLevel));
}

function megaCost() {
  return Math.floor(250 * Math.pow(1.8, state.megaLevel));
}

function render() {
  coinsEl.textContent = formatNumber(state.coins);
  perClickEl.textContent = formatNumber(clickPower());
  perSecondEl.textContent = formatNumber(coinsPerSecond());
  totalClicksEl.textContent = formatNumber(state.totalClicks);

  el("clickLevel").textContent = state.clickLevel;
  el("autoLevel").textContent = state.autoLevel;
  el("megaLevel").textContent = state.megaLevel;
  el("clickCost").textContent = formatNumber(clickCost());
  el("autoCost").textContent = formatNumber(autoCost());
  el("megaCost").textContent = formatNumber(megaCost());

  clickUpgrade.disabled = state.coins < clickCost();
  autoUpgrade.disabled = state.coins < autoCost();
  megaUpgrade.disabled = state.coins < megaCost();

  updateAchievement("ach100", 100);
  updateAchievement("ach1000", 1000);
  updateAchievement("ach10000", 10000);
  renderMissions();
  updateBonusButton();
}

function updateAchievement(id, target) {
  const item = el(id);
  const unlocked = state.totalEarned >= target;
  item.classList.toggle("unlocked", unlocked);
  item.querySelector(".check").textContent = unlocked ? "✓" : "🔒";
}

function earnCoins(amount) {
  state.coins += amount;
  state.totalEarned += amount;
  state.missionEarned += amount;
  checkMissionRewards();
  saveGame();
  render();
}

function renderMissions() {
  const clicks = Math.min(state.missionClicks, 25);
  const earned = Math.min(state.missionEarned, 200);
  el("clickMissionText").textContent = `${clicks}/25${state.clickMissionClaimed ? " ✓" : ""}`;
  el("earnMissionText").textContent = `${earned}/200${state.earnMissionClaimed ? " ✓" : ""}`;
  el("clickMissionBar").style.width = `${clicks / 25 * 100}%`;
  el("earnMissionBar").style.width = `${earned / 200 * 100}%`;
  el("missionClicks").classList.toggle("completed", state.clickMissionClaimed);
  el("missionEarn").classList.toggle("completed", state.earnMissionClaimed);
  el("missionDate").textContent = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function checkMissionRewards() {
  if (state.missionClicks >= 25 && !state.clickMissionClaimed) {
    state.clickMissionClaimed = true;
    state.coins += 50;
    state.totalEarned += 50;
    showToast("Missão concluída! +50 moedas 🎉");
  }
  if (state.missionEarned >= 200 && !state.earnMissionClaimed) {
    state.earnMissionClaimed = true;
    state.coins += 100;
    state.totalEarned += 100;
    showToast("Tesouro completo! +100 moedas 🎉");
  }
}

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function floatText(amount) {
  const button = el("coinBtn");
  const text = document.createElement("span");
  text.className = "float-text";
  text.textContent = `+${formatNumber(amount)} 🪙`;
  text.style.left = `${25 + Math.random() * 45}%`;
  text.style.top = `${15 + Math.random() * 30}%`;
  button.appendChild(text);
  setTimeout(() => text.remove(), 850);
}

el("coinBtn").addEventListener("click", () => {
  const amount = clickPower();
  state.totalClicks += 1;
  state.missionClicks += 1;
  earnCoins(amount);
  floatText(amount);
});

clickUpgrade.addEventListener("click", () => {
  const cost = clickCost();
  if (state.coins < cost) return;
  state.coins -= cost;
  state.clickLevel += 1;
  saveGame();
  render();
  showToast("Dedos de aço comprado! +1 por clique.");
});

autoUpgrade.addEventListener("click", () => {
  const cost = autoCost();
  if (state.coins < cost) return;
  state.coins -= cost;
  state.autoLevel += 1;
  saveGame();
  render();
  showToast("Robô coletor comprado! +1 por segundo.");
});

megaUpgrade.addEventListener("click", () => {
  const cost = megaCost();
  if (state.coins < cost) return;
  state.coins -= cost;
  state.megaLevel += 1;
  saveGame();
  render();
  showToast("Toque de diamante comprado! +10 por clique.");
});

function updateBonusButton() {
  const button = el("bonusBtn");
  const status = el("bonusStatus");
  const remaining = Math.max(0, Math.ceil((state.bonusReadyAt - Date.now()) / 1000));
  button.disabled = remaining > 0;
  status.textContent = remaining > 0 ? `Volta em ${remaining}s` : "Disponível!";
}

el("bonusBtn").addEventListener("click", () => {
  if (Date.now() < state.bonusReadyAt) return;
  const reward = Math.max(25, clickPower() * 25 + coinsPerSecond() * 10);
  state.bonusReadyAt = Date.now() + 30000;
  earnCoins(reward);
  showToast(`Bônus relâmpago: +${formatNumber(reward)} moedas! ⚡`);
});

el("resetBtn").addEventListener("click", () => {
  const confirmed = confirm("Tem certeza que deseja apagar todo o progresso?");
  if (!confirmed) return;
  state = { ...initialState, missionDate: todayKey() };
  saveGame();
  render();
  showToast("Progresso reiniciado.");
});

// Gera moedas automaticamente uma vez por segundo.
setInterval(() => {
  const income = coinsPerSecond();
  if (income > 0) earnCoins(income);
  else updateBonusButton();
  updateBonusButton();
}, 1000);

render();
