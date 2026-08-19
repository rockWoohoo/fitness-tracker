// 健身紀錄 App
// 資料來源：Rock 實際訓練紀錄（fitness_profile 記憶 2026-08-11 更新 + 訓練紀錄表 運動也是蠻爽ㄉ.xlsx）
// 種子資料裡「今天」的胸/肩紀錄只是示範用的假資料，實際會對應到打開網頁那天的日期
//
// 資料模型：每個動作有 history，用日期字串 (YYYY-MM-DD) 當 key 存當天的 SessionData，
// 這樣「今天」「上次」都只是對 history 的查詢，日期欄位切換、輸出報表跨日彙整都建立在同一份資料上。
// SessionData 結構：{ generalSets:[{reps,weight}], dropSets:[{reps,weight,note?}], note }
// 整份 BODY_PARTS + WEIGHT_LOG 會存進 localStorage，重新整理頁面不會遺失。

function uniformSets(count, reps, weight) {
  return Array.from({ length: count }, () => ({ reps, weight }));
}

function pad2(n) { return String(n).padStart(2, '0'); }
function toISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

// 裝置當天日期，不是寫死的字串——每次打開都會是真正的今天
const TODAY = toISODate(new Date());

// 種子資料：只在瀏覽器第一次開啟、還沒有存檔時使用；之後一律從 localStorage 讀取
function seedBodyParts() {
  return [
    {
      key: 'chest', name: '胸', color: 'blue', archived: [],
      exercises: [
        {
          name: '史密斯平推',
          history: {
            '2026-06-20': { generalSets: uniformSets(4, 8, 55), dropSets: [], note: '' },
            [TODAY]: { generalSets: uniformSets(4, 10, 60), dropSets: [], note: '右上胸有悶痛感（不到痛），氣胸恢復期保守處理，先不加重' },
          },
        },
        {
          name: '史密斯上斜',
          history: {
            '2026-06-09': { generalSets: uniformSets(4, 12, 50), dropSets: [], note: '' },
            [TODAY]: { generalSets: uniformSets(4, 12, 45), dropSets: [], note: '' },
          },
        },
        {
          name: '上斜夾胸',
          history: {
            '2026-06-09': { generalSets: uniformSets(4, 12, 50), dropSets: [], note: '' },
            [TODAY]: { generalSets: uniformSets(4, 12, 35), dropSets: [], note: '' },
          },
        },
        {
          name: '機械夾胸',
          history: {
            '2026-06-09': { generalSets: uniformSets(4, 12, 59), dropSets: [], note: '' },
            [TODAY]: { generalSets: uniformSets(4, 12, 59), dropSets: [], note: '' },
          },
        },
      ],
    },
    {
      key: 'shoulder', name: '肩', color: 'amber', archived: [],
      exercises: [
        {
          name: '啞鈴側平舉',
          history: {
            '2026-06-20': { generalSets: uniformSets(4, 12, 8), dropSets: [], note: '' },
            [TODAY]: { generalSets: uniformSets(4, 12, 10), dropSets: [], note: '' },
          },
        },
        {
          name: '蝴蝶後展',
          history: {
            [TODAY]: { generalSets: uniformSets(4, 12, 39), dropSets: [], note: '新增動作，取代/補充原本的蝴蝶機後三角' },
          },
        },
      ],
    },
    {
      key: 'back', name: '背', color: 'violet', archived: [],
      exercises: [
        {
          name: '寬握Cable',
          history: {
            '2026-08-11': {
              generalSets: uniformSets(4, 12, 41.3),
              dropSets: [{ reps: null, weight: 28.5, note: '弱點加量：降重力竭組（抓原重量六到七成，練到真力竭）' }],
              note: '',
            },
          },
        },
        { name: '窄握Cable', history: { '2026-08-11': { generalSets: uniformSets(4, 12, 41.3), dropSets: [], note: '' } } },
        { name: '機械下拉', history: { '2026-08-11': { generalSets: uniformSets(4, 12, 47.5), dropSets: [], note: '' } } },
        { name: '槓鈴划船', history: {} },
      ],
    },
    {
      key: 'arm', name: '手臂', color: 'pink', archived: [],
      exercises: [
        { name: '後仰坐姿彎舉', history: { '2026-08-11': { generalSets: uniformSets(4, 12, 8), dropSets: [], note: '刻意降重，找回動作感受度' } } },
        { name: '後仰坐姿垂式彎舉', history: { '2026-08-11': { generalSets: uniformSets(4, 12, 8), dropSets: [], note: '' } } },
        { name: 'Cable下壓', history: { '2026-08-11': { generalSets: uniformSets(4, 12, 18), dropSets: [], note: '原為啞鈴過頭彎舉，換動作避開手肘鷹嘴突痛點' } } },
      ],
    },
    {
      key: 'leg', name: '腿', color: 'teal', archived: [],
      exercises: [
        { name: '腿推', history: { '2026-06-20': { generalSets: uniformSets(4, 10, 54.3), dropSets: [], note: '' } } },
        { name: '機械前伸展', history: { '2026-06-20': { generalSets: uniformSets(4, 10, 27.3), dropSets: [], note: '' } } },
        { name: '機械開腿', history: { '2026-06-20': { generalSets: uniformSets(4, 10, 32), dropSets: [], note: '' } } },
        { name: '機械夾腿', history: { '2026-06-20': { generalSets: uniformSets(4, 10, 32), dropSets: [], note: '' } } },
      ],
    },
    {
      key: 'abs', name: '腹', color: 'green', archived: [],
      exercises: [
        { name: '啞鈴捲腹', history: { '2026-06-20': { generalSets: uniformSets(3, 24, 7.5), dropSets: [], note: '' } } },
        { name: '啞鈴側捲腹', history: { '2026-06-20': { generalSets: uniformSets(3, 24, 7.5), dropSets: [], note: '' } } },
        { name: '下腹抬腿', history: { '2026-06-20': { generalSets: uniformSets(3, 24, null), dropSets: [], note: '自體重量，頂點腳垂直上抬' } } },
      ],
    },
  ];
}

