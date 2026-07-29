"use strict";

/* ==========================================================================
   MOCK DATA — identical shape/values to the React prototype
   ========================================================================== */

const weeklyHours = [
  { day: "Mon", hours: 8.2, overtime: 0.2 },
  { day: "Tue", hours: 7.9, overtime: 0 },
  { day: "Wed", hours: 8.6, overtime: 0.6 },
  { day: "Thu", hours: 8.0, overtime: 0 },
  { day: "Fri", hours: 6.4, overtime: 0 },
  { day: "Sat", hours: 0, overtime: 0 },
  { day: "Sun", hours: 0, overtime: 0 },
];

const attendancePie = [
  { name: "Present", value: 18, color: "success" },
  { name: "Late", value: 2, color: "accent" },
  { name: "Leave", value: 1, color: "primary" },
  { name: "Absent", value: 0, color: "danger" },
];

const team = [
  { name: "Amelia Rhodes", role: "Product Designer", status: "present", hours: "6h 12m", initials: "AR", color: "#5B7CFF" },
  { name: "Diego Marín", role: "Backend Engineer", status: "present", hours: "5h 48m", initials: "DM", color: "#34D399" },
  { name: "Priya Nair", role: "Support Lead", status: "late", hours: "4h 05m", initials: "PN", color: "#FFB020" },
  { name: "Tom Achebe", role: "Sales Manager", status: "leave", hours: "—", initials: "TA", color: "#FB7185" },
  { name: "Sofia Lund", role: "QA Engineer", status: "present", hours: "6h 40m", initials: "SL", color: "#A78BFA" },
  { name: "Kenji Watanabe", role: "Frontend Engineer", status: "absent", hours: "—", initials: "KW", color: "#5C5C68" },
];

const activity = [
  { who: "Priya Nair", what: "clocked in", when: "08:14 AM", tag: "late" },
  { who: "Diego Marín", what: "started a break", when: "10:02 AM", tag: "break" },
  { who: "Amelia Rhodes", what: "requested leave — Aug 4–5", when: "09:41 AM", tag: "leave" },
  { who: "Sofia Lund", what: "clocked in", when: "07:58 AM", tag: "onTime" },
  { who: "Tom Achebe", what: "leave approved by system", when: "Yesterday", tag: "leave" },
];

const scheduleWeek = [
  { day: "Mon", date: 28, shifts: [{ name: "Amelia", time: "9:00–17:00" }, { name: "Diego", time: "9:00–17:00" }, { name: "Sofia", time: "10:00–18:00" }] },
  { day: "Tue", date: 29, shifts: [{ name: "Amelia", time: "9:00–17:00" }, { name: "Priya", time: "8:00–16:00" }] },
  { day: "Wed", date: 30, shifts: [{ name: "Diego", time: "9:00–17:00" }, { name: "Sofia", time: "10:00–18:00" }, { name: "Kenji", time: "9:00–17:00" }] },
  { day: "Thu", date: 31, shifts: [{ name: "Amelia", time: "9:00–17:00" }, { name: "Priya", time: "8:00–16:00" }] },
  { day: "Fri", date: 1, shifts: [{ name: "Diego", time: "9:00–15:00" }] },
  { day: "Sat", date: 2, shifts: [] },
  { day: "Sun", date: 3, shifts: [] },
];

const leaveRequests = [
  { name: "Amelia Rhodes", type: "Vacation", range: "Aug 4 – Aug 5", status: "pending", initials: "AR", color: "#5B7CFF" },
  { name: "Kenji Watanabe", type: "Sick leave", range: "Jul 26", status: "approved", initials: "KW", color: "#5C5C68" },
  { name: "Tom Achebe", type: "Personal", range: "Jul 28 – Jul 30", status: "approved", initials: "TA", color: "#FB7185" },
];

const payroll = [
  { name: "Amelia Rhodes", base: 4200, overtime: 220, net: 4420 },
  { name: "Diego Marín", base: 4600, overtime: 140, net: 4740 },
  { name: "Priya Nair", base: 3800, overtime: 0, net: 3800 },
  { name: "Sofia Lund", base: 3950, overtime: 310, net: 4260 },
];

const STATUS_META = {
  present: { label: "Present", key: "success" },
  late: { label: "Late", key: "accent" },
  leave: { label: "On leave", key: "primary" },
  absent: { label: "Absent", key: "danger" },
};

// NAV and page titles are no longer static: they're sourced per-role from
// window.Roles.getNavForRole() (see roles.js) via getRoleNav() below, so
// each role only ever sees — and can only ever reach — its own destinations.

/* ==========================================================================
   STATE — mirrors the useState calls in App()
   ========================================================================== */

