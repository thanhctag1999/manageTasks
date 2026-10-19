# ManageTasks — Mobile + iOS Safari fixes

## Changes

- `mobile-fixes.css`: iPhone safe-area bottom navigation with labels, larger tap targets, compact topbar, mobile finance view navigation, responsive cards/tables/modals, input font-size 16px to prevent auto-zoom.
- `mobile-ui.js`: adds accessible captions to five navigation tabs without changing page data logic.
- `app-ui.js`: on touch devices use iOS/Android native `<select>` and date pickers instead of custom floating controls, which could be misplaced behind dialogs, Safari browser bars or the software keyboard. Desktop keeps the custom pickers. Popup dismissal on desktop now uses pointer events.
- Included on all HTML pages.

## Test on iPhone Safari

1. Open login and type username/password (no unexpected zoom).
2. Open tasks, filters and both date/category selectors, create/edit tasks.
3. Open finance → switch tabs → add transaction → pick category/date → save → close/reopen modal.
4. Scroll tables horizontally and the finance navigation tabs; check the bottom navigation stays fully tappable above the iPhone home indicator.
5. Test portrait/landscape, Safari's address bar expanded/collapsed and return via browser back/forward.

Serve via HTTP(S), not `file://`. For local testing run `python3 -m http.server 5500` from this folder. Real Supabase authentication and data access require your configured environment and cannot be tested offline.

## Additional reliability

- Original task-notification icons now show an explicit status message instead of silently doing nothing; the Finance due-notification button retains its original handler.
- The dashboard expand-chart button opens and closes an in-page full-screen chart, supported even when iOS Safari does not provide Element Fullscreen.
- `auth.js` authentication calls and `finance.js` data-list requests now abort after 18 seconds to prevent indefinite blocking by a stalled network request; original database behavior is unchanged when responses arrive normally.
- Finance switching no longer uses smooth scrolling on touch screens, avoiding taps being dropped during ongoing scrolling.

## Verification

- Syntax checks: `node --check` passed for all modified JavaScript files.
- Chromium mobile emulation: 320px, 375px and 844px landscape, plus desktop 1180px. Horizontal document overflow: none on pages inspected; all 5 bottom navigation hit targets passed `elementFromPoint` checks.
- Mobile native select, chart expansion, informational toast and Finance transaction modal close hit-target tests passed.
- The test used a stubbed environment: **real Apple Safari, Supabase APIs and actual data saves were not exercised**. Complete the manual iPhone checklist above after deployment.
