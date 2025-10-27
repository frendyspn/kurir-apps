import { Stack } from 'expo-router';

export default function KontakLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      header: () => null,
      headerTitle: '',
      headerBackVisible: false,
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          header: () => null,
          headerTitle: '',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          headerShown: false,
          header: () => null,
          headerTitle: '',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="tambah"
        options={{
          headerShown: false,
          header: () => null,
          headerTitle: '',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
