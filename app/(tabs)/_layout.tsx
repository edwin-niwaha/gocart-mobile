import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

export default function TabLayout() {
  const { cartItems } = useShop();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="bag-handle" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>GoCart</Text>
                <Text style={styles.brandSlogan}>
                  Everything you need, delivered
                </Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/cart')}
              style={styles.headerCartBtn}
            >
              <Ionicons name="cart-outline" size={22} color={colors.text} />
              {cartCount > 0 ? (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ),
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
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="grid" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>Categories</Text>
                <Text style={styles.brandSlogan}>Browse by collection</Text>
              </View>
            </View>
          ),
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
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="cart" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>My Cart</Text>
                <Text style={styles.brandSlogan}>
                  Ready for checkout
                </Text>
              </View>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <FontAwesome name="shopping-cart" color={color} size={size} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerTitle: () => (
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="receipt" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>My Orders</Text>
                <Text style={styles.brandSlogan}>Track your purchases</Text>
              </View>
            </View>
          ),
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
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="heart" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>Wishlist</Text>
                <Text style={styles.brandSlogan}>
                  Saved for later
                </Text>
              </View>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="heart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => (
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>

              <View>
                <Text style={styles.brandTitle}>My Profile</Text>
                <Text style={styles.brandSlogan}>
                  Account & preferences
                </Text>
              </View>
            </View>
          ),
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