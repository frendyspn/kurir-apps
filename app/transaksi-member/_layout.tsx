import { Stack } from 'expo-router';

export default function TransaksiMemberLayout() {
  return (
    <Stack>
      {/* <GlassBackground /> */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