const state = {
  theme: "dark",
  active: "dashboard",
  sidebarOpen: false,
  notifOpen: false,
  running: true,
  onBreak: false,
  seconds: 6 * 3600 + 12 * 60,
  timerIntervalId: null,
  // Populated by resolveRole() on sign-in (see roles.js), cleared on sign-out.
  // Shape: { id, email, name, role }
  currentUser: null,
};

const GOAL_SECONDS = 8 * 3600;

/* ==========================================================================
   HELPERS
   ========================================================================== */

function fmt(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeColor(key) {
  // maps a logical color key (success/accent/primary/danger) to its live CSS var
  const map = { success: "--success", accent: "--accent", primary: "--primary", danger: "--danger" };
  return cssVar(map[key] || "--primary");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ==========================================================================
   REUSABLE RENDER FUNCTIONS (JS equivalents of React primitives)
   ========================================================================== */

function avatarHTML(initials, color, size = 36) {
  const fontSize = Math.round(size * 0.36);
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;background:${color}22;color:${color}">${escapeHtml(initials)}</div>`;
}

function pillHTML(colorKey, label) {
  return `<span class="pill pill-${colorKey}"><span class="pill-dot"></span>${escapeHtml(label)}</span>`;
}

function buttonHTML({ label, variant = "primary", icon = null, extraClass = "", attrs = "" }) {
  const iconHTML = icon ? `<i data-lucide="${icon}"></i>` : "";
  return `<button class="btn btn-${variant} ${extraClass}" ${attrs}>${iconHTML}${escapeHtml(label)}</button>`;
}

function sectionHeadingHTML(title, subtitle, actionHTML = "") {
  return `
    <div class="section-heading">
      <div>
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${actionHTML}
    </div>`;
}

function statCardHTML({ label, value, delta, positive, icon, colorKey = "primary" }) {
  const deltaHTML = delta
    ? `<span class="stat-card-delta ${positive ? "positive" : "negative"}">
         <i data-lucide="${positive ? "arrow-up-right" : "arrow-down-right"}"></i>${escapeHtml(delta)}
       </span>`
    : "";
  return `
    <div class="card hoverable p-5">
      <div class="stat-card-top">
        <div class="stat-card-icon" style="background:var(--${colorKey}-soft);color:var(--${colorKey})">
          <i data-lucide="${icon}"></i>
        </div>
        ${deltaHTML}
      </div>
      <p class="stat-card-value">${escapeHtml(value)}</p>
      <p class="stat-card-label">${escapeHtml(label)}</p>
    </div>`;
}

/* ---- Live Timer (rendered identically into #dashboard and #time views) ---- */

function liveTimerHTML(idSuffix) {
  return `
    <div class="card live-timer" data-timer-root>
      <div class="live-timer-glow" data-timer-glow></div>
      <div class="live-timer-inner">
        <div class="live-timer-main">
          <div class="timer-status">
            <span class="timer-status-dot" data-timer-dot></span>
            <span class="timer-status-label" data-timer-status-label>Not clocked in</span>
          </div>
          <div class="timer-display" data-timer-display>00:00:00</div>
          <p class="timer-subtitle">
            <span data-timer-hours>0.0</span>h of your 8h goal ·
            <span class="overtime-value">+<span data-timer-overtime>0.0</span>h overtime</span>
          </p>
          <div class="timer-actions">
            <button class="btn" data-action="clock-toggle" data-timer-clock-btn></button>
            <button class="btn" data-action="break-toggle" data-timer-break-btn></button>
          </div>
        </div>
        <div class="timer-ring-wrap">
          <div class="timer-ring">
            <svg viewBox="0 0 120 120">
              <circle class="ring-track" cx="60" cy="60" r="52"></circle>
              <circle class="ring-fill" data-timer-ring cx="60" cy="60" r="52"
                stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52}"></circle>
            </svg>
            <div class="timer-ring-label">
              <span class="timer-ring-pct" data-timer-pct>0%</span>
              <span class="timer-ring-caption">of goal</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ==========================================================================
   VIEW RENDERERS
   ========================================================================== */

function renderDashboard() {
  return `
    <div class="stack">
      <div class="grid grid-2-1">
        <div>${liveTimerHTML()}</div>
        <div class="card p-6 team-status-card">
          <div>
            <p class="team-status-label">Team status</p>
            <p class="team-status-value">5 <span>of 6 online</span></p>
          </div>
          <div class="avatar-stack">
            ${team.slice(0, 5).map((m) => `<div class="avatar-stack-item">${avatarHTML(m.initials, m.color, 34)}</div>`).join("")}
            <div class="avatar-stack-more">+1</div>
          </div>
        </div>
      </div>

      <div class="grid grid-4-stats">
        ${statCardHTML({ label: "Hours this week", value: "39.1h", delta: "4.2%", positive: true, icon: "clock", colorKey: "primary" })}
        ${statCardHTML({ label: "Overtime", value: "1.8h", delta: "0.6h", positive: true, icon: "trending-up", colorKey: "accent" })}
        ${statCardHTML({ label: "Leave balance", value: "12 days", icon: "calendar-clock", colorKey: "success" })}
        ${statCardHTML({ label: "Late check-ins", value: "2", delta: "1", positive: false, icon: "alert-circle", colorKey: "danger" })}
      </div>

      <div class="grid grid-2-1">
        <div class="card p-6">
          ${sectionHeadingHTML("Weekly hours", "Logged vs. overtime")}
          <div class="chart-box"><canvas id="weeklyHoursChart"></canvas></div>
        </div>
        <div class="card p-6">
          ${sectionHeadingHTML("Attendance", "This month")}
          <div class="chart-box-sm"><canvas id="attendancePieChart"></canvas></div>
          <div class="pie-legend">
            ${attendancePie.map((d) => `
              <div class="pie-legend-item">
                <span class="pie-legend-dot" style="background:var(--${d.color})"></span>
                ${escapeHtml(d.name)} · ${d.value}
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="grid grid-2-1">
        <div class="card p-6">
          ${sectionHeadingHTML("Recent activity")}
          <div>
            ${activity.map((a) => `
              <div class="activity-row">
                <span class="activity-icon"><i data-lucide="clock"></i></span>
                <p class="activity-text"><b>${escapeHtml(a.who)}</b> ${escapeHtml(a.what)}</p>
                <span class="activity-when">${escapeHtml(a.when)}</span>
              </div>`).join("")}
          </div>
        </div>
        <div class="card p-6">
          ${sectionHeadingHTML("Quick actions")}
          <div class="quick-actions">
            ${[
              { label: "Request time off", icon: "calendar-clock" },
              { label: "Add a shift", icon: "plus" },
              { label: "Export report", icon: "download" },
              { label: "Approve leave (1)", icon: "check-circle-2" },
            ].map((a) => `
              <button class="quick-action-btn">
                <span class="left"><i data-lucide="${a.icon}"></i>${escapeHtml(a.label)}</span>
                <i data-lucide="chevron-right"></i>
              </button>`).join("")}
          </div>
        </div>
      </div>
    </div>`;
}

function renderTimeTracking() {
  const log = [
    { date: "Today", in: "09:02", out: "—", brk: "12m", total: fmt(state.seconds), active: true },
    { date: "Yesterday", in: "08:58", out: "17:41", brk: "34m", total: "8h 09m", active: false },
    { date: "Mon, Jul 26", in: "09:11", out: "17:20", brk: "28m", total: "7h 41m", active: false },
    { date: "Fri, Jul 24", in: "08:55", out: "16:50", brk: "40m", total: "7h 15m", active: false },
  ];
  return `
    <div class="stack">
      ${liveTimerHTML()}
      <div class="card p-6">
        ${sectionHeadingHTML("Time log", "Your check-ins for this week", buttonHTML({ label: "Manual entry", variant: "ghost", icon: "plus" }))}
        <div class="table-scroll">
          <table class="log-table">
            <thead>
              <tr><th>Date</th><th>Clock in</th><th>Clock out</th><th>Break</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody id="timeLogBody">
              ${log.map((row) => `
                <tr class="data-row" ${row.active ? 'data-live-row="1"' : ""}>
                  <td class="cell-date">${escapeHtml(row.date)}</td>
                  <td class="cell-mono">${escapeHtml(row.in)}</td>
                  <td class="cell-mono">${escapeHtml(row.out)}</td>
                  <td class="cell-mono">${escapeHtml(row.brk)}</td>
                  <td class="cell-total" ${row.active ? 'data-live-total="1"' : ""}>${escapeHtml(row.total)}</td>
                  <td>${row.active ? pillHTML("accent", "In progress") : pillHTML("success", "Complete")}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderSchedule() {
  return `
    <div class="card p-6">
      ${sectionHeadingHTML("Weekly schedule", "Jul 28 – Aug 3", `
        <div class="heading-actions">
          <button class="pager-btn"><i data-lucide="chevron-left"></i></button>
          <button class="pager-btn"><i data-lucide="chevron-right"></i></button>
          ${buttonHTML({ label: "Add shift", icon: "plus" })}
        </div>`)}
      <div class="schedule-scroll">
        <div class="schedule-grid">
          ${scheduleWeek.map((d) => `
            <div class="schedule-day">
              <div class="schedule-day-head">
                <span class="schedule-day-name">${escapeHtml(d.day)}</span>
                <span class="schedule-day-date">${d.date}</span>
              </div>
              <div class="schedule-shifts">
                ${d.shifts.length === 0
                  ? `<p class="schedule-empty">No shifts</p>`
                  : d.shifts.map((s) => `
                      <div class="schedule-shift">
                        <p class="schedule-shift-name">${escapeHtml(s.name)}</p>
                        <p class="schedule-shift-time">${escapeHtml(s.time)}</p>
                      </div>`).join("")}
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
}

function renderAttendance() {
  return `
    <div class="stack">
      <div class="grid grid-4-stats">
        ${statCardHTML({ label: "Present today", value: "18", icon: "check-circle-2", colorKey: "success" })}
        ${statCardHTML({ label: "Late arrivals", value: "2", icon: "alert-circle", colorKey: "accent" })}
        ${statCardHTML({ label: "On leave", value: "1", icon: "calendar-clock", colorKey: "primary" })}
        ${statCardHTML({ label: "Absent", value: "0", icon: "x-circle", colorKey: "danger" })}
      </div>
      <div class="card p-6">
        ${sectionHeadingHTML("Today's attendance", "Jul 28, 2026")}
        <div>
          ${team.map((m) => `
            <div class="person-row">
              ${avatarHTML(m.initials, m.color, 34)}
              <div class="person-info">
                <p class="person-name">${escapeHtml(m.name)}</p>
                <p class="person-role">${escapeHtml(m.role)}</p>
              </div>
              <span class="person-hours">${escapeHtml(m.hours)}</span>
              ${pillHTML(STATUS_META[m.status].key, STATUS_META[m.status].label)}
            </div>`).join("")}
        </div>
      </div>
    </div>`;
}

function renderLeave() {
  return `
    <div class="stack">
      <div class="card p-6">
        ${sectionHeadingHTML("Leave requests", "Review and approve time off", buttonHTML({ label: "New request", icon: "plus" }))}
        <div>
          ${leaveRequests.map((r) => `
            <div class="leave-row">
              ${avatarHTML(r.initials, r.color, 36)}
              <div class="person-info">
                <p class="person-name">${escapeHtml(r.name)}</p>
                <p class="leave-type">${escapeHtml(r.type)} · ${escapeHtml(r.range)}</p>
              </div>
              ${r.status === "pending"
                ? `<div class="leave-actions">
                     ${buttonHTML({ label: "Decline", variant: "ghost", extraClass: "btn-sm" })}
                     ${buttonHTML({ label: "Approve", variant: "primary", extraClass: "btn-sm" })}
                   </div>`
                : pillHTML("success", "Approved")}
            </div>`).join("")}
        </div>
      </div>

      <div class="card p-6">
        ${sectionHeadingHTML("Leave balance")}
        <div class="leave-balance-grid">
          ${[{ l: "Vacation", v: 12, max: 20 }, { l: "Sick", v: 4, max: 8 }, { l: "Personal", v: 2, max: 4 }, { l: "Unpaid", v: 0, max: "∞" }]
            .map((b) => `
              <div class="leave-balance-tile">
                <p class="leave-balance-label">${escapeHtml(b.l)}</p>
                <p class="leave-balance-value">${b.v}<span>/${b.max}</span></p>
              </div>`).join("")}
        </div>
      </div>
    </div>`;
}

function renderTeam() {
  return `
    <div class="card p-6">
      ${sectionHeadingHTML("Team", "6 members", buttonHTML({ label: "Invite member", icon: "plus" }))}
      <div class="grid team-grid">
        ${team.map((m) => `
          <div class="team-card">
            <div class="team-card-top">
              ${avatarHTML(m.initials, m.color, 40)}
              ${pillHTML(STATUS_META[m.status].key, STATUS_META[m.status].label)}
            </div>
            <p class="team-card-name">${escapeHtml(m.name)}</p>
            <p class="team-card-role">${escapeHtml(m.role)}</p>
            <div class="team-card-bottom">
              <span>Today</span>
              <span>${escapeHtml(m.hours)}</span>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

function renderReports() {
  return `
    <div class="stack">
      <div class="grid grid-2-1">
        <div class="card p-6">
          ${sectionHeadingHTML("Overtime by day", "Last 7 days", buttonHTML({ label: "Export CSV", variant: "ghost", icon: "download", extraClass: "btn-sm" }))}
          <div class="chart-box"><canvas id="overtimeBarChart"></canvas></div>
        </div>
        <div class="card p-6">
          ${sectionHeadingHTML("Payroll overview", "This period")}
          <p class="payroll-total">$17,220</p>
          <p class="payroll-sub">+ $670 overtime included</p>
          <div>
            ${payroll.map((p) => `
              <div class="payroll-row">
                <span class="name">${escapeHtml(p.name)}</span>
                <span class="amount">$${p.net.toLocaleString()}</span>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="card p-6">
        ${sectionHeadingHTML("Reports", "Generate a report for any range")}
        <div class="grid report-links">
          ${[
            { title: "Attendance summary", icon: "user-check", desc: "Presence, lateness & absence trends" },
            { title: "Overtime breakdown", icon: "trending-up", desc: "Hours beyond scheduled shifts" },
            { title: "Payroll export", icon: "dollar-sign", desc: "Ready-to-run pay period totals" },
          ].map((r) => `
            <button class="report-link">
              <i data-lucide="${r.icon}"></i>
              <p class="report-link-title">${escapeHtml(r.title)}</p>
              <p class="report-link-desc">${escapeHtml(r.desc)}</p>
            </button>`).join("")}
        </div>
      </div>
    </div>`;
}

function toggleRowHTML(id, label, desc, defaultOn) {
  return `
    <div class="toggle-row">
      <div>
        <p class="toggle-label">${escapeHtml(label)}</p>
        ${desc ? `<p class="toggle-desc">${escapeHtml(desc)}</p>` : ""}
      </div>
      <button class="switch ${defaultOn ? "is-on" : ""}" data-toggle-id="${id}" role="switch" aria-checked="${defaultOn}">
        <span class="switch-thumb"></span>
      </button>
    </div>`;
}

function renderSettings() {
  return `
    <div class="stack">
      <div class="card p-6">
        ${sectionHeadingHTML("Profile")}
        <div class="profile-row">
          ${avatarHTML("JD", "#5B7CFF", 56)}
          <div>
            <p class="profile-name">Jordan Diaz</p>
            <p class="profile-email">jordan@chronos.app · HR Manager</p>
          </div>
          <div class="profile-edit">${buttonHTML({ label: "Edit profile", variant: "ghost" })}</div>
        </div>
      </div>

      <div class="card p-6">
        ${sectionHeadingHTML("Working hours", "Default schedule & overtime rules")}
        <div class="grid settings-hours-grid">
          <div>
            <label class="field-label">Standard shift start</label>
            <div class="field-value">09:00</div>
          </div>
          <div>
            <label class="field-label">Standard shift end</label>
            <div class="field-value">17:00</div>
          </div>
          <div>
            <label class="field-label">Overtime multiplier</label>
            <div class="field-value">1.5×</div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        ${sectionHeadingHTML("Notifications")}
        ${toggleRowHTML("late-alerts", "Late clock-in alerts", "Notify managers when someone clocks in after 09:15", true)}
        ${toggleRowHTML("leave-updates", "Leave request updates", "Email me when a request is approved or declined", true)}
        ${toggleRowHTML("weekly-summary", "Weekly summary", "A digest of hours, overtime and attendance every Monday", false)}
      </div>

      <div class="card p-6">
        ${sectionHeadingHTML("Appearance")}
        ${toggleRowHTML("reduce-motion", "Reduce motion", "Minimize animations across the app", false)}
        ${toggleRowHTML("compact-density", "Compact density", "Tighter spacing for data-dense tables", false)}
      </div>
    </div>`;
}

const VIEW_RENDERERS = {
  dashboard: renderDashboard,
  time: renderTimeTracking,
  schedule: renderSchedule,
  attendance: renderAttendance,
  leave: renderLeave,
  team: renderTeam,
  reports: renderReports,
  settings: renderSettings,
};

/* ==========================================================================
   CHARTS (Chart.js instances — recreated on theme change for correct colors)
   ========================================================================== */

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function initWeeklyHoursChart() {
  const canvas = document.getElementById("weeklyHoursChart");
  if (!canvas) return;
  destroyChart("weeklyHoursChart");

  const primary = cssVar("--primary");
  const border = cssVar("--border");
  const textFaint = cssVar("--text-faint");
  const surface = cssVar("--surface");

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, primary + "59"); // ~35% alpha
  gradient.addColorStop(1, primary + "00");

  chartInstances.weeklyHoursChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weeklyHours.map((d) => d.day),
      datasets: [{
        data: weeklyHours.map((d) => d.hours),
        borderColor: primary,
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: primary,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface, borderColor: border, borderWidth: 1,
          titleColor: cssVar("--text"), bodyColor: cssVar("--text-dim"),
          padding: 10, cornerRadius: 12, displayColors: false,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textFaint, font: { size: 12 } }, border: { display: false } },
        y: { grid: { color: border, drawTicks: false }, ticks: { color: textFaint, font: { size: 12 } }, border: { display: false } },
      },
    },
  });
}

function initAttendancePieChart() {
  const canvas = document.getElementById("attendancePieChart");
  if (!canvas) return;
  destroyChart("attendancePieChart");

  chartInstances.attendancePieChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: attendancePie.map((d) => d.name),
      datasets: [{
        data: attendancePie.map((d) => d.value),
        backgroundColor: attendancePie.map((d) => themeColor(d.color)),
        borderWidth: 0,
        spacing: 3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar("--surface"), borderColor: cssVar("--border"), borderWidth: 1,
          titleColor: cssVar("--text"), bodyColor: cssVar("--text-dim"),
          padding: 10, cornerRadius: 12,
        },
      },
    },
  });
}

function initOvertimeBarChart() {
  const canvas = document.getElementById("overtimeBarChart");
  if (!canvas) return;
  destroyChart("overtimeBarChart");

  chartInstances.overtimeBarChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: weeklyHours.map((d) => d.day),
      datasets: [
        { label: "Hours", data: weeklyHours.map((d) => d.hours), backgroundColor: cssVar("--primary"), borderRadius: 6 },
        { label: "Overtime", data: weeklyHours.map((d) => d.overtime), backgroundColor: cssVar("--accent"), borderRadius: 6 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar("--surface"), borderColor: cssVar("--border"), borderWidth: 1,
          titleColor: cssVar("--text"), bodyColor: cssVar("--text-dim"),
          padding: 10, cornerRadius: 12,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: cssVar("--text-faint"), font: { size: 12 } }, border: { display: false } },
        y: { grid: { color: cssVar("--border"), drawTicks: false }, ticks: { color: cssVar("--text-faint"), font: { size: 12 } }, border: { display: false } },
      },
    },
  });
}

function initChartsForActiveView() {
  if (state.active === "dashboard") {
    initWeeklyHoursChart();
    initAttendancePieChart();
  } else if (state.active === "reports") {
    initOvertimeBarChart();
  }
}

/* ==========================================================================
   TIMER
   ========================================================================== */

function updateTimerUI() {
  const pct = Math.min(100, (state.seconds / GOAL_SECONDS) * 100);
  const circumference = 2 * Math.PI * 52;
  const hours = state.seconds / 3600;
  const overtime = Math.max(0, hours - 8);

  document.querySelectorAll("[data-timer-root]").forEach((root) => {
    root.querySelector("[data-timer-glow]").classList.toggle("is-running", state.running);
    const dot = root.querySelector("[data-timer-dot]");
    dot.classList.toggle("is-running", state.running);
    root.querySelector("[data-timer-status-label]").textContent =
      state.running ? (state.onBreak ? "On break" : "Currently clocked in") : "Not clocked in";
    root.querySelector("[data-timer-display]").textContent = fmt(state.seconds);
    root.querySelector("[data-timer-hours]").textContent = hours.toFixed(1);
    root.querySelector("[data-timer-overtime]").textContent = overtime.toFixed(1);

    const ring = root.querySelector("[data-timer-ring]");
    ring.setAttribute("stroke-dasharray", circumference);
    ring.setAttribute("stroke-dashoffset", circumference * (1 - pct / 100));
    root.querySelector("[data-timer-pct]").textContent = `${Math.round(pct)}%`;

    const clockBtn = root.querySelector("[data-timer-clock-btn]");
    if (state.running) {
      clockBtn.className = "btn btn-ghost";
      clockBtn.innerHTML = `<i data-lucide="pause"></i>Clock out`;
    } else {
      clockBtn.className = "btn btn-primary";
      clockBtn.innerHTML = `<i data-lucide="play"></i>Clock in`;
    }

    const breakBtn = root.querySelector("[data-timer-break-btn]");
    breakBtn.className = `btn ${state.onBreak ? "btn-soft" : "btn-ghost"}`;
    breakBtn.innerHTML = `<i data-lucide="coffee"></i>${state.onBreak ? "End break" : "Take a break"}`;
  });

  // live row in the Time Tracking table, if currently rendered
  const liveTotal = document.querySelector("[data-live-total]");
  if (liveTotal) liveTotal.textContent = fmt(state.seconds);

  refreshIcons();
}

function tick() {
  if (state.running && !state.onBreak) {
    state.seconds += 1;
    updateTimerUI();
  }
}

function startTimerLoop() {
  if (state.timerIntervalId) clearInterval(state.timerIntervalId);
  state.timerIntervalId = setInterval(tick, 1000);
}

/* ==========================================================================
   RENDER / NAVIGATION
   ========================================================================== */

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function renderSidebarNav() {
  const nav = document.getElementById("sidebarNav");
  nav.innerHTML = getRoleNav().map((item) => `
    <button class="nav-item ${item.id === state.active ? "is-active" : ""}" data-nav="${item.id}">
      <i data-lucide="${item.icon}"></i>${escapeHtml(item.label)}
    </button>`).join("");
}

function renderNotifications() {
  const list = document.getElementById("notifList");
  list.innerHTML = activity.slice(0, 4).map((a) => `
    <div class="notif-row">
      <div class="notif-row-dot"></div>
      <div class="notif-row-text">
        <span class="notif-row-who">${escapeHtml(a.who)}</span>
        <span class="notif-row-what"> ${escapeHtml(a.what)}</span>
        <div class="notif-row-when">${escapeHtml(a.when)}</div>
      </div>
    </div>`).join("");
}

function renderAllViews() {
  Object.keys(VIEW_RENDERERS).forEach((id) => {
    const el = document.getElementById(`view-${id}`);
    el.innerHTML = VIEW_RENDERERS[id]();
  });
  refreshIcons();
  updateTimerUI();
}

function setActiveView(id) {
  // Route protection: if the current role can't reach `id` (including an
  // Employee somehow ending up on an Admin-only view), fall back to the
  // one view every role can always reach.
  if (!isViewAllowedForCurrentUser(id)) {
    id = window.Roles.getDefaultViewId();
  }
  state.active = id;

  document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
  const target = document.getElementById(`view-${id}`);
  target.classList.add("is-active");
  // restart the fade-in animation each time a view becomes active
  target.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  target.offsetHeight;
  target.style.animation = "";

  const navItem = getRoleNav().find((item) => item.id === id);
  document.getElementById("pageTitle").textContent = navItem ? navItem.label : "";
  renderSidebarNav();
  refreshIcons();

  initChartsForActiveView();
  closeSidebar();
}

/* ==========================================================================
   THEME
   ========================================================================== */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  // colors referenced by Chart.js are read live from CSS vars, so charts
  // must be re-created whenever the theme (and therefore the vars) changes
  initChartsForActiveView();
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

/* ==========================================================================
   SIDEBAR / NOTIFICATIONS (mobile + dropdown open/close)
   ========================================================================== */

function openSidebar() {
  state.sidebarOpen = true;
  document.getElementById("sidebar").classList.add("is-open");
  document.getElementById("sidebarScrim").classList.add("is-visible");
}
function closeSidebar() {
  state.sidebarOpen = false;
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("sidebarScrim").classList.remove("is-visible");
}

function toggleNotifDropdown() {
  state.notifOpen = !state.notifOpen;
  const dropdown = document.getElementById("notifDropdown");
  const btn = document.getElementById("notifBtn");
  dropdown.hidden = !state.notifOpen;
  btn.setAttribute("aria-expanded", String(state.notifOpen));
}

/* ==========================================================================
   EVENT DELEGATION
   ========================================================================== */

function wireEvents() {
  document.getElementById("sidebarOpenBtn").addEventListener("click", openSidebar);
  document.getElementById("sidebarCloseBtn").addEventListener("click", closeSidebar);
  document.getElementById("sidebarScrim").addEventListener("click", closeSidebar);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("notifBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotifDropdown();
  });

  // sidebar nav (delegated — nav is re-rendered on every view switch)
  document.getElementById("sidebarNav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-nav]");
    if (btn) setActiveView(btn.dataset.nav);
  });

  // global delegated handlers for content generated inside views
  document.getElementById("mainContent").addEventListener("click", (e) => {
    const clockBtn = e.target.closest('[data-action="clock-toggle"]');
    if (clockBtn) {
      state.running = !state.running;
      updateTimerUI();
      return;
    }
    const breakBtn = e.target.closest('[data-action="break-toggle"]');
    if (breakBtn) {
      state.onBreak = !state.onBreak;
      updateTimerUI();
      return;
    }
    const toggle = e.target.closest("[data-toggle-id]");
    if (toggle) {
      const isOn = toggle.classList.toggle("is-on");
      toggle.setAttribute("aria-checked", String(isOn));
      return;
    }
  });

  // close notification dropdown / mobile sidebar on outside interaction is
  // intentionally NOT implemented, matching the original React prototype's
  // behavior (it also had no outside-click handling).
}

/* ==========================================================================
   INIT (app shell — only ever runs while a session is present)
   ========================================================================== */

let appStarted = false;

function init() {
  applyThemeAttributeOnly(state.theme);
  renderSidebarNav();
  renderNotifications();
  renderAllViews();
  setActiveView(state.active);
  wireEvents();
  startTimerLoop();
  refreshIcons();
}

function applyThemeAttributeOnly(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/* ==========================================================================
   AUTHENTICATION / ROUTE PROTECTION
   ==========================================================================
   Three mutually-exclusive screens: #bootScreen (resolving the session),
   #authScreen (login), #appShell (everything built above). Which one is
   visible is driven entirely by Auth.onAuthStateChange — there is no other
   way to reach the app shell, so an unauthenticated visitor can never see
   it, including on refresh.
   ========================================================================== */

const bootScreen = document.getElementById("bootScreen");
const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const logoutBtn = document.getElementById("logoutBtn");
const accountName = document.getElementById("accountName");
const accountAvatar = document.getElementById("accountAvatar");
const accountRole = document.getElementById("accountRole");

function showBootScreen() {
  bootScreen.hidden = false;
  authScreen.hidden = true;
  appShell.hidden = true;
}

function resetLoginForm() {
  loginForm.reset();
  loginError.hidden = true;
  loginError.textContent = "";
  loginSubmitBtn.disabled = false;
  loginSubmitBtn.textContent = "Sign in";
}

function showAuthScreen() {
  bootScreen.hidden = true;
  authScreen.hidden = false;
  appShell.hidden = true;

  // Stop ticking the timer and close transient UI while logged out, so
  // nothing keeps running behind a screen the user can no longer reach.
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
  state.currentUser = null;
  closeSidebar();
  resetLoginForm();
  loginEmailInput.focus();
}

function updateAccountInfo(profile) {
  const displayName = (profile && (profile.name || profile.email)) || "";
  accountName.textContent = displayName || "Signed in";
  accountAvatar.textContent = displayName ? displayName[0].toUpperCase() : "•";
  accountRole.textContent = profile && profile.role === window.Roles.ROLES.ADMIN ? "Admin" : "Employee";
}

/* ---- Role-check helpers ---------------------------------------------------
   Thin wrappers around window.Roles + state.currentUser. getRoleNav() and
   isViewAllowedForCurrentUser() below back renderSidebarNav() and route
   protection in setActiveView(); currentUserIsAdmin/Employee/HasRole are
   available for any view that needs a role check of its own. */
function currentUserIsAdmin() {
  return window.Roles.isAdmin(state.currentUser);
}
function currentUserIsEmployee() {
  return window.Roles.isEmployee(state.currentUser);
}
function currentUserHasRole(role) {
  return window.Roles.hasRole(state.currentUser, role);
}

/** The current user's role-scoped nav entries — the single source both
 *  renderSidebarNav() and setActiveView() read from. */
function getRoleNav() {
  return window.Roles.getNavForRole(state.currentUser && state.currentUser.role);
}

/** Route protection: is `id` one of the current role's reachable views? */
function isViewAllowedForCurrentUser(id) {
  return window.Roles.isViewAllowedForRole(state.currentUser && state.currentUser.role, id);
}

async function showAppShell(user) {
  // Reuse the existing boot screen as the "loading your profile" state —
  // no new UI, just the same screen already used for the initial session
  // check, now also covering the database round-trip for the role.
  showBootScreen();

  // Backend Foundation: load the real profile/role from the `profiles`
  // table (via roles.js -> profileService.js). renderSidebarNav()/
  // setActiveView() (called via init() below) read state.currentUser.role
  // to decide which nav items and views this session can reach.
  state.currentUser = await window.Roles.resolveRole(user);

  bootScreen.hidden = true;
  authScreen.hidden = true;
  appShell.hidden = false;
  updateAccountInfo(state.currentUser);

  if (!appStarted) {
    appStarted = true;
    init();
  } else {
    // Returning to the app after a sign-out/sign-in cycle in the same tab —
    // the shell already exists, just resume the timer and land on Dashboard.
    state.active = "dashboard";
    setActiveView("dashboard");
    startTimerLoop();
  }
}

function wireAuthUI() {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = "Signing in…";

    try {
      const { error } = await window.Auth.signIn(email, password);
      if (error) {
        loginError.textContent = error.message || "Unable to sign in. Please try again.";
        loginError.hidden = false;
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Sign in";
      }
      // On success, Auth.onAuthStateChange fires SIGNED_IN and showAppShell()
      // takes over — no manual redirect needed here.
    } catch (err) {
      loginError.textContent = "Network error — please check your connection and try again.";
      loginError.hidden = false;
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "Sign in";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
      await window.Auth.signOut();
      // Auth.onAuthStateChange fires SIGNED_OUT and showAuthScreen() takes over.
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

function initAuthGate() {
  showBootScreen();
  wireAuthUI();

  window.Auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
      await showAppShell(session.user);
    } else {
      showAuthScreen();
    }
  });
}

document.addEventListener("DOMContentLoaded", initAuthGate);
