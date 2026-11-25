#!/usr/bin/env bash
# Clears stale CMake outputs when libworklets.so paths disagree across modules
# (common after adding react-native-reanimated / worklets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

rm -rf \
  android/app/.cxx android/app/build android/build \
  node_modules/react-native-worklets/android/.cxx \
  node_modules/react-native-worklets/android/build \
  node_modules/react-native-gesture-handler/android/.cxx \
  node_modules/react-native-gesture-handler/android/build \
  node_modules/react-native-reanimated/android/.cxx \
  node_modules/react-native-reanimated/android/build \
  node_modules/expo-modules-core/android/.cxx \
  node_modules/react-native-screens/android/.cxx

(cd android && ./gradlew clean --no-build-cache)
echo "Native CMake caches cleared. Run: npx expo run:android"