// 來源：BodyComposition_202601-202608.csv（體脂機原始匯出）；同一天有多筆量測時，
// 依 App 自己的儲存規則只留當天最後一筆（例如 2026-04-04 當天量了三次，取 23:44 那筆）
function seedWeightLog() {
  return [
    { date: '2026-03-08', weight: 79.7, bodyFat: 24.6 },
    { date: '2026-03-23', weight: 82.2, bodyFat: 23.7 },
    { date: '2026-03-26', weight: 82.0, bodyFat: 25.3 },
    { date: '2026-03-30', weight: 79.5, bodyFat: 25.1 },
    { date: '2026-04-02', weight: 80.5, bodyFat: 24.9 },
    { date: '2026-04-04', weight: 81.8, bodyFat: 24.7 },
    { date: '2026-04-08', weight: 81.0, bodyFat: 24.6 },
    { date: '2026-04-13', weight: 79.8, bodyFat: 23.9 },
    { date: '2026-04-15', weight: 80.9, bodyFat: 21.5 },
    { date: '2026-04-17', weight: 80.7, bodyFat: 23.3 },
    { date: '2026-04-21', weight: 80.1, bodyFat: 24.2 },
    { date: '2026-04-23', weight: 79.6, bodyFat: 24.3 },
    { date: '2026-04-28', weight: 78.4, bodyFat: 23.9 },
    { date: '2026-04-30', weight: 78.5, bodyFat: 24.1 },
    { date: '2026-05-01', weight: 77.8, bodyFat: 24.2 },
    { date: '2026-05-12', weight: 78.0, bodyFat: 22.7 },
    { date: '2026-05-14', weight: 76.9, bodyFat: 22.9 },
    { date: '2026-05-15', weight: 77.2, bodyFat: 23.0 },
    { date: '2026-05-19', weight: 76.4, bodyFat: 22.3 },
    { date: '2026-05-24', weight: 75.5, bodyFat: 23.1 },
    { date: '2026-05-26', weight: 74.8, bodyFat: 23.4 },
    { date: '2026-05-27', weight: 74.7, bodyFat: 23.1 },
    { date: '2026-05-29', weight: 74.0, bodyFat: 22.6 },
    { date: '2026-06-06', weight: 73.8, bodyFat: 22.8 },
    { date: '2026-06-08', weight: 72.8, bodyFat: 22.7 },
    { date: '2026-06-11', weight: 73.4, bodyFat: 22.4 },
    { date: '2026-06-20', weight: 73.8, bodyFat: 21.3 },
    { date: '2026-06-25', weight: 74.4, bodyFat: 21.4 },
    { date: '2026-07-05', weight: 72.6, bodyFat: 21.1 },
    { date: '2026-07-24', weight: 73.7, bodyFat: 20.9 },
    { date: '2026-07-28', weight: 71.0, bodyFat: 21.2 },
    { date: '2026-07-29', weight: 71.7, bodyFat: 20.9 },
    { date: '2026-08-03', weight: 72.0, bodyFat: 20.6 },
  ];
}

const BODY_PARTS = seedBodyParts();
const WEIGHT_LOG = seedWeightLog();

// ---------- 資料持久化（localStorage）----------
const STORAGE_KEY = 'fitness-tracker-v1';

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ bodyParts: BODY_PARTS, weightLog: WEIGHT_LOG }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.bodyParts)) BODY_PARTS.splice(0, BODY_PARTS.length, ...data.bodyParts);
    if (Array.isArray(data.weightLog)) WEIGHT_LOG.splice(0, WEIGHT_LOG.length, ...data.weightLog);
  } catch (e) {
    // 存檔壞掉就沿用種子資料，不讓整個 App 掛掉
  }
}
loadState();

const DEFAULT_GENERAL_SETS = 4;
const SET_LABELS = '一二三四五六七八九十';

const ICONS = {
  calendar: '<path d="M7 2v3M17 2v3M3.5 8.5h17M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>',
  edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/>',
  check: '<path d="M4 12.5 9.5 18 20 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  timer: '<path d="M12 8v5l3 2"/><circle cx="12" cy="13.5" r="8"/><path d="M9.5 2h5M12 2v2.5"/>',
  chest: '<circle cx="8" cy="13" r="4"/><circle cx="16" cy="13" r="4"/>',
  shoulder: '<circle cx="6" cy="9" r="3"/><circle cx="18" cy="9" r="3"/><path d="M9 9h6"/>',
  back: '<path d="M12 4 4 20M12 4l8 16M12 4v16"/>',
  arm: '<path d="M5 19l5-5c2-2 2-5 0-7"/><circle cx="15" cy="7" r="2.3"/>',
  leg: '<path d="M10 4v9l-3 7"/><path d="M14 4v9l3 7"/>',
  abs: '<rect x="8" y="4.5" width="3.4" height="4" rx="1"/><rect x="12.6" y="4.5" width="3.4" height="4" rx="1"/><rect x="8" y="10" width="3.4" height="4" rx="1"/><rect x="12.6" y="10" width="3.4" height="4" rx="1"/><rect x="8" y="15.5" width="3.4" height="4" rx="1"/><rect x="12.6" y="15.5" width="3.4" height="4" rx="1"/>',
  chart: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/>',
  export: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  archive: '<path d="M4 4h16l-1.2 3H5.2Z"/><path d="M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7"/><path d="M9.5 11.5h5"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
  addRing: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  dragHandle: '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
};

