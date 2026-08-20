/* ============================================================
   小役カウンター
============================================================ */

const KEYS = ["bell", "cherry", "orangeP", "orangeS", "kakutei"];
const STORAGE_KEY = "kerotto5_counters_v1";

let state = {
  bell: 0,
  cherry: 0,
  orangeP: 0,
  orangeS: 0,
  kakutei: 0
};

let counterMode = "plus";

// 読み込み
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      KEYS.forEach(k => {
        if (typeof parsed[k] === "number") state[k] = parsed[k];
      });
    }
  } catch (e) {}
}

// 保存
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 画面反映
function render() {
  document.getElementById("bell-count").textContent = state.bell;
  document.getElementById("cherry-count").textContent = state.cherry;
  document.getElementById("orangeP-count").textContent = state.orangeP;
  document.getElementById("orangeS-count").textContent = state.orangeS;
  document.getElementById("kakutei-count").textContent = state.kakutei;

  renderRates();       // 小役確率
  renderBonusRates();  // ボーナス確率＋回数
}

// 小役確率（1/x）
function renderRates() {
  const myGames = playData.total - playData.start;

  if (myGames <= 0) {
    KEYS.forEach(key => {
      document.getElementById(`${key}-rate`).textContent = "-";
    });
    return;
  }

  KEYS.forEach(key => {
    const count = state[key];
    if (count === 0) {
      document.getElementById(`${key}-rate`).textContent = "-";
      return;
    }
    const rate = (myGames / count).toFixed(1);
    document.getElementById(`${key}-rate`).textContent = `1/${rate}`;
  });
}

// 初期化（枠全押し＋派手フラッシュ対応）
const FLASH_COLORS = {
  bell: "#ffe45c",     // 黄色
  cherry: "#ff4b4b",   // 赤
  orangeP: "#ffb86c",  // 薄オレンジ
  orangeS: "#ff8c00",  // 濃いオレンジ
  kakutei: "#b36bff"   // 紫
};

function setupCounters() {
  loadState();
  render();

  KEYS.forEach(key => {
  const box = document.querySelector(`.counter-box[data-key="${key}"]`);

  box.addEventListener("click", () => {
    if (counterMode === "plus") {
      state[key] += 1;
    } else {
      state[key] = Math.max(0, state[key] - 1);
    }
    saveState();
    render();

    try { navigator.vibrate([150]); } catch (e) {}

    // 枠の派手フラッシュ
    box.classList.add("flash");
    setTimeout(() => box.classList.remove("flash"), 250);

    // 画面全体フラッシュ
    const flashColor = FLASH_COLORS[key];
    document.body.style.setProperty("--flash-color", flashColor);
    document.body.classList.add("screen-flash");
    setTimeout(() => {
      document.body.classList.remove("screen-flash");
    }, 150);
  });   // ← addEventListener の閉じ
});     // ← ★これが抜けてた（forEach の閉じ）




  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("全消去しますか？")) return;
    KEYS.forEach(k => state[k] = 0);
    saveState();
    render();
  });

  document.getElementById("counter-mode-btn").addEventListener("click", () => {
    counterMode = counterMode === "plus" ? "minus" : "plus";
    document.getElementById("counter-mode-btn").textContent =
      `モード：${counterMode === "plus" ? "＋" : "−"}`;
  });
}


/* ============================================================
   ボーナス登録
============================================================ */

const BONUS_KEY = "kerotto5_bonus_history_v1";
let bonusHistory = [];

function loadBonusHistory() {
  try {
    const saved = localStorage.getItem(BONUS_KEY);
    if (saved) bonusHistory = JSON.parse(saved);
  } catch (e) {}
}

function saveBonusHistory() {
  localStorage.setItem(BONUS_KEY, JSON.stringify(bonusHistory));
}

function renderBonusHistory() {
  const area = document.getElementById("bonus-history");
  const count = document.getElementById("bonus-count");

  area.innerHTML = "";
  count.textContent = bonusHistory.length;

  bonusHistory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "bonus-item";

    div.innerHTML = `
      #${i + 1}  ${item.type} ← ${item.trigger}
      <button class="bonus-delete-btn" data-index="${i}">削除</button>
    `;

    area.appendChild(div);
  });

  document.querySelectorAll(".bonus-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      bonusHistory.splice(index, 1);
      saveBonusHistory();
      renderBonusHistory();
      renderBonusRates();
    });
  });
}

