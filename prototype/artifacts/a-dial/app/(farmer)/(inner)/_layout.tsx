import React from 'react';
import { Stack } from 'expo-router';

export default function FarmerInnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="add-product" />
      <Stack.Screen name="edit-product" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
