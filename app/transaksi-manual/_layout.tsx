import { Stack } from 'expo-router';

export default function TransaksiManualLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tambah" options={{ headerShown: false }} />
    </Stack>
  );
}
