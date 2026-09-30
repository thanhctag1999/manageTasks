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
  let activeTooltip = null;

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
    (event) => {
      if (!openPanel || !openPanel._cuiFloating) return;
      const floating = openPanel._cuiFloating;
      const scrollTarget = event.target;
      // Scrolling the option list/calendar is an interaction with the popup,
      // not a page movement. Keep it open and preserve the scroll position.
      if (
        scrollTarget === floating ||
        (scrollTarget instanceof Node && floating.contains(scrollTarget))
      ) {
        return;
      }
      closeOpen();
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
    // A native <dialog> lives in the browser top layer. Floating controls must
    // be mounted inside it or they render below the modal and cannot be clicked.
    (select.closest("dialog") || document.body).appendChild(panel);

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
    // Keep the calendar in the same top-layer dialog as its trigger.
    (input.closest("dialog") || document.body).appendChild(panel);

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

  /* ---------- COLOR ---------- */

  const COLOR_SWATCHES = [
    "#1c1c24",
    "#4f46e5",
    "#2563eb",
    "#0891b2",
    "#0f9f6e",
    "#b8d94a",
    "#f59e0b",
    "#f97316",
    "#ef4444",
    "#db2777",
    "#7c3aed",
    "#64748b",
  ];

  function validHex(value) {
    const v = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
  }

  function enhanceColor(input) {
    if (input.dataset.cuiEnhanced === "1" || input.type !== "color") return;
    input.dataset.cuiEnhanced = "1";

    const wrap = document.createElement("div");
    wrap.className = "cui-color";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add("cui-native");
    input.tabIndex = -1;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cui-color__trigger";
    trigger.innerHTML = `<span class="cui-color__preview" aria-hidden="true"></span><span class="cui-color__value"></span><span class="cui-select__chev" aria-hidden="true"></span>`;
    wrap.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "cui-color__panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="cui-color__head"><b>Chọn màu</b><span>Tùy chỉnh giao diện</span></div>
      <div class="cui-color__swatches" role="listbox" aria-label="Bảng màu">
        ${COLOR_SWATCHES.map((color) => `<button type="button" class="cui-color__swatch" data-color="${color}" style="--swatch:${color}" aria-label="${color}"></button>`).join("")}
      </div>
      <label class="cui-color__hex"><span>Mã HEX</span><input type="text" maxlength="7" spellcheck="false" placeholder="#1c1c24" /></label>`;
    (input.closest("dialog") || document.body).appendChild(panel);

    const preview = $(".cui-color__preview", trigger);
    const valueEl = $(".cui-color__value", trigger);
    const hex = $(".cui-color__hex input", panel);

    function sync() {
      const value = validHex(input.value) || "#000000";
      preview.style.background = value;
      valueEl.textContent = value.toUpperCase();
      hex.value = value.toUpperCase();
      panel.querySelectorAll("[data-color]").forEach((swatch) => {
        const active = swatch.dataset.color === value;
        swatch.classList.toggle("is-active", active);
        swatch.setAttribute("aria-selected", active ? "true" : "false");
      });
      trigger.disabled = input.disabled;
      wrap.classList.toggle("is-disabled", input.disabled);
    }

    function setColor(value) {
      const next = validHex(value);
      if (!next) return false;
      input.value = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      sync();
      return true;
    }

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (input.disabled) return;
      sync();
      openFor(wrap, trigger, panel);
    });
    panel.addEventListener("click", (e) => {
      const swatch = e.target.closest("[data-color]");
      if (!swatch) return;
      setColor(swatch.dataset.color);
    });
    hex.addEventListener("input", () => {
      hex.classList.toggle("is-invalid", hex.value.length >= 7 && !validHex(hex.value));
      setColor(hex.value);
    });
    hex.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && setColor(hex.value)) closeOpen();
    });
    input.addEventListener("change", sync);
    patchValueProp(input, sync);
    new MutationObserver(sync).observe(input, {
      attributes: true,
      attributeFilter: ["disabled"],
    });
    sync();
  }

  /* ---------- NOTICES & CONFIRMATION ---------- */

  function notify(message, options) {
    const opts = typeof options === "string" ? { tone: options } : options || {};
    let stack = $(".cui-toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "cui-toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const toast = document.createElement("div");
    toast.className = `cui-toast cui-toast--${opts.tone || "info"}`;
    toast.setAttribute("role", opts.tone === "error" ? "alert" : "status");
    toast.innerHTML = `<span class="cui-toast__mark" aria-hidden="true"></span><span>${escapeHtml(message)}</span><button type="button" aria-label="Đóng">×</button>`;
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    const remove = () => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 180);
    };
    toast.querySelector("button").addEventListener("click", remove);
    setTimeout(remove, opts.duration || 4200);
    return toast;
  }

  function confirmAction(message, options) {
    const opts = options || {};
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "cui-confirm";
      overlay.innerHTML = `
        <section class="cui-confirm__panel" role="alertdialog" aria-modal="true" aria-labelledby="cuiConfirmTitle">
          <div class="cui-confirm__icon" aria-hidden="true">!</div>
          <div class="cui-confirm__copy">
            <h2 id="cuiConfirmTitle">${escapeHtml(opts.title || "Xác nhận thao tác")}</h2>
            <p>${escapeHtml(message)}</p>
          </div>
          <div class="cui-confirm__actions">
            <button type="button" class="btn" data-result="false">${escapeHtml(opts.cancelText || "Hủy")}</button>
            <button type="button" class="btn primary" data-result="true">${escapeHtml(opts.confirmText || "Xác nhận")}</button>
          </div>
        </section>`;
      document.body.appendChild(overlay);
      const previous = document.activeElement;
      const finish = (result) => {
        document.removeEventListener("keydown", onKey);
        overlay.classList.remove("is-visible");
        setTimeout(() => overlay.remove(), 160);
        previous?.focus?.();
        resolve(result);
      };
      const onKey = (e) => {
        if (e.key === "Escape") finish(false);
      };
      overlay.addEventListener("click", (e) => {
        const result = e.target.closest("[data-result]");
        if (result) finish(result.dataset.result === "true");
        else if (e.target === overlay) finish(false);
      });
      document.addEventListener("keydown", onKey);
      requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
        overlay.querySelector('[data-result="true"]').focus();
      });
    });
  }

  /* ---------- TOOLTIPS & VALIDATION ---------- */

  function enhanceTooltip(el) {
    if (!el.title || el.dataset.cuiTooltip) return;
    el.dataset.cuiTooltip = el.title;
    el.removeAttribute("title");
    if (!el.getAttribute("aria-label") && !el.textContent.trim()) {
      el.setAttribute("aria-label", el.dataset.cuiTooltip);
    }
  }

  function hideTooltip() {
    activeTooltip?.remove();
    activeTooltip = null;
  }

  function showTooltip(el, text) {
    hideTooltip();
    const tip = document.createElement("div");
    tip.className = "cui-tooltip";
    tip.setAttribute("role", "tooltip");
    tip.textContent = text;
    document.body.appendChild(tip);
    const r = el.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(8, Math.min(left, innerWidth - tr.width - 8));
    const above = r.top > tr.height + 14;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(above ? r.top - tr.height - 8 : r.bottom + 8)}px`;
    tip.dataset.side = above ? "top" : "bottom";
    activeTooltip = tip;
  }

  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest?.("[data-cui-tooltip]");
    if (el) showTooltip(el, el.dataset.cuiTooltip);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest?.("[data-cui-tooltip]")) hideTooltip();
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest?.("[data-cui-tooltip]");
    if (el) showTooltip(el, el.dataset.cuiTooltip);
  });
  document.addEventListener("focusout", hideTooltip);

  document.addEventListener(
    "invalid",
    (e) => {
      e.preventDefault();
      const field = e.target;
      const target = field.closest(".cui-select, .cui-date")?.querySelector("button") || field;
      target.focus?.();
      notify(field.validationMessage || "Vui lòng kiểm tra trường này.", "error");
    },
    true,
  );

  function enhanceAll(root) {
    (root || document).querySelectorAll("select").forEach(enhanceSelect);
    (root || document)
      .querySelectorAll('input[type="date"]')
      .forEach(enhanceDate);
    (root || document)
      .querySelectorAll('input[type="color"]')
      .forEach(enhanceColor);
    (root || document).querySelectorAll("[title]").forEach(enhanceTooltip);
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
        else if (n.matches?.('input[type="color"]')) enhanceColor(n);
        else if (n.querySelectorAll) enhanceAll(n);
      });
    }
  });
  boot.observe(document.documentElement, { childList: true, subtree: true });

  window.alert = (message) => notify(message);
  window.AppUI = {
    enhanceAll,
    closeOpen,
    notify,
    confirm: confirmAction,
  };
})();
