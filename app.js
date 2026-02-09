// LocalStorage keys
const LS_KEYS = {
  subjects: "ssp_subjects",
  schedule: "ssp_schedule",
  tasks: "ssp_tasks",
  prefs: "ssp_prefs",
};

let subjects = [];
let scheduleSlots = [];
let tasks = [];
let prefs = { theme: "light" };

// Debounce helper for smooth performance
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Show success/error messages
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 999px;
    background: ${type === "success" ? "var(--success)" : "var(--danger)"};
    color: white;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    z-index: 1000;
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Helpers
function saveAll() {
  localStorage.setItem(LS_KEYS.subjects, JSON.stringify(subjects));
  localStorage.setItem(LS_KEYS.schedule, JSON.stringify(scheduleSlots));
  localStorage.setItem(LS_KEYS.tasks, JSON.stringify(tasks));
  localStorage.setItem(LS_KEYS.prefs, JSON.stringify(prefs));
}

function loadAll() {
  subjects = JSON.parse(localStorage.getItem(LS_KEYS.subjects) || "[]");
  scheduleSlots = JSON.parse(localStorage.getItem(LS_KEYS.schedule) || "[]");
  tasks = JSON.parse(localStorage.getItem(LS_KEYS.tasks) || "[]");
  prefs = JSON.parse(localStorage.getItem(LS_KEYS.prefs) || '{"theme":"light"}');
}

// Navigation
function switchView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  const titleMap = {
    dashboard: "Dashboard",
    subjects: "Subject Management",
    schedule: "Schedule Planner",
    tasks: "Task Manager",
    analytics: "Progress Analytics",
    settings: "Settings",
  };
  document.getElementById("viewTitle").textContent = titleMap[viewId] || "Smart Study Planner";

  if (viewId === "dashboard") renderDashboard();
  if (viewId === "subjects") renderSubjects();
  if (viewId === "schedule") renderSchedule();
  if (viewId === "tasks") renderTasks();
  if (viewId === "analytics") renderAnalytics();
  if (viewId === "settings") {} // nothing special
}

// Date & time
function updateTodayDate() {
  const el = document.getElementById("todayDate");
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

function startClock() {
  const el = document.getElementById("clock");
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 1000);
}

// Theme
function applyTheme() {
  document.body.classList.toggle("theme-dark", prefs.theme === "dark");
}

function toggleTheme() {
  prefs.theme = prefs.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveAll();
}

// Subjects
function renderSubjects() {
  const list = document.getElementById("subjectList");
  const scheduleSubject = document.getElementById("scheduleSubject");
  const taskSubject = document.getElementById("taskSubject");

  // Populate selects
  scheduleSubject.innerHTML = "";
  taskSubject.innerHTML = '<option value="">No specific subject</option>';

  if (!subjects.length) {
    list.classList.add("empty-state");
    list.innerHTML = "<li>No subjects added yet.</li>";
    return;
  }

  list.classList.remove("empty-state");
  list.innerHTML = "";
  subjects.forEach(sub => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";

    const title = document.createElement("span");
    title.textContent = sub.name;
    title.style.fontWeight = "500";

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.gap = "6px";
    meta.style.alignItems = "center";
    meta.style.fontSize = "0.75rem";

    const pri = document.createElement("span");
    pri.className = `badge-pill badge-${sub.priority.toLowerCase()}`;
    pri.textContent = sub.priority;

    const hours = document.createElement("span");
    hours.className = "chip";
    hours.textContent = `${sub.hoursPerWeek || 0}h / week`;

    const colorDot = document.createElement("span");
    colorDot.style.display = "inline-block";
    colorDot.style.width = "10px";
    colorDot.style.height = "10px";
    colorDot.style.borderRadius = "999px";
    colorDot.style.backgroundColor = sub.color || "#4f46e5";

    meta.append(pri, hours, colorDot);
    left.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "secondary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => fillSubjectForm(sub.id);

    const delBtn = document.createElement("button");
    delBtn.className = "danger-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteSubject(sub.id);

    actions.append(editBtn, delBtn);
    li.append(left, actions);
    list.appendChild(li);

    // selects
    const opt1 = document.createElement("option");
    opt1.value = sub.id;
    opt1.textContent = sub.name;
    scheduleSubject.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = sub.id;
    opt2.textContent = sub.name;
    taskSubject.appendChild(opt2);
  });
}

