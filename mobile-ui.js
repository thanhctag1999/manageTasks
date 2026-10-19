/**
 * ManageTasks mobile enhancements — semantic navigation and Safari-friendly UI.
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

  function initialize() {
    const nav = document.querySelector(".app-sidebar .app-nav");
    if (!nav) return;
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
      if (a.classList.contains("active")) a.setAttribute("aria-current", "page");
    });

    document.body.classList.add("has-mobile-bottom-nav");
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
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function toggleChart(button) {
    const chart = button.closest(".performance-chart-card");
    if (!chart) return;
    const open = !chart.classList.contains("is-chart-expanded");
    chart.classList.toggle("is-chart-expanded", open);
    document.body.classList.toggle("mobile-chart-open", open);
    button.setAttribute("aria-label", open ? "Thu nhỏ biểu đồ" : "Phóng to biểu đồ");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "✕" : "⤢";
    if (open) button.focus({ preventScroll: true });
  }

  // Only handle existing placeholder buttons, leaving real finance notification
  // and search functionality untouched.
  document.addEventListener("click", (event) => {
    const chartButton = event.target.closest(".chart-expand-btn");
    if (chartButton) { toggleChart(chartButton); return; }
    const notifications = event.target.closest('button[aria-label="Notifications"]');
    if (notifications) {
      showFeedback("Thông báo công việc hiện chưa được kích hoạt.");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".performance-chart-card.is-chart-expanded .chart-expand-btn")
      .forEach(toggleChart);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
