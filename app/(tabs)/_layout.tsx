import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['left', 'right']}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#0d6efd',
                    tabBarInactiveTintColor: '#8e8e93',
                    headerShown: false,
                    tabBarButton: HapticTab,
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 8,
                        backgroundColor: '#ffffff',
                        borderTopWidth: 1,
                        borderTopColor: '#e5e5e5',
                        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 0,
                        paddingTop: 8,
                        height: Platform.OS === 'android' ? 60 + Math.max(insets.bottom, 8) : 60,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                    },
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'History',
                        tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} />,
                    }}
                />


                
            </Tabs>
        </SafeAreaView>
    );
}