function fillSubjectForm(id) {
  const s = subjects.find(x => x.id === id);
  if (!s) return;
  document.getElementById("subjectId").value = s.id;
  document.getElementById("subjectName").value = s.name;
  document.getElementById("subjectPriority").value = s.priority;
  document.getElementById("subjectHours").value = s.hoursPerWeek;
  document.getElementById("subjectColor").value = s.color || "#4f46e5";
}

function deleteSubject(id) {
  if (!confirm("Delete this subject? Related schedule slots will remain.")) return;
  subjects = subjects.filter(s => s.id !== id);
  saveAll();
  showNotification("Subject deleted successfully.", "success");
  renderSubjects();
}

function handleSubjectForm(e) {
  e.preventDefault();
  const id = document.getElementById("subjectId").value || crypto.randomUUID();
  const name = document.getElementById("subjectName").value.trim();
  const priority = document.getElementById("subjectPriority").value;
  const hoursPerWeek = parseInt(document.getElementById("subjectHours").value || "0", 10);
  const color = document.getElementById("subjectColor").value;

  // Validation
  if (!name) {
    showNotification("Subject name is required.", "error");
    return;
  }

  if (name.length > 50) {
    showNotification("Subject name must be 50 characters or less.", "error");
    return;
  }

  if (hoursPerWeek < 1 || hoursPerWeek > 40) {
    showNotification("Study hours must be between 1 and 40 per week.", "error");
    return;
  }

  const existingIndex = subjects.findIndex(s => s.id === id);
  const obj = { id, name, priority, hoursPerWeek, color };
  if (existingIndex >= 0) {
    subjects[existingIndex] = obj;
    showNotification("Subject updated successfully.", "success");
  } else {
    subjects.push(obj);
    showNotification("Subject added successfully.", "success");
  }

  saveAll();
  (e.target || document.getElementById("subjectForm")).reset();
  document.getElementById("subjectId").value = "";
  renderSubjects();
}

