/**
 * Synchro custom UI — select dropdowns & date calendars.
 * Keeps native <select>/<input type="date"> synced so existing page JS keeps working.
 */
(function () {
  "use strict";

  const icon =
    (typeof window !== "undefined" && window.icon) ||
    function () {
      return "";
    };

  const OPEN_ATTR = "data-cui-open";
  let openPanel = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  }

  function closeOpen() {
    if (!openPanel) return;
    openPanel.removeAttribute(OPEN_ATTR);
    if (openPanel._cuiFloating) {
      openPanel._cuiFloating.hidden = true;
    }
    openPanel = null;
  }

  function placeFloating(trigger, panel) {
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    panel.hidden = false;
    panel.style.position = "fixed";
    panel.style.zIndex = "10050";
    panel.style.minWidth = Math.max(r.width, 180) + "px";
    panel.style.maxWidth = Math.min(360, vw - 16) + "px";

    // Measure after show
    const ph = panel.offsetHeight || 280;
    const pw = panel.offsetWidth || r.width;
    let top = r.bottom + gap;
    let left = r.left;

    if (top + ph > vh - 8 && r.top - gap - ph > 8) {
      top = r.top - gap - ph;
    }
    if (left + pw > vw - 8) left = Math.max(8, vw - pw - 8);
    if (left < 8) left = 8;

    panel.style.top = Math.round(top) + "px";
    panel.style.left = Math.round(left) + "px";
  }

  function openFor(wrap, trigger, floating) {
    if (wrap.getAttribute(OPEN_ATTR) === "true") {
      closeOpen();
      return;
    }
    closeOpen();
    wrap.setAttribute(OPEN_ATTR, "true");
    wrap._cuiFloating = floating;
    placeFloating(trigger, floating);
    openPanel = wrap;
  }

  document.addEventListener(
    "mousedown",
    (e) => {
      if (!openPanel) return;
      const t = e.target;
      if (openPanel.contains(t)) return;
      if (openPanel._cuiFloating && openPanel._cuiFloating.contains(t)) return;
      closeOpen();
    },
    true,
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOpen();
  });

  window.addEventListener(
    "scroll",
    () => {
      if (openPanel && openPanel._cuiFloating) closeOpen();
    },
    true,
  );

  window.addEventListener("resize", () => {
    if (openPanel) closeOpen();
  });

  /* ---------- SELECT ---------- */

  function selectedLabel(select) {
    const opt = select.options[select.selectedIndex];
    return opt ? opt.textContent.trim() : "";
  }

  function patchValueProp(el, onSet) {
    const proto =
      el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (!desc || !desc.set || !desc.get) return;
    Object.defineProperty(el, "value", {
      configurable: true,
      enumerable: true,
      get() {
        return desc.get.call(this);
      },
      set(v) {
        desc.set.call(this, v);
        onSet();
      },
    });
  }

  function enhanceSelect(select) {
    if (select.dataset.cuiEnhanced === "1") return;
    if (select.closest("[data-cui-skip]")) return;
    select.dataset.cuiEnhanced = "1";

    const wrap = document.createElement("div");
    wrap.className = "cui-select";
    if (select.classList.contains("select-account")) {
      wrap.classList.add("cui-select--pill");
    }
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add("cui-native");
    select.tabIndex = -1;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cui-select__trigger";
    trigger.innerHTML = `<span class="cui-select__label"></span><span class="cui-select__chev" aria-hidden="true"></span>`;
    wrap.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "cui-select__panel";
    panel.hidden = true;
    panel.setAttribute("role", "listbox");
    document.body.appendChild(panel);

    const labelEl = $(".cui-select__label", trigger);

    function syncDisabled() {
      const on = select.disabled;
      trigger.disabled = on;
      wrap.classList.toggle("is-disabled", on);
    }

    function rebuildOptions() {
      const frag = document.createDocumentFragment();
      Array.from(select.options).forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cui-select__option";
        btn.setAttribute("role", "option");
        btn.dataset.value = opt.value;
        btn.dataset.index = String(i);
        if (opt.disabled) btn.disabled = true;
        if (opt.selected) btn.setAttribute("aria-selected", "true");
        btn.textContent = opt.textContent.trim() || "\u00a0";
        frag.appendChild(btn);
      });
      panel.innerHTML = "";
      panel.appendChild(frag);
      labelEl.textContent = selectedLabel(select) || "Chọn…";
      wrap.classList.toggle("is-empty", !select.value && select.value !== "0");
    }

    function syncFromNative() {
      labelEl.textContent = selectedLabel(select) || "Chọn…";
      panel.querySelectorAll(".cui-select__option").forEach((btn) => {
        const on = btn.dataset.value === select.value;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.classList.toggle("is-active", on);
      });
    }

    rebuildOptions();
    syncDisabled();

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (select.disabled) return;
      rebuildOptions();
      syncFromNative();
      openFor(wrap, trigger, panel);
      const active = $(".cui-select__option.is-active", panel);
      if (active) {
        active.scrollIntoView({ block: "nearest" });
      }
    });

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest(".cui-select__option");
      if (!btn || btn.disabled) return;
      select.value = btn.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));
      syncFromNative();
      closeOpen();
    });

    patchValueProp(select, () => {
      // Options may have just been rebuilt elsewhere — refresh list then label
      if (panel.childElementCount !== select.options.length) rebuildOptions();
      else syncFromNative();
    });

    const mo = new MutationObserver(() => {
      rebuildOptions();
      syncDisabled();
    });
    mo.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "value"],
    });

    select.addEventListener("change", syncFromNative);

    select.addEventListener("invalid", () => {
      trigger.focus();
      rebuildOptions();
      syncFromNative();
      openFor(wrap, trigger, panel);
    });
  }

  /* ---------- DATE ---------- */

  const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const MONTHS = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  function parseYMD(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return null;
    return dt;
  }

  function toYMD(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDisplay(ymd) {
    const dt = parseYMD(ymd);
    if (!dt) return "Chọn ngày";
    return dt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function enhanceDate(input) {
    if (input.dataset.cuiEnhanced === "1") return;
    if (input.type !== "date") return;
    input.dataset.cuiEnhanced = "1";

    const wrap = document.createElement("div");
    wrap.className = "cui-date";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add("cui-native");
    input.tabIndex = -1;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cui-date__trigger";
    trigger.innerHTML = `<span class="cui-date__label"></span>${icon("calendar")}`;
    wrap.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "cui-date__panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="cui-date__head">
        <button type="button" class="cui-date__nav" data-nav="-1" aria-label="Tháng trước">${icon("chevronLeft")}</button>
        <div class="cui-date__title"></div>
        <button type="button" class="cui-date__nav" data-nav="1" aria-label="Tháng sau">${icon("chevronRight")}</button>
      </div>
      <div class="cui-date__weekdays"></div>
      <div class="cui-date__grid"></div>
      <div class="cui-date__foot">
        <button type="button" class="cui-date__today" data-act="today">Hôm nay</button>
        <button type="button" class="cui-date__clear" data-act="clear">Xóa</button>
      </div>`;
    document.body.appendChild(panel);

    const labelEl = $(".cui-date__label", trigger);
    const titleEl = $(".cui-date__title", panel);
    const weekEl = $(".cui-date__weekdays", panel);
    const gridEl = $(".cui-date__grid", panel);

    weekEl.innerHTML = WEEKDAYS.map(
      (d) => `<span>${escapeHtml(d)}</span>`,
    ).join("");

    let view = parseYMD(input.value) || new Date();
    view = new Date(view.getFullYear(), view.getMonth(), 1);

    function syncDisabled() {
      const on = input.disabled || input.readOnly;
      trigger.disabled = on;
      wrap.classList.toggle("is-disabled", on);
    }

    function syncLabel() {
      labelEl.textContent = formatDisplay(input.value);
      wrap.classList.toggle("is-empty", !input.value);
    }

    function paintGrid() {
      const y = view.getFullYear();
      const m = view.getMonth();
      titleEl.textContent = `${MONTHS[m]} ${y}`;

      const firstDow = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const selected = input.value;
      const today = toYMD(new Date());

      let html = "";
      for (let i = 0; i < firstDow; i++) {
        html += `<span class="cui-date__day is-pad"></span>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const cls = [
          "cui-date__day",
          ymd === selected ? "is-selected" : "",
          ymd === today ? "is-today" : "",
        ]
          .filter(Boolean)
          .join(" ");
        html += `<button type="button" class="${cls}" data-ymd="${ymd}">${d}</button>`;
      }
      gridEl.innerHTML = html;
    }

    function setValue(ymd) {
      input.value = ymd || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      syncLabel();
      paintGrid();
    }

    syncLabel();
    syncDisabled();
    paintGrid();

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (input.disabled || input.readOnly) return;
      const cur = parseYMD(input.value);
      if (cur) view = new Date(cur.getFullYear(), cur.getMonth(), 1);
      paintGrid();
      openFor(wrap, trigger, panel);
    });

    panel.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        view = new Date(
          view.getFullYear(),
          view.getMonth() + Number(nav.dataset.nav),
          1,
        );
        paintGrid();
        placeFloating(trigger, panel);
        return;
      }
      const act = e.target.closest("[data-act]");
      if (act) {
        if (act.dataset.act === "today") {
          setValue(toYMD(new Date()));
          closeOpen();
        } else if (act.dataset.act === "clear") {
          setValue("");
          closeOpen();
        }
        return;
      }
      const day = e.target.closest(".cui-date__day[data-ymd]");
      if (day) {
        setValue(day.dataset.ymd);
        closeOpen();
      }
    });

    patchValueProp(input, () => {
      const cur = parseYMD(input.value);
      if (cur) view = new Date(cur.getFullYear(), cur.getMonth(), 1);
      syncLabel();
      paintGrid();
    });

    const mo = new MutationObserver(syncDisabled);
    mo.observe(input, {
      attributes: true,
      attributeFilter: ["disabled", "readonly"],
    });

    input.addEventListener("change", syncLabel);

    input.addEventListener("invalid", () => {
      trigger.focus();
      paintGrid();
      openFor(wrap, trigger, panel);
    });
  }

  function enhanceAll(root) {
    (root || document).querySelectorAll("select").forEach(enhanceSelect);
    (root || document)
      .querySelectorAll('input[type="date"]')
      .forEach(enhanceDate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => enhanceAll());
  } else {
    enhanceAll();
  }

  // Late population (async fetches) — re-enhance any new natives
  const boot = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.("select")) enhanceSelect(n);
        else if (n.matches?.('input[type="date"]')) enhanceDate(n);
        else if (n.querySelectorAll) enhanceAll(n);
      });
    }
  });
  boot.observe(document.documentElement, { childList: true, subtree: true });

  window.AppUI = { enhanceAll, closeOpen };
})();
