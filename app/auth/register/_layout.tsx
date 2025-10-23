import { Stack } from 'expo-router';

export default function RegisterLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen 
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen 
                name="detail"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen 
                name="otp"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
