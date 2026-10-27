const STORAGE_KEY = 'edupulse_estudante_v1';

let appData = {
  records: [],
  subjects: [],
  tasks: [],
  generalNotes: '',
  planner: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] }
};

const daysOfWeek = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const dayLabels = { segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo' };

function loadAppData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { appData = JSON.parse(saved); } catch (e) { console.error(e); }
  } else {

    appData.subjects = [
      { id: 'sub-1', name: 'Matemática', color: '#d97706', topics: [{ id: 'top-1', title: 'Funções de 1º Grau', completed: true }] },
      { id: 'sub-2', name: 'Português', color: '#10b981', topics: [{ id: 'top-2', title: 'Acentuação Gráfica', completed: false }] }
    ];
    appData.records = [
      { id: 'rec-1', subjectId: 'sub-1', title: 'Exercícios de Álgebra', date: getTodayISO(), minutes: 60, semana: 'Semana 1', conducao: 'Exercícios', status: 'Concluído', grade: 'Alta', notes: 'Resolver novamente questão 4' }
    ];
    appData.tasks = [
      { id: 'task-1', title: 'Fazer resumo de Geografia', subjectId: null, date: getTodayISO(), grade: 'Média', completed: false }
    ];
    appData.generalNotes = 'Minhas metas de estudo para este mês: Manter 2 horas por dia!';
    saveAppData();
  }
}

function saveAppData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  renderAll();
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  lucide.createIcons();
}

function renderAll() {
  renderHeaderStats();
  renderDashboard();
  renderStudyTable();
  renderSubjects();
  renderTasks();
  renderPlanner();
  renderNotes();
  populateDropdowns();
}

function renderHeaderStats() {
  const todayISO = getTodayISO();
  const todayMins = appData.records
    .filter(r => r.date === todayISO)
    .reduce((sum, r) => sum + Number(r.minutes || 0), 0);

  const hours = Math.floor(todayMins / 60);
  const mins = todayMins % 60;
  document.getElementById('header-today-time').innerText = `${hours}h ${mins}m hoje`;
  document.getElementById('stat-hours-today').innerText = `${hours}h ${mins}m`;

  document.getElementById('stat-total-records').innerText = appData.records.length;
  document.getElementById('stat-tasks-completed').innerText = `${appData.tasks.filter(t => t.completed).length}/${appData.tasks.length}`;
  document.getElementById('stat-active-subjects').innerText = appData.subjects.length;
}

function renderDashboard() {
  const subList = document.getElementById('dash-subjects-list');
  subList.innerHTML = '';
  if (appData.subjects.length === 0) {
    subList.innerHTML = `<p class="text-xs text-amber-700">Nenhuma matéria cadastrada.</p>`;
  } else {
    appData.subjects.forEach(sub => {
      const total = sub.topics.length;
      const done = sub.topics.filter(t => t.completed).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      subList.innerHTML += `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs font-semibold text-amber-950">
            <span class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${sub.color}"></span>
              ${escapeHtml(sub.name)}
            </span>
            <span class="text-amber-800">${done}/${total} (${pct}%)</span>
          </div>
          <div class="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full" style="width:${pct}%; background:${sub.color}"></div>
          </div>
        </div>
      `;
    });
  }

  const recentDiv = document.getElementById('dash-recent-records');
  recentDiv.innerHTML = '';
  const recent = [...appData.records].reverse().slice(0, 3);
  if (recent.length === 0) {
    recentDiv.innerHTML = `<p class="text-xs text-amber-700">Nenhum registro recente.</p>`;
  } else {
    recent.forEach(r => {
      const sub = appData.subjects.find(s => s.id === r.subjectId);
      recentDiv.innerHTML += `
        <div class="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
          <span class="font-medium flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" style="background:${sub ? sub.color : '#d97706'}"></span>
            ${escapeHtml(r.title)}
          </span>
          <span class="font-mono text-amber-800">${r.minutes} min</span>
        </div>
      `;
    });
  }

  const plannerDiv = document.getElementById('dash-today-planner');
  plannerDiv.innerHTML = '';
  const dayMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const todayKey = dayMap[new Date().getDay()];
  const todayPlanner = appData.planner[todayKey] || [];
  if (todayPlanner.length === 0) {
    plannerDiv.innerHTML = `<p class="text-xs text-amber-700">Nada agendado para hoje.</p>`;
  } else {
    todayPlanner.forEach(p => {
      const sub = appData.subjects.find(s => s.id === p.subjectId);
      plannerDiv.innerHTML += `
        <div class="p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <span class="font-mono text-amber-700">${escapeHtml(p.time)}</span>
          <span class="font-semibold" style="color:${sub ? sub.color : '#451a03'}">${sub ? escapeHtml(sub.name) : 'Estudo'}</span>
        </div>
      `;
    });
  }

  const pendingDiv = document.getElementById('dash-pending-tasks');
  pendingDiv.innerHTML = '';
  const pending = appData.tasks.filter(t => !t.completed).slice(0, 3);
  if (pending.length === 0) {
    pendingDiv.innerHTML = `<p class="text-xs text-amber-700">Sem tarefas pendentes! 🎉</p>`;
  } else {
    pending.forEach(t => {
      pendingDiv.innerHTML += `
        <div class="p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <span>${escapeHtml(t.title)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${getGradeClass(t.grade)}">${t.grade}</span>
        </div>
      `;
    });
  }
}

