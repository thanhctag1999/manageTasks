// Shared application settings. Load this file before each page's inline script.
const PROJECT_URL = "";
const ANON_KEY = "";
const BASE = `${PROJECT_URL}/rest/v1`;
const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};
const HEADERS_JSON = {
  ...HEADERS,
  "Content-Type": "application/json",
};

const _VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
