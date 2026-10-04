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
      repeat: normalizeRepeat(input.repeat),
      repeat_every: normalizeEvery(input.repeat, input.repeat_every),
      date_offset_days: dayOffset(input.date, input.run_at),
      status: "pending",
      task_id: null,
      run_count: 0,
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

  function normalizeRepeat(value) {
    return ["daily", "weekly", "monthly", "days"].includes(value) ? value : "once";
  }

  function normalizeEvery(repeat, value) {
    const every = Math.round(Number(value));
    if (normalizeRepeat(repeat) !== "days") return 1;
    if (!Number.isFinite(every)) return 1;
    return Math.min(365, Math.max(1, every));
  }

  function calendarDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dayOffset(taskDate, runAt) {
    const run = new Date(runAt);
    if (!taskDate || Number.isNaN(run.getTime())) return 0;
    const parts = String(taskDate).split("-").map(Number);
    if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return 0;
    const taskDay = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((taskDay - calendarDay(run)) / 86400000);
  }

  function occurrenceYmd(runAt, offsetDays) {
    const run = new Date(runAt);
    const day = new Date(
      run.getFullYear(),
      run.getMonth(),
      run.getDate() + (Number(offsetDays) || 0),
    );
    const pad = (n) => String(n).padStart(2, "0");
    return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  }

  function addDays(date, days) {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
  }

  function addMonths(date, months) {
    const next = new Date(date.getTime());
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + months);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, last));
    return next;
  }

  function nextRunAt(runAt, repeat, every) {
    const base = new Date(runAt);
    if (Number.isNaN(base.getTime())) return null;
    if (repeat === "daily") return addDays(base, 1);
    if (repeat === "weekly") return addDays(base, 7);
    if (repeat === "monthly") return addMonths(base, 1);
    if (repeat === "days") return addDays(base, normalizeEvery(repeat, every));
    return null;
  }

  function isRepeating(row) {
    return !!nextRunAt(row.run_at, row.repeat, row.repeat_every);
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
      let current = locked;
      let guard = 0;
      try {
        while (current && Date.parse(current.run_at) <= Date.now() && guard < 31) {
          guard += 1;
          const repeating = isRepeating(current);
          const task = await createTask({
            ...current,
            date: repeating
              ? occurrenceYmd(current.run_at, current.date_offset_days)
              : current.date,
          });
          const next = nextRunAt(current.run_at, current.repeat, current.repeat_every);
          const continueRun =
            repeating && next && next.getTime() <= Date.now() && guard < 31;
          current = update(current.id, {
            status: repeating ? "pending" : "done",
            run_at: repeating ? next.toISOString() : current.run_at,
            task_id: task?.id || null,
            run_count: (Number(current.run_count) || 0) + 1,
            last_run_at: new Date().toISOString(),
            done_at: repeating ? null : new Date().toISOString(),
            error: "",
            lockToken: continueRun ? current.lockToken : "",
            lockUntil: continueRun ? Date.now() + LOCK_MS : 0,
          });
          created.push(current);
          if (!continueRun) break;
        }
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