// ボーナス分類
function classifyBonus(type) {
  if (type === "赤SBB" || type === "白SBB") return "sbb";
  if (type === "赤BB" || type === "白BB") return "bb";
  if (type === "赤RB" || type === "白RB" || type === "フタバ赤" || type === "フタバ白") return "reg";
  return null;
}

// ボーナス確率＋回数表示
function renderBonusRates() {
  const myGames = playData.total - playData.start;

  if (myGames <= 0) {
    document.getElementById("rate-sbb").textContent = "-";
    document.getElementById("rate-bb").textContent = "-";
    document.getElementById("rate-reg").textContent = "-";
    document.getElementById("rate-big").textContent = "-";
    document.getElementById("rate-bonus").textContent = "-";

    document.getElementById("count-sbb").textContent = "0回";
    document.getElementById("count-bb").textContent = "0回";
    document.getElementById("count-reg").textContent = "0回";
    document.getElementById("count-big").textContent = "0回";
    document.getElementById("count-bonus").textContent = "0回";
    return;
  }

  let sbb = 0, bb = 0, reg = 0;

  bonusHistory.forEach(b => {
    const cat = classifyBonus(b.type);
    if (cat === "sbb") sbb++;
    if (cat === "bb") bb++;
    if (cat === "reg") reg++;
  });

  const big = sbb + bb;
  const total = sbb + bb + reg;

  function calc(count) {
    if (count === 0) return "-";
    return `1/${(myGames / count).toFixed(1)}`;
  }

  document.getElementById("rate-sbb").textContent = calc(sbb);
  document.getElementById("rate-bb").textContent = calc(bb);
  document.getElementById("rate-reg").textContent = calc(reg);
  document.getElementById("rate-big").textContent = calc(big);
  document.getElementById("rate-bonus").textContent = calc(total);

  document.getElementById("count-sbb").textContent = `${sbb}回`;
  document.getElementById("count-bb").textContent = `${bb}回`;
  document.getElementById("count-reg").textContent = `${reg}回`;
  document.getElementById("count-big").textContent = `${big}回`;
  document.getElementById("count-bonus").textContent = `${total}回`;
}

function setupBonus() {
  loadBonusHistory();
  renderBonusHistory();
  renderBonusRates();

  document.getElementById("bonus-save-btn").addEventListener("click", () => {
    const type = document.getElementById("bonus-type").value;
    const trigger = document.getElementById("bonus-trigger").value;

    if (!type || !trigger) {
      alert("ボーナス種類と当選契機を選択してください");
      return;
    }

    bonusHistory.push({ type, trigger });
    saveBonusHistory();
    renderBonusHistory();
    renderBonusRates();

    document.getElementById("bonus-type").value = "";
    document.getElementById("bonus-trigger").value = "";
  });

  const btn = document.getElementById("bonus-accordion-btn");
  const content = document.getElementById("bonus-accordion-content");

  btn.addEventListener("click", () => {
    content.classList.toggle("open");
    btn.innerHTML = content.classList.contains("open")
      ? `📜 ボーナス履歴（<span id="bonus-count">${bonusHistory.length}</span>件） ▲`
      : `📜 ボーナス履歴（<span id="bonus-count">${bonusHistory.length}</span>件） ▼`;
  });
}


/* ============================================================
   示唆入力
============================================================ */

const HINT_KEY = "kerotto5_hint_history_v1";
let hintHistory = [];

function loadHintHistory() {
  try {
    const saved = localStorage.getItem(HINT_KEY);
    if (saved) hintHistory = JSON.parse(saved);
  } catch (e) {}
}

function saveHintHistory() {
  localStorage.setItem(HINT_KEY, JSON.stringify(hintHistory));
}

function renderHintHistory() {
  const area = document.getElementById("hint-history");
  area.innerHTML = "";

  hintHistory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "hint-item";

    div.innerHTML = `
      #${i + 1}  ${item.text}
      <button class="hint-delete-btn" data-index="${i}">削除</button>
    `;

    area.appendChild(div);
  });

  document.querySelectorAll(".hint-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      hintHistory.splice(index, 1);
      saveHintHistory();
renderHintHistory();
recalcJudge();   // ★追加


    });
  });
}

