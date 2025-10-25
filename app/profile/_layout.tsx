import { Stack } from 'expo-router';

export default function ProfileLayout() {
    // Return an empty Stack so file-based child screens (profile.tsx) are registered
    // automatically by Expo Router while inheriting screenOptions.
    return <Stack screenOptions={{ headerShown: false }} />;
}
