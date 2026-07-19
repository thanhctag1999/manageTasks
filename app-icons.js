/**
 * Shared stroke icons for Synchro UI.
 * Use: icon("search") → HTML string; or <span class="ic">…</span> with same SVG markup.
 */
(function (global) {
  "use strict";

  const P = {
    search:
      '<circle cx="11" cy="11" r="6.5"/><path d="m16.2 16.2 4.3 4.3"/>',
    bell: '<path d="M6.5 16.5h11"/><path d="M8 16.5V10a4 4 0 1 1 8 0v6.5"/><path d="M10.2 18.5a1.8 1.8 0 0 0 3.6 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh:
      '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 5v4.5H15"/>',
    back: '<path d="M15 6 9 12l6 6"/><path d="M9 12h10"/>',
    home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 10v8.5h11V10"/><path d="M10 18.5v-5h4v5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    save: '<path d="M5 5h11l3 3v11H5V5z"/><path d="M8 5v5h8V5"/><path d="M8 19v-6h8v6"/>',
    undo: '<path d="M9 8H5v4"/><path d="M5 12a7 7 0 1 0 2-4.9"/>',
    trash:
      '<path d="M5 8h14"/><path d="M9.5 8V6.5h5V8"/><path d="M8 8l.8 11h6.4L16 8"/>',
    copy: '<rect x="8.5" y="8.5" width="10" height="12" rx="2"/><path d="M6.5 15.5V5.5a2 2 0 0 1 2-2h8"/>',
    check: '<path d="m5.5 12.5 4 4 9-10"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>',
    alert:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5"/><path d="M12 16.5h.01"/>',
    progress:
      '<path d="M12 4.5a7.5 7.5 0 1 1-5.3 2.2"/><path d="M12 4.5V12"/>',
    review:
      '<path d="M12 5.5 14.8 11l5.7.5-4.3 3.8 1.3 5.5L12 18.2 6.5 20.8l1.3-5.5L3.5 11.5l5.7-.5z"/>',
    layers:
      '<path d="m4.5 9 7.5 4 7.5-4"/><path d="m4.5 13 7.5 4 7.5-4"/><path d="m4.5 17 7.5 4 7.5-4"/>',
    money:
      '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9"/><path d="M9.5 10.2c.5-1 1.5-1.5 2.5-1.5s2 .6 2 1.7-.8 1.5-2.5 1.9-2.5.9-2.5 2.1 1.1 1.8 2.5 1.8 2.1-.6 2.6-1.6"/>',
    chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
    chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
    calendar:
      '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 11h16"/>',
  };

  function icon(name, extraClass) {
    const body = P[name];
    if (!body) return "";
    const cls = ["ic", extraClass].filter(Boolean).join(" ");
    return (
      `<span class="${cls}" aria-hidden="true">` +
      `<svg viewBox="0 0 24 24">${body}</svg>` +
      `</span>`
    );
  }

  function iconSvg(name) {
    const body = P[name];
    if (!body) return "";
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  global.AppIcons = { paths: P, icon, iconSvg };
  global.icon = icon;
})(typeof window !== "undefined" ? window : globalThis);