function renderStudyTable() {
  const tbody = document.getElementById('study-table-body');
  tbody.innerHTML = '';

  const search = document.getElementById('filter-search').value.toLowerCase();
  const fSubject = document.getElementById('filter-subject').value;
  const fStatus = document.getElementById('filter-status').value;
  const fGrade = document.getElementById('filter-grade').value;
  const fConducao = document.getElementById('filter-conducao').value;

  const filtered = appData.records.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search) || (r.notes && r.notes.toLowerCase().includes(search));
    const matchesSub = !fSubject || r.subjectId === fSubject;
    const matchesStatus = !fStatus || r.status === fStatus;
    const matchesGrade = !fGrade || r.grade === fGrade;
    const matchesConducao = !fConducao || r.conducao === fConducao;
    return matchesSearch && matchesSub && matchesStatus && matchesGrade && matchesConducao;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-amber-800">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(r => {
    const sub = appData.subjects.find(s => s.id === r.subjectId);
    tbody.innerHTML += `
      <tr class="hover:bg-amber-50/60 transition-colors border-b border-amber-100">
        <td class="p-3">
          <div class="font-bold text-amber-950 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" style="background:${sub ? sub.color : '#d97706'}"></span>
            ${escapeHtml(r.title)}
          </div>
          <div class="text-[10px] text-amber-800 ml-4">${sub ? escapeHtml(sub.name) : 'Geral'}</div>
        </td>
        <td class="p-3 font-mono text-amber-900">
          <div>${r.date}</div>
          <div class="text-[10px] text-amber-700">${escapeHtml(r.semana || 'S/W')}</div>
        </td>
        <td class="p-3 font-mono font-semibold">${r.minutes} min</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 border border-amber-200 text-amber-900">${r.conducao}</span>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusClass(r.status)}">${r.status}</span>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${getGradeClass(r.grade)}">${r.grade}</span>
        </td>
        <td class="p-3 text-amber-800 max-w-xs truncate" title="${escapeHtml(r.notes || '')}">
          ${escapeHtml(r.notes || '-')}
        </td>
        <td class="p-3 text-right">
          <button onclick="deleteRecord('${r.id}')" class="text-amber-700 hover:text-rose-600 p-1">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-subject').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-grade').value = '';
  document.getElementById('filter-conducao').value = '';
  renderStudyTable();
}

function getStatusClass(status) {
  if (status === 'Concluído') return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (status === 'Em Andamento') return 'bg-amber-100 text-amber-900 border border-amber-300';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

function getGradeClass(grade) {
  if (grade === 'Alta') return 'bg-rose-100 text-rose-800 border border-rose-200';
  if (grade === 'Média') return 'bg-amber-100 text-amber-900 border border-amber-300';
  return 'bg-blue-100 text-blue-800 border border-blue-200';
}

function openRecordModal() {
  document.getElementById('form-record').reset();
  document.getElementById('rec-date').value = getTodayISO();
  document.getElementById('modal-record').classList.remove('hidden');
}
function closeRecordModal() { document.getElementById('modal-record').classList.add('hidden'); }
function saveRecord(e) {
  e.preventDefault();
  appData.records.push({
    id: 'rec-' + Date.now(),
    subjectId: document.getElementById('rec-subject-id').value,
    title: document.getElementById('rec-title').value,
    date: document.getElementById('rec-date').value,
    minutes: Number(document.getElementById('rec-minutes').value),
    semana: document.getElementById('rec-semana').value,
    conducao: document.getElementById('rec-conducao').value,
    status: document.getElementById('rec-status').value,
    grade: document.getElementById('rec-grade').value,
    notes: document.getElementById('rec-notes').value
  });
  saveAppData();
  closeRecordModal();
}
function deleteRecord(id) {
  appData.records = appData.records.filter(r => r.id !== id);
  saveAppData();
}

function renderSubjects() {
  const container = document.getElementById('subjects-container');
  container.innerHTML = '';

  appData.subjects.forEach(sub => {
    const total = sub.topics.length;
    const done = sub.topics.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const topicsList = sub.topics.map(t => `
      <div class="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-xs">
        <label class="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTopic('${sub.id}', '${t.id}')" class="rounded border-amber-300 text-amber-600 focus:ring-0">
          <span class="${t.completed ? 'line-through text-amber-700' : 'text-amber-950'} truncate">${escapeHtml(t.title)}</span>
        </label>
        <button onclick="deleteTopic('${sub.id}', '${t.id}')" class="text-amber-700 hover:text-rose-600 p-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `).join('');

    container.innerHTML += `
      <div class="content-box space-y-4">
        <div class="flex items-center justify-between border-b border-amber-200 pb-2">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full" style="background:${sub.color}"></span>
            <h3 class="font-bold text-amber-950 text-base">${escapeHtml(sub.name)}</h3>
          </div>
          <button onclick="deleteSubject('${sub.id}')" class="text-amber-700 hover:text-rose-600">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs text-amber-800">
            <span>Edital</span><span>${pct}%</span>
          </div>
          <div class="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full" style="width:${pct}%; background:${sub.color}"></div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-amber-800">Tópicos</span>
            <button onclick="openTopicModal('${sub.id}')" class="text-xs text-amber-700 font-bold hover:underline">+ Adicionar</button>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">${topicsList || '<p class="text-xs text-amber-700">Nenhum tópico.</p>'}</div>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

function openSubjectModal() { document.getElementById('form-subject').reset(); document.getElementById('modal-subject').classList.remove('hidden'); }
function closeSubjectModal() { document.getElementById('modal-subject').classList.add('hidden'); }
function saveSubject(e) {
  e.preventDefault();
  appData.subjects.push({ id: 'sub-' + Date.now(), name: document.getElementById('subject-name').value, color: document.getElementById('subject-color').value, topics: [] });
  saveAppData();
  closeSubjectModal();
}
function deleteSubject(subId) {
  if (confirm('Excluir esta matéria?')) {
    appData.subjects = appData.subjects.filter(s => s.id !== subId);
    saveAppData();
  }
}

function openTopicModal(subId) { document.getElementById('form-topic').reset(); document.getElementById('topic-subject-id').value = subId; document.getElementById('modal-topic').classList.remove('hidden'); }
function closeTopicModal() { document.getElementById('modal-topic').classList.add('hidden'); }
function saveTopic(e) {
  e.preventDefault();
  const sub = appData.subjects.find(s => s.id === document.getElementById('topic-subject-id').value);
  if (sub) {
    sub.topics.push({ id: 'top-' + Date.now(), title: document.getElementById('topic-title').value, completed: false });
    saveAppData();
  }
  closeTopicModal();
}
function toggleTopic(subId, topId) {
  const sub = appData.subjects.find(s => s.id === subId);
  if (sub) {
    const top = sub.topics.find(t => t.id === topId);
    if (top) top.completed = !top.completed;
    saveAppData();
  }
}
function deleteTopic(subId, topId) {
  const sub = appData.subjects.find(s => s.id === subId);
  if (sub) {
    sub.topics = sub.topics.filter(t => t.id !== topId);
    saveAppData();
  }
}

let currentTaskFilter = 'all';
function filterTasks(f) {
  currentTaskFilter = f;
  ['all', 'pending', 'completed'].forEach(k => document.getElementById(`task-filter-${k}`).classList.remove('active'));
  document.getElementById(`task-filter-${f}`).classList.add('active');
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';

  let list = appData.tasks;
  if (currentTaskFilter === 'pending') list = appData.tasks.filter(t => !t.completed);
  if (currentTaskFilter === 'completed') list = appData.tasks.filter(t => t.completed);

  if (list.length === 0) {
    container.innerHTML = `<p class="text-center text-amber-700 text-xs py-6">Nenhuma tarefa aqui.</p>`;
    return;
  }

  list.forEach(t => {
    const sub = appData.subjects.find(s => s.id === t.subjectId);
    container.innerHTML += `
      <div class="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button onclick="toggleTaskStatus('${t.id}')" class="text-amber-700">
            <i data-lucide="${t.completed ? 'check-circle-2' : 'circle'}" class="w-5 h-5 ${t.completed ? 'text-emerald-600' : ''}"></i>
          </button>
          <div>
            <p class="text-xs font-semibold ${t.completed ? 'line-through text-amber-700' : 'text-amber-950'}">${escapeHtml(t.title)}</p>
            <div class="flex items-center space-x-2 mt-0.5 text-[10px] text-amber-800">
              ${sub ? `<span>${escapeHtml(sub.name)}</span> •` : ''}
              ${t.date ? `<span>📅 ${t.date}</span> •` : ''}
              <span class="font-bold ${getGradeClass(t.grade)} px-1 rounded">${t.grade}</span>
            </div>
          </div>
        </div>
        <button onclick="deleteTask('${t.id}')" class="text-amber-700 hover:text-rose-600 p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  });
  lucide.createIcons();
}

