/**
 * Lịch tạo task: lưu local, kiểm tra khi app đang mở và khi mở lại sau giờ hẹn.
 */
(function () {
  "use strict";

  const KEY = "mt_task_schedules";
  const LOCK_MS = 25000;
  const isPublic =
    /(?:^|\/)login\.html$/i.test(location.pathname) ||
    document.documentElement.dataset.publicPage === "true";

  function read() {
    try {
      const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  function write(rows, silent) {
    localStorage.setItem(KEY, JSON.stringify(rows));
    if (!silent) {
      window.dispatchEvent(new CustomEvent("mt-schedules-changed"));
    }
  }

  function list() {
    return read()
      .slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }

  function update(id, patch, silent) {
    const rows = read();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return null;
    rows[index] = { ...rows[index], ...patch };
    write(rows, silent);
    return rows[index];
  }

  function add(input) {
    const row = {
      id: `sch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: String(input.name || "").trim(),
      category_id: input.category_id || null,
      category_name: String(input.category_name || "").trim(),
      date: input.date || null,
      price:
        input.price == null || input.price === "" ? null : Number(input.price),
      assign_to: input.assign_to || null,
      is_charged: !!input.is_charged,
      link: input.link || null,
      note: input.note || null,
      run_at: input.run_at,
      status: "pending",
      task_id: null,
      error: "",
      created_at: new Date().toISOString(),
      done_at: null,
      lockToken: "",
      lockUntil: 0,
    };
    const rows = read();
    rows.push(row);
    write(rows);
    return row;
  }

  function remove(id) {
    write(read().filter((row) => row.id !== id));
  }

  function claim(id) {
    const rows = read();
    const row = rows.find((item) => item.id === id);
    if (!row || row.status !== "pending") return null;
    if (row.lockUntil && Date.now() < Number(row.lockUntil)) return null;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    row.lockToken = token;
    row.lockUntil = Date.now() + LOCK_MS;
    write(rows, true);
    const again = read().find((item) => item.id === id);
    if (!again || again.lockToken !== token || again.status !== "pending") {
      return null;
    }
    return again;
  }

  async function errorText(res) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.message || data.hint || data.details || text;
    } catch {
      return text || `HTTP ${res.status}`;
    }
  }

  async function createTask(row) {
    const body = {
      name: row.name,
      link: row.link || null,
      category_id: row.category_id || null,
      date: row.date || null,
      price: Number.isFinite(row.price) ? row.price : null,
      is_charged: !!row.is_charged,
      assign_to: row.assign_to || null,
      note: row.note || null,
    };
    const res = await fetch(`${BASE}/task`, {
      method: "POST",
      headers: { ...HEADERS_JSON, Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  }

  function toast(message, tone) {
    if (window.AppUI && typeof AppUI.toast === "function") {
      AppUI.toast(message, tone);
    }
  }

  async function executeDue() {
    if (typeof BASE === "undefined") return { created: [], failed: [] };
    const created = [];
    const failed = [];
    const now = Date.now();
    const due = read().filter(
      (row) => row.status === "pending" && Date.parse(row.run_at) <= now,
    );
    for (const item of due) {
      const locked = claim(item.id);
      if (!locked) continue;
      try {
        const task = await createTask(locked);
        update(locked.id, {
          status: "done",
          task_id: task?.id || null,
          error: "",
          done_at: new Date().toISOString(),
          lockToken: "",
          lockUntil: 0,
        });
        created.push(locked);
      } catch (error) {
        const message = String(error?.message || error || "Lỗi không xác định");
        update(locked.id, {
          status: "error",
          error: message.slice(0, 240),
          lockToken: "",
          lockUntil: 0,
        });
        failed.push({ ...locked, error: message });
      }
    }
    if (created.length === 1) {
      toast(`Đã tạo task theo lịch: ${created[0].name}`);
    } else if (created.length > 1) {
      toast(`Đã tạo ${created.length} task theo lịch.`);
    }
    failed.forEach((row) => {
      toast(`Không tạo được "${row.name}": ${row.error}`, "error");
    });
    return { created, failed };
  }

  let chain = Promise.resolve();
  function runDue() {
    const run = chain.then(() => executeDue());
    chain = run.then(
      () => {},
      () => {},
    );
    return run;
  }

  function retry(id) {
    update(id, {
      status: "pending",
      error: "",
      lockToken: "",
      lockUntil: 0,
    });
    return runDue();
  }

  function runNow(id) {
    update(id, {
      run_at: new Date().toISOString(),
      status: "pending",
      error: "",
      lockToken: "",
      lockUntil: 0,
    });
    return runDue();
  }

  async function boot() {
    if (isPublic || window.__mtScheduleBoot) return;
    window.__mtScheduleBoot = true;
    const user = await (window.AppAuth?.ready ?? Promise.resolve(null));
    if (!user) return;
    const tick = () => {
      runDue();
    };
    tick();
    setInterval(tick, 15000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tick();
    });
    window.addEventListener("focus", tick);
  }

  window.TaskSchedule = {
    list,
    add,
    remove,
    retry,
    runNow,
    runDue,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
