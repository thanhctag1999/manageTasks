(function () {
  const STORAGE_KEY = "mt_theme";
  const ACCENTS = [
    "#d1f366",
    "#ffd8a8",
    "#bfe1ff",
    "#e6d6ff",
    "#c7f9d4",
    "#f3f3f5",
  ];
  const SIDEBARS = [
    "#fff7ed",
    "#eef7ff",
    "#fbf1ff",
    "#f3fff5",
    "#1c1c24",
    "#ffffff",
  ];

  function normalizeHex(hex) {
    hex = String(hex || "").trim().replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return /^[0-9a-f]{6}$/i.test(hex) ? "#" + hex.toLowerCase() : "";
  }

  function darkenHex(hex, amount) {
    hex = normalizeHex(hex).replace("#", "");
    if (!hex) return "#b8d94a";
    const num = parseInt(hex, 16);
    const r = Math.max(
      0,
      Math.min(255, Math.round(((num >> 16) & 0xff) * (1 - amount))),
    );
    const g = Math.max(
      0,
      Math.min(255, Math.round(((num >> 8) & 0xff) * (1 - amount))),
    );
    const b = Math.max(
      0,
      Math.min(255, Math.round((num & 0xff) * (1 - amount))),
    );
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function luminance(hex) {
    hex = normalizeHex(hex).replace("#", "");
    if (!hex) return 0;
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function save(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function apply(settings) {
    const root = document.documentElement.style;
    const mode = settings && settings.mode === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = mode;

    if (mode === "dark") {
      root.setProperty("--bg-page", "#0b0b10");
      root.setProperty("--panel", "#0f1720");
      root.setProperty("--panel-solid", "#0f1720");
      root.setProperty("--ink", "#eef2ff");
      root.setProperty("--muted", "rgba(255,255,255,0.65)");
      root.setProperty("--line", "rgba(255,255,255,0.1)");
    } else {
      root.setProperty("--bg-page", "#f5f5f7");
      root.setProperty("--panel", "#ffffff");
      root.setProperty("--panel-solid", "#ffffff");
      root.setProperty("--ink", "#141419");
      root.setProperty("--muted", "#9ca3af");
      root.setProperty("--line", "rgba(20,20,25,0.08)");
    }

    const accent = normalizeHex(settings && settings.accent);
    if (accent) {
      root.setProperty("--accent-lime", accent);
      root.setProperty("--accent-lime-dark", darkenHex(accent, 0.18));
      root.setProperty("--primary-soft", accent + "38");
      root.setProperty("--chart-pink", accent);
      root.setProperty("--chart-soft-pink", accent + "26");
    }

    const sidebar = normalizeHex(settings && settings.sidebar);
    if (sidebar) {
      root.setProperty("--sidebar-bg", sidebar);
      const isDark = luminance(sidebar) < 0.45;
      root.setProperty(
        "--sidebar-ink",
        isDark ? "rgba(255,255,255,0.85)" : "#141419",
      );
      root.setProperty(
        "--sidebar-hover-bg",
        isDark ? "rgba(255,255,255,0.06)" : "rgba(20,20,25,0.06)",
      );
      root.setProperty(
        "--sidebar-hover-ink",
        isDark ? "rgba(255,255,255,0.95)" : "#141419",
      );
      root.setProperty("--sidebar-ink-active", "#141419");
    }
  }

  window.ThemeManager = {
    accents: ACCENTS,
    sidebars: SIDEBARS,
    apply,
    darkenHex,
    load,
    save,
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      apply({});
    },
  };

  apply(load());
})();
