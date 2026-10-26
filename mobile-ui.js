/**
 * ManageTasks mobile enhancements — semantic navigation, filter sheet, Safari UI.
 * Never synthesize click/touch events: a single native click avoids double-save.
 */
(function () {
  "use strict";

  const labels = {
    "index.html": "Tổng quan",
    "task.html": "Công việc",
    "finance.html": "Tài chính",
    "analytics.html": "Báo cáo",
    "settings.html": "Cài đặt",
  };

  const MOBILE_MQ = "(max-width: 900px)";
  const filterSheets = [];

  let navHome = null;
  let navTouchLock = false;
  let navTouchLink = null;
  let navTouchX = 0;
  let navTouchY = 0;
  let pinNavTimer = 0;
  let navLeaving = false;

  function initializeNav() {
    const side = document.querySelector(".side.app-sidebar");
    const nav = side?.querySelector(".app-nav");
    if (!side || !nav) return;
    nav.setAttribute("aria-label", "Điều hướng chính");

    nav.querySelectorAll("a[href]").forEach((a) => {
      const url = a.getAttribute("href")?.split(/[?#]/)[0];
      const label = labels[url];
      if (!label) return;
      if (!a.querySelector(".mobile-nav-label")) {
        const caption = document.createElement("span");
        caption.className = "mobile-nav-label";
        caption.textContent = label;
        caption.setAttribute("aria-hidden", "true");
        a.appendChild(caption);
      }
      a.setAttribute("aria-label", label);
      a.classList.add("mobile-nav-link");
      if (a.classList.contains("active")) a.setAttribute("aria-current", "page");
    });

    if (!navHome) {
      navHome = {
        parent: side.parentNode,
        next: side.nextSibling,
      };
    }

    bindBottomNavTaps(side);
    document.body.classList.add("has-mobile-bottom-nav");
    syncBottomNavDock();
  }

  function bindBottomNavTaps(side) {
    if (!side || side.dataset.navTapBound === "1") return;
    side.dataset.navTapBound = "1";

    // iOS often paints :active then cancels click if the fixed dock moves
    // (Safari chrome / visualViewport). Navigate on touchend instead.
    side.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches?.[0];
        if (!touch) return;
        navTouchLock = true;
        navTouchLink = resolveNavLink(side, event.target, touch.clientX);
        navTouchX = touch.clientX;
        navTouchY = touch.clientY;
      },
      { passive: true },
    );

    side.addEventListener(
      "touchmove",
      (event) => {
        if (!navTouchLink) return;
        const touch = event.changedTouches?.[0];
        if (!touch) return;
        if (
          Math.abs(touch.clientX - navTouchX) > 24 ||
          Math.abs(touch.clientY - navTouchY) > 24
        ) {
          navTouchLink = null;
        }
      },
      { passive: true },
    );

    const endTouch = (event) => {
      const link = navTouchLink;
      navTouchLink = null;
      window.setTimeout(() => {
        navTouchLock = false;
      }, 450);
      if (!link || !side.contains(link)) return;

      const href = link.getAttribute("href");
      if (!isInternalPageLink(href)) return;
      const url = new URL(href, location.href);
      const sameDoc =
        url.pathname === location.pathname && url.search === location.search;
      if (event.cancelable) event.preventDefault();
      if (sameDoc && !url.hash) {
        link.classList.add("active");
        return;
      }
      if (navLeaving) return;
      navLeaving = true;
      showPageLoading();
      location.assign(url.href);
    };

    side.addEventListener("touchend", endTouch, { passive: false });
    // Safari fires touchcancel when it toggles its toolbar mid-tap; a still
    // finger on the dock is still a tap.
    side.addEventListener("touchcancel", endTouch, { passive: true });
  }

  function resolveNavLink(side, target, x) {
    const direct = target?.closest?.("a[href]");
    if (direct && side.contains(direct)) return direct;
    // Touch landed on dock padding / grid gap: pick the column under the finger.
    const links = Array.from(side.querySelectorAll(".app-nav a[href]")).filter(
      (a) => a.offsetParent !== null,
    );
    let best = null;
    let bestDist = Infinity;
    links.forEach((a) => {
      const r = a.getBoundingClientRect();
      const dist = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      if (dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    });
    return best;
  }

  function syncBottomNavDock() {
    const side = document.querySelector(".side.app-sidebar");
    if (!side || !navHome?.parent) return;
    const mobile = window.matchMedia(MOBILE_MQ).matches;

    if (mobile) {
      // iOS Safari can composite scroll layers above position:fixed descendants
      // of .layout; park the dock on <body> so taps always reach it.
      if (side.parentElement !== document.body) {
        document.body.appendChild(side);
      }
      bindBottomNavTaps(side);
      pinBottomNav(side);
    } else {
      side.style.removeProperty("bottom");
      if (side.parentElement === document.body) {
        if (navHome.next && navHome.next.parentNode === navHome.parent) {
          navHome.parent.insertBefore(side, navHome.next);
        } else {
          navHome.parent.appendChild(side);
        }
      }
    }
  }

  function pinBottomNav(side) {
    if (navTouchLock) return;
    const dock = side || document.querySelector(".side.app-sidebar");
    if (!dock) return;
    // CSS owns the offset (incl. safe-area-inset-bottom). An inline bottom
    // drops the safe area and parks the dock in the home-indicator gesture
    // zone, where iOS intermittently swallows taps.
    dock.style.removeProperty("bottom");
  }

  function schedulePinBottomNav() {
    if (navTouchLock) return;
    window.clearTimeout(pinNavTimer);
    pinNavTimer = window.setTimeout(() => pinBottomNav(), 120);
  }

  let toastTimer;
  function showFeedback(message) {
    let toast = document.getElementById("mobileUiToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mobileUiToast";
      toast.className = "mobile-ui-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  }

  function toggleChart(button) {
    const chart = button.closest(".performance-chart-card");
    if (!chart) return;
    const open = !chart.classList.contains("is-chart-expanded");
    chart.classList.toggle("is-chart-expanded", open);
    document.body.classList.toggle("mobile-chart-open", open);
    button.setAttribute(
      "aria-label",
      open ? "Thu nhỏ biểu đồ" : "Phóng to biểu đồ",
    );
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "✕" : "⤢";
    if (open) button.focus({ preventScroll: true });
  }

  function transportNode(node) {
    if (!node) return null;
    return node.closest?.(".cui-select") || node;
  }

  function countActiveFilters(nodes) {
    let n = 0;
    nodes.forEach((node) => {
      if (!node) return;
      const selects =
        node.matches?.("select")
          ? [node]
          : [...node.querySelectorAll("select")];
      selects.forEach((select) => {
        if (String(select.value || "").trim()) n += 1;
      });
    });
    return n;
  }

  function updateFilterBadge(sheet) {
    const active = countActiveFilters(
      [sheet.group, ...sheet.extras.map((item) => item.node)].filter(Boolean),
    );
    const badge = sheet.btn.querySelector(".mobile-filter-btn__count");
    if (!badge) return;
    if (active > 0) {
      badge.hidden = false;
      badge.textContent = String(active);
      sheet.btn.classList.add("is-active");
      sheet.btn.setAttribute("aria-label", `Bộ lọc, ${active} đang chọn`);
    } else {
      badge.hidden = true;
      badge.textContent = "";
      sheet.btn.classList.remove("is-active");
      sheet.btn.setAttribute("aria-label", "Bộ lọc");
    }
  }

  function collectExtras(group) {
    const extras = [];
    if (group.id === "filters") {
      const month = document.getElementById("f_month");
      if (month && !group.contains(month)) {
        const carried = transportNode(month);
        const placeholder = document.createComment("mf-month");
        carried.parentNode.insertBefore(placeholder, carried);
        extras.push({ node: month, carried, placeholder });
      }
    }
    return extras;
  }

  function moveHome(item) {
    if (!item?.placeholder?.parentNode) return;
    const carried = transportNode(item.node) || item.carried || item.node;
    item.placeholder.parentNode.insertBefore(carried, item.placeholder);
  }

  function createFilterSheet(group) {
    if (group.dataset.mfBound === "true") return null;
    if (!group.querySelector("select")) return null;
    group.dataset.mfBound = "true";

    const placeholder = document.createComment("mf-filters");
    group.parentNode.insertBefore(placeholder, group);

    const extras = collectExtras(group);

    const host = document.createElement("div");
    host.className = "mobile-filter-bar";
    host.hidden = true;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn mobile-filter-btn";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.innerHTML =
      '<span class="mobile-filter-btn__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg></span><span>Bộ lọc</span><span class="mobile-filter-btn__count" hidden></span>';

    host.appendChild(btn);
    const inlineHost = group
      .closest(".taskmail-merge-controls")
      ?.querySelector(".taskmail-tabs-actions");
    if (inlineHost) {
      host.classList.add("mobile-filter-bar--inline");
      inlineHost.appendChild(host);
    } else {
      placeholder.parentNode.insertBefore(host, placeholder);
    }

    const dlg = document.createElement("dialog");
    dlg.className = "mobile-filter-dlg";
    dlg.innerHTML =
      '<form method="dialog" class="mobile-filter-dlg__panel">' +
      '<div class="mobile-filter-dlg__head"><b>Bộ lọc</b>' +
      '<button type="submit" class="icon-btn mobile-filter-dlg__close" value="close" aria-label="Đóng">✕</button></div>' +
      '<div class="mobile-filter-dlg__body"></div>' +
      '<div class="mobile-filter-dlg__actions">' +
      '<button type="button" class="btn mobile-filter-reset">Reset</button>' +
      '<button type="submit" class="btn primary" value="apply">Áp dụng</button>' +
      "</div></form>";

    document.body.appendChild(dlg);
    const body = dlg.querySelector(".mobile-filter-dlg__body");
    const resetBtn = dlg.querySelector(".mobile-filter-reset");

    const sheet = {
      group,
      placeholder,
      host,
      btn,
      dlg,
      body,
      extras,
      mobile: false,
    };

    btn.addEventListener("click", () => {
      if (!sheet.mobile) return;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });

    dlg.addEventListener("close", () => {
      updateFilterBadge(sheet);
      try {
        window.AppUI?.closeOpen?.();
      } catch {}
    });
    dlg.addEventListener("click", (event) => {
      if (event.target === dlg) dlg.close();
    });

    resetBtn.addEventListener("click", () => {
      const pageReset = document.getElementById("f_reset");
      if (pageReset && pageReset !== resetBtn) {
        pageReset.click();
      } else {
        group.querySelectorAll("select").forEach((select) => {
          select.value = "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        extras.forEach((item) => {
          if (item.node.tagName === "SELECT") {
            item.node.value = "";
            item.node.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }
      updateFilterBadge(sheet);
    });

    group.addEventListener("change", () => updateFilterBadge(sheet));
    extras.forEach((item) => {
      item.node.addEventListener("change", () => updateFilterBadge(sheet));
    });

    return sheet;
  }

  function setFilterMode(sheet, mobile) {
    if (sheet.mobile === mobile) {
      updateFilterBadge(sheet);
      return;
    }
    sheet.mobile = mobile;
    if (mobile) {
      sheet.host.hidden = false;
      sheet.extras.forEach((item) => {
        const wrap = document.createElement("div");
        wrap.className = "mobile-filter-field";
        const label = document.createElement("label");
        label.textContent =
          item.node.getAttribute("aria-label") ||
          item.node.options?.[0]?.textContent ||
          "Lọc";
        wrap.append(label, transportNode(item.node) || item.node);
        sheet.body.appendChild(wrap);
      });
      sheet.body.appendChild(sheet.group);
      sheet.group.classList.add("mobile-filter-group");
    } else {
      if (sheet.dlg.open) sheet.dlg.close();
      sheet.host.hidden = true;
      sheet.placeholder.parentNode.insertBefore(
        sheet.group,
        sheet.placeholder.nextSibling,
      );
      sheet.group.classList.remove("mobile-filter-group");
      sheet.extras.forEach(moveHome);
      sheet.body.replaceChildren();
    }
    updateFilterBadge(sheet);
  }

  function syncFilterSheets() {
    const mobile = window.matchMedia(MOBILE_MQ).matches;
    document.documentElement.classList.toggle("mobile-compact", mobile);
    filterSheets.forEach((sheet) => setFilterMode(sheet, mobile));
  }

  function initializeFilters() {
    document
      .querySelectorAll(".filters, .taskmail-filters")
      .forEach((group) => {
        const sheet = createFilterSheet(group);
        if (sheet) filterSheets.push(sheet);
      });
    syncFilterSheets();
    const mq = window.matchMedia(MOBILE_MQ);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncFilterSheets);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(syncFilterSheets);
    }
  }

  document.addEventListener("click", (event) => {
    const chartButton = event.target.closest(".chart-expand-btn");
    if (chartButton) {
      toggleChart(chartButton);
      return;
    }
    const notifications = event.target.closest(
      'button[aria-label="Notifications"]',
    );
    if (notifications) {
      showFeedback("Thông báo công việc hiện chưa được kích hoạt.");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document
      .querySelectorAll(
        ".performance-chart-card.is-chart-expanded .chart-expand-btn",
      )
      .forEach(toggleChart);
  });

  function clearFloatingPanels() {
    try {
      window.AppUI?.closeOpen?.();
    } catch {}
    document
      .querySelectorAll(".cui-select__panel, .cui-date__panel")
      .forEach((panel) => {
        panel.hidden = true;
      });
  }

  function showPageLoading(label) {
    let el = document.getElementById("pageTransition");
    if (!el) {
      el = document.createElement("div");
      el.id = "pageTransition";
      el.className = "page-transition";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.innerHTML =
        '<div class="page-transition__card">' +
        '<span class="page-transition__spinner" aria-hidden="true"></span>' +
        '<b class="page-transition__label">Đang chuyển trang…</b>' +
        "</div>";
      document.body.appendChild(el);
    }
    const text = el.querySelector(".page-transition__label");
    if (text) text.textContent = label || "Đang chuyển trang…";
    el.hidden = false;
    document.body.classList.add("page-transition-on");
    requestAnimationFrame(() => el.classList.add("is-on"));
    return el;
  }

  function hidePageLoading() {
    const el = document.getElementById("pageTransition");
    if (el) {
      el.classList.remove("is-on");
      el.hidden = true;
    }
    document.body.classList.remove("page-transition-on");
  }

  function isInternalPageLink(href) {
    if (!href) return false;
    const raw = String(href).trim();
    if (
      !raw ||
      raw.startsWith("#") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:") ||
      raw.startsWith("javascript:")
    ) {
      return false;
    }
    try {
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin) return false;
      const file = url.pathname.split("/").pop() || "";
      return /\.html$/i.test(file) || file === "";
    } catch {
      return false;
    }
  }

  function navigateWithLoading(href) {
    showPageLoading();
    location.assign(href);
  }

  function initializePageTransitions() {
    document.addEventListener(
      "click",
      (event) => {
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        const link = event.target.closest?.("a[href]");
        if (!link) return;
        // Bottom dock uses touchend navigation on iOS.
        if (link.closest(".side.app-sidebar")) return;
        if (link.target && link.target !== "_self") return;
        if (link.hasAttribute("download")) return;
        if (link.dataset.noTransition != null) return;
        if (link.dataset.authLogout != null) {
          showPageLoading("Đang đăng xuất…");
          return;
        }
        const href = link.getAttribute("href");
        if (!isInternalPageLink(href)) return;

        const url = new URL(href, location.href);
        const samePage =
          url.pathname === location.pathname &&
          url.search === location.search &&
          !!url.hash;
        if (samePage) return;
        if (url.href === location.href) return;

        event.preventDefault();
        navigateWithLoading(url.href);
      },
      true,
    );
  }

  function boot() {
    initializeNav();
    initializePageTransitions();
    clearFloatingPanels();
    hidePageLoading();
    // Wait a tick so app-ui.js can wrap selects before we relocate them.
    requestAnimationFrame(() => {
      initializeFilters();
      syncBottomNavDock();
    });
    const mq = window.matchMedia(MOBILE_MQ);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncBottomNavDock);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(syncBottomNavDock);
    }
    window.addEventListener("resize", schedulePinBottomNav, { passive: true });
    window.visualViewport?.addEventListener("resize", schedulePinBottomNav, {
      passive: true,
    });
    window.addEventListener("pageshow", () => {
      navLeaving = false;
      navTouchLock = false;
      hidePageLoading();
      clearFloatingPanels();
      syncBottomNavDock();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        hidePageLoading();
        clearFloatingPanels();
        syncBottomNavDock();
      }
    });
  }

  window.MobileUI = {
    showPageLoading,
    hidePageLoading,
    navigateWithLoading,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
