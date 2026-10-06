  // ⚙️ Change this when testing on your phone, e.g. "http://192.168.1.25:8080"
  const API_BASE_URL = "http://127.0.0.1:8080";

  const COLORS = {
    Food: "#fbbf24", Transport: "#38bdf8", Housing: "#a78bfa", Entertainment: "#f472b6",
    Health: "#34d399", Shopping: "#fb923c", Other: "#94a3b8",
  };
  const color = (c) => COLORS[c] || COLORS.Other;
  const da = (n) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} DA`;
  const esc = (s) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const $ = (id) => document.getElementById(id);

  async function api(path, options) {
    const res = await fetch(`${API_BASE_URL}/api${path}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  // ---- Chart ----
  Chart.defaults.color = "#94a3b8";
  const centerText = {
    id: "centerText",
    afterDraw(chart) {
      const { ctx, chartArea: a } = chart;
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#f1f5f9"; ctx.font = "800 18px Manrope, sans-serif";
      ctx.fillText(chart.$total || "", (a.left + a.right) / 2, (a.top + a.bottom) / 2);
      ctx.restore();
    },
  };
  const chart = new Chart($("chart"), {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: "#0b1120", borderWidth: 3, hoverOffset: 8 }] },
    options: {
      cutout: "72%", responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${da(c.parsed)}` } } },
      animation: { duration: 600 },
    },
    plugins: [centerText],
  });

  function updateChart(stats) {
    const cats = stats.by_category;
    chart.data.labels = cats.map((c) => c.category);
    chart.data.datasets[0].data = cats.map((c) => c.total);
    chart.data.datasets[0].backgroundColor = cats.map((c) => color(c.category));
    chart.$total = cats.length ? da(stats.total) : "";
    chart.update();
    $("chart-empty").classList.toggle("hidden", cats.length > 0);
    $("chart-empty").classList.toggle("flex", cats.length === 0);
    $("legend").innerHTML = cats.map((c) => `
      <li class="flex items-center justify-between">
        <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:${color(c.category)};box-shadow:0 0 10px ${color(c.category)}"></span>${esc(c.category)}
          <span class="text-slate-500">${stats.total ? Math.round((c.total / stats.total) * 100) : 0}%</span></span>
        <span class="font-semibold">${da(c.total)}</span>
      </li>`).join("");
  }

  // ---- State ----
  let expenses = [];
  let editingId = null;
  const CATEGORIES = Object.keys(COLORS);

  // ---- Feed rendering (view row or inline edit row) ----
  const inputCls = "w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/60";

  function rowView(e) {
    return `
      <li class="flex items-center gap-3 py-3">
        <span class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold"
              style="background:${color(e.category)}22;color:${color(e.category)}">${esc(e.category[0])}</span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold truncate">${esc(e.description || e.category)}</p>
          <p class="text-xs text-slate-400">${esc(e.category)} • ${e.date}</p>
        </div>
        <p class="font-bold whitespace-nowrap">-${da(e.amount)}</p>
        <button onclick="startEdit(${e.id})" aria-label="Edit expense"
          class="w-9 h-9 shrink-0 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 active:bg-cyan-500/20">✎</button>
        <button onclick="removeExpense(${e.id})" aria-label="Delete expense"
          class="w-9 h-9 shrink-0 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20">✕</button>
      </li>`;
  }

  function rowEdit(e) {
    const opts = CATEGORIES.map((c) => `<option ${c === e.category ? "selected" : ""}>${c}</option>`).join("");
    return `
      <li class="py-3 space-y-2 rounded-xl">
        <div class="grid grid-cols-2 gap-2">
          <input id="e-amount" type="number" inputmode="decimal" step="0.01" min="0.01" value="${e.amount}" class="${inputCls}" aria-label="Amount" />
          <select id="e-category" class="${inputCls}" aria-label="Category">${opts}</select>
          <input id="e-date" type="date" value="${e.date}" class="${inputCls}" style="color-scheme:dark" aria-label="Date" />
          <input id="e-desc" type="text" maxlength="200" value="${esc(e.description || "")}" placeholder="Description" class="${inputCls}" aria-label="Description" />
        </div>
        <p id="e-error" class="hidden text-sm text-rose-300"></p>
        <div class="flex gap-2 justify-end">
          <button onclick="cancelEdit()" class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300">Cancel</button>
          <button onclick="saveEdit(${e.id})" class="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500">Save changes</button>
        </div>
      </li>`;
  }

  function renderFeed() {
    $("empty").classList.toggle("hidden", expenses.length > 0);
    $("feed").innerHTML = expenses.map((e) => (e.id === editingId ? rowEdit(e) : rowView(e))).join("");
  }

  function startEdit(id) { editingId = id; renderFeed(); }
  function cancelEdit() { editingId = null; renderFeed(); }

  async function saveEdit(id) {
    const payload = {
      amount: parseFloat($("e-amount").value),
      category: $("e-category").value,
      date: $("e-date").value,
      description: $("e-desc").value.trim(),
    };
    if (!(payload.amount > 0) || !payload.date) {
      $("e-error").textContent = "Enter an amount greater than zero and pick a date.";
      return $("e-error").classList.remove("hidden");
    }
    try {
      await api(`/expenses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      $("e-error").textContent = "Couldn't save changes. Check your connection and try again.";
      return $("e-error").classList.remove("hidden");
    }
    editingId = null;
    refresh();
  }

  // ---- Insights (computed from the loaded expenses) ----
  function updateInsights() {
    if (!expenses.length) {
      $("stat-max").textContent = "–"; $("stat-max-sub").innerHTML = "&nbsp;"; $("stat-avg").textContent = "–";
      return;
    }
    const max = expenses.reduce((m, e) => (e.amount > m.amount ? e : m));
    $("stat-max").textContent = da(max.amount);
    $("stat-max-sub").textContent = max.description || max.category;
    const first = expenses.reduce((d, e) => (e.date < d ? e.date : d), expenses[0].date);
    const days = Math.max(1, Math.floor((Date.now() - new Date(first + "T00:00:00")) / 86400000) + 1);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    $("stat-avg").textContent = da(total / days);
  }

  // ---- Budget ----
  async function loadBudget() {
    const b = await api("/budget");
    const bar = $("budget-bar"), pct = $("budget-pct"), text = $("budget-text");
    $("budget-edit-btn").textContent = b.monthly_limit ? "Edit budget" : "Set budget";
    if (!b.monthly_limit) {
      bar.style.width = "0%"; bar.className = "h-full rounded-full transition-all duration-700 bg-slate-500";
      pct.textContent = ""; text.textContent = `No budget set. Spent ${da(b.spent)} this month.`;
      return;
    }
    const p = b.percent;
    let tone = "bg-emerald-400 shadow-[0_0_14px_2px_rgba(52,211,153,0.7)]", txt = "text-emerald-300";
    if (p >= 100) { tone = "bg-rose-500 alert-pulse"; txt = "text-rose-400"; }
    else if (p >= 75) { tone = "bg-amber-400 shadow-[0_0_14px_2px_rgba(251,191,36,0.7)]"; txt = "text-amber-300"; }
    bar.className = `h-full rounded-full transition-all duration-700 ${tone}`;
    bar.style.width = `${Math.min(p, 100)}%`;
    pct.className = `font-bold ${txt}`; pct.textContent = `${Math.round(p)}%`;
    text.textContent = p >= 100
      ? `Over budget by ${da(b.spent - b.monthly_limit)}`
      : `${da(b.spent)} of ${da(b.monthly_limit)} this month`;
  }

  async function saveBudget() {
    const v = parseFloat($("budget-input").value);
    if (isNaN(v) || v < 0) return;
    try {
      await api("/budget", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthly_limit: v }) });
    } catch { return setConn(false); }
    $("budget-form").classList.add("hidden");
    loadBudget();
  }

  // ---- Data ----
  async function loadExpenses() {
    expenses = await api("/expenses");
    renderFeed();
    updateInsights();
  }

  async function loadStats() {
    const s = await api("/stats");
    $("stat-total").textContent = da(s.total);
    $("stat-count").textContent = s.count;
    $("stat-top").textContent = s.by_category[0]?.category ?? "–";
    updateChart(s);
  }

  async function refresh() {
    try {
      await Promise.all([loadExpenses(), loadStats(), loadBudget()]);
      setConn(true);
    } catch {
      setConn(false);
    }
  }

  function setConn(ok) {
    const el = $("conn");
    el.textContent = ok ? "Connected" : "Offline";
    el.className = "text-xs px-2.5 py-1 rounded-full border " +
      (ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300");
  }

  function showError(msg) {
    $("form-error").textContent = msg;
    $("form-error").classList.toggle("hidden", !msg);
  }

  async function addExpense() {
    showError("");
    const payload = {
      amount: parseFloat($("amount").value),
      category: $("category").value,
      date: $("date").value,
      description: $("description").value.trim(),
    };
    if (!(payload.amount > 0) || !payload.date) return showError("Enter an amount greater than zero and pick a date.");
    try {
      await api("/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      return showError(`Couldn't reach ${API_BASE_URL}. Check that the server is running and the address is correct.`);
    }
    $("amount").value = ""; $("description").value = "";
    refresh();
  }

  async function removeExpense(id) {
    try { await api(`/expenses/${id}`, { method: "DELETE" }); } catch { setConn(false); return; }
    if (editingId === id) editingId = null;
    refresh();
  }

  $("budget-edit-btn").addEventListener("click", () => $("budget-form").classList.toggle("hidden"));
  $("budget-save-btn").addEventListener("click", saveBudget);
  $("add-btn").addEventListener("click", addExpense);
  $("date").valueAsDate = new Date();
  refresh();
