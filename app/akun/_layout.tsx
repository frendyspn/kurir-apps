import { Stack } from 'expo-router';

export default function AkunLayout() {
    // Return an empty Stack so file-based child screens (index.tsx) are registered
    // automatically by Expo Router while inheriting screenOptions.
    return <Stack screenOptions={{ headerShown: false }} />;
}