function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

// 目前正在檢視的日期（首頁／清單／紀錄共用），預設今天；身體組成頁另外有自己的日期
let viewDate = TODAY;

function getSession(ex, date) { return ex.history[date] || null; }

// 帶入用：找 date 之前最近一筆有資料的日期
function getPreviousSession(ex, date) {
  const dates = Object.keys(ex.history).filter((d) => d < date).sort();
  if (!dates.length) return null;
  return ex.history[dates[dates.length - 1]];
}

// 清單上的最高/最低重量，只依「檢視日期」的資料計算；當天沒填就不顯示（WF：若無填寫則不顯示）
function fmtWeight(ex, date) {
  const d = getSession(ex, date);
  if (!d) return '';
  const weights = [...d.generalSets, ...d.dropSets].map((s) => s.weight).filter((w) => w != null);
  if (!weights.length) return '自體重量';
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  return max === min ? `${max} kgs` : `${max} kgs / ${min} kgs`;
}

// ---------- 首頁 ----------
function renderHome() {
  const grid = document.getElementById('bodyPartGrid');
  grid.innerHTML = BODY_PARTS.map((bp) => {
    const done = bp.exercises.some((ex) => !!getSession(ex, viewDate));
    return `
    <button class="part-card part-card--${bp.color}" data-key="${bp.key}">
      ${done ? `<span class="part-card__badge">${icon('check')}</span>` : ''}
      <span class="part-card__icon">${icon(bp.key)}</span>
      <span class="part-card__name">${bp.name}</span>
    </button>
  `;
  }).join('');
  grid.querySelectorAll('.part-card').forEach((el) => {
    el.addEventListener('click', () => openList(el.dataset.key));
  });
}

// ---------- 動作清單 ----------
function renderExerciseList(key) {
  const bp = BODY_PARTS.find((b) => b.key === key);
  document.getElementById('listTitle').textContent = bp.name;
  const wrap = document.getElementById('exerciseList');
  wrap.innerHTML = bp.exercises.map((ex, i) => {
    const weightText = fmtWeight(ex, viewDate);
    return `
    <button class="exercise-card" data-key="${key}" data-idx="${i}">
      <span class="exercise-card__name">${ex.name}</span>
      ${weightText ? `<span class="exercise-card__weight">${weightText}</span>` : `<span class="exercise-card__weight exercise-card__weight--empty">尚無當日紀錄</span>`}
    </button>`;
  }).join('');
  wrap.querySelectorAll('.exercise-card').forEach((el) => {
    el.addEventListener('click', () => openRecord(el.dataset.key, +el.dataset.idx));
  });
}

let activeKey = null;

function openList(key) {
  activeKey = key;
  renderExerciseList(key);
  push('list');
}

// ---------- 編輯動作 ----------
let dragSrcIdx = null;

// 長按約 300ms 後才進入拖曳狀態，手指移動距離內若還沒到時間就當成正常捲動，
// 不會擋掉清單的上下滑動
function bindTouchReorder(row, list, bp) {
  let holdTimer = null;
  let dragging = false;
  let startY = 0;

  const cancelHold = () => clearTimeout(holdTimer);
  const endDrag = () => {
    dragging = false;
    row.style.transform = '';
    row.style.zIndex = '';
    row.classList.remove('dragging');
  };

  row.addEventListener('touchstart', (e) => {
    if (e.target.closest('.edit-row__archive')) return;
    startY = e.touches[0].clientY;
    holdTimer = setTimeout(() => {
      dragging = true;
      row.classList.add('dragging');
      row.style.zIndex = '10';
    }, 300);
  }, { passive: true });

  row.addEventListener('touchmove', (e) => {
    if (!dragging) { cancelHold(); return; }
    e.preventDefault();
    row.style.transform = `translateY(${e.touches[0].clientY - startY}px)`;
  }, { passive: false });

  row.addEventListener('touchend', (e) => {
    cancelHold();
    if (!dragging) return;
    const endY = e.changedTouches[0].clientY;
    endDrag();

    const rows = [...list.querySelectorAll('.edit-row')];
    let targetIdx = +rows[rows.length - 1].dataset.idx;
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (endY < rect.top + rect.height / 2) { targetIdx = +r.dataset.idx; break; }
    }
    const fromIdx = +row.dataset.idx;
    if (targetIdx !== fromIdx) {
      const [moved] = bp.exercises.splice(fromIdx, 1);
      bp.exercises.splice(targetIdx, 0, moved);
      saveState();
    }
    renderEdit();
  });

  row.addEventListener('touchcancel', () => { cancelHold(); endDrag(); });
}

