import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '@/services/api';

export default function KontakScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [idKonsumen, setIdKonsumen] = useState<string>('');

    useEffect(() => {
        const initializeData = async () => {
            try {
                // Get id_konsumen from AsyncStorage
                const storedIdStr = await AsyncStorage.getItem('userData');
                if (storedIdStr) {
                    const storedId = JSON.parse(storedIdStr);
                    setIdKonsumen(storedId.id_konsumen);
                    // Fetch contacts from API
                    await fetchContacts(storedId.id_konsumen);
                } else {
                    Alert.alert('Error', 'ID Konsumen tidak ditemukan. Silakan login kembali.');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing data:', error);
                Alert.alert('Error', 'Gagal memuat data');
                setLoading(false);
            }
        };

        initializeData();

        // Force hide header
        navigation.setOptions({
            headerShown: false,
            header: () => null,
            headerTitle: '',
            headerBackVisible: false,
        });

        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [navigation]);

    const fetchContacts = async (id: string) => {
        try {
            setLoading(true);
            const response = await apiService.getKonsumen(id);
            
            if (response.success && response.data) {
                // Assuming the API returns an array of contacts
                // You may need to adjust this based on the actual API response structure
                const contactsData = Array.isArray(response.data?.data) ? response.data.data : [];
                setContacts(contactsData);
            } else {
                console.log('No contacts data or API error:', response.message);
                // Set empty array if no data
                setContacts([]);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // Set empty array on error
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        if (!idKonsumen) return;
        
        setRefreshing(true);
        await fetchContacts(idKonsumen);
        setRefreshing(false);
    };

    const handleContactPress = (contact: any) => {
        router.push({
            pathname: '/kontak/detail',
            params: { contact: JSON.stringify(contact) }
        });
    };

    const renderContactItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.contactItem} onPress={() => handleContactPress(item)}>
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.nama_lengkap}</Text>
                <Text style={styles.contactPhone}>{item.no_hp}</Text>
                <Text style={styles.contactDescription}>{item.alamat_lengkap}</Text>
            </View>
            <TouchableOpacity style={styles.arrowButton}>
                <Ionicons name="chevron-forward" size={20} color="#6c757d" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header Custom */}
            <View style={styles.header}>
                <Text style={styles.logo}>Kontak</Text>
                <TouchableOpacity
                    onPress={() => router.push('/kontak/tambah')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={20} color="#0d6efd" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Search Bar Placeholder */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Cari kontak...</Text>
                </View>

                {/* Contact List */}
                {contacts.length === 0 && !loading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people" size={64} color="#6c757d" />
                        <Text style={styles.emptyText}>Tidak ada kontak</Text>
                        <Text style={styles.emptySubtext}>Belum ada kontak yang ditambahkan</Text>
                    </View>
                ) : (
                    <FlatList
                        data={contacts}
                        keyExtractor={(item, index) => item.id_konsumen ? item.id_konsumen.toString() : `contact-${index}`}
                        renderItem={renderContactItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#0d6efd']}
                                tintColor="#0d6efd"
                            />
                        }
                    />
                )}

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Math.max(insets.bottom, 20) + 20 }} />
            </View>
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
        textAlign: 'center',
        flex: 1,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    searchContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchPlaceholder: {
        fontSize: 16,
        color: '#6c757d',
        flex: 1,
    },
    listContainer: {
        paddingBottom: 20,
    },
    contactItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        color: '#0d6efd',
        fontWeight: '500',
        marginBottom: 2,
    },
    contactDescription: {
        fontSize: 12,
        color: '#6c757d',
    },
    arrowButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6c757d',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
});
