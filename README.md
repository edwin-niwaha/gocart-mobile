# GoCart Mobile Production

Expo Router ecommerce mobile app connected to a Django backend at `/api/v1`.

## Included
- Expo Router tabs
- Django JWT auth with refresh-token interceptor
- Products + categories
- Wishlist synced to backend
- Cart synced to backend
- Checkout that creates orders and order-items from cart data
- Orders screen backed by Django
- Notifications screen backed by Django
- Login required to place and view orders

## Backend URL for your Android phone
Use this in `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.43.13:8000/api/v1
```

Start Django with:

```bash
python manage.py runserver 0.0.0.0:8000
```

## Install and run

```bash
npm install
npx expo start --clear
npx expo run:android
```


## Google sign-in
This build now supports Google login through your Django endpoint:
- `POST /auth/social/google/`

Add this to `.env`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
# optional for iOS builds
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
```

Important for Expo:
- Google sign-in uses `@react-native-google-signin/google-signin`.
- Expo's docs say this cannot run in Expo Go because it requires native code, so use a development build or EAS build for Android/iOS testing.
- After adding the dependency, rebuild the app.

Android steps:
1. Create a Google OAuth setup for your Android app and web client.
2. Set your package name in `app.json` if you want a different one than `com.gocart.mobile`.
3. Build a dev client: `npx expo prebuild --clean && npx expo run:android`
4. Add the returned Google `access_token` to your Django `/auth/social/google/` endpoint flow.

## Django assumptions
This app expects the same endpoints used by your Next.js app:
- `POST /auth/login/`
- `POST /auth/register/`
- `GET /auth/me/`
- `POST /auth/logout/`
- `POST /auth/token/refresh/`
- `GET/POST /cart/`
- `GET/POST/PATCH/DELETE /cart-items/`
- `GET/POST /wishlist/`
- `GET/POST/DELETE /wishlist-items/`
- `GET/POST /orders/`
- `POST /order-items/`
- `GET /products/`
- `GET /categories/`
- `GET /notifications/`

## Production-grade upgrades already wired
- centralized API client
- token persistence with AsyncStorage
- automatic access-token refresh
- protected actions for cart, wishlist, checkout, and orders
- environment-based base URL
- modular services and providers

## Recommended next backend steps
- connect addresses during checkout
- connect shipping methods and shipments
- connect coupon validation before placing order
- connect payments endpoint before marking orders paid
- add push notifications from Django for status updates