function renderEdit() {
  const bp = BODY_PARTS.find((b) => b.key === activeKey);

  const list = document.getElementById('editList');
  list.innerHTML = bp.exercises.map((ex, i) => `
    <div class="edit-row" draggable="true" data-idx="${i}">
      <span class="edit-row__handle">${icon('dragHandle')}</span>
      <span class="edit-row__name">${ex.name}</span>
      <button class="edit-row__archive" data-idx="${i}">${icon('archive')}</button>
    </div>`).join('');

  list.querySelectorAll('.edit-row').forEach((row) => {
    // 滑鼠拖曳（桌面）
    row.addEventListener('dragstart', () => {
      dragSrcIdx = +row.dataset.idx;
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', (e) => e.preventDefault());
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIdx = +row.dataset.idx;
      if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
      const [moved] = bp.exercises.splice(dragSrcIdx, 1);
      bp.exercises.splice(targetIdx, 0, moved);
      dragSrcIdx = null;
      saveState();
      renderEdit();
    });

    // 觸控長按拖曳（手機）：HTML5 的 draggable 在觸控裝置上不會觸發，
    // 沒有這段的話手機長按只會變成瀏覽器內建的選取文字/放大鏡選單
    bindTouchReorder(row, list, bp);
  });

  list.querySelectorAll('.edit-row__archive').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('確定要封存此訓練動作嗎？')) return;
      const [removed] = bp.exercises.splice(+btn.dataset.idx, 1);
      bp.archived.push(removed);
      saveState();
      renderEdit();
    });
  });

  const archiveList = document.getElementById('archiveList');
  archiveList.innerHTML = bp.archived.length
    ? bp.archived.map((ex, i) => `
      <div class="archive-row">
        <span class="archive-row__name">${ex.name}</span>
        <button class="archive-row__restore" data-idx="${i}">${icon('addRing')}</button>
        <button class="archive-row__delete" data-idx="${i}">${icon('trash')}</button>
      </div>`).join('')
    : `<p class="archive-empty">目前沒有封存的動作</p>`;

  archiveList.querySelectorAll('.archive-row__restore').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [restored] = bp.archived.splice(+btn.dataset.idx, 1);
      bp.exercises.push(restored);
      saveState();
      renderEdit();
    });
  });
  archiveList.querySelectorAll('.archive-row__delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('確定要永久刪除此訓練動作嗎？')) return;
      bp.archived.splice(+btn.dataset.idx, 1);
      saveState();
      renderEdit();
    });
  });
}

function openEdit() {
  renderEdit();
  document.getElementById('archiveList').classList.remove('open');
  document.getElementById('archiveToggle').classList.remove('open');
  push('edit');
}

document.getElementById('listEditBtn').addEventListener('click', openEdit);
document.getElementById('editBack').addEventListener('click', () => {
  renderExerciseList(activeKey);
  renderHome();
  pop();
});
document.getElementById('archiveToggle').addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('open');
  document.getElementById('archiveList').classList.toggle('open');
});

// ---------- 新增動作 ----------
const addNameInput = document.getElementById('addNameInput');
const addNameError = document.getElementById('addNameError');
const addConfirmBtn = document.getElementById('addConfirmBtn');

function validateAddName(showError) {
  const trimmed = addNameInput.value.trim();
  addConfirmBtn.disabled = !(trimmed.length >= 2 && trimmed.length <= 15);
  if (!showError) { addNameError.textContent = ''; return; }
  if (trimmed.length === 0) addNameError.textContent = '此為必填欄位';
  else if (trimmed.length < 2) addNameError.textContent = '最少需有兩字';
  else addNameError.textContent = '';
}
addNameInput.addEventListener('input', () => validateAddName(false));
addNameInput.addEventListener('blur', () => {
  addNameInput.value = addNameInput.value.trim();
  validateAddName(true);
});

document.getElementById('addExerciseBtn').addEventListener('click', () => {
  addNameInput.value = '';
  addNameError.textContent = '';
  addConfirmBtn.disabled = true;
  push('add');
});
document.getElementById('addClose').addEventListener('click', pop);
addConfirmBtn.addEventListener('click', () => {
  if (addConfirmBtn.disabled) return;
  if (!confirm('確定要新增此訓練動作嗎？')) return;
  const bp = BODY_PARTS.find((b) => b.key === activeKey);
  bp.exercises.push({ name: addNameInput.value.trim(), history: {} });
  saveState();
  pop();
  renderEdit();
});

// ---------- 動作紀錄 ----------
let currentExercise = null;
let currentKey = null;
let workingSession = null; // { generalSets:[{reps,weight}], dropSets:[{reps,weight,note}], note }

function cloneSession(data) {
  if (!data) {
    return { generalSets: uniformSets(DEFAULT_GENERAL_SETS, null, null), dropSets: [{ reps: null, weight: null }], note: '' };
  }
  return {
    generalSets: data.generalSets.map((s) => ({ reps: s.reps, weight: s.weight })),
    dropSets: data.dropSets.map((s) => ({ reps: s.reps, weight: s.weight, note: s.note })),
    note: data.note || '',
  };
}

function bindLongPress(el, callback) {
  let timer;
  const start = (e) => {
    if (e.target.closest('.field__input')) return; // 輸入框內不觸發長按刪除
    timer = setTimeout(callback, 550);
  };
  const cancelT = () => clearTimeout(timer);
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: true });
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((evt) => el.addEventListener(evt, cancelT));
}

function setRowHtml(index, reps, weight, isDrop) {
  const label = isDrop
    ? `<span class="set-row__label">第${SET_LABELS[index]}組 <em class="tag-drop">降重</em></span>`
    : `<span class="set-row__label">第${SET_LABELS[index]}組</span>`;
  return `
    <div class="set-row ${isDrop ? 'set-row--drop' : 'set-row--general'}">
      ${label}
      <div class="field">
        <span class="field__label">次數</span>
        <input class="field__input" type="number" inputmode="decimal" placeholder="輸入次數" value="${reps ?? ''}">
      </div>
      <div class="field">
        <span class="field__label">重量(kgs)</span>
        <input class="field__input" type="number" inputmode="decimal" placeholder="輸入重量" value="${weight ?? ''}">
      </div>
    </div>`;
}

