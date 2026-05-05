import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ShopProvider } from '@/providers/ShopProvider';
import { HeaderTitle } from '@/components/AppHeader';
import { colors } from '@/constants/theme';
import Toast from 'react-native-toast-message';

function AppShell() {
  const { ready } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;
  }

  return (
    <ShopProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.ink,
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/login"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="log-in"
                  title="Welcome back"
                  subtitle="Sign in to continue"
                  tone="primary"
                />
              ),
            }}
          />
          <Stack.Screen
            name="auth/register"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="person-add"
                  title="Create account"
                  subtitle="Start shopping smarter"
                  tone="accent"
                />
              ),
            }}
          />
          <Stack.Screen
            name="product/[slug]"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="pricetag"
                  title="Product"
                  subtitle="Details and variants"
                  tone="dark"
                />
              ),
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="shield-checkmark"
                  title="Checkout"
                  subtitle="Delivery and payment"
                  tone="primary"
                />
              ),
            }}
          />
          <Stack.Screen
            name="notifications/index"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="notifications"
                  title="Notifications"
                  subtitle="Orders, offers, and updates"
                  tone="accent"
                />
              ),
            }}
          />
          <Stack.Screen
            name="account/notifications"
            options={{
              headerTitle: () => (
                <HeaderTitle
                  icon="mail"
                  title="Email Updates"
                  subtitle="Choose what to receive"
                  tone="primary"
                />
              ),
            }}
          />
      </Stack>
      <StatusBar style="dark" />
    </ShopProvider>
  );
}

export default function RootLayout() {
  return (
    <>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
    <Toast />
    </>
  );
}
