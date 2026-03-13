import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ShopProvider } from '@/providers/ShopProvider';
import { colors } from '@/constants/theme';

function AppShell() {
  const { ready } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;
  }

  return (
    <ShopProvider>
      <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
          <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
          <Stack.Screen name="product/[slug]" options={{ title: 'Product' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} />
      </Stack>
      <StatusBar style="dark" />
    </ShopProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
