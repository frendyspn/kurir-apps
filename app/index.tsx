import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from 'expo-router';
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
            const user = await AsyncStorage.getItem('userData');

            const result = await apiService.cekStatusSopir(user ? JSON.parse(user).no_hp : '');
            console.log('Cek status sopir result:', result);
            if (result.data.success) {

                if (result.data?.data?.aktif === 'N') {
                    console.log('Sopir tidak aktif, redirect ke kelengkapan data');

                    // Redirect ke screen kelengkapan data
                    setIsLoading(false);
                    router.replace({
                        pathname: '/auth/register/kelengkapan-data',
                        params: {
                            phone: user ? JSON.parse(user).no_hp : '',
                            data: result.data?.data ? JSON.stringify(result.data.data) : ''
                        }
                    });
                    return;
                }
            } else {
                await AsyncStorage.removeItem('userData');
                await AsyncStorage.removeItem('userToken');

                console.log('User logged out successfully');

                // Redirect ke login screen
                router.replace('/auth/login');
            }

            // console.log('User token:', token);
            // console.log('User data:', user);
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