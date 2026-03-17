# URL Player+

  A professional dark-themed media player app built with Expo React Native.

  ## Features
  - 🎬 Play **video, audio, images, PDFs, and text files** via URL
  - 📜 **History** – tracks recently played media
  - ❤️ **Favorites** – save your favorite media URLs
  - ⬇️ **Download** – save media to device storage
  - 🔗 **Share** – share media URLs easily
  - 🌙 Beautiful **dark theme** (#101010 background)

  ## Tech Stack
  - [Expo](https://expo.dev) (React Native)
  - Expo AV for video/audio playback
  - AsyncStorage for persistence
  - Expo Router for navigation

  ## Getting Started

  ```bash
  npm install
  npx expo start
  ```

  ## Building

  ### Android
  ```bash
  npx expo run:android
  ```

  ### iOS
  ```bash
  npx expo run:ios
  ```

  ## CI/CD

  This repo includes GitHub Actions workflows for building:
  - **Android**: Signed APK + AAB (add secrets to GitHub repo settings)
  - **iOS**: IPA via EAS Build

  See `.github/workflows/` for configuration.
  