function setupHints() {
  loadHintHistory();
  renderHintHistory();

  document.getElementById("freeze-btn").addEventListener("click", () => {
    hintHistory.push({ text: "🔥 ロングフリーズ（設定4以上確定）" });
    saveHintHistory();
    renderHintHistory();
    recalcJudge(); // ★追加
  });

  document.getElementById("hint-save-btn").addEventListener("click", () => {
    const trophy = document.getElementById("trophy-select").value;
    const reg = document.getElementById("reg-hint-select").value;
    const big = document.getElementById("big-end-select").value;

    if (trophy) hintHistory.push({ text: `🏆 トロフィー：${trophy}` });
    if (reg)    hintHistory.push({ text: `🎨 REG中示唆：${reg}` });
    if (big)    hintHistory.push({ text: `🖼 BIG終了画面：${big}` });

    saveHintHistory();
    renderHintHistory();
    recalcJudge(); // ★追加

    document.getElementById("trophy-select").value = "";
    document.getElementById("reg-hint-select").value = "";
    document.getElementById("big-end-select").value = "";
  });

  document.getElementById("hint-clear-btn").addEventListener("click", () => {
    if (!confirm("示唆履歴をすべて削除しますか？")) return;
    hintHistory = [];
    saveHintHistory();
    renderHintHistory();
    recalcJudge(); // ★追加
  });

  const hbtn = document.getElementById("hint-accordion-btn");
  const hcontent = document.getElementById("hint-accordion-content");

  hbtn.addEventListener("click", () => {
    hcontent.classList.toggle("open");
    hbtn.innerHTML = hcontent.classList.contains("open")
      ? "📜 示唆履歴 ▲"
      : "📜 示唆履歴 ▼";
  });
}


/* ============================================================
   プレイ数入力
============================================================ */

const PLAY_KEY = "kerotto5_play_data_v1";
let playData = {
  start: 0,
  total: 0
};

function loadPlayData() {
  try {
    const saved = localStorage.getItem(PLAY_KEY);
    if (saved) playData = JSON.parse(saved);
  } catch (e) {}
}

function savePlayData() {
  localStorage.setItem(PLAY_KEY, JSON.stringify(playData));
}

function renderPlayData() {
  const myGames = playData.total - playData.start;
  document.getElementById("my-games").textContent = myGames >= 0 ? myGames : 0;

  document.getElementById("start-games").value = playData.start;
  document.getElementById("total-games").value = playData.total;

  render(); // 小役＋ボーナス確率更新
}

function setupPlayInput() {
  loadPlayData();
  renderPlayData();

  document.getElementById("play-save-btn").addEventListener("click", () => {
    const start = Number(document.getElementById("start-games").value);
    const total = Number(document.getElementById("total-games").value);

    if (isNaN(start) || isNaN(total)) {
      alert("数値を入力してください");
      return;
    }

    playData.start = start;
    playData.total = total;

    savePlayData();
    renderPlayData();
  });
}


/* ============================================================
   設定判別（カード風・空欄）
============================================================ */

function renderJudge() {
  const area = document.getElementById("judge-cards");
  area.innerHTML = "";

  for (let i = 1; i <= 6; i++) {
    const div = document.createElement("div");
    div.className = "judge-card";
    div.textContent = `設定${i}：`;
    area.appendChild(div);
  }
}


/* ============================================================
   初期化
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  setupCounters();
  setupBonus();
  setupHints();
  setupPlayInput();
  renderJudge();
});
/* ============================================================
   設定判別：自動反映
============================================================ */

document.getElementById("judge-btn").addEventListener("click", () => {
  const judgeState = collectJudgeState();
const result = calcSettingScores(judgeState);
renderJudgeResult(result, judgeState.hints);
});
/* ============================================================
   契機 → ROLE_BONUS キー変換
============================================================ */