// Schedule
function detectConflict(day, start, end, excludeId = null) {
  const startM = toMinutes(start);
  const endM = toMinutes(end);
  return scheduleSlots.some(slot => {
    if (excludeId && slot.id === excludeId) return false;
    if (slot.day !== day) return false;
    const s = toMinutes(slot.start);
    const e = toMinutes(slot.end);
    return Math.max(s, startM) < Math.min(e, endM);
  });
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function renderSchedule() {
  const tbody = document.getElementById("scheduleList");
  if (!scheduleSlots.length) {
    tbody.innerHTML = `<tr class="empty-state-row"><td colspan="4">No schedule slots yet.</td></tr>`;
    return;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  tbody.innerHTML = "";
  const sorted = [...scheduleSlots].sort((a, b) => (a.day - b.day) || (toMinutes(a.start) - toMinutes(b.start)));
  sorted.forEach(slot => {
    const tr = document.createElement("tr");
    const subj = subjects.find(s => s.id === slot.subjectId);
    const subjName = subj ? subj.name : "Unknown";

    const tdDay = document.createElement("td");
    tdDay.textContent = dayNames[slot.day];

    const tdTime = document.createElement("td");
    tdTime.textContent = `${slot.start} – ${slot.end}`;

    const tdSubj = document.createElement("td");
    tdSubj.textContent = subjName;

    const tdActions = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.className = "secondary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => fillScheduleForm(slot.id);

    const delBtn = document.createElement("button");
    delBtn.className = "danger-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteSchedule(slot.id);

    tdActions.append(editBtn, delBtn);
    tr.append(tdDay, tdTime, tdSubj, tdActions);
    tbody.appendChild(tr);
  });
}

function fillScheduleForm(id) {
  const s = scheduleSlots.find(x => x.id === id);
  if (!s) return;
  document.getElementById("scheduleId").value = s.id;
  document.getElementById("scheduleSubject").value = s.subjectId;
  document.getElementById("scheduleDay").value = s.day;
  document.getElementById("scheduleStart").value = s.start;
  document.getElementById("scheduleEnd").value = s.end;
}

function deleteSchedule(id) {
  if (!confirm("Delete this time slot?")) return;
  scheduleSlots = scheduleSlots.filter(s => s.id !== id);
  saveAll();
  showNotification("Schedule slot deleted successfully.", "success");
  renderSchedule();
}

function handleScheduleForm(e) {
  e.preventDefault();
  const id = document.getElementById("scheduleId").value || crypto.randomUUID();
  const subjectId = document.getElementById("scheduleSubject").value;
  const day = parseInt(document.getElementById("scheduleDay").value, 10);
  const start = document.getElementById("scheduleStart").value;
  const end = document.getElementById("scheduleEnd").value;

  // Validation
  if (!subjectId || !start || !end) {
    showNotification("Subject, start and end time are required.", "error");
    return;
  }

  if (toMinutes(end) <= toMinutes(start)) {
    showNotification("End time must be after start time.", "error");
    return;
  }

  const conflict = detectConflict(day, start, end, id || null);
  const conflictMsg = document.getElementById("scheduleConflictMsg");

  if (conflict) {
    conflictMsg.classList.remove("hidden");
    showNotification("⚠ Time conflict detected. Please adjust your schedule.", "error");
    return;
  } else {
    conflictMsg.classList.add("hidden");
  }

  const existingIndex = scheduleSlots.findIndex(s => s.id === id);
  const obj = { id, subjectId, day, start, end };
  if (existingIndex >= 0) {
    scheduleSlots[existingIndex] = obj;
    showNotification("Schedule updated successfully.", "success");
  } else {
    scheduleSlots.push(obj);
    showNotification("Schedule slot added successfully.", "success");
  }

  saveAll();
  (e.target || document.getElementById("scheduleForm")).reset();
  document.getElementById("scheduleId").value = "";
  renderSchedule();
}

// Tasks
function renderTasks() {
  const list = document.getElementById("taskList");
  if (!tasks.length) {
    list.classList.add("empty-state");
    list.innerHTML = "<li>No tasks added yet.</li>";
    return;
  }

  list.classList.remove("empty-state");
  list.innerHTML = "";

  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const today = new Date();
  sorted.forEach(task => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.alignItems = "center";

    const title = document.createElement("span");
    title.textContent = task.title;
    title.className = "task-title";

    const statusWrap = document.createElement("div");
    statusWrap.className = "task-status";

    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.checked = !!task.completed;
    doneCheckbox.onchange = () => toggleTaskCompleted(task.id, doneCheckbox.checked);

    const statusLabel = document.createElement("span");
    statusLabel.textContent = doneCheckbox.checked ? "Done" : "Pending";
    statusLabel.style.color = doneCheckbox.checked ? "var(--success)" : "var(--text-muted)";

    statusWrap.append(doneCheckbox, statusLabel);
    titleRow.append(title, statusWrap);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const subj = subjects.find(s => s.id === task.subjectId);
    if (subj) {
      const subjSpan = document.createElement("span");
      subjSpan.textContent = subj.name;
      subjSpan.className = "chip";
      meta.appendChild(subjSpan);
    }

    const typeSpan = document.createElement("span");
    typeSpan.className = "chip";
    typeSpan.textContent = task.type;
    meta.appendChild(typeSpan);

    const due = new Date(task.dueDate);
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    const dueSpan = document.createElement("span");
    dueSpan.textContent = `Due: ${due.toLocaleDateString()}`;
    meta.appendChild(dueSpan);

    if (daysLeft < 0) {
      const badge = document.createElement("span");
      badge.className = "badge-pill badge-high";
      badge.textContent = "Overdue";
      meta.appendChild(badge);
    } else if (daysLeft <= 2) {
      const badge = document.createElement("span");
      badge.className = "badge-pill badge-medium";
      badge.textContent = "Due soon";
      meta.appendChild(badge);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "secondary-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => fillTaskForm(task.id);

    const delBtn = document.createElement("button");
    delBtn.className = "danger-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteTask(task.id);

    actions.append(editBtn, delBtn);

    left.append(titleRow, meta);
    li.append(left, actions);
    list.appendChild(li);
  });
}

function handleTaskForm(e) {
  e.preventDefault();
  const id = document.getElementById("taskId").value || crypto.randomUUID();
  const title = document.getElementById("taskTitle").value.trim();
  const subjectId = document.getElementById("taskSubject").value || null;
  const type = document.getElementById("taskType").value;
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;

  // Validation
  if (!title) {
    showNotification("Task title is required.", "error");
    return;
  }

  if (title.length > 100) {
    showNotification("Task title must be 100 characters or less.", "error");
    return;
  }

  if (!dueDate) {
    showNotification("Due date is required.", "error");
    return;
  }

  const dueDateTime = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDateTime < today) {
    showNotification("Due date cannot be in the past.", "error");
    return;
  }

  const existingIndex = tasks.findIndex(t => t.id === id);
  const obj = { id, title, subjectId, type, priority, dueDate, completed: existingIndex >= 0 ? tasks[existingIndex].completed : false };
  if (existingIndex >= 0) {
    tasks[existingIndex] = obj;
    showNotification("Task updated successfully.", "success");
  } else {
    tasks.push(obj);
    showNotification("Task added successfully.", "success");
  }

  saveAll();
  (e.target || document.getElementById("taskForm")).reset();
  document.getElementById("taskId").value = "";
  renderTasks();
}

function fillTaskForm(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  document.getElementById("taskId").value = t.id;
  document.getElementById("taskTitle").value = t.title;
  document.getElementById("taskSubject").value = t.subjectId || "";
  document.getElementById("taskType").value = t.type;
  document.getElementById("taskPriority").value = t.priority;
  document.getElementById("taskDueDate").value = t.dueDate;
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter(t => t.id !== id);
  saveAll();
  showNotification("Task deleted successfully.", "success");
  renderTasks();
  renderDashboard();
  renderAnalytics();
}

function toggleTaskCompleted(id, completed) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.completed = completed;
  saveAll();
  renderTasks();
  renderDashboard();
  renderAnalytics();
}

