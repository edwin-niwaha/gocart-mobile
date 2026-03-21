import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

function HeaderCartButton({ count }: { count: number }) {
  return (
    <Pressable onPress={() => router.push('/cart')} style={styles.headerCartBtn}>
      <Ionicons name="cart-outline" size={22} color={colors.text} />
      {count > 0 ? (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function HeaderTitle({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.logoBadge}>
        <Ionicons name={icon} size={16} color="#fff" />
      </View>

      <View>
        <Text style={styles.brandTitle}>{title}</Text>
        <Text style={styles.brandSlogan}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { cartItems = [], 
    orders = [], 
    totalOrders = 0,
    wishlistItems = [],
  } = useShop();

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const visibleOrdersCount = orders.length;
  const wishlistCount = wishlistItems.length;
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarActiveTintColor: colors.primary,
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
              subtitle="Everything you need, delivered"
            />
          ),
          headerRight: () => <HeaderCartButton count={cartCount} />,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          headerTitle: () => (
            <HeaderTitle
              icon="grid"
              title="Categories"
              subtitle="Browse by collection"
            />
          ),
          headerRight: () => <HeaderCartButton count={cartCount} />,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="th-large" color={color} size={size} />
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
              subtitle={`${
                cartCount === 0
                  ? 'Your cart is empty'
                  : `${cartCount} item${cartCount === 1 ? '' : 's'}`
              }`}
            />
          ),

          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <FontAwesome name="shopping-cart" color={color} size={size} />

              {cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerTitle: () => (
            <HeaderTitle
              icon="receipt"
              title="My Orders"
              subtitle={`${visibleOrdersCount} of ${totalOrders} order${
                totalOrders === 1 ? '' : 's'
              }`}
            />
          ),
          headerRight: () => <HeaderCartButton count={cartCount} />,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="shopping-bag" color={color} size={size} />
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
              title="My Wishlist"
              subtitle={`${
                wishlistCount === 0
                  ? 'No saved items'
                  : `${wishlistCount} saved item${
                      wishlistCount === 1 ? '' : 's'
                    }`
              }`}
            />
          ),

          headerRight: () => <HeaderCartButton count={cartCount} />,

          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <FontAwesome name="heart" color={color} size={size} />

              {wishlistCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => (
            <HeaderTitle
              icon="person"
              title="My Profile"
              subtitle="Account & preferences"
            />
          ),
          headerRight: () => <HeaderCartButton count={cartCount} />,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.2,
  },

  brandSlogan: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
    fontWeight: '500',
  },

  headerCartBtn: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  iconWrapper: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});