function openTaskModal() { document.getElementById('form-task').reset(); document.getElementById('modal-task').classList.remove('hidden'); }
function closeTaskModal() { document.getElementById('modal-task').classList.add('hidden'); }
function saveTask(e) {
  e.preventDefault();
  appData.tasks.push({
    id: 'task-' + Date.now(),
    title: document.getElementById('task-title').value,
    subjectId: document.getElementById('task-subject-id').value || null,
    grade: document.getElementById('task-grade').value,
    date: document.getElementById('task-date').value || null,
    completed: false
  });
  saveAppData();
  closeTaskModal();
}
function toggleTaskStatus(id) {
  const t = appData.tasks.find(x => x.id === id);
  if (t) { t.completed = !t.completed; saveAppData(); }
}
function deleteTask(id) { appData.tasks = appData.tasks.filter(t => t.id !== id); saveAppData(); }

function renderPlanner() {
  const container = document.getElementById('planner-days-grid');
  container.innerHTML = '';

  daysOfWeek.forEach(dayKey => {
    const items = appData.planner[dayKey] || [];
    const itemsList = items.map(i => {
      const sub = appData.subjects.find(s => s.id === i.subjectId);
      return `
        <div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
          <div class="flex items-center justify-between font-mono text-amber-700">
            <span>${escapeHtml(i.time)}</span>
            <button onclick="deletePlannerItem('${dayKey}', '${i.id}')" class="text-amber-700 hover:text-rose-600"><i data-lucide="x" class="w-3 h-3"></i></button>
          </div>
          <p class="font-semibold text-amber-950 truncate" style="color:${sub ? sub.color : '#451a03'}">${sub ? escapeHtml(sub.name) : 'Estudo'}</p>
        </div>
      `;
    }).join('');

    container.innerHTML += `
      <div class="content-box space-y-2">
        <div class="flex items-center justify-between border-b border-amber-200 pb-2">
          <h4 class="font-bold text-xs text-amber-950">${dayLabels[dayKey]}</h4>
          <button onclick="openPlannerModal('${dayKey}')" class="text-amber-700 font-bold text-xs">+ Add</button>
        </div>
        <div class="space-y-1.5">${itemsList || '<p class="text-[10px] text-amber-700">Livre</p>'}</div>
      </div>
    `;
  });
  lucide.createIcons();
}

