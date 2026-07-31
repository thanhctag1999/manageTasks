// Shared application settings. Load this file before each page's inline script.
const PROJECT_URL = "https://zuitnapveubnhjumvdnt.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aXRuYXB2ZXVibmhqdW12ZG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTcwMjEsImV4cCI6MjA3NTY5MzAyMX0.rjhf7gSNaATuKCuVBYBgVA8wmUisSyTcM25Qeexj5Gg";

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
