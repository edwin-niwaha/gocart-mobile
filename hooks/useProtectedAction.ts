import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export function useProtectedAction() {
  const { isAuthenticated } = useAuth();

  return (action: () => void | Promise<void>) => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please log in to use this feature.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    return action();
  };
}
