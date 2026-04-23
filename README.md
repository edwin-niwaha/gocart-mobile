# GoCart Mobile

![Build Status](https://img.shields.io/badge/build-no%20CI-lightgrey)
![Release Check](https://img.shields.io/badge/release%20check-configured-2ea44f)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-not%20specified-lightgrey)

GoCart Mobile is a production-oriented e-commerce application built with React Native, Expo, Expo Router, and TypeScript. It connects to the GoCart backend over REST for authentication, catalog browsing, wishlist and cart management, checkout, orders, payments, reviews, addresses, and notifications.

The project uses Expo's native workflow for mobile builds, supports environment-based configuration, and includes release validation checks for safer deployments.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Build and Release Notes](#build-and-release-notes)
- [Project Structure](#project-structure)
- [Backend Expectations](#backend-expectations)
- [Contributing](#contributing)
- [License](#license)

## Features

- Email/password authentication with token persistence and automatic access-token refresh.
- Google sign-in support through native OAuth client configuration.
- Product catalog browsing with categories and product detail routes.
- Wishlist and cart flows backed by the GoCart API.
- Checkout, address management, order history, and payment initiation flows.
- Notifications, reviews, account management, legal, and support screens.
- Expo Router file-based navigation with typed routes enabled.
- Environment validation for staging and production builds.

## Tech Stack

- React Native `0.81`
- Expo SDK `54`
- Expo Router for navigation
- TypeScript for type safety
- Axios for API communication
- Context providers for authentication and shop state
- EAS Build profiles for development, staging, and production

## Getting Started

### Prerequisites

Install the following before running the app locally:

- Node.js 20 LTS or a current Expo-compatible LTS release
- npm 10+
- Android Studio with Android SDK and an emulator or physical Android device
- Java 17 for local Android builds
- Xcode and CocoaPods for local iOS builds on macOS

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the template:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. Update `.env` with real API and OAuth values for your environment.

4. If your Android build relies on Firebase configuration and `google-services.json` is not already present locally, place it in the project root before building.

### Run the App

#### Android

Start an emulator or connect a device, then run:

```bash
npm run android
```

Use this path when you want a native Android build with the current Expo configuration.

#### iOS

Local iOS builds require macOS. This repository does not currently include a generated `ios/` folder, so create it locally first:

```bash
npx expo prebuild -p ios
npx pod-install
npm run ios
```

If you are developing on Windows or Linux, use EAS Build for iOS instead of a local device build.

#### Expo Dev Server

If you only want the Metro and Expo development server:

```bash
npm run start
```

#### Web Preview

```bash
npm run web
```

### Local Backend Tip

When testing against a backend running on your machine from a physical Android device, use your machine's LAN IP instead of `localhost`:

```env
EXPO_PUBLIC_API_BASE_URL=http://<your-local-ip>:8000/api/v1
```

Make sure the backend is reachable on the network, for example by running it on `0.0.0.0`.

## Environment Configuration

All runtime configuration in this app uses `EXPO_PUBLIC_*` variables. These values are bundled into the client, so do not place private server secrets in these variables.

### Environment Loading Order

The release validation script resolves configuration in this order:

1. `.env`
2. `.env.<profile>`
3. `.env.local`
4. `.env.<profile>.local`
5. shell environment variables

### Required Variables

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Absolute backend API base URL, such as `https://api.example.com/api/v1`. |
| `EXPO_PUBLIC_TENANT_SLUG` | Yes | Tenant identifier sent with API requests in the `X-Tenant-Slug` header. |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Recommended | Request timeout in milliseconds. Defaults to `15000`. |
| `EXPO_PUBLIC_APP_VERSION` | Recommended | Version string sent to the backend in the `X-App-Version` header. |
| `EXPO_PUBLIC_APP_ENV` | Recommended | Active environment name, such as `development`, `staging`, or `production`. |
| `EXPO_PUBLIC_ALLOW_INSECURE_API` | Optional | Set to `true` only for temporary internal builds that must use non-HTTPS API endpoints. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Yes for Google auth | Google OAuth web client ID. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Yes for Google auth | Google OAuth Android client ID. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Yes for Google auth | Google OAuth iOS client ID. |
| `EXPO_PUBLIC_APP_NAME` | Recommended | Display name used for environment-aligned app metadata. |
| `EXPO_PUBLIC_APP_SLUG` | Recommended | App slug for Expo/EAS workflows. |
| `EXPO_PUBLIC_APP_SCHEME` | Recommended | Deep-link and OAuth redirect scheme. This project uses `gocartmobile`. |
| `EXPO_PUBLIC_ANDROID_PACKAGE` | Recommended | Android application ID. |
| `EXPO_PUBLIC_IOS_BUNDLE_ID` | Recommended | iOS bundle identifier. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Recommended for EAS | Required when linking the project to EAS Build and submission workflows. |

### Example

The repository already includes `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
EXPO_PUBLIC_TENANT_SLUG=gocart
EXPO_PUBLIC_API_TIMEOUT_MS=15000
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_ALLOW_INSECURE_API=false
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_APP_NAME=GoCart
EXPO_PUBLIC_APP_SLUG=gocart-mobile
EXPO_PUBLIC_APP_SCHEME=gocartmobile
EXPO_PUBLIC_ANDROID_PACKAGE=com.gocart.mobile
EXPO_PUBLIC_IOS_BUNDLE_ID=com.gocart.mobile
EXPO_PUBLIC_EAS_PROJECT_ID=
```

### Google Sign-In Note

Google authentication in this project relies on native modules and OAuth client IDs. Use a development build or EAS build for Android and iOS testing. Expo Go is not suitable for validating the full native Google sign-in flow.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run start` | Start the Expo development server. |
| `npm run android` | Build and launch the app on Android using Expo's native workflow. |
| `npm run ios` | Build and launch the app on iOS using Expo's native workflow. |
| `npm run web` | Start the web preview. |
| `npm run lint` | Run ESLint across the project. |
| `npm run typecheck` | Run the TypeScript compiler without emitting files. |
| `npm run config:check` | Print and validate the public Expo config. |
| `npm run doctor` | Check Expo dependency compatibility. |
| `npm run validate:env -- --profile production` | Validate release environment values for a selected profile. |
| `npm run release:check` | Run the full release gate: environment validation, typecheck, lint, Expo config validation, and doctor checks. |

Note: a unit or end-to-end test suite is not currently configured in `package.json`, so the main automated quality gates in this repository are linting, typechecking, Expo config validation, and release checks.

## Build and Release Notes

The project includes EAS profiles in [`eas.json`](./eas.json):

- `development`: internal development client builds
- `staging`: internal APK distribution with `EXPO_PUBLIC_APP_ENV=staging`
- `production`: production builds with automatic version incrementing

Recommended release workflow:

1. Populate the correct environment variables for the target profile.
2. Run `npm run release:check`.
3. Build with the appropriate EAS profile.
4. Submit the validated artifact to the relevant store or internal distribution channel.

## Project Structure

```text
gocart-mobile/
|- app/              Expo Router screens, route groups, and navigation layouts
|- api/              Axios client setup and backend service wrappers
|- assets/           Icons, splash assets, images, and other static files
|- components/       Reusable UI components
|- constants/        Shared constants such as theme configuration
|- docs/             Project documentation and supporting notes
|- hooks/            Custom hooks for auth and protected flows
|- providers/        Application-level state and context providers
|- scripts/          Utility scripts, including release environment validation
|- types/            Shared TypeScript models and contracts
|- utils/            Helpers for formatting, logging, storage, push, and toast logic
|- android/          Native Android project generated for Expo native builds
|- app.json          Expo app configuration
|- eas.json          EAS build and submit profiles
|- .env.example      Environment variable template
|- package.json      Scripts and dependency definitions
```

An `ios/` directory is generated locally when you run `npx expo prebuild -p ios`.

## Backend Expectations

This mobile client expects a GoCart-compatible backend exposed through `EXPO_PUBLIC_API_BASE_URL`. The current service layer integrates with API domains such as:

- authentication and profile management
- Google social login
- products and categories
- cart and wishlist
- addresses
- checkout, orders, and order items
- payments
- reviews and ratings
- notifications
- newsletter subscriptions

If you change backend endpoints or payload shapes, update the service layer in `api/`, the shared types in `types/`, and any related UI flows.

## Contributing

Contributions are easiest to review when they are small, focused, and validated locally.

1. Create a feature branch from the latest mainline branch.
2. Keep secrets and environment-specific files out of source control.
3. Update `.env.example`, documentation, and route or API references when configuration changes.
4. Run `npm run lint` and `npm run typecheck` before opening a pull request.
5. Run `npm run release:check` for changes that affect environment variables, Expo config, dependencies, or release behavior.
6. Include screenshots or short recordings for user-facing UI changes when possible.
7. Summarize testing performed and any rollout considerations in the pull request description.

## License

This repository does not currently include a `LICENSE` file. Until one is added, coordinate with the maintainers before reusing, redistributing, or publishing the code outside its intended environment.