const TRIGGER_MAP = {
  "リプレイ": {
    "赤SBB": "replay_big_red",
    "白SBB": "replay_big_white",
    "赤BB":  "replay_big_red",
    "白BB":  "replay_big_white",
    "赤RB":  "replay_reg_red",
    "白RB":  "replay_reg_white",
    "フタバ赤": "replay_reg_red",
    "フタバ白": "replay_reg_white"
  },

  "平行オレンジ": {
    "赤BB":  "orangeP_big_red",
    "白BB":  "orangeP_big_white",
    "赤RB":  "orangeP_reg_red",
    "白RB":  "orangeP_reg_white",
    "フタバ赤": "orangeP_reg_red",
    "フタバ白": "orangeP_reg_white"
  },

  "斜めオレンジ": {
    "赤BB":  "orangeS_big_red",
    "白BB":  "orangeS_big_white",
    "赤RB":  "orangeS_reg_red2",
    "白RB":  "orangeS_reg_white2",
    "フタバ赤": "orangeS_reg_red2",
    "フタバ白": "orangeS_reg_white2",
    "赤SBB": "orangeS_spbig_red",
    "白SBB": "orangeS_spbig_white"
  },

  "チェリー": {
    "赤BB": "cherry_big_red",
    "白BB": "cherry_big_white",
    "赤RB": "cherry_reg_red",
    "白RB": "cherry_reg_white",
    "フタバ赤": "cherry_reg_red",
    "フタバ白": "cherry_reg_white"
  },

  "確定役": {
    "赤BB": "kakutei_big_red",
    "白BB": "kakutei_big_white",
    "赤RB": "kakutei_reg_red",
    "白RB": "kakutei_reg_white",
    "フタバ赤": "kakutei_reg_red",
    "フタバ白": "kakutei_reg_white",
    "赤SBB": "kakutei_spbig_red",
    "白SBB": "kakutei_spbig_white"
  },

  "単独": {
    "白SBB": "tandoku_spbig_white"
  }
};

function collectJudgeState() {
  const myGames = playData.total - playData.start;

  let red = 0, white = 0;
  bonusHistory.forEach(b => {
    if (b.type.includes("赤")) red++;
    if (b.type.includes("白")) white++;
  });

  const roleHits = {};
bonusHistory.forEach(b => {
  const bonusType = b.type.trim();
const trigger = b.trigger.trim();


  if (TRIGGER_MAP[trigger] && TRIGGER_MAP[trigger][bonusType]) {
    const roleKey = TRIGGER_MAP[trigger][bonusType];
    if (!roleHits[roleKey]) roleHits[roleKey] = 0;
    roleHits[roleKey]++;
  }
});


  const hints = {};

hintHistory.forEach(h => {
  if (h.text.includes("BIG終了画面")) {
    let val = h.text.replace("🖼 BIG終了画面：", "");
    // ★ ① / ② を 1 / 2 に変換
    val = val.replace("①", "1").replace("②", "2");
    hints.bigEnd = val;
  }

  if (h.text.includes("REG中示唆")) {
    hints.regEffect = h.text.replace("🎨 REG中示唆：", "");
  }

  if (h.text.includes("トロフィー")) {
    const val = h.text.replace("🏆 トロフィー：", "");
    hints.trophy = val;
  }

  if (h.text.includes("ロングフリーズ")) {
    // 強いトロフィーが既にあるなら上書きしない
    if (!["虹", "ケロット柄", "金2"].includes(hints.trophy)) {
      hints.trophy = "金1"; // 設定4以上確定
    }
  }
});




  return {
    games: myGames,
    bell: state.bell,
    cherry: state.cherry,
    orangeP: state.orangeP,
    orangeS: state.orangeS,
    kakutei: state.kakutei,

    sbb: bonusHistory.filter(b => classifyBonus(b.type) === "sbb").length,
    bb:  bonusHistory.filter(b => classifyBonus(b.type) === "bb").length,
    reg: bonusHistory.filter(b => classifyBonus(b.type) === "reg").length,
    totalBonus: bonusHistory.length,

    redBonusCount: red,
    whiteBonusCount: white,

    roleHits,
    hints
  };
}
function renderJudgeResult(result) {
  const cards = document.querySelectorAll(".judge-card");

  cards.forEach((card, i) => {
    const setting = i + 1;
    const percent = result[setting] ?? 0;
    card.textContent = `設定${setting}：${percent}%`;
  });
}



/* ============================================================
   ケロット5 設定判別ロジック 完全版
   2525専用カスタム（全データ反映）
============================================================ */

