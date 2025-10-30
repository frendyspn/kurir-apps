import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import KendaraanModal from './kendaraan-modal';
import ProfileModal from './profile-modal';

function AkunScreen() {
    const insets = useSafeAreaInsets();
    const [userData, setUserData] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showKendaraanModal, setShowKendaraanModal] = useState(false);

    // Fetch user data from AsyncStorage
    const fetchUserData = async () => {
        const data = await AsyncStorage.getItem('userData');
        console.log('Fetched user data:', data);
        if (data) {
            const parsedData = JSON.parse(data);
            setUserData(parsedData);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    // Handle profile save callback
    const handleProfileSave = useCallback((data: any) => {
        // Refresh user data from AsyncStorage
        fetchUserData();
    }, []);

    // Handle menu press
    const handleMenuPress = useCallback((item: any) => {
        item.action();
    }, []);

    // Get user badge based on user data
    const getUserBadge = useCallback(() => {
        if (userData?.agen === '1') return { text: 'Agen', color: '#28a745' };
        if (userData?.koordinator_kota === '1') return { text: 'Koordinator Kota', color: '#007bff' };
        if (userData?.koordinator_kecamatan === '1') return { text: 'Koordinator Kecamatan', color: '#6f42c1' };
        return null;
    }, [userData]);

    // Menu items for account screen
    const menuItems = [
        { id: 1, name: 'Profile', icon: 'person-outline', action: () => setShowProfileModal(true) },
        { id: 2, name: 'Kendaraan', icon: 'car-outline', action: () => setShowKendaraanModal(true) },
        { id: 3, name: 'Logout', icon: 'log-out-outline', action: () => router.push('/auth/logout') },
    ];

    return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ProfileModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} onSave={handleProfileSave} />
                <KendaraanModal visible={showKendaraanModal} onClose={() => setShowKendaraanModal(false)} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton} accessibilityLabel="Back">
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                    <Text style={{ position: 'absolute', opacity: 0 }}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.logo}>Akun</Text>

                <View style={styles.headerRight}>
                    {/* Empty for balance */}
                    <View style={{ width: 24 }} />
                </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content}>
                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.userAvatar}>
                        {userData?.foto ? (
                            <Image
                                source={{ uri: userData.foto }}
                                style={{ width: 60, height: 60, borderRadius: 30 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="person" size={40} color="#0d6efd" />
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData?.nama_lengkap || 'Nama Lengkap'}</Text>
                        <Text style={styles.userPhone}>{userData?.no_hp || 'No HP'}</Text>
                        {getUserBadge() && (
                            <View style={[styles.userBadge, { backgroundColor: getUserBadge()?.color }]}>
                                <Text style={styles.userBadgeText}>{getUserBadge()?.text}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.menuItem}
                            onPress={() => handleMenuPress(item)}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={24} color="#0d6efd" />
                            </View>
                            <Text style={styles.menuText}>{item.name}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Math.max(insets.bottom, 20) + 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0d6efd',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    userCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#6c757d',
    },
    userBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    userBadgeText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '600',
    },
    menuContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#212529',
        fontWeight: '500',
    },
});

export default memo(AkunScreen);
