import GlassBackground from '@/components/glass-background';
import { Stack } from 'expo-router';

export default function TransaksiManualLayout() {
  return (
    <Stack>
      <GlassBackground />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tambah" options={{ headerShown: false }} />
    </Stack>
  );
}
