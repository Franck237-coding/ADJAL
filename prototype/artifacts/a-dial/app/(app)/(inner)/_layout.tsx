import React from 'react';
import { Stack } from 'expo-router';

export default function AppInnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="cart" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
