(function () {
  "use strict";

  const TOKEN_KEY = "mt_session_token";
  const USER_KEY = "mt_session_user";
  const CRED_KEY = "mt_saved_login";
  const isLoginPage =
    /(?:^|\/)login\.html$/i.test(location.pathname) ||
    document.documentElement.dataset.publicPage === "true";

  document.documentElement.classList.add("auth-checking");

  function readStored(key) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return saved;
      const legacy = sessionStorage.getItem(key);
      if (!legacy) return "";
      localStorage.setItem(key, legacy);
      sessionStorage.removeItem(key);
      return legacy;
    } catch {
      return "";
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      try {
        sessionStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }

  function removeStored(key) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {}
  }

  function readUser() {
    try {
      return JSON.parse(readStored(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function readToken() {
    return readStored(TOKEN_KEY);
  }

  function readCreds() {
    try {
      const creds = JSON.parse(readStored(CRED_KEY) || "null");
      if (!creds?.username || !creds?.password) return null;
      return creds;
    } catch {
      return null;
    }
  }

  function saveCreds(username, password) {
    writeStored(
      CRED_KEY,
      JSON.stringify({
        username: String(username || "").trim(),
        password: String(password || ""),
      }),
    );
  }

  function clearCreds() {
    removeStored(CRED_KEY);
  }

  function saveSession(token, user) {
    writeStored(TOKEN_KEY, token);
    writeStored(USER_KEY, JSON.stringify(user));
    attachSessionHeader(token);
  }

  function clearSession() {
    removeStored(TOKEN_KEY);
    removeStored(USER_KEY);
  }

  function attachSessionHeader(token) {
    if (!token) return;
    try {
      if (typeof HEADERS !== "undefined") HEADERS["x-app-session"] = token;
      if (typeof HEADERS_JSON !== "undefined")
        HEADERS_JSON["x-app-session"] = token;
    } catch {}
  }

  function nextUrl() {
    const here =
      location.pathname.split("/").pop() +
      location.search +
      location.hash;
    return `login.html?next=${encodeURIComponent(here || "index.html")}`;
  }

  function goLogin() {
    clearSession();
    if (!isLoginPage) location.replace(nextUrl());
  }

  function apiReady() {
    return (
      typeof BASE !== "undefined" &&
      typeof HEADERS_JSON !== "undefined" &&
      !String(BASE).includes("YOUR_PROJECT")
    );
  }

  async function rpc(name, body, useSession = false) {
    if (!apiReady()) {
      throw new Error(
        "Chưa cấu hình setting.js. Hãy sao chép setting.example.js và điền thông tin Supabase.",
      );
    }
    const headers = { ...HEADERS_JSON };
    if (useSession) {
      const token = readToken();
      if (token) headers["x-app-session"] = token;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    let res;
    try {
      res = await fetch(`${BASE}/rpc/${name}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body || {}),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      let message = "";
      try {
        const data = await res.json();
        message = data.message || data.details || "";
      } catch {
        message = await res.text();
      }
      throw new Error(message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function login(username, password) {
    const rows = await rpc("app_login", {
      p_username: String(username || "").trim(),
      p_password: String(password || ""),
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.session_token) throw new Error("INVALID_CREDENTIALS");
    const user = {
      id: row.account_id,
      username: row.username,
      displayName: row.display_name || row.username,
      role: row.role || "member",
      mustChangePassword: !!row.must_change_password,
      expiresAt: row.expires_at,
    };
    saveSession(row.session_token, user);
    saveCreds(username, password);
    return user;
  }

  async function validate() {
    const token = readToken();
    if (!token) return null;
    attachSessionHeader(token);
    try {
      const rows = await rpc(
        "app_validate_session",
        { p_token: token },
        true,
      );
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.account_id) return null;
      const user = {
        id: row.account_id,
        username: row.username,
        displayName: row.display_name || row.username,
        role: row.role || "member",
        mustChangePassword: !!row.must_change_password,
        expiresAt: row.expires_at,
      };
      saveSession(token, user);
      return user;
    } catch (error) {
      if (isTransient(error)) throw error;
      return null;
    }
  }

  function isTransient(error) {
    const message = String(error?.message || error || "");
    return (
      error?.name === "AbortError" ||
      /failed to fetch|network|abort|timeout|load failed|HTTP 5/i.test(message)
    );
  }

  async function logout() {
    const token = readToken();
    try {
      if (token) await rpc("app_logout", { p_token: token }, true);
    } catch {}
    clearCreds();
    clearSession();
    location.replace("login.html");
  }

  async function changePassword(currentPassword, newPassword) {
    const token = readToken();
    if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");
    await rpc(
      "app_change_password",
      {
        p_token: token,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      },
      true,
    );
    clearCreds();
    clearSession();
    return true;
  }

  function bindUserUi(user) {
    document.querySelectorAll("[data-auth-name]").forEach((el) => {
      el.textContent = user?.displayName || user?.username || "User";
    });
    document.querySelectorAll("[data-auth-role]").forEach((el) => {
      el.textContent = user?.role || "member";
    });
    document.querySelectorAll("[data-auth-logout]").forEach((el) => {
      if (el.dataset.authBound) return;
      el.dataset.authBound = "true";
      el.addEventListener("click", (event) => {
        event.preventDefault();
        logout();
      });
    });
  }

  function showApp(user) {
    if (!(isLoginPage && user)) {
      document.documentElement.classList.remove("auth-checking");
    }
    if (!user || isLoginPage) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => bindUserUi(user), {
        once: true,
      });
    } else {
      bindUserUi(user);
    }
  }

  async function restore() {
    if (readToken()) {
      try {
        const user = await validate();
        if (user) return user;
        clearSession();
      } catch {
        return readUser();
      }
    }
    const creds = readCreds();
    if (!creds) return null;
    try {
      return await login(creds.username, creds.password);
    } catch (error) {
      if (isTransient(error)) return readUser();
      clearCreds();
      clearSession();
      return null;
    }
  }

  const ready = restore().then((user) => {
    if (!user && !isLoginPage) {
      goLogin();
      return null;
    }
    showApp(user);
    return user;
  });

  window.AppAuth = {
    ready,
    login,
    logout,
    validate,
    changePassword,
    get token() {
      return readToken();
    },
    get user() {
      return readUser();
    },
    authHeaders(json = false) {
      const base =
        typeof HEADERS !== "undefined"
          ? json && typeof HEADERS_JSON !== "undefined"
            ? HEADERS_JSON
            : HEADERS
          : {};
      return {
        ...base,
        ...(json ? { "Content-Type": "application/json" } : {}),
        "x-app-session": readToken(),
      };
    },
  };
})();

