/*
 * Copy this file to setting.js and replace the two placeholders.
 * Keep setting.js out of public repositories.
 */
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const BASE = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};
const HEADERS_JSON = {
  ...HEADERS,
  "Content-Type": "application/json",
};
