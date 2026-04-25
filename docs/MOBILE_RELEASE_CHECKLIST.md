# Mobile Release Checklist

## Before building
- [ ] `npm install` completed successfully
- [ ] `npm run release:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run doctor`
- [ ] `.env.staging` or `.env.production` populated
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the correct HTTPS backend
- [ ] `EXPO_PUBLIC_TENANT_SLUG` is correct for the branded build
- [ ] Google OAuth client IDs are set for web, Android, and iOS
- [ ] Android package and iOS bundle ID are correct
- [ ] `google-services.json` is supplied to EAS as a secret file or generated during build
- [ ] Push credentials configured in Expo/EAS
- [ ] Verify SecureStore token migration on an existing logged-in device

## Build validation
- [ ] `eas build --platform android --profile staging`
- [ ] `eas build --platform ios --profile staging`
- [ ] install APK/AAB on a real device
- [ ] login works
- [ ] Google login works on a release build
- [ ] tenant branding loads
- [ ] product list, cart, checkout, cash payment, and MTN payment work
- [ ] support/contact submission works
- [ ] push token registers successfully
- [ ] notification receipt verified on a real device

## Production release
- [ ] `eas build --platform all --profile production`
- [ ] create production build
- [ ] upload to Play Store/App Store Connect
- [ ] verify store listing assets and privacy links
- [ ] verify legal URLs and support URLs from tenant settings
