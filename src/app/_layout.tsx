import { Stack } from 'expo-router';
import React from 'react';
import { ToastProvider } from 'react-native-toast-notifications';
import AuthProvider from '../providers/auth-provider';

export default function RootLayout() {

    return (
        <ToastProvider>
            <AuthProvider>
                <Stack>
                    <Stack.Screen
                        name='(shop)'
                        options={{ headerShown: false, title: 'Go Cart' }}
                    />
                    <Stack.Screen
                        name='categories'
                        options={{ headerShown: true, title: 'Categories' }}
                    />
                    <Stack.Screen
                        name='product'
                        options={{ headerShown: false, title: 'Product' }}
                    />
                    <Stack.Screen
                        name='cart'
                        options={{
                            presentation: 'modal',
                            title: 'Shopping Cart',
                        }}
                    />
                    <Stack.Screen name='auth'
                        options={{ headerShown: false, title: 'Authentication' }}
                    />
                </Stack>
            </AuthProvider>
        </ToastProvider>
    );
}