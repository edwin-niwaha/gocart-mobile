import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton, HeaderTitle } from '@/components/AppHeader';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function TabIcon({
  name,
  color,
  size,
  count = 0,
  focused = false,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  count?: number;
  focused?: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name} color={color} size={size} />
      <TabBadge count={count} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const {
    cartItems = [],
    orders = [],
    totalOrders = 0,
    wishlistItems = [],
  } = useShop();

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const wishlistCount = wishlistItems.length;
  const visibleOrdersCount = orders.length;
  const tabBarBottom = Math.max(insets.bottom, spacing.md);

  const cartButton = () => (
    <HeaderIconButton
      icon="cart-outline"
      badgeCount={cartCount}
      accessibilityLabel="Open cart"
      onPress={() => router.push('/cart')}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerStyle: styles.header,
        headerBackgroundContainerStyle: styles.headerBackground,
        tabBarActiveTintColor: colors.surface,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [styles.tabBar, { bottom: tabBarBottom }],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveBackgroundColor: colors.primary,
        tabBarInactiveBackgroundColor: colors.surface,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => (
            <HeaderTitle
              icon="bag-handle"
              title="GoCart"
              subtitle="Fresh picks and fast checkout"
              tone="primary"
            />
          ),
          headerRight: cartButton,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Category',
          headerTitle: () => (
            <HeaderTitle
              icon="grid"
              title="Categories"
              subtitle="Browse smart collections"
              tone="accent"
            />
          ),
          headerRight: cartButton,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerTitle: () => (
            <HeaderTitle
              icon="cart"
              title="My Cart"
              subtitle={
                cartCount === 0
                  ? 'Ready for your next find'
                  : `${cartCount} item${cartCount === 1 ? '' : 's'} selected`
              }
              tone="dark"
            />
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'cart' : 'cart-outline'}
              color={color}
              size={size}
              count={cartCount}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Order',
          headerTitle: () => (
            <HeaderTitle
              icon="receipt"
              title="My Orders"
              subtitle={`${visibleOrdersCount} of ${totalOrders} order${
                totalOrders === 1 ? '' : 's'
              }`}
              tone="primary"
            />
          ),
          headerRight: cartButton,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          headerTitle: () => (
            <HeaderTitle
              icon="heart"
              title="Wishlist"
              subtitle={
                wishlistCount === 0
                  ? 'Save products you love'
                  : `${wishlistCount} saved item${
                      wishlistCount === 1 ? '' : 's'
                    }`
              }
              tone="accent"
            />
          ),
          headerRight: cartButton,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              size={size}
              count={wishlistCount}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="me"
        options={{
          title: 'Profile',
          headerTitle: () => (
            <HeaderTitle
              icon="person"
              title="Profile"
              subtitle="Account and preferences"
              tone="dark"
            />
          ),
          headerRight: cartButton,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 94,
    backgroundColor: colors.background,
  },
  headerBackground: {
    backgroundColor: colors.background,
  },
  tabBar: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    height: 74,
    paddingHorizontal: 6,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 0,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  tabBarItem: {
    marginHorizontal: 2,
    borderRadius: radii.md,
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 1,
    lineHeight: 12,
  },
  iconWrapper: {
    width: 38,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ translateY: -2 }],
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '900',
  },
});
