# Mobile Release Checklist

## Before building
- [ ] `npm install` completed successfully
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run doctor`
- [ ] `.env.staging` or `.env.production` populated
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the correct backend
- [ ] `EXPO_PUBLIC_TENANT_SLUG` is correct for the branded build
- [ ] Android package and iOS bundle ID are correct
- [ ] Push credentials configured in Expo/EAS

## Build validation
- [ ] `eas build --platform android --profile staging`
- [ ] install APK/AAB on a real device
- [ ] login works
- [ ] tenant branding loads
- [ ] product list and checkout work
- [ ] push token registers successfully
- [ ] notification receipt verified on a real device

## Production release
- [ ] create production build
- [ ] upload to Play Store/App Store Connect
- [ ] verify store listing assets and privacy links
- [ ] verify legal URLs and support URLs from tenant settings