// Dashboard
function renderDashboard() {
  document.getElementById("statSubjects").textContent = subjects.length.toString();
  const pending = tasks.filter(t => !t.completed).length;
  document.getElementById("statPendingTasks").textContent = pending.toString();

  const today = new Date();
  const seven = new Date();
  seven.setDate(today.getDate() + 7);
  const upcoming = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d >= today && d <= seven;
  }).length;
  document.getElementById("statUpcoming").textContent = upcoming.toString();

  // Today's schedule
  const day = today.getDay();
  const listSchedule = document.getElementById("todayScheduleList");
  const todaysSlots = scheduleSlots.filter(s => s.day === day);
  if (!todaysSlots.length) {
    listSchedule.classList.add("empty-state");
    listSchedule.innerHTML = "<li>No schedule set for today yet.</li>";
  } else {
    listSchedule.classList.remove("empty-state");
    listSchedule.innerHTML = "";
    todaysSlots
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
      .forEach(slot => {
        const li = document.createElement("li");
        const subj = subjects.find(s => s.id === slot.subjectId);
        const subjName = subj ? subj.name : "Unknown";
        li.textContent = `${slot.start} – ${slot.end} · ${subjName}`;
        listSchedule.appendChild(li);
      });
  }

  // Upcoming tasks list
  const upcomingList = document.getElementById("upcomingTasksList");
  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (!upcomingTasks.length) {
    upcomingList.classList.add("empty-state");
    upcomingList.innerHTML = "<li>No upcoming tasks yet.</li>";
  } else {
    upcomingList.classList.remove("empty-state");
    upcomingList.innerHTML = "";
    upcomingTasks.forEach(t => {
      const li = document.createElement("li");
      const d = new Date(t.dueDate);
      li.textContent = `${d.toLocaleDateString()} · ${t.title}`;
      upcomingList.appendChild(li);
    });
  }
}

