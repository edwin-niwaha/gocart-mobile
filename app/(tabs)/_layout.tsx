import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <FontAwesome name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color, size }) => <FontAwesome name="th-large" color={color} size={size} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color, size }) => <FontAwesome name="heart" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color, size }) => <FontAwesome name="shopping-cart" color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <FontAwesome name="shopping-bag" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <FontAwesome name="user" color={color} size={size} /> }} />
    </Tabs>
  );
}
