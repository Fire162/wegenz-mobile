# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-10-21 19:56 IST

### Fixed
* Added root `react-native.config.js` to explicitly route Expo Android autolinking to `expo.modules.ExpoModulesPackage`, preventing stale fallback generation.

## [1.0.1] - 2026-10-21 19:38 IST

### Fixed
* Explicitly hoisted `expo-modules-core` and configured `.npmrc` with `shamefully-hoist=true` to resolve Android autolinking compilation error (`cannot find symbol: import expo.core.ExpoModulesPackage`).

## [1.0.0] - 2026-10-21 19:20 IST

### Added
* Native React Native & Expo SDK 52 mobile application for Wegenz Practice (`in.wegenz.practice`).
* Complete CBT examination room with live countdown timer, palette drawer, question jumping, and option selection.
* Single choice, multiple choice, and numerical integer question answer inputs with validation.
* Hardware-accelerated isolated KaTeX renderer component with automatic height adjustment and dark theme support.
* Diagnostic Weakness Engine with automated mistake taxonomy classification (`RUSHED_GUESS`, `TIME_SINK`, `CALCULATION_ERROR`, `CONCEPTUAL_TRAP`).
* Examination Time Economy metric (+4s vs -1s) and auto-prescribed fresh weakness drills targeting weak chapters.
* Error Vault & Notebook with Questions Journal, personal takeaway notes inline editor, and Chapter Mastery Radar.
* Bookmarks hub with local persistence using `@react-native-async-storage/async-storage` and Zustand.
* Automated GitHub Actions Android Debug APK build workflow (`build-android.yml`) compiling APKs in the cloud without loading VPS CPU/RAM.
