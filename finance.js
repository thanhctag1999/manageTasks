(function () {
  "use strict";

  const state = {
    user: null,
    accounts: [],
    categories: [],
    transactions: [],
    recurring: [],
    budgets: [],
    goals: [],
    contributions: [],
    debts: [],
    debtPayments: [],
    wishlist: [],
    scenarios: [],
    period: "month",
    transactionType: "",
    transactionDate: "",
    purchaseWishlistId: null,
    lastSyncedAt: null,
    debtsAvailable: true,
    quickTxPresets: [],
  };

  const DAILY_ESSENTIAL_ACCOUNT_ID = "82b524c3-2c71-482e-89b7-4b1b0fda09e3";
  const DAILY_ESSENTIAL_CATEGORY_IDS = {
    food: "925474d5-0e55-4eaf-b275-edd02cca66b1",
    vehicle: "3b255d8d-0157-4f51-95fc-4f58bcfc5e2a",
    grocery: "e5d408d5-5bf2-45d8-a25f-d34ecfe9c83a",
  };

  const DEFAULT_QUICK_TX = [
    {
      id: "qt-breakfast",
      name: "Ăn sáng",
      type: "expense",
      amount: 30000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.food,
      category_hint: "ăn",
      priority: "p1",
      nature: "variable",
      merchant: "",
    },
    {
      id: "qt-lunch",
      name: "Ăn trưa",
      type: "expense",
      amount: 50000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.food,
      category_hint: "ăn",
      priority: "p1",
      nature: "variable",
      merchant: "",
    },
    {
      id: "qt-dinner",
      name: "Ăn tối",
      type: "expense",
      amount: 50000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.food,
      category_hint: "ăn",
      priority: "p1",
      nature: "variable",
      merchant: "",
    },
    {
      id: "qt-coffee",
      name: "Cà phê sáng",
      type: "expense",
      amount: 23000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.food,
      category_hint: "cà phê",
      priority: "p2",
      nature: "variable",
      merchant: "",
    },
    {
      id: "qt-commute",
      name: "Đổ xăng",
      type: "expense",
      amount: 70000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.vehicle,
      category_hint: "đi lại",
      priority: "p1",
      nature: "semi_fixed",
      merchant: "",
    },
    {
      id: "qt-grocery",
      name: "Tạp hóa",
      type: "expense",
      amount: 100000,
      account_id: DAILY_ESSENTIAL_ACCOUNT_ID,
      category_id: DAILY_ESSENTIAL_CATEGORY_IDS.grocery,
      category_hint: "siêu thị",
      priority: "p1",
      nature: "variable",
      merchant: "",
    },
  ];

  const TABLES = {
    accounts: "financial_account",
    categories: "expense_category",
    transactions: "finance_transaction",
    recurring: "recurring_rule",
    budgets: "budget",
    goals: "savings_goal",
    contributions: "goal_contribution",
    debts: "finance_debt",
    debtPayments: "debt_payment",
    wishlist: "wishlist_item",
    scenarios: "cashflow_scenario",
  };

  const PRIORITY_LABELS = {
    p0: "P0 · Bắt buộc",
    p1: "P1 · Thiết yếu",
    p2: "P2 · Quan trọng",
    p3: "P3 · Tùy chọn",
  };
  const NATURE_LABELS = {
    fixed: "Cố định",
    semi_fixed: "Bán cố định",
    variable: "Biến đổi",
    one_off: "Một lần",
  };
  const STATUS_LABELS = {
    planned: "Dự kiến",
    due: "Đến hạn",
    posted: "Đã ghi nhận",
    skipped: "Đã bỏ qua",
    active: "Đang chạy",
    paused: "Tạm dừng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    considering: "Đang cân nhắc",
    saving: "Đang tiết kiệm",
    ready: "Sẵn sàng mua",
    purchased: "Đã mua",
    paid: "Đã trả hết",
  };
  const FREQUENCY_LABELS = {
    daily: "Hàng ngày",
    weekly: "Hàng tuần",
    monthly: "Hàng tháng",
    quarterly: "Hàng quý",
    yearly: "Hàng năm",
    custom: "Tùy chỉnh",
  };
  const ACCOUNT_KIND_LABELS = {
    cash: "Tiền mặt",
    bank: "Ngân hàng",
    ewallet: "Ví điện tử",
    credit: "Thẻ tín dụng",
    saving: "Tiết kiệm",
    investment: "Đầu tư",
  };
  const VIEW_COPY = {
    overview: [
      "Tổng quan dòng tiền",
      "Từ số dư hiện tại đến mọi quyết định phía trước.",
    ],
    transactions: [
      "Sổ giao dịch",
      "Mọi chuyển động tiền tệ trong một dòng thời gian rõ ràng.",
    ],
    recurring: [
      "Chi phí định kỳ",
      "Nhìn trước những khoản sẽ đến hạn thay vì chờ chúng xuất hiện.",
    ],
    budgets: [
      "Ngân sách",
      "Đặt giới hạn thông minh cho tuần và tháng hiện tại.",
    ],
    goals: [
      "Mục tiêu tiết kiệm",
      "Biến một con số lớn thành những bước đóng góp có thể thực hiện.",
    ],
    wishlist: [
      "Wishlist",
      "Tính ngày có thể mua mà không phá vỡ kế hoạch tài chính.",
    ],
    scenarios: [
      "Kịch bản dòng tiền",
      "Thử tương lai trước khi tương lai thử ví của bạn.",
    ],
    debts: ["Quản lý nợ", "Theo dõi dư nợ, hạn trả và lịch sử thanh toán."],
    setup: [
      "Tài khoản & danh mục",
      "Nền móng dữ liệu cho mọi báo cáo và dự báo.",
    ],
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];

  init();

  async function init() {
    state.user = await AppAuth.ready;
    if (!state.user) return;
    bindStaticEvents();
    renderAuth();
    setDefaultDates();
    await loadAll();
  }

  function bindStaticEvents() {
    document.addEventListener("click", handleDocumentClick);

    $("#refreshBtn").addEventListener("click", loadAll);
    $("#periodSelect").addEventListener("change", (event) => {
      state.period = event.target.value;
      renderAll();
    });
    $("#transactionSearch").addEventListener("input", renderTransactions);
    $("#transactionFilterDate").addEventListener("change", (event) => {
      state.transactionDate = event.target.value;
      renderTransactions();
    });
    $("#financeGlobalSearch")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const query = event.currentTarget.value.trim();
      $("#transactionSearch").value = query;
      setView("transactions");
      renderTransactions();
      $("#transactionSearch").focus();
    });
    $("#exportTransactionsBtn").addEventListener("click", exportTransactions);
    $("#generateRecurringBtn").addEventListener(
      "click",
      generateRecurringTransactions,
    );

    $("#transactionTypePicker").addEventListener("click", (event) => {
      const button = event.target.closest("[data-value]");
      if (!button) return;
      setTransactionType(button.dataset.value);
    });
    $("#transactionCategory").addEventListener("change", () => {
      const category = findById(
        state.categories,
        $("#transactionCategory").value,
      );
      if (!category) return;
      $("#transactionNature").value = category.default_nature || "variable";
      $("#transactionPriority").value = category.default_priority || "p2";
    });

    $$("[data-money-input]").forEach((input) => {
      input.addEventListener("input", () => {
        const amount = parseMoney(input.value);
        input.value = amount ? numberFormat(amount) : "";
      });
    });

    $("#transactionForm").addEventListener("submit", saveTransaction);
    $("#quickTxForm")?.addEventListener("submit", saveQuickTxPreset);
    $("#quickTxResetDefaults")?.addEventListener("click", resetQuickTxDefaults);
    $("#recurringForm").addEventListener("submit", saveRecurring);
    $("#budgetForm").addEventListener("submit", saveBudget);
    $("#goalForm").addEventListener("submit", saveGoal);
    $("#contributionForm").addEventListener("submit", saveContribution);
    $("#debtForm").addEventListener("submit", saveDebt);
    $("#debtPaymentForm").addEventListener("submit", saveDebtPayment);
    $("#wishlistForm").addEventListener("submit", saveWishlist);
    $("#accountForm").addEventListener("submit", saveAccount);
    $("#categoryForm").addEventListener("submit", saveCategory);
    $("#scenarioForm").addEventListener("submit", saveScenario);
    $("#passwordForm").addEventListener("submit", savePassword);

    $$("dialog.finance-dialog").forEach((dialog) => {
      const closeButton = dialog.querySelector("[data-close-dialog]");
      if (closeButton && !closeButton.hasAttribute("aria-label")) {
        closeButton.setAttribute("aria-label", "Đóng hộp thoại");
      }
    });

    window.addEventListener("hashchange", () => {
      const target = location.hash.slice(1);
      if (VIEW_COPY[target]) setView(target, false);
    });

    const initialView = location.hash.slice(1);
    if (VIEW_COPY[initialView]) setView(initialView, false);
  }

  function handleDocumentClick(event) {
    const viewButton = event.target.closest("[data-view-target]");
    if (viewButton) {
      event.preventDefault();
      setView(viewButton.dataset.viewTarget);
      return;
    }

    const openButton = event.target.closest("[data-open-dialog]");
    if (openButton) {
      event.preventDefault();
      openCreateDialog(openButton.dataset.openDialog);
      return;
    }

    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
      event.preventDefault();
      closeDialog(closeButton.closest("dialog"));
      return;
    }

    const typeTab = event.target.closest("#transactionTypeTabs [data-type]");
    if (typeTab) {
      $$("#transactionTypeTabs [data-type]").forEach((button) =>
        button.classList.toggle("active", button === typeTab),
      );
      state.transactionType = typeTab.dataset.type;
      renderTransactions();
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) runAction(action);
  }

  async function runAction(button) {
    const { action, id } = button.dataset;
    const routes = {
      "edit-transaction": () => editTransaction(id),
      "delete-transaction": () =>
        deleteRow("transactions", id, "Xóa giao dịch này?"),
      "post-transaction": () => postTransaction(id),
      "edit-recurring": () => editRecurring(id),
      "delete-recurring": () =>
        deleteRow("recurring", id, "Xóa lịch định kỳ này?"),
      "toggle-recurring": () => toggleRecurring(id),
      "pay-recurring": () => payRecurring(id),
      "edit-budget": () => editBudget(id),
      "delete-budget": () => deleteRow("budgets", id, "Xóa ngân sách này?"),
      "edit-goal": () => editGoal(id),
      "delete-goal": () => deleteRow("goals", id, "Xóa mục tiêu này?"),
      "contribute-goal": () => openContribution(id),
      "edit-debt": () => editDebt(id),
      "delete-debt": () => deleteRow("debts", id, "Xóa khoản nợ này?"),
      "pay-debt": () => openDebtPayment(id),
      "edit-wishlist": () => editWishlist(id),
      "delete-wishlist": () =>
        deleteRow("wishlist", id, "Xóa mặt hàng này khỏi wishlist?"),
      "purchase-wishlist": () => purchaseWishlist(id),
      "edit-account": () => editAccount(id),
      "toggle-account-balance": () => toggleAccountBalance(button),
      "delete-account": () =>
        deleteRow("accounts", id, "Xóa tài khoản tài chính này?"),
      "edit-category": () => editCategory(id),
      "delete-category": () => deleteRow("categories", id, "Xóa danh mục này?"),
      "edit-scenario": () => editScenario(id),
      "delete-scenario": () => deleteRow("scenarios", id, "Xóa kịch bản này?"),
      "use-quick-tx": () => applyQuickTxPreset(id, false),
      "instant-quick-tx": () => applyQuickTxPreset(id, true),
      "edit-quick-tx": () => editQuickTxPreset(id),
      "delete-quick-tx": () => deleteQuickTxPreset(id),
    };
    if (routes[action]) await routes[action]();
  }

  function renderAuth() {
    const name = state.user.displayName || state.user.username || "U";
    $$("[data-user-initial]").forEach((el) => {
      el.textContent = name.trim().slice(0, 1).toUpperCase();
    });
    $("#passwordAlert").classList.toggle(
      "hidden",
      !state.user.mustChangePassword,
    );
  }

  function setView(view, updateHash = true) {
    if (!VIEW_COPY[view]) view = "overview";
    $$(".finance-view").forEach((section) => {
      section.classList.toggle("active", section.dataset.view === view);
    });
    $$("[data-view-target]").forEach((button) => {
      const isActive = button.dataset.viewTarget === view;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    $("#viewTitle").textContent = VIEW_COPY[view][0];
    $("#viewSubtitle").textContent = VIEW_COPY[view][1];
    if (updateHash && location.hash !== `#${view}`) {
      history.pushState(null, "", `#${view}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setLoading(on) {
    $("#financeLoading").classList.toggle("hidden", !on);
    $("#financeLoading").setAttribute("aria-hidden", String(!on));
    const refreshButton = $("#refreshBtn");
    refreshButton.disabled = on;
    refreshButton.setAttribute("aria-busy", String(on));
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [
        accounts,
        categories,
        transactions,
        recurring,
        budgets,
        goals,
        contributions,
        wishlist,
        scenarios,
      ] = await Promise.all([
        list("accounts", "name.asc"),
        list("categories", "name.asc"),
        list("transactions", "occurred_on.desc"),
        list("recurring", "next_due_on.asc"),
        list("budgets", "created_at.desc"),
        list("goals", "priority.asc,created_at.asc"),
        list("contributions", "contributed_on.desc"),
        list("wishlist", "priority.asc,created_at.desc"),
        list("scenarios", "created_at.desc"),
      ]);

      let debts = [];
      let debtPayments = [];
      let debtsAvailable = true;
      try {
        [debts, debtPayments] = await Promise.all([
          list("debts", "due_date.asc"),
          list("debtPayments", "paid_on.desc"),
        ]);
      } catch (debtError) {
        debtsAvailable = false;
        console.warn("Debts tables unavailable:", debtError);
      }

      Object.assign(state, {
        accounts,
        categories,
        transactions,
        recurring,
        budgets,
        goals,
        contributions,
        debts,
        debtPayments,
        wishlist,
        scenarios,
        debtsAvailable,
        lastSyncedAt: new Date(),
      });
      loadQuickTxPresets();
      populateSelects();
      renderAll();
    } catch (error) {
      console.error(error);
      toast(
        readableApiError(error) +
          " Hãy chạy database/schema.sql nếu chưa khởi tạo database.",
        true,
      );
    } finally {
      setLoading(false);
    }
  }

  async function list(key, order) {
    const url = new URL(`${BASE}/${TABLES[key]}`);
    url.searchParams.set("select", "*");
    if (order) url.searchParams.set("order", order);
    const res = await fetch(url, { headers: AppAuth.authHeaders() });
    if (!res.ok) throw await apiError(res);
    return res.json();
  }

  async function createRow(key, body) {
    const res = await fetch(`${BASE}/${TABLES[key]}`, {
      method: "POST",
      headers: {
        ...AppAuth.authHeaders(true),
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await apiError(res);
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function createRows(key, rows) {
    if (!rows.length) return [];
    const res = await fetch(`${BASE}/${TABLES[key]}`, {
      method: "POST",
      headers: {
        ...AppAuth.authHeaders(true),
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw await apiError(res);
    return res.json();
  }

  async function updateRow(key, id, body) {
    const res = await fetch(
      `${BASE}/${TABLES[key]}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          ...AppAuth.authHeaders(true),
          Prefer: "return=representation",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw await apiError(res);
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function removeRow(key, id) {
    const res = await fetch(
      `${BASE}/${TABLES[key]}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: AppAuth.authHeaders(),
      },
    );
    if (!res.ok) throw await apiError(res);
  }

  async function apiError(res) {
    let payload = null;
    try {
      payload = await res.json();
    } catch {}
    const error = new Error(
      payload?.message || payload?.details || `HTTP ${res.status}`,
    );
    error.status = res.status;
    error.payload = payload;
    return error;
  }

  function readableApiError(error) {
    const raw = String(error?.message || error || "");
    if (raw.includes("duplicate key")) return "Dữ liệu này đã tồn tại.";
    if (raw.includes("row-level security"))
      return "Phiên đăng nhập không có quyền với dữ liệu này.";
    if (raw.includes("relation") && raw.includes("does not exist"))
      return "Thiếu bảng dữ liệu tài chính.";
    return raw || "Không thể xử lý yêu cầu.";
  }

  function populateSelects() {
    const accountOptions = [
      '<option value="">Không chọn</option>',
      ...state.accounts
        .filter((item) => !item.is_archived)
        .map(
          (item) =>
            `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
        ),
    ].join("");
    [
      "#transactionAccount",
      "#transactionTransferAccount",
      "#recurringAccount",
      "#contributionAccount",
    ].forEach((selector) => {
      const el = $(selector);
      const current = el.value;
      el.innerHTML = accountOptions;
      if ([...el.options].some((option) => option.value === current))
        el.value = current;
    });

    const categoryOptions = [
      '<option value="">Không phân loại</option>',
      ...state.categories
        .filter((item) => !item.is_archived)
        .map(
          (item) =>
            `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
        ),
    ].join("");
    ["#transactionCategory", "#recurringCategory"].forEach((selector) => {
      const el = $(selector);
      const current = el.value;
      el.innerHTML = categoryOptions;
      if ([...el.options].some((option) => option.value === current))
        el.value = current;
    });
    const quickTxCategory = $("#quickTxCategory");
    if (quickTxCategory) {
      const currentQuickCat = quickTxCategory.value;
      quickTxCategory.innerHTML =
        '<option value="">Tự chọn khi thêm</option>' +
        state.categories
          .filter((item) => !item.is_archived)
          .map(
            (item) =>
              `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
          )
          .join("");
      if ([...quickTxCategory.options].some((o) => o.value === currentQuickCat))
        quickTxCategory.value = currentQuickCat;
    }
    const budgetCategory = $("#budgetCategory");
    const currentBudgetCat = budgetCategory.value;
    budgetCategory.innerHTML =
      '<option value="">Toàn bộ chi tiêu</option>' +
      state.categories
        .filter((item) => !item.is_archived)
        .map(
          (item) =>
            `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
        )
        .join("");
    budgetCategory.value = currentBudgetCat;

    const wishlistGoal = $("#wishlistGoal");
    const currentGoal = wishlistGoal.value;
    wishlistGoal.innerHTML =
      '<option value="">Không liên kết</option>' +
      state.goals
        .filter((goal) => goal.status === "active")
        .map(
          (goal) =>
            `<option value="${escapeAttr(goal.id)}">${escapeHtml(goal.name)}</option>`,
        )
        .join("");
    wishlistGoal.value = currentGoal;

    const debtPaymentAccount = $("#debtPaymentAccount");
    if (debtPaymentAccount) {
      const currentDebtAcc = debtPaymentAccount.value;
      debtPaymentAccount.innerHTML =
        '<option value="">Không chọn</option>' +
        state.accounts
          .filter((item) => !item.is_archived)
          .map(
            (item) =>
              `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`,
          )
          .join("");
      debtPaymentAccount.value = currentDebtAcc;
    }
  }

  function renderAll() {
    renderOverview();
    renderTransactions();
    renderQuickTx();
    renderRecurring();
    renderBudgets();
    renderGoals();
    renderDebts();
    renderWishlist();
    renderScenarios();
    renderSetup();
  }

  // -------------------------------------------------------------------------
  // Overview and forecast
  // -------------------------------------------------------------------------

  function renderOverview() {
    const range = periodRange(state.period);
    const forecast = forecastForRange(range);
    const balance = totalBalance();
    const future = futureCommitments(range);
    const goalReserve = plannedGoalReserve(state.period);
    const safeSpend = Math.max(
      0,
      balance + future.income - future.expense - goalReserve,
    );
    const periodRows = postedTransactions(range);
    const income = sum(
      periodRows
        .filter((row) => ["income", "refund"].includes(row.type))
        .map((row) => row.amount),
    );
    const expense = sum(
      periodRows
        .filter((row) => row.type === "expense")
        .map((row) => row.amount),
    );
    const contributions = contributionTotal(range);
    const savingRate = income
      ? clamp(
          ((Math.max(0, income - expense) + contributions) / income) * 100,
          0,
          100,
        )
      : 0;

    text("#kpiBalance", money(balance));
    text(
      "#kpiAccountCount",
      `${state.accounts.filter((item) => !item.is_archived).length} tài khoản`,
    );
    text(
      "#kpiBalanceTrend",
      income - expense >= 0
        ? `+${money(income - expense)} kỳ này`
        : `${money(income - expense)} kỳ này`,
    );
    text("#kpiSafeSpend", money(safeSpend));
    text("#kpiForecast", money(forecast.total));
    text(
      "#kpiForecastRange",
      state.period === "day"
        ? "Trong hôm nay"
        : state.period === "week"
          ? "Trong tuần này"
          : state.period === "year"
            ? "Trong năm nay"
            : "Trong tháng này",
    );
    text("#kpiSavingRate", `${Math.round(savingRate)}%`);
    text(
      "#kpiSavingRateNote",
      income ? `Trên ${money(income)} thu nhập` : "Chưa có thu nhập trong kỳ",
    );
    text("#sumIncome", money(income));
    text("#sumExpense", money(expense));
    text("#sumNet", money(income - expense));
    $("#sumNet").classList.toggle("negative", income - expense < 0);

    renderContextSummary(range);
    renderCashflowChart(range);
    renderHealth({
      balance,
      income,
      expense,
      savingRate,
      forecast,
    });
    renderUpcoming();
    renderCategoryMix(range);
    renderGoalMini();
    renderInsights({
      range,
      balance,
      safeSpend,
      income,
      expense,
      forecast,
    });
    renderRecentTransactions();
  }

  function renderContextSummary(range) {
    const periodLabels = {
      day: "Hôm nay",
      week: "Tuần này",
      month: "Tháng này",
      year: "Năm nay",
    };
    const rangeStart = range.start.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    const rangeEnd = range.end.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const rangeLabel =
      state.period === "day"
        ? range.end.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : `${rangeStart}–${rangeEnd}`;
    text(
      "#contextPeriod",
      `${periodLabels[state.period] || "Kỳ hiện tại"} · ${rangeLabel}`,
    );

    const syncedLabel = state.lastSyncedAt
      ? `Cập nhật ${state.lastSyncedAt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "Đang đồng bộ";
    text("#contextSync", syncedLabel);

    const today = startOfDay(new Date());
    const dueItems = recurringOccurrences(today, addDays(today, 45)).filter(
      (item) => item.rule.direction === "expense",
    );
    const dueTotal = sum(dueItems.map((item) => item.rule.amount));
    text(
      "#contextDue",
      dueItems.length
        ? `${dueItems.length} khoản · ${money(dueTotal)}`
        : "Không có khoản đến hạn",
    );
    text("#financeNotifCount", String(Math.min(99, dueItems.length)));
    $("#financeNotifCount").classList.toggle("is-empty", !dueItems.length);

    const budget = budgetAggregate();
    const budgetPercent = budget.limit
      ? Math.round((budget.spent / budget.limit) * 100)
      : 0;
    text(
      "#contextBudget",
      budget.limit
        ? `${budgetPercent}% đã dùng · còn ${money(
            Math.max(0, budget.limit - budget.spent),
          )}`
        : "Chưa thiết lập",
    );
    $("#contextBudget").classList.toggle("is-risk", budgetPercent >= 100);
    $("#contextBudget").classList.toggle(
      "is-warning",
      budgetPercent >= 80 && budgetPercent < 100,
    );
  }

  function renderCashflowChart(range) {
    const buckets = cashflowBuckets(range, state.period);
    const svg = $("#cashflowChart");
    if (!svg || !buckets.length) return;

    const W = 900;
    const H = 360;
    const pad = { top: 54, right: 34, bottom: 58, left: 54 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const maxValue = Math.max(
      1,
      ...buckets.flatMap((bucket) => [bucket.income, bucket.expense]),
    );
    const xAt = (index) =>
      pad.left +
      (buckets.length <= 1
        ? plotW / 2
        : (index / (buckets.length - 1)) * plotW);
    const yAt = (value) =>
      pad.top + plotH - (Math.max(0, value) / maxValue) * plotH * 0.82;
    const incomePoints = buckets.map((bucket, index) => ({
      x: xAt(index),
      y: yAt(bucket.income),
    }));
    const expensePoints = buckets.map((bucket, index) => ({
      x: xAt(index),
      y: yAt(bucket.expense),
    }));
    const smoothPath = (points) => {
      if (!points.length) return "";
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let index = 0; index < points.length - 1; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        const middle = (current.x + next.x) / 2;
        path += ` C ${middle} ${current.y}, ${middle} ${next.y}, ${next.x} ${next.y}`;
      }
      return path;
    };

    const highlightIndex = buckets.reduce(
      (best, bucket, index) =>
        bucket.income + bucket.expense >=
        buckets[best].income + buckets[best].expense
          ? index
          : best,
      0,
    );
    const highlight = incomePoints[highlightIndex];
    const highlightedBucket = buckets[highlightIndex];
    const tipX = Math.max(pad.left + 8, Math.min(W - 242, highlight.x - 112));
    const tipY = Math.max(18, Math.min(H - 130, highlight.y - 98));
    const barWidth = Math.max(
      5,
      Math.min(16, plotW / Math.max(18, buckets.length * 1.7)),
    );

    let markup = `<defs>
      <linearGradient id="financeIncomeBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b8a4ff" stop-opacity=".72"/><stop offset="100%" stop-color="#b8a4ff" stop-opacity=".08"/></linearGradient>
      <linearGradient id="financeExpenseBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7a8c7" stop-opacity=".72"/><stop offset="100%" stop-color="#f7a8c7" stop-opacity=".08"/></linearGradient>
      <linearGradient id="perfTooltip" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f8fafc"/></linearGradient>
      <filter id="perfTipShadow" x="-30%" y="-40%" width="160%" height="190%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0f172a" flood-opacity=".12"/></filter>
    </defs>`;
    for (let grid = 0; grid <= 4; grid += 1) {
      const y = pad.top + (plotH * grid) / 4;
      markup += `<line class="perf-grid" x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" />`;
    }
    buckets.forEach((bucket, index) => {
      const height = Math.max(10, (bucket.expense / maxValue) * plotH * 0.82);
      markup += `<rect class="perf-bar" x="${xAt(index) - barWidth / 2}" y="${pad.top + plotH - height}" width="${barWidth}" height="${height}" rx="${barWidth / 2}" fill="${index % 2 ? "url(#financeExpenseBar)" : "url(#financeIncomeBar)"}" />`;
    });
    markup += `<path class="perf-line perf-line--practice" d="${smoothPath(expensePoints)}" />
      <path class="perf-line perf-line--theory" d="${smoothPath(incomePoints)}" />
      <circle class="perf-point perf-point--halo" cx="${highlight.x}" cy="${highlight.y}" r="12" />
      <circle class="perf-point" cx="${highlight.x}" cy="${highlight.y}" r="5" />
      <rect class="perf-tooltip finance-chart-tooltip" x="${tipX}" y="${tipY}" width="234" height="76" rx="22" />
      <text class="perf-tooltip__pct" x="${tipX + 20}" y="${tipY + 31}">${escapeHtml(moneyShort(highlightedBucket.income))}</text>
      <text class="perf-tooltip__sub" x="${tipX + 20}" y="${tipY + 55}">Chi ${escapeHtml(moneyShort(highlightedBucket.expense))} · ${escapeHtml(highlightedBucket.label)}</text>`;
    const labelStep = Math.max(1, Math.ceil(buckets.length / 10));
    buckets.forEach((bucket, index) => {
      if (index % labelStep !== 0 && index !== buckets.length - 1) return;
      markup += `<text class="perf-label" x="${xAt(index)}" y="${H - 20}" text-anchor="middle">${escapeHtml(bucket.label)}</text>`;
    });
    svg.innerHTML = markup;
    svg.classList.remove("in");
    void svg.getBoundingClientRect();
    svg.classList.add("in");
  }

  function cashflowBuckets(range, period) {
    const rows = postedTransactions(range);
    const buckets = [];
    if (period === "day") {
      buckets.push({
        start: range.start,
        end: range.end,
        label: "Hôm nay",
      });
    } else if (period === "week") {
      for (let i = 0; i < 7; i++) {
        const start = addDays(range.start, i);
        buckets.push({
          start,
          end: start,
          label: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i],
        });
      }
    } else if (period === "month") {
      let cursor = new Date(range.start);
      while (cursor <= range.end) {
        const start = new Date(cursor);
        const end = minDate(addDays(start, 6), range.end);
        buckets.push({
          start,
          end,
          label: `${start.getDate()}–${end.getDate()}`,
        });
        cursor = addDays(end, 1);
      }
    } else {
      for (let month = 0; month < 12; month++) {
        const start = new Date(range.start.getFullYear(), month, 1);
        const end = new Date(range.start.getFullYear(), month + 1, 0);
        buckets.push({ start, end, label: `T${month + 1}` });
      }
    }
    return buckets.map((bucket) => {
      const inside = rows.filter((row) =>
        inRange(parseDate(row.occurred_on), bucket.start, bucket.end),
      );
      return {
        ...bucket,
        income: sum(
          inside
            .filter((row) => ["income", "refund"].includes(row.type))
            .map((row) => row.amount),
        ),
        expense: sum(
          inside
            .filter((row) => row.type === "expense")
            .map((row) => row.amount),
        ),
      };
    });
  }

  function renderHealth(data) {
    const periodBudget = budgetAggregate();
    const overdue = state.recurring.filter(
      (rule) =>
        rule.is_active &&
        parseDate(rule.next_due_on) < startOfDay(new Date()) &&
        rule.direction === "expense",
    ).length;
    let score = 52;
    score += Math.min(18, data.savingRate * 0.35);
    score += data.balance >= 0 ? 10 : -20;
    score += data.income >= data.expense ? 10 : -10;
    if (periodBudget.limit > 0)
      score += periodBudget.spent <= periodBudget.limit ? 10 : -12;
    score -= Math.min(20, overdue * 5);
    score = Math.round(clamp(score, 0, 100));

    text("#healthScore", score);
    text("#healthRingScore", score);
    $("#healthRing").style.setProperty("--score", `${score}%`);
    $("#healthSignals").innerHTML = [
      {
        color: data.income >= data.expense ? "var(--f-green)" : "var(--f-red)",
        label: "Dòng tiền kỳ này",
        value: data.income >= data.expense ? "Dương" : "Âm",
      },
      {
        color:
          !periodBudget.limit || periodBudget.spent <= periodBudget.limit
            ? "var(--f-green)"
            : "var(--f-red)",
        label: "Ngân sách",
        value: !periodBudget.limit
          ? "Chưa đặt"
          : `${Math.round((periodBudget.spent / periodBudget.limit) * 100)}%`,
      },
      {
        color: overdue ? "var(--f-orange)" : "var(--f-green)",
        label: "Khoản quá hạn",
        value: String(overdue),
      },
    ]
      .map(
        (item) =>
          `<div class="signal-row"><i style="background:${item.color}"></i><span>${item.label}</span><b>${item.value}</b></div>`,
      )
      .join("");
  }

  function renderUpcoming() {
    const today = startOfDay(new Date());
    const end = addDays(today, 45);
    const items = recurringOccurrences(today, end)
      .filter((item) => item.rule.direction === "expense")
      .slice(0, 5);
    $("#upcomingList").innerHTML = items.length
      ? items
          .map(
            ({ rule, date }) => `
              <div class="due-item">
                <div class="due-item__day">${date.getDate()}<small>/${date.getMonth() + 1}</small></div>
                <div><b>${escapeHtml(rule.name)}</b><span>${escapeHtml(
                  categoryName(rule.category_id),
                )} · ${daysLabel(date)}</span></div>
                <div class="due-item__amount">${money(rule.amount)}</div>
              </div>`,
          )
          .join("")
      : empty("Chưa có khoản định kỳ nào trong 45 ngày tới.");
  }

  function renderCategoryMix(range) {
    const rows = postedTransactions(range).filter(
      (row) => row.type === "expense",
    );
    const grouped = groupAmount(rows, (row) => row.category_id || "other");
    const entries = [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const total = sum(entries.map((entry) => entry[1]));
    const fallbackColors = [
      "#b8d94a",
      "#047857",
      "#ea580c",
      "#2563eb",
      "#dc3f57",
    ];
    let cursor = 0;
    const stops = entries.map(([id, amount], index) => {
      const start = cursor;
      cursor += total ? (amount / total) * 100 : 0;
      const category = findById(state.categories, id);
      return `${category?.color || fallbackColors[index]} ${start}% ${cursor}%`;
    });
    const donut = $("#categoryDonut");
    donut.style.background = entries.length
      ? `conic-gradient(${stops.join(",")})`
      : "conic-gradient(#ece8f5 0 100%)";
    donut.innerHTML = `<b>${moneyShort(total)}</b>`;
    $("#categoryBreakdown").innerHTML = entries.length
      ? entries
          .map(([id, amount], index) => {
            const category = findById(state.categories, id);
            const color = category?.color || fallbackColors[index];
            return `<div class="category-key"><i style="background:${escapeAttr(
              color,
            )}"></i><span>${escapeHtml(category?.name || "Khác")}</span><b>${
              total ? Math.round((amount / total) * 100) : 0
            }%</b></div>`;
          })
          .join("")
      : '<div class="empty-state">Chưa có chi tiêu trong kỳ.</div>';
  }

  function renderGoalMini() {
    const goals = state.goals
      .filter((goal) => goal.status === "active")
      .slice(0, 4);
    $("#goalMiniList").innerHTML = goals.length
      ? goals
          .map((goal) => {
            const progress = goalProgress(goal);
            return `<div class="goal-mini">
              <div><b>${escapeHtml(goal.name)}</b><span>${money(
                progress.current,
              )} / ${money(goal.target_amount)}</span></div>
              <b>${Math.round(progress.percent)}%</b>
              <div class="goal-mini__progress"><span style="width:${progress.percent}%"></span></div>
            </div>`;
          })
          .join("")
      : empty("Chưa có mục tiêu tiết kiệm.");
  }

  function renderInsights(data) {
    const insights = buildInsights(data);
    $("#insightList").innerHTML = insights.length
      ? insights
          .slice(0, 6)
          .map(
            (item) => `<div class="insight-item insight-item--${item.tone}">
              <div class="insight-item__icon">${item.icon}</div>
              <div><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.text)}</p></div>
            </div>`,
          )
          .join("")
      : empty("Dòng tiền đang ổn. Chưa có cảnh báo đáng chú ý.");
  }

  function buildInsights(data) {
    const items = [];
    const overdue = state.recurring.filter(
      (rule) =>
        rule.is_active &&
        rule.direction === "expense" &&
        parseDate(rule.next_due_on) < startOfDay(new Date()),
    );
    if (overdue.length) {
      items.push({
        tone: "danger",
        icon: "!",
        title: `${overdue.length} khoản định kỳ đã quá hạn`,
        text: `Tổng gần nhất ${money(sum(overdue.map((item) => item.amount)))} cần được xử lý.`,
      });
    }
    const activeDebts = state.debts.filter((debt) => debt.status === "active");
    const outstanding = sum(
      activeDebts.map((debt) => debtProgress(debt).remaining),
    );
    const dueSoonDebts = activeDebts.filter((debt) => {
      if (!debt.due_date) return false;
      const due = parseDate(debt.due_date);
      const days = Math.ceil((due - startOfDay(new Date())) / 86400000);
      return days <= 7;
    });
    if (outstanding > 0) {
      items.push({
        tone: dueSoonDebts.length ? "warn" : "info",
        icon: "₫",
        title: `Đang nợ ${money(outstanding)}`,
        text: dueSoonDebts.length
          ? `${dueSoonDebts.length} khoản đến hạn trong 7 ngày tới.`
          : `${activeDebts.length} khoản đang mở · mở mục Nợ để trả.`,
      });
    }
    const overBudgets = budgetDetails().filter((item) => item.percent >= 100);
    if (overBudgets.length) {
      items.push({
        tone: "danger",
        icon: "↗",
        title: `${overBudgets.length} ngân sách đã vượt mức`,
        text: `${overBudgets[0].name} đang ở ${Math.round(overBudgets[0].percent)}% hạn mức.`,
      });
    }
    const warningBudgets = budgetDetails().filter(
      (item) => item.percent >= 80 && item.percent < 100,
    );
    if (warningBudgets.length) {
      items.push({
        tone: "warn",
        icon: "◎",
        title: "Ngân sách sắp chạm trần",
        text: `${warningBudgets[0].name} đã dùng ${Math.round(warningBudgets[0].percent)}%.`,
      });
    }
    if (data.forecast.total > data.income && data.income > 0) {
      items.push({
        tone: "warn",
        icon: "≈",
        title: "Chi phí dự báo cao hơn thu nhập",
        text: `Chênh lệch dự kiến ${money(data.forecast.total - data.income)} trong kỳ.`,
      });
    }
    if (data.safeSpend <= 0) {
      items.push({
        tone: "danger",
        icon: "×",
        title: "Không còn vùng chi an toàn",
        text: "Các cam kết sắp tới đã sử dụng hết số dư khả dụng.",
      });
    }
    const discretionary = sum(
      postedTransactions(data.range)
        .filter((row) => row.type === "expense" && row.priority === "p3")
        .map((row) => row.amount),
    );
    if (discretionary > 0) {
      items.push({
        tone: "normal",
        icon: "◇",
        title: `${money(discretionary)} cho chi tiêu tùy chọn`,
        text: "Đây là vùng cắt giảm đầu tiên nếu bạn muốn tăng tốc mục tiêu.",
      });
    }
    const atRisk = state.goals
      .filter((goal) => goal.status === "active")
      .map(goalProgress)
      .filter((item) => item.track === "risk");
    if (atRisk.length) {
      items.push({
        tone: "warn",
        icon: "△",
        title: `${atRisk.length} mục tiêu có nguy cơ trễ`,
        text: `${atRisk[0].goal.name} cần ${money(atRisk[0].requiredPerMonth)}/tháng để đúng hạn.`,
      });
    }
    return items;
  }

  function renderRecentTransactions() {
    const rows = state.transactions
      .filter((row) => row.status === "posted")
      .slice()
      .sort((a, b) =>
        String(b.occurred_on).localeCompare(String(a.occurred_on)),
      )
      .slice(0, 7);
    $("#recentTransactions").innerHTML = rows.length
      ? rows.map(transactionListItem).join("")
      : empty("Chưa có giao dịch nào.");
  }

  function transactionListItem(row) {
    const category = findById(state.categories, row.category_id);
    const typeSymbol = {
      income: "↙",
      expense: "↗",
      transfer: "↔",
      refund: "↙",
    }[row.type];
    const sign =
      row.type === "expense" ? "−" : row.type === "transfer" ? "" : "+";
    return `<div class="transaction-item">
      <div class="transaction-item__icon" style="--item-color:${escapeAttr(
        category?.color || "#b8d94a",
      )}">${typeSymbol}</div>
      <div><b>${escapeHtml(row.name)}</b><span>${escapeHtml(
        category?.name || typeLabel(row.type),
      )} · ${formatDate(row.occurred_on)}</span></div>
      <div class="transaction-item__amount ${escapeAttr(row.type)}">${sign}${money(
        row.amount,
      )}</div>
    </div>`;
  }

  // -------------------------------------------------------------------------
  // Transactions CRUD
  // -------------------------------------------------------------------------

  function renderTransactions() {
    const search = ($("#transactionSearch")?.value || "").trim().toLowerCase();
    const range = periodRange(state.period);
    const selectedDate = state.transactionDate
      ? parseDate(state.transactionDate)
      : null;
    const rows = state.transactions
      .filter((row) => {
        const occurredOn = parseDate(row.occurred_on);
        if (
          selectedDate
            ? !inRange(occurredOn, selectedDate, selectedDate)
            : !inRange(occurredOn, range.start, range.end)
        )
          return false;
        if (
          state.transactionType === "planned" &&
          !["planned", "due"].includes(row.status)
        )
          return false;
        if (
          state.transactionType &&
          state.transactionType !== "planned" &&
          row.type !== state.transactionType
        )
          return false;
        if (search) {
          const haystack = [
            row.name,
            row.merchant,
            row.note,
            categoryName(row.category_id),
            accountName(row.account_id),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        String(b.occurred_on).localeCompare(String(a.occurred_on)),
      );

    const posted = rows.filter((row) => row.status === "posted");
    const income = sum(
      posted
        .filter((row) => ["income", "refund"].includes(row.type))
        .map((row) => row.amount),
    );
    const expense = sum(
      posted.filter((row) => row.type === "expense").map((row) => row.amount),
    );
    const planned = sum(
      rows
        .filter(
          (row) =>
            ["planned", "due"].includes(row.status) && row.type === "expense",
        )
        .map((row) => row.amount),
    );
    $("#ledgerSummary").innerHTML = [
      [
        selectedDate ? "Ngày theo dõi" : "Đang hiển thị",
        selectedDate
          ? `${formatDate(state.transactionDate)} · ${rows.length} giao dịch`
          : `${rows.length} giao dịch`,
      ],
      ["Tổng thu", money(income)],
      ["Tổng chi", money(expense)],
      ["Chi đang chờ", money(planned)],
    ]
      .map(
        ([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`,
      )
      .join("");

    $("#transactionTableBody").innerHTML = rows.length
      ? rows
          .map((row) => {
            const category = findById(state.categories, row.category_id);
            const sign =
              row.type === "expense" ? "−" : row.type === "transfer" ? "" : "+";
            return `<tr>
              <td>
                <div class="row-title">
                  <i class="row-title__dot" style="--dot:${escapeAttr(
                    category?.color || "#b8d94a",
                  )}"></i>
                  <div><b>${escapeHtml(row.name)}</b><span>${escapeHtml(
                    row.merchant || accountName(row.account_id),
                  )}</span></div>
                </div>
              </td>
              <td>${formatDate(row.occurred_on)}</td>
              <td>${escapeHtml(category?.name || typeLabel(row.type))}</td>
              <td><span class="chip chip--${escapeAttr(row.priority)}">${escapeHtml(
                PRIORITY_LABELS[row.priority] || "—",
              )}</span></td>
              <td><span class="chip chip--${escapeAttr(row.status)}">${escapeHtml(
                STATUS_LABELS[row.status] || row.status,
              )}</span></td>
              <td class="align-right"><b class="table-money ${escapeAttr(
                row.type,
              )}">${sign}${money(row.amount)}</b></td>
              <td><div class="row-actions">
                ${
                  ["planned", "due"].includes(row.status)
                    ? `<button class="icon-action" data-action="post-transaction" data-id="${escapeAttr(row.id)}" title="Ghi nhận đã thanh toán">✓</button>`
                    : ""
                }
                <button class="icon-action" data-action="edit-transaction" data-id="${escapeAttr(row.id)}" title="Sửa">✎</button>
                <button class="icon-action danger" data-action="delete-transaction" data-id="${escapeAttr(row.id)}" title="Xóa">×</button>
              </div></td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="7">${empty("Không có giao dịch phù hợp bộ lọc.")}</td></tr>`;
  }

  async function saveTransaction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#transactionId").value;
    const type = $("#transactionType").value;
    const accountId = nullable($("#transactionAccount").value);
    const transferAccountId = nullable($("#transactionTransferAccount").value);
    if (type === "transfer" && accountId && accountId === transferAccountId) {
      toast("Tài khoản nguồn và đích phải khác nhau.", true);
      return;
    }
    const body = ownerBody({
      name: $("#transactionName").value.trim(),
      type,
      amount: parseMoney($("#transactionAmount").value),
      occurred_on: $("#transactionDate").value,
      status: $("#transactionStatus").value,
      account_id: accountId,
      transfer_account_id: type === "transfer" ? transferAccountId : null,
      category_id:
        type === "expense" ? nullable($("#transactionCategory").value) : null,
      nature: type === "expense" ? $("#transactionNature").value : "one_off",
      priority: type === "expense" ? $("#transactionPriority").value : "p2",
      merchant: nullable($("#transactionMerchant").value.trim()),
      note: nullable($("#transactionNote").value.trim()),
      wishlist_item_id: state.purchaseWishlistId,
    });
    if (!body.name || !body.amount || !body.occurred_on) {
      toast("Vui lòng nhập tên, số tiền và ngày giao dịch.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("transactions", id, body);
      else await createRow("transactions", body);
      if (state.purchaseWishlistId && type === "expense") {
        await updateRow("wishlist", state.purchaseWishlistId, {
          status: "purchased",
          purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      state.purchaseWishlistId = null;
      closeDialog($("#transactionDialog"));
      toast(id ? "Đã cập nhật giao dịch." : "Đã thêm giao dịch.");
      await loadAll();
    });
  }

  function editTransaction(id) {
    const row = findById(state.transactions, id);
    if (!row) return;
    resetTransactionForm();
    $("#transactionId").value = row.id;
    $("#transactionDialogTitle").textContent = "Chỉnh sửa giao dịch";
    $("#transactionName").value = row.name || "";
    $("#transactionAmount").value = numberFormat(row.amount);
    $("#transactionDate").value = row.occurred_on || todayYmd();
    $("#transactionAccount").value = row.account_id || "";
    $("#transactionTransferAccount").value = row.transfer_account_id || "";
    $("#transactionCategory").value = row.category_id || "";
    $("#transactionNature").value = row.nature || "variable";
    $("#transactionPriority").value = row.priority || "p2";
    $("#transactionStatus").value = row.status || "posted";
    $("#transactionMerchant").value = row.merchant || "";
    $("#transactionNote").value = row.note || "";
    setTransactionType(row.type);
    openDialog($("#transactionDialog"));
  }

  async function postTransaction(id) {
    try {
      await updateRow("transactions", id, {
        status: "posted",
        updated_at: new Date().toISOString(),
      });
      toast("Đã ghi nhận giao dịch.");
      await loadAll();
    } catch (error) {
      toast(readableApiError(error), true);
    }
  }

  function resetTransactionForm() {
    $("#transactionForm").reset();
    $("#transactionId").value = "";
    $("#transactionDialogTitle").textContent = "Giao dịch mới";
    $("#transactionDate").value = todayYmd();
    $("#transactionStatus").value = "posted";
    $("#transactionPriority").value = "p2";
    $("#transactionNature").value = "variable";
    state.purchaseWishlistId = null;
    setTransactionType("expense");
  }

  function setTransactionType(type) {
    $("#transactionType").value = type;
    $$("#transactionTypePicker [data-value]").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === type);
    });
    $$(".expense-only").forEach((el) =>
      el.classList.toggle("hidden", type !== "expense"),
    );
    $$(".transfer-only").forEach((el) =>
      el.classList.toggle("hidden", type !== "transfer"),
    );
  }

  // -------------------------------------------------------------------------
  // Quick transaction presets (daily essentials)
  // -------------------------------------------------------------------------

  function quickTxStorageKey() {
    const uid = state.user?.id || state.user?.username || "guest";
    return `finance.quickTx.${uid}`;
  }

  function cloneQuickTxDefaults() {
    return DEFAULT_QUICK_TX.map((item) => ({ ...item }));
  }

  function loadQuickTxPresets() {
    try {
      const raw = localStorage.getItem(quickTxStorageKey());
      if (!raw) {
        state.quickTxPresets = cloneQuickTxDefaults();
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        state.quickTxPresets = cloneQuickTxDefaults();
        return;
      }
      state.quickTxPresets = parsed.map((item) => normalizeQuickTx(item));
    } catch {
      state.quickTxPresets = cloneQuickTxDefaults();
    }
  }

  function normalizeQuickTx(item) {
    const defaultPreset = DEFAULT_QUICK_TX.find(
      (preset) => preset.id === String(item.id || ""),
    );
    return {
      id: String(
        item.id || `qt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ),
      name: String(item.name || "Gợi ý").trim() || "Gợi ý",
      type: item.type === "income" ? "income" : "expense",
      amount: Math.max(0, Number(item.amount) || 0),
      account_id: item.account_id || defaultPreset?.account_id || null,
      category_id: item.category_id || defaultPreset?.category_id || null,
      category_hint: item.category_hint || "",
      priority: item.priority || "p1",
      nature: item.nature || "variable",
      merchant: item.merchant || "",
    };
  }

  function saveQuickTxPresets() {
    localStorage.setItem(
      quickTxStorageKey(),
      JSON.stringify(state.quickTxPresets),
    );
  }

  function resolveQuickTxCategoryId(preset) {
    if (preset.category_id && findById(state.categories, preset.category_id)) {
      return preset.category_id;
    }
    const hint = (preset.category_hint || preset.name || "").toLowerCase();
    if (!hint) return null;
    const match = state.categories.find((cat) => {
      if (cat.is_archived) return false;
      const name = (cat.name || "").toLowerCase();
      return name.includes(hint) || hint.includes(name);
    });
    return match?.id || null;
  }

  function resolveQuickTxAccountId(preset) {
    if (preset.account_id && findById(state.accounts, preset.account_id)) {
      return preset.account_id;
    }
    return null;
  }

  function isQuickTxUsedToday(preset) {
    const today = todayYmd();
    const name = (preset.name || "").toLowerCase();
    return state.transactions.some(
      (row) =>
        row.occurred_on === today &&
        (row.name || "").toLowerCase() === name &&
        row.type === preset.type,
    );
  }

  function renderQuickTx() {
    const chips = $("#quickTxChips");
    if (!chips) return;
    const presets = state.quickTxPresets || [];
    if (!presets.length) {
      chips.innerHTML = empty(
        "Chưa có gợi ý. Bấm Tùy chỉnh để thêm giao dịch thiết yếu.",
      );
      renderQuickTxManageList();
      return;
    }
    chips.innerHTML = presets
      .map((preset) => {
        const used = isQuickTxUsedToday(preset);
        const category =
          findById(state.categories, resolveQuickTxCategoryId(preset)) || null;
        return `<div class="quick-tx-chip${used ? " is-used" : ""}">
          <button type="button" class="quick-tx-chip__main" data-action="use-quick-tx" data-id="${escapeAttr(preset.id)}" title="Mở form đã điền sẵn">
            <span class="quick-tx-chip__name">${escapeHtml(preset.name)}</span>
            <span class="quick-tx-chip__meta">
              <b>${money(preset.amount)}</b>
              <span>${escapeHtml(category?.name || typeLabel(preset.type))}</span>
            </span>
            ${used ? '<span class="quick-tx-chip__badge">Hôm nay</span>' : ""}
          </button>
          <button type="button" class="quick-tx-chip__instant" data-action="instant-quick-tx" data-id="${escapeAttr(preset.id)}" title="Thêm ngay">+</button>
        </div>`;
      })
      .join("");
    renderQuickTxManageList();
  }

  function renderQuickTxManageList() {
    const list = $("#quickTxManageList");
    if (!list) return;
    const presets = state.quickTxPresets || [];
    if (!presets.length) {
      list.innerHTML = empty("Chưa có gợi ý nào.");
      return;
    }
    list.innerHTML = `
      <div class="quick-tx-manage-head">Danh sách đang dùng</div>
      ${presets
        .map((preset) => {
          const category = findById(
            state.categories,
            resolveQuickTxCategoryId(preset),
          );
          return `<div class="quick-tx-manage-row">
            <div>
              <b>${escapeHtml(preset.name)}</b>
              <span>${money(preset.amount)} · ${escapeHtml(
                category?.name || typeLabel(preset.type),
              )} · ${escapeHtml(PRIORITY_LABELS[preset.priority] || preset.priority)}</span>
            </div>
            <div class="row-actions">
              <button type="button" class="icon-action" data-action="edit-quick-tx" data-id="${escapeAttr(preset.id)}" title="Sửa">✎</button>
              <button type="button" class="icon-action danger" data-action="delete-quick-tx" data-id="${escapeAttr(preset.id)}" title="Xóa">×</button>
            </div>
          </div>`;
        })
        .join("")}`;
  }

  function resetQuickTxForm() {
    $("#quickTxForm")?.reset();
    $("#quickTxEditId").value = "";
    $("#quickTxDialogTitle").textContent = "Gợi ý giao dịch nhanh";
    $("#quickTxType").value = "expense";
    $("#quickTxPriority").value = "p1";
    $("#quickTxNature").value = "variable";
    $("#quickTxAmount").value = "";
    $("#quickTxCategory").value = "";
    $("#quickTxMerchant").value = "";
    renderQuickTxManageList();
  }

  function editQuickTxPreset(id) {
    const preset = state.quickTxPresets.find((item) => item.id === id);
    if (!preset) return;
    $("#quickTxEditId").value = preset.id;
    $("#quickTxDialogTitle").textContent = "Sửa gợi ý";
    $("#quickTxName").value = preset.name;
    $("#quickTxType").value = preset.type;
    $("#quickTxAmount").value = numberFormat(preset.amount);
    $("#quickTxCategory").value = resolveQuickTxCategoryId(preset) || "";
    $("#quickTxPriority").value = preset.priority || "p1";
    $("#quickTxNature").value = preset.nature || "variable";
    $("#quickTxMerchant").value = preset.merchant || "";
    openDialog($("#quickTxDialog"));
  }

  async function saveQuickTxPreset(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#quickTxEditId").value;
    const name = $("#quickTxName").value.trim();
    const amount = parseMoney($("#quickTxAmount").value);
    if (!name || !amount) {
      toast("Vui lòng nhập tên và số tiền mặc định.", true);
      return;
    }
    const categoryId = nullable($("#quickTxCategory").value);
    const category = findById(state.categories, categoryId);
    const body = normalizeQuickTx({
      id: id || `qt-${Date.now()}`,
      name,
      type: $("#quickTxType").value,
      amount,
      category_id: categoryId,
      category_hint: category?.name || name,
      priority: $("#quickTxPriority").value,
      nature: $("#quickTxNature").value,
      merchant: $("#quickTxMerchant").value.trim(),
    });
    await withSubmit(form, async () => {
      if (id) {
        state.quickTxPresets = state.quickTxPresets.map((item) =>
          item.id === id ? body : item,
        );
      } else {
        state.quickTxPresets = [...state.quickTxPresets, body];
      }
      saveQuickTxPresets();
      resetQuickTxForm();
      renderQuickTx();
      toast(id ? "Đã cập nhật gợi ý." : "Đã thêm gợi ý.");
    });
  }

  function deleteQuickTxPreset(id) {
    if (!confirm("Xóa gợi ý này?")) return;
    state.quickTxPresets = state.quickTxPresets.filter(
      (item) => item.id !== id,
    );
    saveQuickTxPresets();
    if ($("#quickTxEditId").value === id) resetQuickTxForm();
    renderQuickTx();
    toast("Đã xóa gợi ý.");
  }

  function resetQuickTxDefaults() {
    if (
      !confirm("Khôi phục bộ gợi ý mặc định? Thay đổi hiện tại sẽ bị ghi đè.")
    )
      return;
    state.quickTxPresets = cloneQuickTxDefaults();
    saveQuickTxPresets();
    resetQuickTxForm();
    renderQuickTx();
    toast("Đã khôi phục gợi ý mặc định.");
  }

  async function applyQuickTxPreset(id, instant) {
    const preset = state.quickTxPresets.find((item) => item.id === id);
    if (!preset) return;
    const categoryId = resolveQuickTxCategoryId(preset);
    const accountId = resolveQuickTxAccountId(preset);
    if (instant) {
      const body = ownerBody({
        name: preset.name,
        type: preset.type,
        amount: preset.amount,
        occurred_on: todayYmd(),
        status: "posted",
        account_id: accountId,
        transfer_account_id: null,
        category_id: preset.type === "expense" ? categoryId : null,
        nature:
          preset.type === "expense" ? preset.nature || "variable" : "one_off",
        priority: preset.type === "expense" ? preset.priority || "p1" : "p2",
        merchant: nullable(preset.merchant),
        note: null,
        wishlist_item_id: null,
      });
      try {
        await createRow("transactions", body);
        toast(`Đã thêm “${preset.name}”.`);
        await loadAll();
      } catch (error) {
        toast(readableApiError(error), true);
      }
      return;
    }
    resetTransactionForm();
    $("#transactionDialogTitle").textContent = `Nhanh · ${preset.name}`;
    $("#transactionName").value = preset.name;
    $("#transactionAmount").value = numberFormat(preset.amount);
    $("#transactionDate").value = todayYmd();
    $("#transactionAccount").value = accountId || "";
    $("#transactionCategory").value = categoryId || "";
    $("#transactionPriority").value = preset.priority || "p1";
    $("#transactionNature").value = preset.nature || "variable";
    $("#transactionMerchant").value = preset.merchant || "";
    $("#transactionStatus").value = "posted";
    setTransactionType(preset.type);
    openDialog($("#transactionDialog"));
  }

  // -------------------------------------------------------------------------
  // Recurring
  // -------------------------------------------------------------------------

  function renderRecurring() {
    const active = state.recurring.filter((rule) => rule.is_active);
    const monthlyExpense = sum(
      active
        .filter((rule) => rule.direction === "expense")
        .map(monthlyEquivalent),
    );
    const monthlyIncome = sum(
      active
        .filter((rule) => rule.direction === "income")
        .map(monthlyEquivalent),
    );
    const overdue = active.filter(
      (rule) => parseDate(rule.next_due_on) < startOfDay(new Date()),
    );
    $("#recurringKpis").innerHTML = [
      ["Lịch đang chạy", String(active.length)],
      ["Chi phí tương đương/tháng", money(monthlyExpense)],
      ["Thu nhập tương đương/tháng", money(monthlyIncome)],
      ["Đã quá hạn", String(overdue.length)],
    ]
      .map(([label, value]) => miniKpi(label, value))
      .join("");

    const today = startOfDay(new Date());

    const timeline = active
      .map((rule) => ({
        rule,
        date: parseDate(rule.next_due_on || rule.start_on),
      }))
      .filter(({ rule, date }) => {
        if (!date || Number.isNaN(date.getTime())) return false;

        if (rule.end_on && date > parseDate(rule.end_on)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.date - b.date)
      .slice(0, 18);
    $("#recurringTimeline").innerHTML = timeline.length
      ? timeline
          .map(({ rule, date }) => {
            const paid = transactionForRecurring(rule.id, date);
            return `<div class="timeline-item">
              <div class="timeline-item__date">${formatDate(toYmd(date))}</div>
              <div><b>${escapeHtml(rule.name)}</b><span>${escapeHtml(
                FREQUENCY_LABELS[rule.frequency],
              )} · ${escapeHtml(PRIORITY_LABELS[rule.priority])}</span></div>
              <div class="timeline-item__amount" style="color:${
                rule.direction === "income" ? "var(--f-green)" : "var(--f-red)"
              }">${rule.direction === "income" ? "+" : "−"}${money(rule.amount)}</div>
              ${
                paid
                  ? '<span class="chip chip--posted">Đã có giao dịch</span>'
                  : date <= today
                    ? `<button class="f-btn" data-action="pay-recurring" data-id="${escapeAttr(
                        rule.id,
                      )}">Ghi nhận</button>`
                    : '<span class="chip chip--planned">Sắp tới</span>'
              }
            </div>`;
          })
          .join("")
      : empty("Chưa có lịch định kỳ.");

    $("#recurringRuleList").innerHTML = state.recurring.length
      ? state.recurring
          .map(
            (rule) => `<div class="rule-item">
              <div>
                <b>${escapeHtml(rule.name)}</b>
                <div class="rule-item__meta">${escapeHtml(
                  FREQUENCY_LABELS[rule.frequency],
                )} · kế tiếp ${formatDate(rule.next_due_on)} · ${money(
                  rule.amount,
                )}</div>
              </div>
              <div class="rule-item__actions">
                <button class="icon-action" data-action="toggle-recurring" data-id="${escapeAttr(
                  rule.id,
                )}" title="${rule.is_active ? "Tạm dừng" : "Kích hoạt"}">${
                  rule.is_active ? "Ⅱ" : "▶"
                }</button>
                <button class="icon-action" data-action="edit-recurring" data-id="${escapeAttr(
                  rule.id,
                )}">✎</button>
                <button class="icon-action danger" data-action="delete-recurring" data-id="${escapeAttr(
                  rule.id,
                )}">×</button>
              </div>
            </div>`,
          )
          .join("")
      : empty("Chưa tạo lịch định kỳ.");
  }

  async function saveRecurring(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#recurringId").value;
    const nextDue = $("#recurringNextDue").value;
    const direction = $("#recurringDirection").value;
    const body = ownerBody({
      name: $("#recurringName").value.trim(),
      direction,
      amount: parseMoney($("#recurringAmount").value),
      category_id:
        direction === "expense"
          ? nullable($("#recurringCategory").value)
          : null,
      account_id: nullable($("#recurringAccount").value),
      frequency: $("#recurringFrequency").value,
      interval_count: Math.max(1, +$("#recurringInterval").value || 1),
      next_due_on: nextDue,
      start_on: id
        ? findById(state.recurring, id)?.start_on || nextDue
        : nextDue,
      day_of_month: nextDue ? parseDate(nextDue).getDate() : null,
      remind_days: clamp(+$("#recurringRemindDays").value || 0, 0, 90),
      nature: $("#recurringNature").value,
      priority: $("#recurringPriority").value,
      note: nullable($("#recurringNote").value.trim()),
      is_active: id ? findById(state.recurring, id)?.is_active !== false : true,
      updated_at: new Date().toISOString(),
    });
    if (!body.name || !body.amount || !body.next_due_on) {
      toast("Vui lòng nhập tên, số tiền và ngày đến hạn.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("recurring", id, body);
      else await createRow("recurring", body);
      closeDialog($("#recurringDialog"));
      toast(id ? "Đã cập nhật lịch định kỳ." : "Đã tạo lịch định kỳ.");
      await loadAll();
    });
  }

  function editRecurring(id) {
    const row = findById(state.recurring, id);
    if (!row) return;
    resetRecurringForm();
    $("#recurringId").value = row.id;
    $("#recurringDialogTitle").textContent = "Chỉnh sửa lịch định kỳ";
    $("#recurringName").value = row.name || "";
    $("#recurringDirection").value = row.direction || "expense";
    $("#recurringAmount").value = numberFormat(row.amount);
    $("#recurringCategory").value = row.category_id || "";
    $("#recurringAccount").value = row.account_id || "";
    $("#recurringFrequency").value = row.frequency || "monthly";
    $("#recurringInterval").value = row.interval_count || 1;
    $("#recurringNextDue").value = row.next_due_on || todayYmd();
    $("#recurringRemindDays").value = row.remind_days ?? 3;
    $("#recurringNature").value = row.nature || "fixed";
    $("#recurringPriority").value = row.priority || "p1";
    $("#recurringNote").value = row.note || "";
    openDialog($("#recurringDialog"));
  }

  async function toggleRecurring(id) {
    const row = findById(state.recurring, id);
    if (!row) return;
    try {
      await updateRow("recurring", id, {
        is_active: !row.is_active,
        updated_at: new Date().toISOString(),
      });
      toast(row.is_active ? "Đã tạm dừng lịch." : "Đã kích hoạt lịch.");
      await loadAll();
    } catch (error) {
      toast(readableApiError(error), true);
    }
  }

  async function payRecurring(id) {
    const rule = findById(state.recurring, id);
    if (!rule) return;
    const due = parseDate(rule.next_due_on);
    const existing = transactionForRecurring(rule.id, due);
    if (existing) {
      toast("Kỳ này đã có giao dịch.", true);
      return;
    }
    try {
      await createRow(
        "transactions",
        ownerBody({
          name: rule.name,
          type: rule.direction,
          amount: +rule.amount,
          occurred_on: toYmd(due),
          status: "posted",
          category_id: rule.category_id,
          account_id: rule.account_id,
          nature: rule.nature,
          priority: rule.priority,
          recurring_rule_id: rule.id,
          note: "Tạo từ lịch định kỳ",
        }),
      );
      await updateRow("recurring", rule.id, {
        next_due_on: toYmd(nextOccurrence(rule, due)),
        updated_at: new Date().toISOString(),
      });
      toast("Đã ghi nhận kỳ thanh toán.");
      await loadAll();
    } catch (error) {
      toast(readableApiError(error), true);
    }
  }

  async function generateRecurringTransactions() {
    const today = startOfDay(new Date());
    const rows = [];
    const nextDates = new Map();
    for (const rule of state.recurring.filter((item) => item.is_active)) {
      let cursor = parseDate(rule.next_due_on);
      let guard = 0;
      while (cursor <= today && guard++ < 120) {
        if (!transactionForRecurring(rule.id, cursor)) {
          rows.push(
            ownerBody({
              name: rule.name,
              type: rule.direction,
              amount: +rule.amount,
              occurred_on: toYmd(cursor),
              status: "due",
              category_id: rule.category_id,
              account_id: rule.account_id,
              nature: rule.nature,
              priority: rule.priority,
              recurring_rule_id: rule.id,
              note: "Tự động sinh từ lịch định kỳ",
            }),
          );
        }
        cursor = nextOccurrence(rule, cursor);
      }
      if (cursor > parseDate(rule.next_due_on)) nextDates.set(rule.id, cursor);
    }
    try {
      await createRows("transactions", rows);
      for (const [id, date] of nextDates) {
        await updateRow("recurring", id, {
          next_due_on: toYmd(date),
          updated_at: new Date().toISOString(),
        });
      }
      toast(
        rows.length
          ? `Đã sinh ${rows.length} giao dịch đến hạn.`
          : "Không có kỳ mới cần sinh.",
      );
      await loadAll();
    } catch (error) {
      toast(readableApiError(error), true);
    }
  }

  function resetRecurringForm() {
    $("#recurringForm").reset();
    $("#recurringId").value = "";
    $("#recurringDialogTitle").textContent = "Lịch định kỳ mới";
    $("#recurringNextDue").value = todayYmd();
    $("#recurringInterval").value = 1;
    $("#recurringRemindDays").value = 3;
    $("#recurringNature").value = "fixed";
    $("#recurringPriority").value = "p1";
  }

  // -------------------------------------------------------------------------
  // Budgets
  // -------------------------------------------------------------------------

  function renderBudgets() {
    const details = budgetDetails();
    const totalLimit = sum(details.map((item) => item.limit));
    const totalSpent = sum(details.map((item) => item.spent));
    const totalForecast = sum(details.map((item) => item.forecast));
    const percent = totalLimit ? (totalSpent / totalLimit) * 100 : 0;
    const warningCount = details.filter((item) => item.percent >= 80).length;

    $("#budgetOverview").innerHTML = `
      <div class="budget-hero">
        <div>
          <h3>Tổng ngân sách đang hoạt động</h3>
          <strong>${money(totalLimit)}</strong>
          <p>Đã chi ${money(totalSpent)} · Dự báo ${money(totalForecast)}</p>
        </div>
        <div class="budget-meter" style="--meter:${clamp(
          percent,
          0,
          100,
        )}%;--meter-color:${
          percent >= 100
            ? "var(--f-red)"
            : percent >= 80
              ? "var(--f-orange)"
              : "var(--f-purple)"
        }"><b>${Math.round(percent)}%</b></div>
      </div>
      <div class="budget-warning-panel">
        <h3>${warningCount ? `${warningCount} cảnh báo` : "Đang trong giới hạn"}</h3>
        <p>${
          warningCount
            ? "Một số ngân sách đã dùng trên 80% hạn mức."
            : "Chưa có ngân sách nào chạm ngưỡng cảnh báo."
        }</p>
      </div>`;

    $("#budgetGrid").innerHTML = details.length
      ? details
          .map((item) => {
            const color =
              item.percent >= 100
                ? "#e75672"
                : item.percent >= 80
                  ? "#f59e43"
                  : item.category?.color || "#b8d94a";
            return `<article class="budget-card">
              <div class="budget-card__head">
                <div><h3>${escapeHtml(item.name)}</h3><p>${
                  item.period === "weekly"
                    ? "Ngân sách tuần"
                    : "Ngân sách tháng"
                } · ${escapeHtml(item.category?.name || "Toàn bộ chi tiêu")}</p></div>
                <span class="chip ${item.percent >= 100 ? "chip--p0" : item.percent >= 80 ? "chip--p1" : "chip--posted"}">${Math.round(
                  item.percent,
                )}%</span>
              </div>
              <div class="progress-track"><span style="--bar-color:${color};width:${clamp(
                item.percent,
                0,
                100,
              )}%"></span></div>
              <div class="budget-card__numbers"><span>Đã chi <b>${money(
                item.spent,
              )}</b></span><span>Còn lại <b>${money(
                Math.max(0, item.limit - item.spent),
              )}</b></span></div>
              <div class="card-footer-actions">
                <span>Dự báo ${money(item.forecast)}</span>
                <div><button class="icon-action" data-action="edit-budget" data-id="${escapeAttr(
                  item.id,
                )}">✎</button><button class="icon-action danger" data-action="delete-budget" data-id="${escapeAttr(
                  item.id,
                )}">×</button></div>
              </div>
            </article>`;
          })
          .join("")
      : empty(
          "Chưa có ngân sách. Tạo một giới hạn tuần hoặc tháng để bắt đầu.",
        );
  }

  function budgetDetails() {
    return state.budgets
      .filter((budget) => budget.is_active)
      .map((budget) => {
        const range = periodRange(
          budget.period === "weekly" ? "week" : "month",
        );
        const categoryId = budget.category_id || null;
        const spent = sum(
          postedTransactions(range)
            .filter(
              (row) =>
                row.type === "expense" &&
                (!categoryId || row.category_id === categoryId),
            )
            .map((row) => row.amount),
        );
        const forecast = forecastForRange(range, categoryId).total;
        const limit = +budget.amount || 0;
        return {
          ...budget,
          limit,
          spent,
          forecast,
          percent: limit ? (spent / limit) * 100 : 0,
          category: findById(state.categories, categoryId),
        };
      });
  }

  function budgetAggregate() {
    const details = budgetDetails();
    return {
      limit: sum(details.map((item) => item.limit)),
      spent: sum(details.map((item) => item.spent)),
      forecast: sum(details.map((item) => item.forecast)),
    };
  }

  async function saveBudget(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#budgetId").value;
    const period = $("#budgetPeriod").value;
    const body = ownerBody({
      name: $("#budgetName").value.trim(),
      period,
      amount: parseMoney($("#budgetAmount").value),
      category_id: nullable($("#budgetCategory").value),
      start_on: toYmd(
        periodRange(period === "weekly" ? "week" : "month").start,
      ),
      rollover: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (!body.name || !body.amount) {
      toast("Vui lòng nhập tên và hạn mức.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("budgets", id, body);
      else await createRow("budgets", body);
      closeDialog($("#budgetDialog"));
      toast(id ? "Đã cập nhật ngân sách." : "Đã tạo ngân sách.");
      await loadAll();
    });
  }

  function editBudget(id) {
    const row = findById(state.budgets, id);
    if (!row) return;
    resetBudgetForm();
    $("#budgetId").value = row.id;
    $("#budgetDialogTitle").textContent = "Chỉnh sửa ngân sách";
    $("#budgetName").value = row.name || "";
    $("#budgetPeriod").value = row.period || "monthly";
    $("#budgetAmount").value = numberFormat(row.amount);
    $("#budgetCategory").value = row.category_id || "";
    openDialog($("#budgetDialog"));
  }

  function resetBudgetForm() {
    $("#budgetForm").reset();
    $("#budgetId").value = "";
    $("#budgetDialogTitle").textContent = "Ngân sách mới";
    $("#budgetPeriod").value = "monthly";
  }

  // -------------------------------------------------------------------------
  // Savings goals
  // -------------------------------------------------------------------------

  function renderGoals() {
    const active = state.goals.filter((goal) => goal.status === "active");
    const target = sum(active.map((goal) => goal.target_amount));
    const current = sum(active.map((goal) => goalProgress(goal).current));
    const needed = sum(
      active.map((goal) => goalProgress(goal).requiredPerMonth),
    );
    const completed = state.goals.filter(
      (goal) => goal.status === "completed",
    ).length;
    $("#goalStats").innerHTML = [
      ["Mục tiêu đang chạy", String(active.length)],
      ["Đã tích lũy", money(current)],
      ["Tổng đích đến", money(target)],
      ["Cần mỗi tháng", money(needed)],
    ]
      .map(([label, value]) => miniKpi(label, value))
      .join("");

    $("#goalGrid").innerHTML = state.goals.length
      ? state.goals
          .map((goal) => {
            const data = goalProgress(goal);
            const trackLabel = {
              ahead: "Vượt tiến độ",
              on_track: "Đúng tiến độ",
              risk: "Có nguy cơ trễ",
              completed: "Hoàn thành",
            }[data.track];
            return `<article class="goal-card">
              <div class="goal-card__head">
                <div><h3>${escapeHtml(goal.name)}</h3><p>${escapeHtml(
                  PRIORITY_LABELS[goal.priority],
                )} · ${goal.deadline ? `hạn ${formatDate(goal.deadline)}` : "không có hạn"}</p></div>
                <span class="chip ${data.track === "risk" ? "chip--p0" : "chip--posted"}">${escapeHtml(
                  trackLabel,
                )}</span>
              </div>
              <div class="progress-track"><span style="--bar-color:${escapeAttr(
                goal.color || "#14b8a6",
              )};width:${data.percent}%"></span></div>
              <div class="goal-card__numbers"><span>Hiện có <b>${money(
                data.current,
              )}</b></span><span>Mục tiêu <b>${money(
                goal.target_amount,
              )}</b></span></div>
              <div class="card-footer-actions">
                <span>${
                  goal.deadline
                    ? `Cần ${money(data.requiredPerMonth)}/tháng`
                    : `${Math.round(data.percent)}% hoàn thành`
                }</span>
                <div>
                  ${
                    goal.status === "active"
                      ? `<button class="icon-action" data-action="contribute-goal" data-id="${escapeAttr(
                          goal.id,
                        )}" title="Đóng góp">+</button>`
                      : ""
                  }
                  <button class="icon-action" data-action="edit-goal" data-id="${escapeAttr(
                    goal.id,
                  )}">✎</button>
                  <button class="icon-action danger" data-action="delete-goal" data-id="${escapeAttr(
                    goal.id,
                  )}">×</button>
                </div>
              </div>
            </article>`;
          })
          .join("")
      : empty("Chưa có mục tiêu tiết kiệm.");

    const contributions = state.contributions
      .slice()
      .sort((a, b) =>
        String(b.contributed_on).localeCompare(String(a.contributed_on)),
      )
      .slice(0, 12);
    $("#contributionHistory").innerHTML = contributions.length
      ? contributions
          .map((row) => {
            const goal = findById(state.goals, row.goal_id);
            return `<div class="transaction-item">
              <div class="transaction-item__icon" style="--item-color:#14b8a6">+</div>
              <div><b>${escapeHtml(goal?.name || "Mục tiêu")}</b><span>${formatDate(
                row.contributed_on,
              )} · ${escapeHtml(accountName(row.account_id))}</span></div>
              <div class="transaction-item__amount income">+${money(row.amount)}</div>
            </div>`;
          })
          .join("")
      : empty("Chưa có lần đóng góp nào.");
  }

  function goalProgress(goal) {
    const contributions = state.contributions.filter(
      (row) => row.goal_id === goal.id,
    );
    const current =
      (+goal.initial_amount || 0) + sum(contributions.map((row) => row.amount));
    const target = +goal.target_amount || 0;
    const percent = clamp(target ? (current / target) * 100 : 0, 0, 100);
    const remaining = Math.max(0, target - current);
    let requiredPerMonth = 0;
    let track = percent >= 100 ? "completed" : "on_track";
    if (goal.deadline && remaining > 0) {
      const months = Math.max(
        1,
        monthsBetween(new Date(), parseDate(goal.deadline)),
      );
      requiredPerMonth = remaining / months;
      const plannedMonthly =
        goal.contribution_frequency === "weekly"
          ? (+goal.planned_contribution || 0) * 4.345
          : +goal.planned_contribution || 0;
      if (plannedMonthly >= requiredPerMonth * 1.1) track = "ahead";
      else if (plannedMonthly < requiredPerMonth * 0.8) track = "risk";
    }
    if (goal.status === "completed") track = "completed";
    return {
      goal,
      current,
      target,
      percent,
      remaining,
      requiredPerMonth,
      track,
    };
  }

  async function saveGoal(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#goalId").value;
    const existing = findById(state.goals, id);
    const body = ownerBody({
      name: $("#goalName").value.trim(),
      target_amount: parseMoney($("#goalTarget").value),
      initial_amount: parseMoney($("#goalInitial").value),
      deadline: nullable($("#goalDeadline").value),
      priority: $("#goalPriority").value,
      contribution_frequency: $("#goalFrequency").value,
      planned_contribution: parseMoney($("#goalPlannedContribution").value),
      note: nullable($("#goalNote").value.trim()),
      color: existing?.color || "#14b8a6",
      status: existing?.status || "active",
      updated_at: new Date().toISOString(),
    });
    if (!body.name || !body.target_amount) {
      toast("Vui lòng nhập tên và số tiền mục tiêu.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("goals", id, body);
      else await createRow("goals", body);
      closeDialog($("#goalDialog"));
      toast(id ? "Đã cập nhật mục tiêu." : "Đã tạo mục tiêu.");
      await loadAll();
    });
  }

  function editGoal(id) {
    const row = findById(state.goals, id);
    if (!row) return;
    resetGoalForm();
    $("#goalId").value = row.id;
    $("#goalDialogTitle").textContent = "Chỉnh sửa mục tiêu";
    $("#goalName").value = row.name || "";
    $("#goalTarget").value = numberFormat(row.target_amount);
    $("#goalInitial").value = numberFormat(row.initial_amount);
    $("#goalDeadline").value = row.deadline || "";
    $("#goalPriority").value = row.priority || "p1";
    $("#goalFrequency").value = row.contribution_frequency || "monthly";
    $("#goalPlannedContribution").value = numberFormat(
      row.planned_contribution,
    );
    $("#goalNote").value = row.note || "";
    openDialog($("#goalDialog"));
  }

  function openContribution(id) {
    const goal = findById(state.goals, id);
    if (!goal) return;
    $("#contributionForm").reset();
    $("#contributionGoalId").value = goal.id;
    $("#contributionGoalName").value = goal.name;
    $("#contributionDate").value = todayYmd();
    $("#contributionAmount").value = goal.planned_contribution
      ? numberFormat(goal.planned_contribution)
      : "";
    openDialog($("#contributionDialog"));
  }

  async function saveContribution(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const goalId = $("#contributionGoalId").value;
    const body = ownerBody({
      goal_id: goalId,
      amount: parseMoney($("#contributionAmount").value),
      contributed_on: $("#contributionDate").value,
      account_id: nullable($("#contributionAccount").value),
      note: nullable($("#contributionNote").value.trim()),
    });
    if (!body.goal_id || !body.amount || !body.contributed_on) {
      toast("Vui lòng nhập số tiền và ngày đóng góp.", true);
      return;
    }
    await withSubmit(form, async () => {
      await createRow("contributions", body);
      closeDialog($("#contributionDialog"));
      toast("Đã ghi nhận đóng góp.");
      await loadAll();
      const goal = findById(state.goals, goalId);
      if (
        goal &&
        goalProgress(goal).percent >= 100 &&
        goal.status !== "completed"
      ) {
        await updateRow("goals", goal.id, {
          status: "completed",
          updated_at: new Date().toISOString(),
        });
        await loadAll();
      }
    });
  }

  function resetGoalForm() {
    $("#goalForm").reset();
    $("#goalId").value = "";
    $("#goalDialogTitle").textContent = "Mục tiêu mới";
    $("#goalPriority").value = "p1";
    $("#goalFrequency").value = "monthly";
  }

  // -------------------------------------------------------------------------
  // Debts
  // -------------------------------------------------------------------------

  function renderDebts() {
    const stats = $("#debtStats");
    const grid = $("#debtGrid");
    const history = $("#debtPaymentHistory");
    if (!stats || !grid || !history) return;

    if (!state.debtsAvailable) {
      stats.innerHTML = "";
      grid.innerHTML = empty(
        "Chưa có bảng nợ trên database. Chạy database/schema-debts.sql rồi bấm Reload.",
      );
      history.innerHTML = empty("Chưa có lịch sử trả nợ.");
      return;
    }

    const active = state.debts.filter((debt) => debt.status === "active");
    const outstanding = sum(active.map((debt) => debtProgress(debt).remaining));
    const paidTotal = sum(state.debts.map((debt) => debtProgress(debt).paid));
    const dueSoon = active.filter((debt) => {
      if (!debt.due_date) return false;
      const days = Math.ceil(
        (parseDate(debt.due_date) - startOfDay(new Date())) / 86400000,
      );
      return days >= 0 && days <= 14;
    }).length;

    stats.innerHTML = [
      ["Khoản đang nợ", String(active.length)],
      ["Dư nợ còn lại", money(outstanding)],
      ["Đã trả tích lũy", money(paidTotal)],
      ["Đến hạn ≤ 14 ngày", String(dueSoon)],
    ]
      .map(([label, value]) => miniKpi(label, value))
      .join("");

    grid.innerHTML = state.debts.length
      ? state.debts
          .map((debt) => {
            const data = debtProgress(debt);
            const statusLabel =
              debt.status === "active"
                ? "Đang nợ"
                : STATUS_LABELS[debt.status] || debt.status;
            const dueLabel = debt.due_date
              ? `hạn ${formatDate(debt.due_date)}`
              : "không có hạn";
            const track =
              data.remaining <= 0 || debt.status === "paid"
                ? "completed"
                : data.daysLeft != null && data.daysLeft < 0
                  ? "risk"
                  : data.daysLeft != null && data.daysLeft <= 7
                    ? "risk"
                    : "on_track";
            const trackLabel = {
              completed: "Đã tất toán",
              risk: data.daysLeft < 0 ? "Quá hạn" : "Sắp đến hạn",
              on_track: "Đang theo dõi",
            }[track];
            return `<article class="goal-card debt-card">
              <div class="goal-card__head">
                <div>
                  <h3>${escapeHtml(debt.name)}</h3>
                  <p>${escapeHtml(PRIORITY_LABELS[debt.priority] || "P1")} · ${escapeHtml(
                    debt.lender || "Không rõ chủ nợ",
                  )} · ${dueLabel}</p>
                </div>
                <span class="chip ${
                  track === "risk"
                    ? "chip--p0"
                    : track === "completed"
                      ? "chip--posted"
                      : "chip--due"
                }">${escapeHtml(trackLabel)}</span>
              </div>
              <div class="progress-track"><span style="--bar-color:${escapeAttr(
                debt.color || "#dc3f57",
              )};width:${data.percentPaid}%"></span></div>
              <div class="goal-card__numbers">
                <span>Còn lại <b>${money(data.remaining)}</b></span>
                <span>Gốc <b>${money(debt.principal_amount)}</b></span>
              </div>
              <div class="card-footer-actions">
                <span>${escapeHtml(statusLabel)}${
                  debt.min_payment
                    ? ` · tối thiểu ${money(debt.min_payment)}`
                    : ""
                }${
                  debt.interest_rate
                    ? ` · ${(+debt.interest_rate || 0).toFixed(1)}%/năm`
                    : ""
                }</span>
                <div>
                  ${
                    debt.status === "active" && data.remaining > 0
                      ? `<button class="icon-action" data-action="pay-debt" data-id="${escapeAttr(
                          debt.id,
                        )}" title="Trả nợ">₫</button>`
                      : ""
                  }
                  <button class="icon-action" data-action="edit-debt" data-id="${escapeAttr(
                    debt.id,
                  )}">✎</button>
                  <button class="icon-action danger" data-action="delete-debt" data-id="${escapeAttr(
                    debt.id,
                  )}">×</button>
                </div>
              </div>
            </article>`;
          })
          .join("")
      : empty(
          "Chưa có khoản nợ nào. Thêm khoản vay, thẻ tín dụng hoặc nợ cá nhân.",
        );

    const payments = state.debtPayments
      .slice()
      .sort((a, b) => String(b.paid_on).localeCompare(String(a.paid_on)))
      .slice(0, 12);
    history.innerHTML = payments.length
      ? payments
          .map((row) => {
            const debt = findById(state.debts, row.debt_id);
            return `<div class="transaction-item">
              <div class="transaction-item__icon" style="--item-color:#dc3f57">₫</div>
              <div><b>${escapeHtml(debt?.name || "Khoản nợ")}</b><span>${formatDate(
                row.paid_on,
              )} · ${escapeHtml(accountName(row.account_id))}</span></div>
              <div class="transaction-item__amount expense">−${money(row.amount)}</div>
            </div>`;
          })
          .join("")
      : empty("Chưa có lần trả nợ nào.");
  }

  function debtProgress(debt) {
    const payments = state.debtPayments.filter(
      (row) => String(row.debt_id) === String(debt.id),
    );
    const paidFromPayments = sum(payments.map((row) => row.amount));
    const paidInitial = +debt.paid_initial || 0;
    const paid = paidInitial + paidFromPayments;
    const principal = +debt.principal_amount || 0;
    const remaining = Math.max(0, principal - paid);
    const percentPaid = clamp(principal ? (paid / principal) * 100 : 0, 0, 100);
    let daysLeft = null;
    if (debt.due_date) {
      daysLeft = Math.ceil(
        (parseDate(debt.due_date) - startOfDay(new Date())) / 86400000,
      );
    }
    return { paid, remaining, principal, percentPaid, daysLeft };
  }

  async function saveDebt(event) {
    event.preventDefault();
    if (!state.debtsAvailable) {
      toast("Chưa có bảng nợ. Chạy database/schema-debts.sql trước.", true);
      return;
    }
    const form = event.currentTarget;
    const id = $("#debtId").value;
    const existing = findById(state.debts, id);
    const principal = parseMoney($("#debtPrincipal").value);
    const paidInitial = parseMoney($("#debtPaidInitial").value);
    const body = ownerBody({
      name: $("#debtName").value.trim(),
      lender: nullable($("#debtLender").value.trim()),
      principal_amount: principal,
      paid_initial: paidInitial,
      interest_rate: $("#debtInterest").value
        ? Number($("#debtInterest").value)
        : null,
      min_payment: parseMoney($("#debtMinPayment").value) || null,
      due_date: nullable($("#debtDueDate").value),
      priority: $("#debtPriority").value || "p1",
      status: $("#debtStatus").value || "active",
      note: nullable($("#debtNote").value.trim()),
      color: existing?.color || "#dc3f57",
      updated_at: new Date().toISOString(),
    });
    if (!body.name || !body.principal_amount) {
      toast("Vui lòng nhập tên và tổng gốc khoản nợ.", true);
      return;
    }
    if (paidInitial > principal) {
      toast("Số đã trả trước không được lớn hơn tổng gốc.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("debts", id, body);
      else await createRow("debts", body);
      closeDialog($("#debtDialog"));
      toast(id ? "Đã cập nhật khoản nợ." : "Đã thêm khoản nợ.");
      await loadAll();
    });
  }

  function editDebt(id) {
    const row = findById(state.debts, id);
    if (!row) return;
    resetDebtForm();
    $("#debtId").value = row.id;
    $("#debtDialogTitle").textContent = "Chỉnh sửa khoản nợ";
    $("#debtName").value = row.name || "";
    $("#debtLender").value = row.lender || "";
    $("#debtPrincipal").value = numberFormat(row.principal_amount);
    $("#debtPaidInitial").value = numberFormat(row.paid_initial);
    $("#debtInterest").value =
      row.interest_rate == null || row.interest_rate === ""
        ? ""
        : String(row.interest_rate);
    $("#debtMinPayment").value = numberFormat(row.min_payment);
    $("#debtDueDate").value = row.due_date || "";
    $("#debtPriority").value = row.priority || "p1";
    $("#debtStatus").value = row.status || "active";
    $("#debtNote").value = row.note || "";
    openDialog($("#debtDialog"));
  }

  function openDebtPayment(id) {
    const debt = findById(state.debts, id);
    if (!debt) return;
    $("#debtPaymentForm").reset();
    $("#debtPaymentDebtId").value = debt.id;
    $("#debtPaymentDebtName").value = debt.name;
    $("#debtPaymentDate").value = todayYmd();
    const remaining = debtProgress(debt).remaining;
    const suggest = debt.min_payment
      ? Math.min(+debt.min_payment || 0, remaining)
      : remaining;
    $("#debtPaymentAmount").value = suggest ? numberFormat(suggest) : "";
    openDialog($("#debtPaymentDialog"));
  }

  async function saveDebtPayment(event) {
    event.preventDefault();
    if (!state.debtsAvailable) {
      toast("Chưa có bảng nợ. Chạy database/schema-debts.sql trước.", true);
      return;
    }
    const form = event.currentTarget;
    const debtId = $("#debtPaymentDebtId").value;
    const amount = parseMoney($("#debtPaymentAmount").value);
    const debt = findById(state.debts, debtId);
    if (!debt || !amount) {
      toast("Vui lòng nhập số tiền trả.", true);
      return;
    }
    const remaining = debtProgress(debt).remaining;
    if (amount > remaining) {
      toast(`Số tiền vượt dư nợ còn lại (${money(remaining)}).`, true);
      return;
    }
    const body = ownerBody({
      debt_id: debtId,
      amount,
      paid_on: $("#debtPaymentDate").value || todayYmd(),
      account_id: nullable($("#debtPaymentAccount").value),
      note: nullable($("#debtPaymentNote").value.trim()),
    });
    await withSubmit(form, async () => {
      await createRow("debtPayments", body);
      closeDialog($("#debtPaymentDialog"));
      toast("Đã ghi nhận trả nợ.");
      await loadAll();
      const updated = findById(state.debts, debtId);
      if (
        updated &&
        debtProgress(updated).remaining <= 0 &&
        updated.status !== "paid"
      ) {
        await updateRow("debts", debtId, {
          status: "paid",
          updated_at: new Date().toISOString(),
        });
        await loadAll();
        toast("Khoản nợ đã tất toán.");
      }
    });
  }

  function resetDebtForm() {
    $("#debtForm").reset();
    $("#debtId").value = "";
    $("#debtDialogTitle").textContent = "Khoản nợ mới";
    $("#debtPriority").value = "p1";
    $("#debtStatus").value = "active";
  }

  // -------------------------------------------------------------------------
  // Wishlist
  // -------------------------------------------------------------------------

  function renderWishlist() {
    const active = state.wishlist.filter(
      (item) => !["purchased", "cancelled"].includes(item.status),
    );
    const total = sum(active.map((item) => item.estimated_price));
    const saved = sum(active.map(wishlistSaved));
    const ready = active.filter(
      (item) => wishlistAffordability(item).kind === "safe",
    ).length;
    const monthlyCost = sum(active.map((item) => item.ongoing_monthly_cost));
    $("#wishlistSummary").innerHTML = [
      ["Đang cân nhắc", `${active.length} món`],
      ["Tổng giá trị", money(total)],
      ["Đã dành riêng", money(saved)],
      ["Có thể mua an toàn", `${ready} món`],
    ]
      .map(([label, value]) => miniKpi(label, value))
      .join("");

    $("#wishlistGrid").innerHTML = state.wishlist.length
      ? state.wishlist
          .map((item) => {
            const savedAmount = wishlistSaved(item);
            const percent = clamp(
              +item.estimated_price
                ? (savedAmount / +item.estimated_price) * 100
                : 0,
              0,
              100,
            );
            const afford = wishlistAffordability(item);
            return `<article class="wishlist-card">
              <div class="wishlist-card__visual">${escapeHtml(
                item.name.trim().slice(0, 1).toUpperCase(),
              )}</div>
              <div class="wishlist-card__head">
                <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(
                  PRIORITY_LABELS[item.priority],
                )}${item.desired_on ? ` · muốn trước ${formatDate(item.desired_on)}` : ""}</p></div>
                <span class="chip chip--${escapeAttr(item.status)}">${escapeHtml(
                  STATUS_LABELS[item.status] || item.status,
                )}</span>
              </div>
              <div class="progress-track"><span style="width:${percent}%"></span></div>
              <div class="wishlist-card__numbers"><span>Đã dành <b>${money(
                savedAmount,
              )}</b></span><span>Giá <b>${money(
                item.estimated_price,
              )}</b></span></div>
              <div class="affordability affordability--${afford.kind}">${escapeHtml(
                afford.label,
              )}</div>
              <div class="card-footer-actions">
                <span>${
                  +item.ongoing_monthly_cost
                    ? `+${money(item.ongoing_monthly_cost)}/tháng sau mua`
                    : "Không có chi phí định kỳ"
                }</span>
                <div>
                  ${
                    !["purchased", "cancelled"].includes(item.status)
                      ? `<button class="icon-action" data-action="purchase-wishlist" data-id="${escapeAttr(
                          item.id,
                        )}" title="Mua">✓</button>`
                      : ""
                  }
                  <button class="icon-action" data-action="edit-wishlist" data-id="${escapeAttr(
                    item.id,
                  )}">✎</button>
                  <button class="icon-action danger" data-action="delete-wishlist" data-id="${escapeAttr(
                    item.id,
                  )}">×</button>
                </div>
              </div>
            </article>`;
          })
          .join("")
      : empty("Wishlist đang trống.");
  }

  function wishlistSaved(item) {
    if (item.linked_goal_id) {
      const goal = findById(state.goals, item.linked_goal_id);
      if (goal) return goalProgress(goal).current;
    }
    return +item.saved_amount || 0;
  }

  function wishlistAffordability(item) {
    if (item.status === "purchased") return { kind: "safe", label: "Đã mua" };
    const saved = wishlistSaved(item);
    const gap = Math.max(0, +item.estimated_price - saved);
    if (!gap) return { kind: "safe", label: "Đã đủ tiền dành riêng" };

    const next30 = {
      start: startOfDay(new Date()),
      end: addDays(startOfDay(new Date()), 30),
    };
    const future = futureCommitments(next30);
    const safeNow = Math.max(
      0,
      totalBalance() +
        future.income -
        future.expense -
        plannedGoalReserve("month"),
    );
    if (gap <= safeNow && item.priority !== "p3") {
      return { kind: "safe", label: "Có thể mua an toàn ngay" };
    }

    const monthly = monthlyBaseline();
    const goalReserve = plannedGoalReserve("month");
    const surplus = monthly.income - monthly.expense - goalReserve;
    if (surplus <= 0) {
      return { kind: "risk", label: "Chưa có thặng dư để mua" };
    }
    const months = Math.max(1, Math.ceil(gap / surplus));
    const date = addMonthsClamped(new Date(), months, new Date().getDate());
    return {
      kind: months <= 3 ? "wait" : "risk",
      label: `Dự kiến mua an toàn ${formatDate(toYmd(date))}`,
    };
  }

  async function saveWishlist(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#wishlistId").value;
    const existing = findById(state.wishlist, id);
    const body = ownerBody({
      name: $("#wishlistName").value.trim(),
      estimated_price: parseMoney($("#wishlistPrice").value),
      saved_amount: parseMoney($("#wishlistSaved").value),
      desired_on: nullable($("#wishlistDesired").value),
      priority: $("#wishlistPriority").value,
      ongoing_monthly_cost: parseMoney($("#wishlistOngoing").value),
      linked_goal_id: nullable($("#wishlistGoal").value),
      url: nullable($("#wishlistUrl").value.trim()),
      note: nullable($("#wishlistNote").value.trim()),
      status: existing?.status || "considering",
      updated_at: new Date().toISOString(),
    });
    if (!body.name || !body.estimated_price) {
      toast("Vui lòng nhập tên và giá dự kiến.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("wishlist", id, body);
      else await createRow("wishlist", body);
      closeDialog($("#wishlistDialog"));
      toast(id ? "Đã cập nhật wishlist." : "Đã thêm vào wishlist.");
      await loadAll();
    });
  }

  function editWishlist(id) {
    const row = findById(state.wishlist, id);
    if (!row) return;
    resetWishlistForm();
    $("#wishlistId").value = row.id;
    $("#wishlistDialogTitle").textContent = "Chỉnh sửa mặt hàng";
    $("#wishlistName").value = row.name || "";
    $("#wishlistPrice").value = numberFormat(row.estimated_price);
    $("#wishlistSaved").value = numberFormat(row.saved_amount);
    $("#wishlistDesired").value = row.desired_on || "";
    $("#wishlistPriority").value = row.priority || "p2";
    $("#wishlistOngoing").value = numberFormat(row.ongoing_monthly_cost);
    $("#wishlistGoal").value = row.linked_goal_id || "";
    $("#wishlistUrl").value = row.url || "";
    $("#wishlistNote").value = row.note || "";
    openDialog($("#wishlistDialog"));
  }

  function purchaseWishlist(id) {
    const item = findById(state.wishlist, id);
    if (!item) return;
    resetTransactionForm();
    state.purchaseWishlistId = item.id;
    $("#transactionDialogTitle").textContent = "Ghi nhận mua hàng";
    $("#transactionName").value = item.name;
    $("#transactionAmount").value = numberFormat(item.estimated_price);
    $("#transactionPriority").value = item.priority || "p2";
    $("#transactionNature").value = "one_off";
    setTransactionType("expense");
    openDialog($("#transactionDialog"));
  }

  function resetWishlistForm() {
    $("#wishlistForm").reset();
    $("#wishlistId").value = "";
    $("#wishlistDialogTitle").textContent = "Mặt hàng mới";
    $("#wishlistPriority").value = "p2";
  }

  // -------------------------------------------------------------------------
  // Scenarios and cut suggestions
  // -------------------------------------------------------------------------

  function renderScenarios() {
    const baseline = monthlyBaseline();
    const balance = totalBalance();
    const net = baseline.income - baseline.expense;
    $("#scenarioBaseline").innerHTML = [
      ["Số dư hiện tại", money(balance)],
      ["Thu nhập cơ sở/tháng", money(baseline.income)],
      ["Chi phí cơ sở/tháng", money(baseline.expense)],
      ["Thặng dư cơ sở", money(net)],
    ]
      .map(([label, value]) => miniKpi(label, value))
      .join("");

    $("#scenarioGrid").innerHTML = state.scenarios.length
      ? state.scenarios
          .map((scenario) => {
            const months = +scenario.months || 6;
            const income =
              baseline.income *
              (1 + (+scenario.income_change_percent || 0) / 100);
            const expense =
              baseline.expense *
              (1 + (+scenario.expense_change_percent || 0) / 100);
            const monthlyNet = income - expense;
            const series = [];
            let running =
              balance +
              (+scenario.one_off_income || 0) -
              (+scenario.one_off_expense || 0);
            for (let i = 0; i < months; i++) {
              running += monthlyNet;
              series.push(running);
            }
            const maxAbs = Math.max(
              1,
              ...series.map((value) => Math.abs(value)),
            );
            return `<article class="scenario-card">
              <div class="scenario-card__head">
                <div><h3>${escapeHtml(scenario.name)}</h3><p>${months} tháng · thu ${
                  +scenario.income_change_percent >= 0 ? "+" : ""
                }${+scenario.income_change_percent || 0}% · chi ${
                  +scenario.expense_change_percent >= 0 ? "+" : ""
                }${+scenario.expense_change_percent || 0}%</p></div>
                <span class="chip ${running >= 0 ? "chip--posted" : "chip--p0"}">${
                  running >= 0 ? "Khả thi" : "Rủi ro"
                }</span>
              </div>
              <div class="scenario-card__chart">${series
                .map(
                  (value) =>
                    `<span class="scenario-card__bar ${
                      value < 0 ? "negative" : ""
                    }" style="height:${Math.max(
                      4,
                      (Math.abs(value) / maxAbs) * 100,
                    )}%"></span>`,
                )
                .join("")}</div>
              <div class="scenario-card__numbers"><span>Ròng/tháng <b>${money(
                monthlyNet,
              )}</b></span><span>Số dư cuối <b>${money(running)}</b></span></div>
              <div class="card-footer-actions">
                <span>${running >= balance ? "Tài chính tăng trưởng" : "Số dư bị bào mòn"}</span>
                <div><button class="icon-action" data-action="edit-scenario" data-id="${escapeAttr(
                  scenario.id,
                )}">✎</button><button class="icon-action danger" data-action="delete-scenario" data-id="${escapeAttr(
                  scenario.id,
                )}">×</button></div>
              </div>
            </article>`;
          })
          .join("")
      : empty("Tạo kịch bản đầu tiên để thử biến động thu nhập và chi phí.");

    renderCutSuggestions();
  }

  function renderCutSuggestions() {
    const historyRange = {
      start: addDays(startOfDay(new Date()), -90),
      end: startOfDay(new Date()),
    };
    const rows = postedTransactions(historyRange).filter(
      (row) => row.type === "expense" && ["p2", "p3"].includes(row.priority),
    );
    const grouped = groupAmount(rows, (row) => row.category_id || "other");
    const suggestions = [...grouped.entries()]
      .map(([categoryId, total]) => {
        const category = findById(state.categories, categoryId);
        const p3Amount = sum(
          rows
            .filter(
              (row) =>
                (row.category_id || "other") === categoryId &&
                row.priority === "p3",
            )
            .map((row) => row.amount),
        );
        const monthly = total / 3;
        const saving = p3Amount ? p3Amount / 3 / 2 : monthly * 0.15;
        return {
          name: category?.name || "Chi tiêu khác",
          monthly,
          saving,
          text: p3Amount
            ? "Giảm một nửa khoản tùy chọn trong danh mục này."
            : "Giảm 15% phần chi linh hoạt trong danh mục này.",
        };
      })
      .sort((a, b) => b.saving - a.saving)
      .slice(0, 6);
    $("#cutSuggestionList").innerHTML = suggestions.length
      ? suggestions
          .map(
            (item) => `<div class="cut-item">
              <div><b>${escapeHtml(item.name)}</b><span>${escapeHtml(
                item.text,
              )} Trung bình ${money(item.monthly)}/tháng.</span></div>
              <div class="cut-item__saving">+${money(item.saving)}/tháng</div>
              <span class="chip chip--posted">Gợi ý</span>
            </div>`,
          )
          .join("")
      : empty("Cần thêm dữ liệu chi tiêu P2/P3 để tạo gợi ý cắt giảm.");
  }

  async function saveScenario(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#scenarioId").value;
    const body = ownerBody({
      name: $("#scenarioName").value.trim(),
      months: clamp(+$("#scenarioMonths").value || 6, 1, 60),
      income_change_percent: +$("#scenarioIncomeChange").value || 0,
      expense_change_percent: +$("#scenarioExpenseChange").value || 0,
      one_off_income: parseMoney($("#scenarioOneOffIncome").value),
      one_off_expense: parseMoney($("#scenarioOneOffExpense").value),
      note: nullable($("#scenarioNote").value.trim()),
      updated_at: new Date().toISOString(),
    });
    if (!body.name) {
      toast("Vui lòng đặt tên cho kịch bản.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("scenarios", id, body);
      else await createRow("scenarios", body);
      closeDialog($("#scenarioDialog"));
      toast(id ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản.");
      await loadAll();
    });
  }

  function editScenario(id) {
    const row = findById(state.scenarios, id);
    if (!row) return;
    resetScenarioForm();
    $("#scenarioId").value = row.id;
    $("#scenarioDialogTitle").textContent = "Chỉnh sửa kịch bản";
    $("#scenarioName").value = row.name || "";
    $("#scenarioMonths").value = row.months || 6;
    $("#scenarioIncomeChange").value = row.income_change_percent || 0;
    $("#scenarioExpenseChange").value = row.expense_change_percent || 0;
    $("#scenarioOneOffIncome").value = numberFormat(row.one_off_income);
    $("#scenarioOneOffExpense").value = numberFormat(row.one_off_expense);
    $("#scenarioNote").value = row.note || "";
    openDialog($("#scenarioDialog"));
  }

  function resetScenarioForm() {
    $("#scenarioForm").reset();
    $("#scenarioId").value = "";
    $("#scenarioDialogTitle").textContent = "Kịch bản mới";
    $("#scenarioMonths").value = 6;
  }

  // -------------------------------------------------------------------------
  // Financial accounts and categories
  // -------------------------------------------------------------------------

  function renderSetup() {
    $("#accountGrid").innerHTML = state.accounts.length
      ? state.accounts
          .filter((account) => !account.is_archived)
          .map(
            (account) => `<article class="account-card" data-kind="${escapeAttr(
              account.kind || "bank",
            )}" style="--account-color:${escapeAttr(
              account.color || "#1c1c24",
            )}">
              <div class="account-card__head">
                <div class="account-card__identity">
                  <span class="account-card__kind-icon" aria-hidden="true"></span>
                  <div><h3>${escapeHtml(account.name)}</h3><p>${escapeHtml(
                    ACCOUNT_KIND_LABELS[account.kind] || account.kind,
                  )}</p></div>
                </div>
                <div><button class="icon-action" style="color:#fff" data-action="edit-account" data-id="${escapeAttr(
                  account.id,
                )}" aria-label="Chỉnh sửa tài khoản">✎</button><button class="icon-action danger" style="color:#fff" data-action="delete-account" data-id="${escapeAttr(
                  account.id,
                )}" aria-label="Xóa tài khoản">×</button></div>
              </div>
              <div class="account-card__balance-row">
                <b class="account-card__balance" data-balance="${escapeAttr(
                  money(accountBalance(account.id)),
                )}">*********</b>
                <button class="account-card__visibility" type="button" data-action="toggle-account-balance" aria-pressed="false" aria-label="Hiện số dư">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.4-5.2 9.2-5.2S21.2 12 21.2 12 17.8 17.2 12 17.2 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>
                </button>
              </div>
              <p class="account-card__caption"><span></span>Số dư khả dụng</p>
            </article>`,
          )
          .join("")
      : empty("Chưa có tài khoản tài chính.");

    $("#categoryManager").innerHTML = state.categories.length
      ? state.categories
          .filter((category) => !category.is_archived)
          .map(
            (
              category,
            ) => `<div class="category-manage-item" style="--cat:${escapeAttr(
              category.color || "#b8d94a",
            )}">
              <div class="category-manage-item__icon">${escapeHtml(
                category.name.slice(0, 1).toUpperCase(),
              )}</div>
              <div><b>${escapeHtml(category.name)}</b><span>${escapeHtml(
                NATURE_LABELS[category.default_nature],
              )} · ${escapeHtml(PRIORITY_LABELS[category.default_priority])}</span></div>
              <div><button class="icon-action" data-action="edit-category" data-id="${escapeAttr(
                category.id,
              )}">✎</button><button class="icon-action danger" data-action="delete-category" data-id="${escapeAttr(
                category.id,
              )}">×</button></div>
            </div>`,
          )
          .join("")
      : empty("Chưa có danh mục chi tiêu.");
  }

  function toggleAccountBalance(button) {
    const card = button.closest(".account-card");
    const balance = card?.querySelector(".account-card__balance");
    if (!balance) return;
    const isVisible = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isVisible));
    button.setAttribute("aria-label", isVisible ? "Hiện số dư" : "Ẩn số dư");
    balance.textContent = isVisible ? "*********" : balance.dataset.balance;
    card.classList.toggle("is-balance-visible", !isVisible);
  }

  async function saveAccount(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#accountId").value;
    const existing = findById(state.accounts, id);
    const body = ownerBody({
      name: $("#accountName").value.trim(),
      kind: $("#accountKind").value,
      opening_balance: parseMoney($("#accountOpeningBalance").value),
      color: $("#accountColor").value || "#1c1c24",
      icon: existing?.icon || "wallet",
      is_archived: existing?.is_archived || false,
      updated_at: new Date().toISOString(),
    });
    if (!body.name) {
      toast("Vui lòng nhập tên tài khoản.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("accounts", id, body);
      else await createRow("accounts", body);
      closeDialog($("#accountDialog"));
      toast(id ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản.");
      await loadAll();
    });
  }

  function editAccount(id) {
    const row = findById(state.accounts, id);
    if (!row) return;
    resetAccountForm();
    $("#accountId").value = row.id;
    $("#accountDialogTitle").textContent = "Chỉnh sửa tài khoản";
    $("#accountName").value = row.name || "";
    $("#accountKind").value = row.kind || "bank";
    $("#accountOpeningBalance").value = numberFormat(row.opening_balance);
    $("#accountColor").value = row.color || "#1c1c24";
    openDialog($("#accountDialog"));
  }

  function resetAccountForm() {
    $("#accountForm").reset();
    $("#accountId").value = "";
    $("#accountDialogTitle").textContent = "Tài khoản mới";
    $("#accountColor").value = "#1c1c24";
  }

  async function saveCategory(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = $("#categoryId").value;
    const existing = findById(state.categories, id);
    const body = ownerBody({
      name: $("#categoryName").value.trim(),
      default_nature: $("#categoryNature").value,
      default_priority: $("#categoryPriority").value,
      color: $("#categoryColor").value || "#b8d94a",
      icon: existing?.icon || "tag",
      is_archived: existing?.is_archived || false,
    });
    if (!body.name) {
      toast("Vui lòng nhập tên danh mục.", true);
      return;
    }
    await withSubmit(form, async () => {
      if (id) await updateRow("categories", id, body);
      else await createRow("categories", body);
      closeDialog($("#categoryDialog"));
      toast(id ? "Đã cập nhật danh mục." : "Đã tạo danh mục.");
      await loadAll();
    });
  }

  function editCategory(id) {
    const row = findById(state.categories, id);
    if (!row) return;
    resetCategoryForm();
    $("#categoryId").value = row.id;
    $("#categoryDialogTitle").textContent = "Chỉnh sửa danh mục";
    $("#categoryName").value = row.name || "";
    $("#categoryNature").value = row.default_nature || "variable";
    $("#categoryPriority").value = row.default_priority || "p2";
    $("#categoryColor").value = row.color || "#b8d94a";
    openDialog($("#categoryDialog"));
  }

  function resetCategoryForm() {
    $("#categoryForm").reset();
    $("#categoryId").value = "";
    $("#categoryDialogTitle").textContent = "Danh mục mới";
    $("#categoryNature").value = "variable";
    $("#categoryPriority").value = "p2";
    $("#categoryColor").value = "#b8d94a";
  }

  // -------------------------------------------------------------------------
  // Password
  // -------------------------------------------------------------------------

  async function savePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const current = $("#currentPassword").value;
    const next = $("#newPassword").value;
    const confirm = $("#confirmPassword").value;
    if (next.length < 8) {
      toast("Mật khẩu mới phải có ít nhất 8 ký tự.", true);
      return;
    }
    if (next !== confirm) {
      toast("Xác nhận mật khẩu chưa khớp.", true);
      return;
    }
    await withSubmit(form, async () => {
      try {
        await AppAuth.changePassword(current, next);
        alert("Đã đổi mật khẩu. Bạn cần đăng nhập lại.");
        location.replace("login.html");
      } catch (error) {
        const raw = String(error?.message || error);
        throw new Error(
          raw.includes("INVALID_CURRENT_PASSWORD")
            ? "Mật khẩu hiện tại không đúng."
            : raw,
        );
      }
    });
  }

  // -------------------------------------------------------------------------
  // Forecast math
  // -------------------------------------------------------------------------

  function forecastForRange(range, categoryId = null) {
    const today = startOfDay(new Date());
    const posted = state.transactions.filter(
      (row) =>
        row.status === "posted" &&
        row.type === "expense" &&
        (!categoryId || row.category_id === categoryId) &&
        inRange(parseDate(row.occurred_on), range.start, range.end),
    );
    const actual = sum(posted.map((row) => row.amount));
    const plannedRows = state.transactions.filter(
      (row) =>
        ["planned", "due"].includes(row.status) &&
        row.type === "expense" &&
        (!categoryId || row.category_id === categoryId) &&
        inRange(
          parseDate(row.occurred_on),
          maxDate(today, range.start),
          range.end,
        ),
    );
    const planned = sum(plannedRows.map((row) => row.amount));

    const existingKeys = new Set(
      state.transactions
        .filter((row) => row.recurring_rule_id)
        .map((row) => `${row.recurring_rule_id}|${row.occurred_on}`),
    );
    const recurring = sum(
      recurringOccurrences(maxDate(today, range.start), range.end)
        .filter(
          ({ rule, date }) =>
            rule.direction === "expense" &&
            (!categoryId || rule.category_id === categoryId) &&
            !existingKeys.has(`${rule.id}|${toYmd(date)}`),
        )
        .map(({ rule }) => rule.amount),
    );

    const historyStart = addDays(today, -56);
    const variableHistory = state.transactions.filter(
      (row) =>
        row.status === "posted" &&
        row.type === "expense" &&
        !row.recurring_rule_id &&
        ["variable", "semi_fixed"].includes(row.nature) &&
        (!categoryId || row.category_id === categoryId) &&
        inRange(parseDate(row.occurred_on), historyStart, addDays(today, -1)),
    );
    const dailyVariable = sum(variableHistory.map((row) => row.amount)) / 56;
    const remainingStart = maxDate(today, range.start);
    const remainingDays =
      remainingStart <= range.end ? dayDiff(remainingStart, range.end) + 1 : 0;
    const plannedVariable = sum(
      plannedRows
        .filter((row) => ["variable", "semi_fixed"].includes(row.nature))
        .map((row) => row.amount),
    );
    const variableEstimate = Math.max(
      0,
      dailyVariable * remainingDays - plannedVariable,
    );
    return {
      actual,
      planned,
      recurring,
      variableEstimate,
      total: actual + planned + recurring + variableEstimate,
    };
  }

  function futureCommitments(range) {
    const today = startOfDay(new Date());
    const start = maxDate(today, range.start);
    if (start > range.end) return { income: 0, expense: 0 };
    const rows = state.transactions.filter(
      (row) =>
        ["planned", "due"].includes(row.status) &&
        inRange(parseDate(row.occurred_on), start, range.end),
    );
    let income = sum(
      rows
        .filter((row) => ["income", "refund"].includes(row.type))
        .map((row) => row.amount),
    );
    let expense = sum(
      rows.filter((row) => row.type === "expense").map((row) => row.amount),
    );
    const existingKeys = new Set(
      state.transactions
        .filter((row) => row.recurring_rule_id)
        .map((row) => `${row.recurring_rule_id}|${row.occurred_on}`),
    );
    recurringOccurrences(start, range.end).forEach(({ rule, date }) => {
      if (existingKeys.has(`${rule.id}|${toYmd(date)}`)) return;
      if (rule.direction === "income") income += +rule.amount || 0;
      else expense += +rule.amount || 0;
    });
    return { income, expense };
  }

  function recurringOccurrences(from, to) {
    const result = [];
    state.recurring
      .filter((rule) => rule.is_active)
      .forEach((rule) => {
        let cursor = parseDate(rule.next_due_on || rule.start_on);
        let guard = 0;
        while (cursor <= to && guard++ < 500) {
          if (
            cursor >= from &&
            (!rule.end_on || cursor <= parseDate(rule.end_on))
          ) {
            result.push({ rule, date: new Date(cursor) });
          }
          cursor = nextOccurrence(rule, cursor);
        }
      });
    return result.sort((a, b) => a.date - b.date);
  }

  function nextOccurrence(rule, from) {
    const interval = Math.max(1, +rule.interval_count || 1);
    if (rule.frequency === "daily") return addDays(from, interval);
    if (rule.frequency === "weekly") return addDays(from, 7 * interval);
    if (rule.frequency === "quarterly")
      return addMonthsClamped(from, 3 * interval, rule.day_of_month);
    if (rule.frequency === "yearly")
      return addMonthsClamped(from, 12 * interval, rule.day_of_month);
    if (rule.frequency === "custom") return addDays(from, interval);
    return addMonthsClamped(from, interval, rule.day_of_month);
  }

  function transactionForRecurring(ruleId, date) {
    const ymd = toYmd(date);
    return state.transactions.find(
      (row) => row.recurring_rule_id === ruleId && row.occurred_on === ymd,
    );
  }

  function monthlyEquivalent(rule) {
    const amount = +rule.amount || 0;
    const interval = Math.max(1, +rule.interval_count || 1);
    if (rule.frequency === "daily") return (amount * 30.4375) / interval;
    if (rule.frequency === "weekly") return (amount * 4.345) / interval;
    if (rule.frequency === "quarterly") return amount / (3 * interval);
    if (rule.frequency === "yearly") return amount / (12 * interval);
    if (rule.frequency === "custom") return (amount * 30.4375) / interval;
    return amount / interval;
  }

  function monthlyBaseline() {
    const end = startOfDay(new Date());
    const start = addDays(end, -90);
    const rows = postedTransactions({ start, end });
    return {
      income:
        sum(
          rows
            .filter((row) => ["income", "refund"].includes(row.type))
            .map((row) => row.amount),
        ) / 3,
      expense:
        sum(
          rows.filter((row) => row.type === "expense").map((row) => row.amount),
        ) / 3,
    };
  }

  function plannedGoalReserve(period) {
    return sum(
      state.goals
        .filter((goal) => goal.status === "active")
        .map((goal) => {
          const amount = +goal.planned_contribution || 0;
          if (goal.contribution_frequency === "weekly") {
            return period === "day"
              ? amount / 7
              : period === "week"
                ? amount
                : period === "year"
                  ? amount * 52
                  : amount * 4.345;
          }
          if (goal.contribution_frequency === "monthly") {
            return period === "day"
              ? amount / 30.4375
              : period === "week"
                ? amount / 4.345
                : period === "year"
                  ? amount * 12
                  : amount;
          }
          return 0;
        }),
    );
  }

  // -------------------------------------------------------------------------
  // Balance math
  // -------------------------------------------------------------------------

  function accountBalance(accountId) {
    const account = findById(state.accounts, accountId);
    if (!account) return 0;
    let balance = +account.opening_balance || 0;
    state.transactions
      .filter((row) => row.status === "posted")
      .forEach((row) => {
        const amount = +row.amount || 0;
        if (row.type === "transfer") {
          if (row.account_id === accountId) balance -= amount;
          if (row.transfer_account_id === accountId) balance += amount;
        } else if (row.account_id === accountId) {
          if (row.type === "expense") balance -= amount;
          else balance += amount;
        }
      });
    balance -= sum(
      state.contributions
        .filter((row) => row.account_id === accountId)
        .map((row) => row.amount),
    );
    return balance;
  }

  function totalBalance() {
    return sum(
      state.accounts
        .filter((account) => !account.is_archived)
        .map((account) => accountBalance(account.id)),
    );
  }

  function postedTransactions(range) {
    return state.transactions.filter(
      (row) =>
        row.status === "posted" &&
        inRange(parseDate(row.occurred_on), range.start, range.end),
    );
  }

  function contributionTotal(range) {
    return sum(
      state.contributions
        .filter((row) =>
          inRange(parseDate(row.contributed_on), range.start, range.end),
        )
        .map((row) => row.amount),
    );
  }

  // -------------------------------------------------------------------------
  // Shared CRUD, dialogs and export
  // -------------------------------------------------------------------------

  async function deleteRow(key, id, question) {
    if (!confirm(question)) return;
    try {
      await removeRow(key, id);
      toast("Đã xóa dữ liệu.");
      await loadAll();
    } catch (error) {
      toast(readableApiError(error), true);
    }
  }

  function openCreateDialog(id) {
    const resetters = {
      transactionDialog: resetTransactionForm,
      quickTxDialog: resetQuickTxForm,
      recurringDialog: resetRecurringForm,
      budgetDialog: resetBudgetForm,
      goalDialog: resetGoalForm,
      debtDialog: resetDebtForm,
      wishlistDialog: resetWishlistForm,
      accountDialog: resetAccountForm,
      categoryDialog: resetCategoryForm,
      scenarioDialog: resetScenarioForm,
      passwordDialog: () => $("#passwordForm").reset(),
    };
    resetters[id]?.();
    openDialog($(`#${id}`));
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  async function withSubmit(form, task) {
    const submit = form.querySelector('[type="submit"]');
    const original = submit?.textContent;
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Đang lưu…";
    }
    try {
      await task();
    } catch (error) {
      console.error(error);
      toast(readableApiError(error), true);
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = original;
      }
    }
  }

  function exportTransactions() {
    const range = periodRange(state.period);
    const selectedDate = state.transactionDate
      ? parseDate(state.transactionDate)
      : null;
    const rows = state.transactions.filter((row) =>
      selectedDate
        ? inRange(parseDate(row.occurred_on), selectedDate, selectedDate)
        : inRange(parseDate(row.occurred_on), range.start, range.end),
    );
    const header = [
      "id",
      "name",
      "type",
      "amount",
      "date",
      "category",
      "account",
      "priority",
      "nature",
      "status",
      "merchant",
      "note",
    ];
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.name,
          row.type,
          row.amount,
          row.occurred_on,
          categoryName(row.category_id),
          accountName(row.account_id),
          row.priority,
          row.nature,
          row.status,
          row.merchant,
          row.note,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `finance_${state.transactionDate || state.period}_${todayYmd()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  function setDefaultDates() {
    state.transactionDate = todayYmd();
    $("#transactionFilterDate").value = state.transactionDate;
    $("#transactionDate").value = todayYmd();
    $("#recurringNextDue").value = todayYmd();
    $("#contributionDate").value = todayYmd();
  }

  function periodRange(period, date = new Date()) {
    const now = startOfDay(date);
    if (period === "day") {
      return { start: now, end: now };
    }
    if (period === "week" || period === "weekly") {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = addDays(now, mondayOffset);
      return { start, end: addDays(start, 6) };
    }
    if (period === "year") {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    }
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }

  function parseDate(value) {
    if (value instanceof Date) return startOfDay(value);
    const parts = String(value || "")
      .slice(0, 10)
      .split("-")
      .map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(NaN);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toYmd(date) {
    const d = startOfDay(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function todayYmd() {
    return toYmd(new Date());
  }

  function addDays(date, days) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return startOfDay(out);
  }

  function addMonthsClamped(date, months, preferredDay) {
    const day = clamp(+preferredDay || date.getDate(), 1, 31);
    const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(
      first.getFullYear(),
      first.getMonth() + 1,
      0,
    ).getDate();
    return new Date(
      first.getFullYear(),
      first.getMonth(),
      Math.min(day, lastDay),
    );
  }

  function minDate(a, b) {
    return a < b ? a : b;
  }

  function maxDate(a, b) {
    return a > b ? a : b;
  }

  function inRange(date, start, end) {
    return !Number.isNaN(+date) && date >= start && date <= end;
  }

  function dayDiff(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
  }

  function monthsBetween(from, to) {
    if (to <= from) return 1;
    const months =
      (to.getFullYear() - from.getFullYear()) * 12 +
      to.getMonth() -
      from.getMonth();
    return Math.max(1, months + (to.getDate() >= from.getDate() ? 1 : 0));
  }

  function daysLabel(date) {
    const diff = dayDiff(new Date(), date);
    if (diff < 0) return `quá hạn ${Math.abs(diff)} ngày`;
    if (diff === 0) return "hôm nay";
    if (diff === 1) return "ngày mai";
    return `còn ${diff} ngày`;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (Number.isNaN(+date)) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function money(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(+value || 0);
  }

  function moneyShort(value) {
    const number = +value || 0;
    if (Math.abs(number) >= 1_000_000_000)
      return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
    if (Math.abs(number) >= 1_000_000)
      return `${(number / 1_000_000).toFixed(1)} tr`;
    if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(0)}k`;
    return String(Math.round(number));
  }

  function numberFormat(value) {
    return +value
      ? new Intl.NumberFormat("vi-VN", {
          maximumFractionDigits: 0,
        }).format(+value)
      : "";
  }

  function parseMoney(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  function ownerBody(body) {
    return { owner_id: state.user.id, ...body };
  }

  function nullable(value) {
    return value === "" || value == null ? null : value;
  }

  function findById(rows, id) {
    return rows.find((row) => String(row.id) === String(id));
  }

  function categoryName(id) {
    return findById(state.categories, id)?.name || "Không phân loại";
  }

  function accountName(id) {
    return findById(state.accounts, id)?.name || "Không chọn tài khoản";
  }

  function typeLabel(type) {
    return (
      {
        income: "Thu nhập",
        expense: "Chi tiêu",
        transfer: "Chuyển khoản",
        refund: "Hoàn tiền",
      }[type] || type
    );
  }

  function groupAmount(rows, keyFn) {
    const map = new Map();
    rows.forEach((row) => {
      const key = keyFn(row);
      map.set(key, (map.get(key) || 0) + (+row.amount || 0));
    });
    return map;
  }

  function sum(values) {
    return values.reduce((total, value) => total + (+value || 0), 0);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function text(selector, value) {
    const el = $(selector);
    if (el) el.textContent = value;
  }

  function miniKpi(label, value) {
    return `<div class="mini-kpi"><span>${escapeHtml(label)}</span><b>${escapeHtml(
      value,
    )}</b></div>`;
  }

  function empty(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  let toastTimer = 0;
  function toast(message, error = false) {
    const el = $("#financeToast");
    el.textContent = message;
    el.classList.toggle("error", error);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
})();
