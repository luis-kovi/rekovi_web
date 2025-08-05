# Kanban Mobile – Native Android App

This directory contains a fresh Kotlin/Jetpack Compose Android project that will eventually replicate the mobile experience of the existing web application. **No files outside this folder are modified.**

## Prerequisites

* Android Studio Giraffe (2023.3.1) or newer
* Android SDK 34 (and build tools)
* JDK 17+

## Getting started

```bash
cd KanbanMobile
# Generate/upgrade Gradle wrapper (first-time only)
./gradlew wrapper --gradle-version 8.2.0 --distribution-type all

# Build the debug APK
./gradlew assembleDebug
```

Alternatively, open the `KanbanMobile` folder in Android Studio and press **Run ▶️**.

The app will launch with a simple **“Hello Kanban Mobile!”** screen. Use Jetpack Compose to craft the real UI, taking inspiration from the existing React components under `components/`.