// 依 workingSession 完整重繪組數區塊，並綁定輸入同步 + 長按刪除
function renderWorkingSession() {
  const { generalSets, dropSets } = workingSession;
  let html = generalSets.map((s, i) => setRowHtml(i, s.reps, s.weight, false)).join('');
  if (dropSets.length) {
    html += `<div class="set-divider"></div>`;
    html += dropSets.map((s, i) => setRowHtml(generalSets.length + i, s.reps, s.weight, true)).join('');
  }
  document.getElementById('recordSets').innerHTML = html;

  // WF 組數列表規則：填寫的次數與組數於 unfocus 後直接寫入資料庫，不用等到離開整個畫面
  document.querySelectorAll('#recordSets .set-row--general').forEach((row, i) => {
    const [repsInput, weightInput] = row.querySelectorAll('.field__input');
    repsInput.addEventListener('input', () => { workingSession.generalSets[i].reps = repsInput.value === '' ? null : Number(repsInput.value); });
    weightInput.addEventListener('input', () => { workingSession.generalSets[i].weight = weightInput.value === '' ? null : Number(weightInput.value); });
    repsInput.addEventListener('blur', commitRecordToDate);
    weightInput.addEventListener('blur', commitRecordToDate);
    bindLongPress(row, () => {
      if (workingSession.generalSets.length <= 1) { alert('至少需保留一組'); return; }
      if (!confirm('確定要刪除此組嗎？')) return;
      workingSession.generalSets.splice(i, 1);
      renderWorkingSession();
    });
  });
  document.querySelectorAll('#recordSets .set-row--drop').forEach((row, i) => {
    const [repsInput, weightInput] = row.querySelectorAll('.field__input');
    repsInput.addEventListener('input', () => { workingSession.dropSets[i].reps = repsInput.value === '' ? null : Number(repsInput.value); });
    weightInput.addEventListener('input', () => { workingSession.dropSets[i].weight = weightInput.value === '' ? null : Number(weightInput.value); });
    repsInput.addEventListener('blur', commitRecordToDate);
    weightInput.addEventListener('blur', commitRecordToDate);
    bindLongPress(row, () => {
      if (!confirm('確定要刪除此組嗎？')) return;
      workingSession.dropSets.splice(i, 1);
      renderWorkingSession();
    });
  });
}

document.getElementById('addGeneralSetBtn').addEventListener('click', () => {
  workingSession.generalSets.push({ reps: null, weight: null });
  renderWorkingSession();
});
document.getElementById('addDropSetBtn').addEventListener('click', () => {
  workingSession.dropSets.push({ reps: null, weight: null });
  renderWorkingSession();
});

const recordNoteInput = document.getElementById('recordNote');
recordNoteInput.addEventListener('input', () => { workingSession.note = recordNoteInput.value; });
recordNoteInput.addEventListener('blur', commitRecordToDate);

function openRecord(key, idx) {
  const bp = BODY_PARTS.find((b) => b.key === key);
  const ex = bp.exercises[idx];
  currentKey = key;
  currentExercise = ex;
  workingSession = cloneSession(getSession(ex, viewDate));

  document.getElementById('recordTitle').textContent = ex.name;
  renderWorkingSession();
  recordNoteInput.value = workingSession.note;

  const bringInBtn = document.getElementById('bringInBtn');
  bringInBtn.classList.toggle('record-hint__btn--disabled', !getPreviousSession(ex, viewDate));

  push('record');
}

document.getElementById('bringInBtn').addEventListener('click', () => {
  if (!currentExercise) return;
  const prev = getPreviousSession(currentExercise, viewDate);
  if (!prev) return;
  if (!confirm('確定要帶入上次數據嗎？')) return;
  workingSession = cloneSession(prev);
  renderWorkingSession();
  recordNoteInput.value = workingSession.note;
});

// 離開動作紀錄畫面時，把目前欄位值寫回「檢視日期」那一天的紀錄
function commitRecordToDate() {
  if (!currentExercise) return;

  const hasData = workingSession.generalSets.some((s) => s.reps != null || s.weight != null)
    || workingSession.dropSets.some((s) => s.reps != null || s.weight != null);

  if (hasData) {
    currentExercise.history[viewDate] = cloneSession(workingSession);
  } else {
    delete currentExercise.history[viewDate];
  }
  saveState();
}

document.getElementById('recordBack').addEventListener('click', () => {
  commitRecordToDate();
  renderExerciseList(currentKey);
  renderHome();
  pop();
});

// ---------- 休息計時 ----------
let timerInterval = null;
let timerSeconds = 0;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function openTimerSheet() { document.getElementById('timerSheetOverlay').classList.add('show'); }
function closeTimerSheet() { document.getElementById('timerSheetOverlay').classList.remove('show'); }

document.getElementById('timerFabBtn').addEventListener('click', openTimerSheet);
document.getElementById('timerSheetClose').addEventListener('click', closeTimerSheet);
document.getElementById('timerSheetOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'timerSheetOverlay') closeTimerSheet();
});