// ------------------------------------------------------------
// 小役確率（設定差あり）
// ------------------------------------------------------------
const SETTING_KOYAKU = {
  1: { bell: 7.0, cherry: 24.2, orangeP: 91.4, orangeS: 187.3, kakutei: 1524.1 },
  2: { bell: 6.9, cherry: 23.9, orangeP: 90.5, orangeS: 184.1, kakutei: 1524.1 },
  3: { bell: 6.9, cherry: 22.8, orangeP: 89.5, orangeS: 181.0, kakutei: 1489.5 },
  4: { bell: 6.8, cherry: 22.2, orangeP: 87.7, orangeS: 177.1, kakutei: 1310.7 }, // ←修正済み
  5: { bell: 6.6, cherry: 21.6, orangeP: 86.8, orangeS: 171.1, kakutei: 1191.6 },
  6: { bell: 6.5, cherry: 21.0, orangeP: 84.9, orangeS: 163.0, kakutei: 993.0 }
};

// ------------------------------------------------------------
// ボーナス確率
// ------------------------------------------------------------
const SETTING_BONUS = {
  1: { sbb: 464.79, bb: 464.79, reg: 350.46, big: 232.40, total: 139.74 },
  2: { sbb: 461.52, bb: 461.52, reg: 341.33, big: 230.76, total: 137.68 },
  3: { sbb: 458.29, bb: 458.29, reg: 324.44, big: 229.15, total: 134.30 },
  4: { sbb: 436.91, bb: 436.91, reg: 299.25, big: 218.45, total: 126.27 },
  5: { sbb: 431.16, bb: 431.16, reg: 274.21, big: 215.58, total: 120.69 },
  6: { sbb: 409.60, bb: 409.60, reg: 239.18, big: 204.80, total: 110.33 }
};

// ------------------------------------------------------------
// トロフィー（確定系）
// ------------------------------------------------------------
const SETTING_TROPHY = {
  "銅": 2,
  "銀": 3,
  "金": 4,
  "ケロット柄": 5,
  "虹": 6
};

// ------------------------------------------------------------
// BIG終了画面示唆
// ------------------------------------------------------------
const ENDING_HINT_CONFIRM = {
  "銀": 2,
  "金1": 4,
  "金2": 5
};

const ENDING_HINT_SUGGEST = {
  "青1": { odd: +1 },
  "青2": { even: +1 },
  "赤": { high: +1 } // 設定4・5・6に均等＋1
};

// ------------------------------------------------------------
// REG目押しチャレンジ示唆
// ------------------------------------------------------------
const REG_HINT_CONFIRM = {
  "銀": 2,
  "金1": 4,
  "金2": 5
};

const REG_HINT_SUGGEST = {
  "赤": { high: +1 }
};

// ------------------------------------------------------------
// ボーナス色割合（赤7 / 白7）
// ------------------------------------------------------------
const SETTING_COLOR_RATIO = {
  1: { red: 55.0, white: 45.0 },
  2: { red: 45.4, white: 54.6 },
  3: { red: 54.9, white: 45.1 },
  4: { red: 45.3, white: 54.7 },
  5: { red: 54.9, white: 45.1 },
  6: { red: 45.1, white: 54.9 }
};

