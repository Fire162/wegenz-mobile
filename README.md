<div align="center">

# 📱 Wegenz Practice Mobile

**Pure Native React Native & Expo Mobile App for High-Speed JEE & NEET CBT Examination & Diagnostic Drills**

[![Build Android APK](https://github.com/Fire162/wegenz-mobile/actions/workflows/build-android.yml/badge.svg)](https://github.com/Fire162/wegenz-mobile/actions/workflows/build-android.yml)
[![Expo SDK 52](https://img.shields.io/badge/Expo-SDK%2052-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![React Native 0.76](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm 11](https://img.shields.io/badge/pnpm-11-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ⚡ Overview

**Wegenz Practice Mobile** is a lightning-fast, zero-lag React Native application built with **Expo SDK 52** and **Expo Router**. Designed specifically for intensive JEE & NEET competitive exam aspirants, it delivers a distraction-free Computer Based Test (CBT) environment with instant formula rendering, algorithmic mistake diagnostics, and persistent error journaling.

> [!TIP]
> Built as a **pure native application**—not a webview shell or browser iframe. All UI transitions, timer countdowns, navigation stacks, and gesture interactions run at native 60–120 FPS.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["📱 Native Mobile App (React Native + Expo)"]
        Nav["Expo Router v4 Stack & Tabs"]
        
        subgraph Screens ["Screens & Experiences"]
            Home["Selection Hub (JEE / NEET, Subjects, Chapter Multiselect)"]
            CBT["CBT Exam Room (Realtime Countdown, Palette Drawer, Quick-jump)"]
            Result["Diagnostic Results (Mistake Taxonomy, Economy, Prescriptions)"]
            Vault["Error Vault & Notebook (Questions Journal & Personal Notes)"]
            Saved["Saved Bookmarks (Formula Drill Launcher)"]
        end

        subgraph Engine ["Diagnostic & State Core"]
            DiagEngine["Weakness Diagnostic Engine & Heuristic Classifier"]
            MistakeStore["Zustand Mistake Store (AsyncStorage Persistence)"]
            BookmarkStore["Zustand Bookmark Store (AsyncStorage Persistence)"]
            KaTeX["Native KaTeX Formula Renderer (Auto-height)"]
        end
    end

    subgraph Backend ["☁️ Wegenz Cloud API (wegenz.in)"]
        SubjectsAPI["GET /api/subjects"]
        ChaptersAPI["GET /api/chapters"]
        QuestionsAPI["POST /api/random"]
    end

    Nav --> Screens
    Home --> CBT --> Result
    Result -->|Auto-Prescribe Drill| CBT
    CBT --> MistakeStore
    CBT --> BookmarkStore
    Result --> DiagEngine
    CBT --> KaTeX
    Home -->|x-api-key: arjunonfire| SubjectsAPI & ChaptersAPI & QuestionsAPI
```

---

## ✨ Core Highlights

<table>
<tr>
<td width="50%">

### ⏱️ Native CBT Examination Room
* Realtime countdown clock with low-time visual warnings.
* Full test palette drawer with live state tracking (Answered, Unanswered, Current).
* Native support for Single Choice, Multiple Choice, and Numerical value questions.
* Instant Exam Mode (unrevealed answers) vs Quiz Mode (instant solution reveal).

</td>
<td width="50%">

### 📐 Hardware-Accelerated KaTeX
* Native web-view isolation specifically for KaTeX mathematical and chemical rendering.
* Automated height synchronization prevents layout shifts.
* High-contrast theme adaptation matching AMOLED dark mode.

</td>
</tr>
<tr>
<td width="50%">

### 🧠 Weakness Diagnostic Engine
* Classifies exam errors into precise cognitive traps:
  * ⚡ `RUSHED_GUESS` (< 20s spent)
  * ⏳ `TIME_SINK` (> 180s spent)
  * 🧮 `CALCULATION_ERROR` (incorrect with long work)
  * 🪤 `CONCEPTUAL_TRAP` (rapid wrong guess)
* **Exam Time Economy metric**: computes true net points earned per minute (+4s vs -1s).
* **1-Tap Prescribed Drills**: Instantly generates focused practice sets for chapters below 60% accuracy.

</td>
<td width="50%">

### 📓 Error Vault & Takeaway Notes
* Persistent error log storing complete question statements, options, and explanations.
* In-app rich note editor allowing students to record personal takeaways and memory tricks.
* Chapter Mastery Radar showing live mistake density per syllabus topic.
* Offline persistence using `@react-native-async-storage/async-storage`.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

* **Framework**: React Native 0.76 & Expo SDK 52
* **Navigation**: Expo Router v4 (File-system based navigation)
* **State Management**: Zustand v5 with `@react-native-async-storage/async-storage`
* **Data Fetching**: `@tanstack/react-query` v5
* **Styling & Icons**: Custom dark/light design system with `@expo/vector-icons`
* **Haptics**: `expo-haptics` for tactile button feedback
* **CI / CD**: GitHub Actions with Temurin Java 21 & Gradle daemon automation

---

## 🚀 Getting Started

### Prerequisites

* Node.js `>= 20.x`
* pnpm `>= 9.x`

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Fire162/wegenz-mobile.git
   cd wegenz-mobile
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Verify TypeScript compilation**:
   ```bash
   pnpm run typecheck
   ```

4. **Start the Expo development server**:
   ```bash
   pnpm run start
   ```

> [!NOTE]
> Scan the QR code using the **Expo Go** app on your physical Android or iOS device to run the app immediately.

---

## ☁️ Cloud Compilation (Zero Local VPS Load)

No local Android SDK or heavy Gradle tools are needed on your development machine or VPS. The project includes an automated GitHub Actions cloud build pipeline:

```bash
# Push changes to main to trigger cloud build
git push origin main

# Or trigger manual APK build using GitHub CLI
gh workflow run build-android.yml
```

Once the build finishes on GitHub Actions, the compiled debug APK (`app-debug.apk`) is automatically uploaded as an Action Artifact, ready for 1-click download and direct sideloading on any Android device.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
