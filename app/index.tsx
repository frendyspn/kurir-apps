import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            // TODO: Check if user is logged in from AsyncStorage
            const token = await AsyncStorage.getItem('userToken');
            console.log('User token:', token);
            setIsLoggedIn(!!token);
            // setIsLoggedIn(false);
        } catch (error) {
            console.error('Error checking login status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return null; // Atau bisa return splash screen
    }

    return <Redirect href={isLoggedIn ? '/(tabs)' : '/auth/login'} />;
}