// ------------------------------------------------------------
// 小役契機ボーナス実質確率（全データ）
// ------------------------------------------------------------
const ROLE_BONUS = {

  replay_big_red:   { 1: 3640.9, 2: 5041.2, 3: 3640.9, 4: 5041.2, 5: 3449.3, 6: 5041.2 },
  replay_big_white: { 1: 5041.2, 2: 3640.9, 3: 5041.2, 4: 3449.3, 5: 5041.2, 6: 3449.3 },

  replay_reg_red:   { 1: 2048.0, 2: 2621.4, 3: 1872.5, 4: 2114.1, 5: 1560.4, 6: 1771.2 },
  replay_reg_white: {
    1: 2621.4,
    2: 1985.9,   // ←修正
    3: 2340.6,   // ←修正
    4: 1680.4,
    5: 1927.5,
    6: 1394.4
  },

  cherry_big_white: { 1: 7281.8, 2: 7281.8, 3: 7281.8, 4: 6553.6, 5: 6553.6, 6: 5957.8 },

  orangeP_big_red:  { 1: 3449.3, 2: 4369.1, 3: 3276.8, 4: 4096.0, 5: 2978.9, 6: 3855.1 },
  orangeP_big_white:{ 1: 4369.1, 2: 3276.8, 3: 4369.1, 4: 3120.8, 5: 4096.0, 6: 2730.7 },
  orangeP_reg_red:  { 1: 2340.6, 2: 2849.4, 3: 2184.5, 4: 2427.3, 5: 1820.4, 6: 2048.0 },

  orangeP_reg_white:{ 1: 2849.4, 2: 2184.5, 3: 2621.4, 4: 1820.4, 5: 2340.6, 6: 1560.4 },
  orangeS_spbig_red:{ 1: 3120.8, 2: 4096.0, 3: 2978.9, 4: 3640.9, 5: 2849.4, 6: 3449.3 },

  orangeS_spbig_white:{ 1: 4096.0, 2: 2978.9, 3: 3855.1, 4: 2849.4, 5: 3640.9, 6: 2621.4 },
  orangeS_big_red:     { 1: 2978.9, 2: 3640.9, 3: 2849.4, 4: 3640.9, 5: 2730.7, 6: 3449.3 },

  orangeS_big_white:{ 1: 3640.9, 2: 2978.9, 3: 3640.9, 4: 2730.7, 5: 3640.9, 6: 2621.4 },
  orangeS_reg_red2:{
    1: 1927.5,
    2: 2259.9,   // ←修正
    3: 1820.4,
    4: 2114.1,
    5: 1560.4,
    6: 1598.4
  },

  orangeS_reg_white2:{ 1: 2259.9, 2: 1820.4, 3: 2114.1, 4: 1724.6, 5: 1771.2, 6: 1337.5 },
  kakutei_spbig_red:  { 1: 5461.3, 2: 7281.8, 3: 5461.3, 4: 5957.8, 5: 4369.1, 6: 4681.1 },

  kakutei_spbig_white:{ 1: 7281.8, 2: 5461.3, 3: 7281.8, 4: 4681.1, 5: 5957.8, 6: 4369.1 },
  kakutei_big_red:     { 1: 9362.3, 2: 13107.2, 3: 9362.3, 4: 10922.7, 5: 7281.8, 6: 9362.3 },

  kakutei_big_white:{ 1: 13107.2, 2: 9362.3, 3: 13107.2, 4: 8192.0, 5: 10922.7, 6: 6553.6 },
  kakutei_reg_red:   { 1: 10922.7, 2: 16384.0, 3: 10922.7, 4: 13107.2, 5: 9362.3, 6: 6553.6 },

  kakutei_reg_white:{ 1: 16384.0, 2: 10922.7, 3: 13107.2, 4: 10922.7, 5: 9362.3, 6: 6553.6 },
  tandoku_spbig_white:{ 1: null, 2: null, 3: null, 4: 65536.0, 5: 32768.0, 6: 16384.0 }
};

// ------------------------------------------------------------
// 判別ロジック本体
// ------------------------------------------------------------
function calcSettingScores(state) {

  const scores = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const g = state.games || 1;

  // 小役
  for (let s=1; s<=6; s++) {
    const k = SETTING_KOYAKU[s];
    scores[s] += closeness(state.bell, g / k.bell);
    scores[s] += closeness(state.cherry, g / k.cherry);
    scores[s] += closeness(state.orangeP, g / k.orangeP);
    scores[s] += closeness(state.orangeS, g / k.orangeS);
    scores[s] += closeness(state.kakutei, g / k.kakutei);
  }

  // ボーナス
  for (let s=1; s<=6; s++) {
    const b = SETTING_BONUS[s];
    scores[s] += closeness(state.sbb, g / b.sbb);
    scores[s] += closeness(state.bb, g / b.bb);
    scores[s] += closeness(state.reg, g / b.reg);
    scores[s] += closeness(state.totalBonus, g / b.total);
  }

  // ボーナス色割合
  const totalColor = (state.redBonusCount||0) + (state.whiteBonusCount||0);
  if (totalColor > 0) {
    const redRate = (state.redBonusCount / totalColor) * 100;
    const whiteRate = (state.whiteBonusCount / totalColor) * 100;
    for (let s=1; s<=6; s++) {
      const r = SETTING_COLOR_RATIO[s];
      scores[s] += rateCloseness(redRate, r.red);
      scores[s] += rateCloseness(whiteRate, r.white);
    }
  }

  // 小役契機ボーナス
  if (state.roleHits) {
    for (const role in state.roleHits) {
      const count = state.roleHits[role];
      if (!ROLE_BONUS[role]) continue;
      for (let s=1; s<=6; s++) {
        const exp = g / ROLE_BONUS[role][s];
        scores[s] += closeness(count, exp);
      }
    }
  }

  

  // 正規化して％化
  const minScore = Math.min(...Object.values(scores));
  const shifted = {};
  for (let s=1; s<=6; s++) shifted[s] = scores[s] - minScore + 1;
  const sum = Object.values(shifted).reduce((a,b)=>a+b,0);
  const percent = {};
  for (let s=1; s<=6; s++) percent[s] = Math.round((shifted[s]/sum)*100);

  return percent;
}


