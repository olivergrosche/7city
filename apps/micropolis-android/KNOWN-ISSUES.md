# 7CITY — Known Issues & Roadmap

Status: v1.3.1 (versionCode 5) uploaded to Google Play internal testing on
23.07.2026 — includes the black-screen hardening (canvas renderer forced on
native Android, loading overlay) and targetSdk 36.
App ID: `io.super7.sevencity`. This tracks rough edges found during initial
development and ideas for later — nothing here blocks the current release.

## Where we left off (resume here)

Working tree, `main`-equivalent branch `mobile-app` and the Play build are all
in sync: **the repo state equals what is live as v1.3.1 (versionCode 5)**, so no
AAB is pending upload.

**Blocked on:** tester feedback for v1.3.1 from the Pixel 9 Pro reporter.

- If the black screen is **gone** → the WebGPU path was the culprit; close the
  issue and consider whether to re-enable WebGPU only behind a device check.
- If it **persists** → ask the three diagnostic questions below before changing
  code, then continue debugging with those answers.

**Deliberately not shipped:** R8 (see Build configuration notes) — kept off so
v1.3.1 remains a single-variable test. Do not re-enable it while the black
screen is unresolved.

**Next candidates once unblocked** (rough priority): sound wiring or hiding the
dead Sound toggle · maps-close / back-button overlap · scenario win/lose flow
verification · gesture onboarding.

## Known issues (bugs / rough edges)

- ~~Toolbar icons not distinctive enough~~ — **fixed**: icons are now composed
  from the original Micropolis tile atlas (`scripts/make-tool-icons.py`), so
  each tool shows the real game artwork; query and bulldozer are hand-drawn
  pixel art in the same palette because no game tile depicts them.
- ~~Cannot bulldoze single tiles of a residential zone~~ — **fixed** in
  `tool.cpp`: tiles 240..260 (empty "R" frame and small single houses) without
  ZONEBIT clear individually; grown high-rises (261+), hospitals, churches,
  commercial and industrial are unchanged. This resolves the upstream
  `@bug Sometimes we can delete parts of a residential zone, but not always`.

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

## Build configuration notes

- **R8 is deliberately OFF.** It was implemented and verified on device
  (APK 16.2 MB -> 14.1 MB; start screen, new city, slot save/load, cold-start
  restore and save-to-file all worked), then rolled back before shipping:
  v1.3.1 went out to fix an unreproducible black screen and the tester had not
  reported back yet. Adding R8 on top would have made a second, release-only
  failure mode indistinguishable from the original bug. One variable at a time.
  `proguard-rules.pro` keeps the verified Capacitor keep rules dormant — to
  re-enable, set `minifyEnabled true` + `shrinkResources true` and switch to
  `proguard-android-optimize.txt`.
- Note on expectations: Play advertises faster startup / less memory from R8,
  but that applies to the Java/Kotlin shell. 7CITY is JS + WASM in assets, which
  R8 never touches — startup is dominated by WASM boot, so the realistic win is
  download size, not runtime.
- **targetSdk/compileSdk 36** is in place since v1.3.1 (Play requirement from
  Aug 2026) and stays regardless of the R8 decision.

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