function openPlannerModal(dayKey) { document.getElementById('form-planner').reset(); document.getElementById('planner-day-key').value = dayKey; document.getElementById('modal-planner').classList.remove('hidden'); }
function closePlannerModal() { document.getElementById('modal-planner').classList.add('hidden'); }
function savePlannerItem(e) {
  e.preventDefault();
  const dayKey = document.getElementById('planner-day-key').value;
  if (!appData.planner[dayKey]) appData.planner[dayKey] = [];
  appData.planner[dayKey].push({
    id: 'plan-' + Date.now(),
    time: document.getElementById('planner-time').value || '08:00',
    subjectId: document.getElementById('planner-subject-id').value
  });
  saveAppData();
  closePlannerModal();
}
function deletePlannerItem(dayKey, id) {
  if (appData.planner[dayKey]) {
    appData.planner[dayKey] = appData.planner[dayKey].filter(i => i.id !== id);
    saveAppData();
  }
}

function renderNotes() {
  const input = document.getElementById('general-notes-input');
  if (input && document.activeElement !== input) {
    input.value = appData.generalNotes || '';
    document.getElementById('notes-char-count').innerText = `${input.value.length} caracteres`;
  }
}
function saveGeneralNotes() {
  const text = document.getElementById('general-notes-input').value;
  appData.generalNotes = text;
  document.getElementById('notes-char-count').innerText = `${text.length} caracteres`;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

let timerInterval = null, timerRunning = false, currentMode = 'work';
const modeTimes = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
let timeRemaining = modeTimes.work;

function setPomodoroMode(mode) {
  if (timerRunning) togglePomodoro();
  currentMode = mode;
  timeRemaining = modeTimes[mode];
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
  const btnKey = mode === 'shortBreak' ? 'short' : (mode === 'longBreak' ? 'long' : 'work');
  document.getElementById(`pomo-mode-${btnKey}`).classList.add('active');
  updatePomodoroDisplay();
}
function updatePomodoroDisplay() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  document.getElementById('pomo-timer-display').innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const total = modeTimes[currentMode];
  document.getElementById('pomo-progress-ring').style.strokeDashoffset = 596.9 * (1 - (timeRemaining / total));
}
function togglePomodoro() {
  const icon = document.getElementById('pomo-start-icon');
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    icon.setAttribute('data-lucide', 'play');
  } else {
    timerRunning = true;
    icon.setAttribute('data-lucide', 'pause');
    timerInterval = setInterval(() => {
      if (timeRemaining > 0) { timeRemaining--; updatePomodoroDisplay(); }
      else {
        togglePomodoro();
        alert('Tempo esgotado! Excelente foco.');
        resetPomodoro();
      }
    }, 1000);
  }
  lucide.createIcons();
}
function resetPomodoro() {
  if (timerRunning) togglePomodoro();
  timeRemaining = modeTimes[currentMode];
  updatePomodoroDisplay();
}

function populateDropdowns() {
  const options = appData.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  
  document.getElementById('filter-subject').innerHTML = `<option value="">Todas as Matérias</option>` + options;
  document.getElementById('rec-subject-id').innerHTML = options;
  document.getElementById('task-subject-id').innerHTML = `<option value="">Geral</option>` + options;
  document.getElementById('planner-subject-id').innerHTML = options;
  document.getElementById('pomo-subject-select').innerHTML = `<option value="">Geral / Sem matéria</option>` + options;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

window.addEventListener('DOMContentLoaded', () => {
  loadAppData();
  updatePomodoroDisplay();
  lucide.createIcons();
});