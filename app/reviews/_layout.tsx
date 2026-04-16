import { Stack } from 'expo-router';

export default function ReviewsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[slug]"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="write/[slug]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}