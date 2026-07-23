# 7CITY — Known Issues & Roadmap

Status: v1.3.1 (versionCode 5) uploaded to Google Play internal testing on
23.07.2026 — includes the black-screen hardening (canvas renderer forced on
native Android, loading overlay) and targetSdk 36.
App ID: `io.super7.sevencity`. This tracks rough edges found during initial
development and ideas for later — nothing here blocks the current release.

## Known issues (bugs / rough edges)

- **Tester report (Pixel 9 Pro, v1.2): black screen after restart, no map.**
  Not reproducible on emulator (cold start / force-stop+load / background
  process kill all fine, release build). v1.3 hardens the two prime suspects:
  WebGPU forced off on native Android, and a loading overlay so slow engine
  boots no longer look like a black screen. Awaiting tester feedback on v1.3;
  if it persists, request: full-screen vs map-only black, Android System
  WebView version, and whether it happens on fresh start too.

- **Maps window close button overlaps the game back button** (both top-right).
  The ✕ works, but the fixed PlayBackButton (higher z-index) sits on top. Move
  or restyle one so they don't collide.
- ~~10 s WASM init shows a blank map~~ — **fixed in v1.3**: loading overlay
  (spinner + localized text) covers the map until the engine is ready.
- **Sound does nothing yet.** The engine fires `makeSound` callbacks that we
  ignore; the Options "Sound" toggle is a no-op. Either wire up audio or hide
  the toggle until it's implemented.
- **Power blink only animates while the sim ticks.** When paused, render() isn't
  called, so unpowered zones stop blinking. Minor; classic behavior is looser.
- **Auto-goto can land on water/edge** (e.g. monster spawns at the map border),
  showing an empty area. Consider clamping the target toward built tiles.
- **Landscape verified but lightly tested.** Works (left tool rail, wide maps);
  not exercised across many aspect ratios / notches.
- **Tablet layout not deeply tested.** Store screenshots exist; real tablet
  play-testing pending.

## Not-yet-wired capabilities

- **Haptics plugin** is bundled but only used for the build-mode buzz. Could add
  feedback for bulldoze, disasters, invalid placement.
- **Scenario win/lose flow** — engine has scoreType/scoreWait and
  SCENARIO_WON / SCENARIO_LOST messages (translated), but the end-to-end outcome
  UX hasn't been verified. Confirm a scenario actually resolves and shows the
  result.

## Ideas for later

- Gesture onboarding / short tutorial overlay (pan, pinch, hold-to-build).
- WebGPU renderer activates automatically once Android WebView ships WebGPU
  (chain is already webgpu → canvas). The legacy WebGL path renders black and is
  intentionally skipped; fixing it is a separate project.
- Freeland & Las Vegas scenarios (SNES-only, not in the open-source engine) —
  would need custom `.cty` maps to recreate.
- iOS build — Capacitor makes this largely free from the same codebase.
- Fix the maps-close / back-button overlap as part of a broader landscape polish
  pass.

## Upstream-worthy fixes (candidates for a PR to SimHacker/MicropolisCore)

- Prerender `/play/*` routes (fixes the 404/500 on static hosting / the live
  micropolisweb.com deep links).
- The new emscripten bindings (loadScenario, save, overlay map accessors,
  makeMonster/makeTornado) and the software-renderer power blink.