// ------------------------------------------------------------
// 近さ評価
// ------------------------------------------------------------
function closeness(actual, expected) {
  if (expected <= 0) return 0;
  const diff = Math.abs(actual - expected);
  return Math.max(0, 10 - diff / Math.max(1, expected / 10));
}

function rateCloseness(actualRate, expectedRate) {
  const diff = Math.abs(actualRate - expectedRate);
  return Math.max(0, 10 - diff / 2);
}

// ------------------------------------------------------------
// 示唆反映
// ------------------------------------------------------------
function applyHints(scores, state) {

  const hints = state.hints || {};

  // BIG終了画面
  if (hints.bigEnd) {
    const h = hints.bigEnd;

    if (ENDING_HINT_CONFIRM[h]) {
      const min = ENDING_HINT_CONFIRM[h];
      for (let s=1; s<=6; s++) {
        if (s < min) scores[s] = -9999;
        else scores[s] += 10;
      }
    }

    if (ENDING_HINT_SUGGEST[h]) {
      const info = ENDING_HINT_SUGGEST[h];
      if (info.odd) {
        scores[1]+=info.odd; scores[3]+=info.odd; scores[5]+=info.odd;
      }
      if (info.even) {
        scores[2]+=info.even; scores[4]+=info.even; scores[6]+=info.even;
      }
      if (info.high) {
        scores[4]+=info.high; scores[5]+=info.high; scores[6]+=info.high;
      }
    }
  }

  // REG目押し
  if (hints.regEffect) {
    const h = hints.regEffect;

    if (REG_HINT_CONFIRM[h]) {
      const min = REG_HINT_CONFIRM[h];
      for (let s=1; s<=6; s++) {
        if (s < min) scores[s] = -9999;
        else scores[s] += 10;
      }
    }

    if (REG_HINT_SUGGEST[h]) {
      const info = REG_HINT_SUGGEST[h];
      if (info.high) {
        scores[4]+=info.high; scores[5]+=info.high; scores[6]+=info.high;
      }
    }
  }
}
function recalcJudge() {
  const judgeState = collectJudgeState();
  const result = calcSettingScores(judgeState);
  renderJudgeResult(result, judgeState.hints);
}

/* ============================================================
   ここまでが完全版。
   UI側では calcSettingScores(state) を呼べばOK。
============================================================ */
document.getElementById("all-clear-btn").addEventListener("click", () => {

  const ok = confirm("本当に全データを削除しますか？\n（ゲーム数・小役・ボーナス・示唆履歴すべて）");

  if (!ok) return;  // キャンセルなら何もしない

  // localStorage 全削除
  localStorage.clear();

  // 小役カウンター初期化
  state = {
    bell: 0,
    cherry: 0,
    orangeP: 0,
    orangeS: 0,
    kakutei: 0
  };

  // ボーナス履歴初期化
  bonusHistory = [];
  document.getElementById("bonus-history").innerHTML = "";
  document.getElementById("bonus-count").textContent = 0;

  // 示唆履歴初期化
  hintHistory = [];
  document.getElementById("hint-history").innerHTML = "";

  // ゲーム数初期化
  document.getElementById("start-games").value = "";
  document.getElementById("total-games").value = "";
  document.getElementById("my-games").textContent = 0;

  // 再描画
  saveState();
  render();

  alert("全データを削除しました");
});