// 倒數是 nav bar 下方的橫向區塊，不是遮罩，畫面上其他元件（組數輸入、備註、
// 返回、帶入…）全程都還能正常操作；休息結束則維持滿版遮罩，要按確認才關掉
function startCountdown(seconds) {
  timerSeconds = seconds;
  document.getElementById('countdownTime').textContent = formatTime(timerSeconds);
  document.getElementById('countdownBar').classList.add('show');
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      document.getElementById('countdownBar').classList.remove('show');
      document.getElementById('finishOverlay').classList.add('show');
      return;
    }
    document.getElementById('countdownTime').textContent = formatTime(timerSeconds);
  }, 1000);
}

document.querySelectorAll('.sheet__option').forEach((btn) => {
  btn.addEventListener('click', () => {
    const seconds = +btn.dataset.seconds;
    closeTimerSheet();
    startCountdown(seconds);
  });
});

// WF 取消說明：點擊則直接進入倒數完成狀態
document.getElementById('countdownCancel').addEventListener('click', () => {
  clearInterval(timerInterval);
  document.getElementById('countdownBar').classList.remove('show');
  document.getElementById('finishOverlay').classList.add('show');
});
document.getElementById('finishConfirm').addEventListener('click', () => {
  document.getElementById('finishOverlay').classList.remove('show');
});

// ---------- 身體組成（A2）----------
const bodyWeightInput = document.getElementById('bodyWeightInput');
const bodyFatInput = document.getElementById('bodyFatInput');
const bodySaveBtn = document.getElementById('bodySaveBtn');
const bodyDateInputEl = document.getElementById('bodyDateInput');

function validateBodyForm() {
  bodySaveBtn.disabled = !(bodyWeightInput.value !== '' && bodyFatInput.value !== '');
}
bodyWeightInput.addEventListener('input', validateBodyForm);
bodyFatInput.addEventListener('input', validateBodyForm);

function renderBodyHistory() {
  const wrap = document.getElementById('bodyHistory');
  const rows = [...WEIGHT_LOG].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  wrap.innerHTML = `<div class="body-history__label">歷史紀錄</div>` + rows.map((r) => `
    <div class="body-history-item">
      <span>${r.date}${r.date === TODAY ? '（今天）' : ''}</span>
      <span><strong>${r.weight} kg</strong>　${r.bodyFat != null ? `${r.bodyFat} %` : '—'}</span>
    </div>`).join('');
}

bodySaveBtn.addEventListener('click', () => {
  if (bodySaveBtn.disabled) return;
  const targetDate = bodyDateInputEl.value || TODAY;
  // 儲存規則：若當日已有紀錄，覆蓋當日舊紀錄，只留最新一筆
  const existingIdx = WEIGHT_LOG.findIndex((r) => r.date === targetDate);
  const entry = { date: targetDate, weight: Number(bodyWeightInput.value), bodyFat: Number(bodyFatInput.value) };
  if (existingIdx >= 0) WEIGHT_LOG[existingIdx] = entry;
  else WEIGHT_LOG.push(entry);
  saveState();
  renderBodyHistory();
});

renderBodyHistory();

// ---------- 輸出（A3）----------
function addDaysISO(dateStr, delta) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

// 統計每一天實際訓練了幾個「不同部位」，用來區分單一部位／多部位的顯示顏色
function getTrainingPartsPerDate() {
  const map = new Map(); // dateStr -> Set(部位key)
  BODY_PARTS.forEach((bp) => {
    bp.exercises.forEach((ex) => {
      Object.keys(ex.history).forEach((d) => {
        if (!map.has(d)) map.set(d, new Set());
        map.get(d).add(bp.key);
      });
    });
  });
  return map;
}

