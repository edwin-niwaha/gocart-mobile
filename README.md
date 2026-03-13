# GoCart Mobile Refactor

A simplified Expo Router ecommerce app with a working tab layout and fewer moving parts.

## Included
- Expo Router tabs
- product listing
- search and category filtering
- wishlist
- persistent cart with AsyncStorage
- checkout flow
- local order history
- product details screen

## Run
```bash
npm install
npx expo start
```

## Notes
- The app uses demo product data so it runs without a backend.
- Most legacy Redux/navigation files were left in place for reference, but the active app flow is under `app/`, `providers/`, `data/`, and `components/ui/`.
