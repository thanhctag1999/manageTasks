(function () {
  "use strict";

  const TOKEN_KEY = "mt_session_token";
  const USER_KEY = "mt_session_user";
  const isLoginPage =
    /(?:^|\/)login\.html$/i.test(location.pathname) ||
    document.documentElement.dataset.publicPage === "true";

  if (!isLoginPage) document.documentElement.classList.add("auth-checking");

  function readUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function readToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    attachSessionHeader(token);
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {}
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
    const res = await fetch(`${BASE}/rpc/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body || {}),
    });
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
    } catch {
      return null;
    }
  }

  async function logout() {
    const token = readToken();
    try {
      if (token) await rpc("app_logout", { p_token: token }, true);
    } catch {}
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

  const ready = isLoginPage
    ? Promise.resolve(readUser())
    : (() => {
        const token = readToken();
        if (!token) {
          goLogin();
          return Promise.resolve(null);
        }
        attachSessionHeader(token);
        return validate().then((user) => {
          if (!user) {
            goLogin();
            return null;
          }
          document.documentElement.classList.remove("auth-checking");
          if (document.readyState === "loading") {
            document.addEventListener(
              "DOMContentLoaded",
              () => bindUserUi(user),
              { once: true },
            );
          } else {
            bindUserUi(user);
          }
          return user;
        });
      })();

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