// Analytics
function renderAnalytics() {
  // Task completion
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("taskCompletionPercent").textContent = `${percent}%`;
  document.getElementById("taskCompletionBar").style.width = `${percent}%`;
  document.getElementById("taskCompletionSummary").textContent =
    total === 0
      ? "No tasks yet."
      : `${done} of ${total} tasks completed. Keep going!`;

  // Subject coverage
  if (!subjects.length) {
    document.getElementById("subjectCoveragePercent").textContent = "0%";
    document.getElementById("subjectCoverageBar").style.width = "0%";
    document.getElementById("subjectCoverageSummary").textContent =
      "Add subjects and tasks to see coverage.";
  } else {
    const subjectIdsWithTasks = new Set(tasks.filter(t => t.subjectId).map(t => t.subjectId));
    const covered = subjectIdsWithTasks.size;
    const coverage = Math.round((covered / subjects.length) * 100);
    document.getElementById("subjectCoveragePercent").textContent = `${coverage}%`;
    document.getElementById("subjectCoverageBar").style.width = `${coverage}%`;
    document.getElementById("subjectCoverageSummary").textContent =
      `${covered} of ${subjects.length} subjects have at least one task.`;
  }

  // Study load
  const list = document.getElementById("studyLoadList");
  if (!subjects.length) {
    list.classList.add("empty-state");
    list.innerHTML = "<li>Add subjects with weekly hours to see study load.</li>";
    return;
  }

  list.classList.remove("empty-state");
  list.innerHTML = "";
  subjects.forEach(s => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";

    const title = document.createElement("span");
    title.textContent = s.name;
    title.style.fontWeight = "500";

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.gap = "6px";
    meta.style.alignItems = "center";
    meta.style.fontSize = "0.8rem";

    const hours = document.createElement("span");
    hours.className = "chip";
    hours.textContent = `${s.hoursPerWeek || 0}h / week`;

    const relatedTasks = tasks.filter(t => t.subjectId === s.id);
    const ct = document.createElement("span");
    ct.textContent = `${relatedTasks.length} tasks`;
    ct.className = "chip";

    meta.append(hours, ct);
    left.append(title, meta);
    li.append(left);
    list.appendChild(li);
  });
}

// Settings: export / reset
function exportData() {
  const data = {
    subjects,
    scheduleSlots,
    tasks,
    prefs,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smart-study-planner-data.json";
  a.click();
  URL.revokeObjectURL(url);
  showNotification("Data exported successfully!", "success");
}

function resetData() {
  if (!confirm("This will clear all subjects, schedule, tasks, and preferences. This action cannot be undone. Continue?")) return;
  subjects = [];
  scheduleSlots = [];
  tasks = [];
  prefs = { theme: "light" };
  saveAll();
  applyTheme();
  renderSubjects();
  renderSchedule();
  renderTasks();
  renderDashboard();
  renderAnalytics();
  showNotification("All data has been reset successfully.", "success");
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  applyTheme();
  updateTodayDate();
  startClock();

  // Navigation listeners
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Theme toggle
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  // Forms
  document.getElementById("subjectForm").addEventListener("submit", handleSubjectForm);
  document.getElementById("subjectFormReset").addEventListener("click", () => {
    document.getElementById("subjectForm").reset();
    document.getElementById("subjectId").value = "";
  });

  document.getElementById("scheduleForm").addEventListener("submit", handleScheduleForm);
  document.getElementById("scheduleFormReset").addEventListener("click", () => {
    document.getElementById("scheduleForm").reset();
    document.getElementById("scheduleId").value = "";
    document.getElementById("scheduleConflictMsg").classList.add("hidden");
  });

  document.getElementById("taskForm").addEventListener("submit", handleTaskForm);
  document.getElementById("taskFormReset").addEventListener("click", () => {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
  });

  // Settings
  document.getElementById("exportDataBtn").addEventListener("click", exportData);
  document.getElementById("resetDataBtn").addEventListener("click", resetData);

  // Initial renders
  renderSubjects();
  renderSchedule();
  renderTasks();
  renderDashboard();
  renderAnalytics();
});