// 方塊顯示規則：多部位訓練顯示深綠、僅單一部位訓練顯示淺綠、無紀錄顯示灰色、尚未到來顯示白（透明）；
// 月份當小標題，格子排在下方，固定一行14格（一個月會排成兩行多），往前呈現最近3個月
function renderHeatmap() {
  const wrap = document.getElementById('heatmap');
  const partsPerDate = getTrainingPartsPerDate();
  const today = new Date(TODAY);
  let y = today.getFullYear();
  let m = today.getMonth() + 1;

  let html = `<div class="heatmap-legend">
    <span class="heatmap-legend__item"><span class="heatmap-legend__dot" style="background:var(--success)"></span>多部位訓練</span>
    <span class="heatmap-legend__item"><span class="heatmap-legend__dot" style="background:var(--success-light)"></span>單一部位訓練</span>
    <span class="heatmap-legend__item"><span class="heatmap-legend__dot" style="background:#444B58"></span>無訓練</span>
  </div>`;

  for (let i = 0; i < 3; i++) {
    const dim = daysInMonth(y, m);
    let squares = '';
    for (let d = 1; d <= dim; d++) {
      const dateStr = `${y}-${pad2(m)}-${pad2(d)}`;
      let cls = 'heatmap-cell--future';
      if (new Date(dateStr) <= today) {
        const count = partsPerDate.get(dateStr)?.size || 0;
        cls = count === 1 ? 'heatmap-cell--single' : count > 1 ? 'heatmap-cell--done' : '';
      }
      squares += `<span class="heatmap-cell ${cls}" title="${dateStr}"></span>`;
    }
    html += `<div class="heatmap-month">
      <div class="heatmap-month__label">${y}年 ${m}月</div>
      <div class="heatmap-month__grid">${squares}</div>
    </div>`;
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  wrap.innerHTML = html;
}
renderHeatmap();

const exportStartDate = document.getElementById('exportStartDate');
const exportEndDate = document.getElementById('exportEndDate');
exportStartDate.value = addDaysISO(TODAY, -60);
exportEndDate.value = TODAY;

function validateExportRange() {
  if (exportStartDate.value && exportEndDate.value && exportEndDate.value < exportStartDate.value) {
    alert('迄日不可早於起日');
    exportEndDate.value = exportStartDate.value;
  }
}
exportStartDate.addEventListener('change', validateExportRange);
exportEndDate.addEventListener('change', validateExportRange);

// 通用折線圖產生器：跳過該欄位為 null 的日期（例如體脂未量測的那幾天），標出最大/最小值
function buildLineChartSVG(rows, key, color, label) {
  const points = rows.filter((r) => r[key] != null);
  if (points.length < 1) return `<p class="muted">此區間沒有足夠的${label}資料</p>`;

  const w = 560, h = 140, m = 30;
  const vals = points.map((r) => r[key]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const span = Math.max(points.length - 1, 1);
  const xy = (i, val) => [m + (i * (w - m * 2)) / span, h - m - ((val - min) / range) * (h - m * 2)];

  const pts = points.map((r, i) => xy(i, r[key]).join(',')).join(' ');
  const dots = points.map((r, i) => { const [x, y] = xy(i, r[key]); return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`; }).join('');
  const firstX = xy(0, points[0][key])[0];

  return `<div class="chart-label">${label}</div>
    <svg width="${w}" height="${h}" class="chart">
      <text x="${firstX}" y="14" font-size="10" fill="#999">${max}</text>
      <text x="${firstX}" y="${h - 6}" font-size="10" fill="#999">${min}</text>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/>
      ${dots}
    </svg>`;
}

// 每個動作一個小長條圖：每組一根柱子、高度＝重量，降重組用橘色跟一般組區分
function buildExerciseBarChart(session) {
  const bars = [
    ...session.generalSets.map((s) => ({ ...s, drop: false })),
    ...session.dropSets.map((s) => ({ ...s, drop: true })),
  ];
  const weights = bars.map((b) => b.weight).filter((v) => v != null);
  if (!weights.length) return '<p class="muted">沒有重量資料</p>';

  const max = Math.max(...weights);
  const barW = 32, gap = 10, chartH = 70, baseY = 74;
  const w = bars.length * (barW + gap) + gap;

  const barsSvg = bars.map((b, i) => {
    const x = gap + i * (barW + gap);
    const barH = b.weight != null ? Math.max((b.weight / max) * chartH, 3) : 0;
    const y = baseY - barH;
    const color = b.drop ? '#FF7A45' : '#3B5BFF';
    const weightLabel = b.weight != null ? `${b.weight}` : '-';
    const repsLabel = `${b.reps ?? (b.drop ? '力竭' : '-')}下`;
    return `
      <text x="${x + barW / 2}" y="${y - 5}" font-size="10" fill="#555" text-anchor="middle">${weightLabel}</text>
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}"/>
      <text x="${x + barW / 2}" y="${baseY + 14}" font-size="9" fill="#999" text-anchor="middle">${repsLabel}</text>`;
  }).join('');

  return `<svg width="${w}" height="${baseY + 20}" class="ex-chart">${barsSvg}</svg>`;
}

// 輸出說明：僅輸出起迄日內的資訊；動作系列隨部位逐一顯示動作、每組次數與重量；
// 身體組成將體重與體脂分開顯示，分為列表與折線圖；輸出為 PDF，用原生分享處理
// （這裡用瀏覽器原生列印/分享來產生 PDF，不需額外安裝套件）
function buildReportHTML(startDate, endDate) {
  let exerciseHtml = '';
  BODY_PARTS.forEach((bp) => {
    let bpHtml = '';
    bp.exercises.forEach((ex) => {
      const dates = Object.keys(ex.history).filter((d) => d >= startDate && d <= endDate).sort();
      dates.forEach((d) => {
        const session = ex.history[d];
        bpHtml += `<div class="ex-block">
          <div class="ex-name">${ex.name} <span class="ex-date">${d}${d === TODAY ? '（今天）' : ''}</span></div>
          ${buildExerciseBarChart(session)}
          ${session.note ? `<div class="ex-note">${session.note}</div>` : ''}
        </div>`;
      });
    });
    if (bpHtml) exerciseHtml += `<h3>${bp.name}</h3>${bpHtml}`;
  });
  if (!exerciseHtml) exerciseHtml = '<p class="muted">此區間內沒有動作紀錄</p>';

  const rows = WEIGHT_LOG.filter((r) => r.date >= startDate && r.date <= endDate).sort((a, b) => (a.date > b.date ? 1 : -1));
  let bodyHtml = '<p class="muted">此區間內沒有身體組成紀錄</p>';
  if (rows.length) {
    const listHtml = rows.map((r) => `<tr><td>${r.date}</td><td>${r.weight} kg</td><td>${r.bodyFat != null ? r.bodyFat + ' %' : '—'}</td></tr>`).join('');
    bodyHtml = `${buildLineChartSVG(rows, 'weight', '#3B5BFF', '體重 kg')}
      ${buildLineChartSVG(rows, 'bodyFat', '#FF7A45', '體脂 %')}
      <table class="rt"><thead><tr><th>日期</th><th>體重</th><th>體脂</th></tr></thead><tbody>${listHtml}</tbody></table>`;
  }

  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>健身紀錄 ${startDate} ~ ${endDate}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Microsoft JhengHei',sans-serif;color:#1A1A1A;padding:32px;max-width:640px;margin:0 auto;}
  h1{font-size:20px;margin-bottom:4px;}
  h2{font-size:16px;margin:24px 0 8px;}
  h3{font-size:14px;margin:16px 0 8px;border-left:4px solid #6E8BFF;padding-left:8px;}
  .range{color:#777;font-size:13px;}
  table.rt{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px;}
  table.rt th,table.rt td{border:1px solid #DDD;padding:6px 8px;text-align:left;}
  table.rt th{background:#F5F5F5;}
  .muted{color:#999;font-size:13px;}
  .chart-label{font-size:12px;font-weight:600;color:#555;margin-top:14px;}
  .chart{display:block;margin:4px 0 12px;}
  .ex-block{margin-bottom:14px;}
  .ex-name{font-size:13px;font-weight:600;margin-bottom:4px;}
  .ex-date{font-size:11px;font-weight:500;color:#999;}
  .ex-chart{display:block;}
  .ex-note{font-size:11px;color:#999;margin-top:2px;}
  @media print{ body{padding:0;} }
</style></head><body>
  <h1>健身紀錄</h1>
  <div class="range">${startDate} ～ ${endDate}</div>
  <h2>動作系列</h2>
  ${exerciseHtml}
  <h2>身體組成</h2>
  ${bodyHtml}
</body></html>`;
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const s = exportStartDate.value;
  const e = exportEndDate.value;
  if (!s || !e) { alert('請選擇起訖日'); return; }
  if (e < s) { alert('迄日不可早於起日'); return; }
  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(buildReportHTML(s, e));
  reportWindow.document.close();
  setTimeout(() => reportWindow.print(), 300);
});

// ---------- 日期欄位（A1／A2 頂部日期，整個藥丸都可點擊）----------
// 首頁的日期欄位會真的切換 viewDate，讓部位打勾狀態、動作清單、動作紀錄都改成看那一天的資料；
// 身體組成頁的日期欄位則單純決定「儲存」要寫進哪一天
const homeDateInput = document.getElementById('homeDateInput');
const homeDateSuffix = document.getElementById('homeDateSuffix');
homeDateInput.value = viewDate;
homeDateSuffix.textContent = viewDate === TODAY ? '（今天）' : '';
homeDateInput.addEventListener('change', () => {
  viewDate = homeDateInput.value || TODAY;
  homeDateSuffix.textContent = viewDate === TODAY ? '（今天）' : '';
  renderHome();
});

bodyDateInputEl.value = TODAY;
document.getElementById('bodyDateSuffix').textContent = '（今天）';
bodyDateInputEl.addEventListener('change', () => {
  const d = bodyDateInputEl.value || TODAY;
  document.getElementById('bodyDateSuffix').textContent = d === TODAY ? '（今天）' : '';
  const existing = WEIGHT_LOG.find((r) => r.date === d);
  bodyWeightInput.value = existing ? existing.weight : '';
  bodyFatInput.value = existing != null && existing.bodyFat != null ? existing.bodyFat : '';
  validateBodyForm();
});

// ---------- 底部 Tab 切換（訓練／身體組成／輸出）----------
let currentTab = 'home';
function setTab(tab) {
  currentTab = tab;
  ['home', 'body', 'export'].forEach((t) => {
    document.getElementById(`screen-${t}`).style.display = t === tab ? 'flex' : 'none';
  });
  document.querySelectorAll('.tab-bar__item').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
}
document.querySelectorAll('.tab-bar__item').forEach((el) => {
  el.addEventListener('click', () => setTab(el.dataset.tab));
});
setTab('home');

// ---------- 畫面堆疊導航（動作清單／編輯／新增／紀錄，皆從首頁往下疊）----------
const stack = ['home'];
function render() {
  document.querySelectorAll('.screen--sub').forEach((el) => el.classList.remove('show'));
  stack.forEach((s) => {
    if (s !== 'home') document.getElementById(`screen-${s}`).classList.add('show');
  });
}
function push(screen) { stack.push(screen); render(); }
function pop() { if (stack.length > 1) stack.pop(); render(); }

document.getElementById('listBack').addEventListener('click', pop);

renderHome();

// ---------- 下拉刷新 ----------
// 加到主畫面後是獨立模式，沒有網址列可以下拉刷新；同時 PWA 常會把舊的 css/js 快取住，
// 所以這裡刷新時直接連去掉快取版本一起重新拉取，不是單純 location.reload()
(function setupPullToRefresh() {
  const indicator = document.getElementById('pullRefresh');
  const THRESHOLD = 60;
  let startY = 0;
  let pulling = false;
  let refreshing = false;

  function findScrollParent(el) {
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return el;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('touchstart', (e) => {
    if (refreshing) return;
    const scrollParent = findScrollParent(e.target);
    if (scrollParent && scrollParent.scrollTop > 0) { pulling = false; return; }
    startY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling || refreshing) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY <= 0) { indicator.style.transform = 'translateY(-60px)'; indicator.classList.remove('ready'); return; }
    e.preventDefault();
    const pull = Math.min(deltaY, 100);
    indicator.style.transform = `translateY(${pull - 60}px)`;
    indicator.classList.toggle('ready', pull > THRESHOLD);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!pulling || refreshing) return;
    pulling = false;
    if (indicator.classList.contains('ready')) {
      refreshing = true;
      indicator.style.transform = 'translateY(0)';
      indicator.classList.add('loading');
      setTimeout(() => {
        const url = new URL(location.href);
        url.searchParams.set('r', Date.now());
        location.replace(url.toString());
      }, 400);
    } else {
      indicator.style.transform = 'translateY(-60px)';
      indicator.classList.remove('ready');
    }
  });
})();
