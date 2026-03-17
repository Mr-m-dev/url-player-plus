# URL Player+

  A professional dark-themed media player for iOS and Android built with Expo React Native.

  ## Features

  - Play **Video** (MP4, MKV, WebM, HLS, DASH streams)
  - Play **Audio** (MP3, AAC, M4A, FLAC, WAV, OGG)
  - View **Images** (JPG, PNG, GIF, WebP, SVG)
  - View **PDFs** via browser
  - View **Text** files (TXT, JSON, XML, CSV, MD, code files)
  - **History** & **Favorites** with AsyncStorage persistence
  - **Download** media to device
  - **Share** media via system share sheet
  - Fully dark theme: #101010 background, #141414 card elements

  ## Tech Stack

  - Expo / React Native (managed workflow)
  - expo-av for video/audio
  - expo-file-system, expo-media-library for downloads
  - expo-sharing for share functionality
  - AsyncStorage for persistence

  ## CI/CD

  Automatic builds via GitHub Actions:
  - **Android APK & AAB**: Signed release build with custom keystore
  - **iOS IPA**: Via Expo Application Services (EAS Build)

  See [.github/workflows/](.github/workflows/) for build configurations.

  ## Setup

  ```bash
  pnpm install
  pnpm --filter @workspace/url-player run dev
  ```
  