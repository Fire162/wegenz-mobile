# Wegenz Practice Mobile - Agent Guide

This document serves as the architectural reference and development guide for AI coding agents (`agy`) working on the Wegenz Practice mobile application.

## Project Summary

* **Repository**: `Fire162/wegenz-mobile`
* **Package**: `in.wegenz.practice`
* **Stack**: React Native 0.76, Expo SDK 52, Expo Router v4, Zustand 5, TanStack Query v5, TypeScript 5.9
* **Package Manager**: pnpm 11
* **Primary Target**: Android (debug APK via GitHub Actions), iOS ready

## Key Architectural Principles

1. **Pure Native UI**:
   - Built with native React Native and Expo components.
   - Never embed whole web views or iframe wrappers for application UI.
   - Web view isolation (`react-native-webview`) is strictly reserved for the `<MathView />` KaTeX equation renderer.

2. **State & Offline Persistence**:
   - Zustand stores (`useMistakesStore`, `useBookmarksStore`) use `@react-native-async-storage/async-storage`.
   - All errors from tests, user notes, and bookmarks are persistently saved across restarts.

3. **Cloud Build Policy (Zero Heavy VPS Load)**:
   - **Never run `./gradlew` or local Android SDK builds on this host VPS**.
   - Cloud builds are handled automatically via GitHub Actions `.github/workflows/build-android.yml`.
   - Trigger manual cloud build: `gh workflow run build-android.yml`
   - Monitor runner: `gh run list --workflow=build-android.yml`

4. **API Integration**:
   - Base URL: `https://wegenz.in/api`
   - Header: `x-api-key: arjunonfire`
   - Endpoints:
     - `GET /subjects` (JEE / NEET subject taxonomy)
     - `GET /chapters` (Chapter hierarchy with subject mappings)
     - `POST /random` (Random question retrieval with filters)

5. **Diagnostic Engine (`src/lib/diagnostics.ts`)**:
   - Classifies student mistakes into heuristic categories:
     - `RUSHED_GUESS`: < 20 seconds spent
     - `TIME_SINK`: > 180 seconds spent
     - `CALCULATION_ERROR`: > 75 seconds spent on numerical/choice
     - `CONCEPTUAL_TRAP`: incorrect choice in normal window
   - Computes Time Economy (+4s net points / minute)
   - Recommends targeted practice sets for chapters with accuracy < 60%

## Verification Commands

* `pnpm run typecheck` (`tsc --noEmit`) - must always pass with 0 errors.
* `pnpm run start` - starts Expo metro bundler.
