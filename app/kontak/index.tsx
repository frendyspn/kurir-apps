import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiService } from '@/services/api';

export default function KontakScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [idKonsumen, setIdKonsumen] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | number | null>(null);

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

        return () => {
            backHandler.remove();
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [navigation]);

    // Search contacts with debouncing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim() === '') {
            setFilteredContacts(contacts);
            setSearchLoading(false);
        } else {
            setSearchLoading(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await apiService.searchKonsumen(searchQuery);
                    if (response.success && response.data) {
                        const searchResults = Array.isArray(response.data) ? response.data : 
                                            Array.isArray(response.data?.data) ? response.data.data : [];
                        setFilteredContacts(searchResults);
                    } else {
                        setFilteredContacts([]);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    setFilteredContacts([]);
                } finally {
                    setSearchLoading(false);
                }
            }, 1500); // Debounce 1.5 detik untuk menghindari too many requests
        }
    }, [searchQuery]);

    const fetchContacts = useCallback(async (id: string) => {
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
    }, []);

    // Refresh contacts when screen comes back into focus (after delete operation)
    useFocusEffect(
        useCallback(() => {
            if (idKonsumen) {
                console.log('Refreshing contacts list...');
                fetchContacts(idKonsumen);
            }
        }, [idKonsumen, fetchContacts])
    );

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.contactName}>{item.nama_lengkap}</Text>
                    {item.is_downline && <Ionicons name="person-add" size={14} color="#0097A7" />}
                </View>
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
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={() => router.push('/kontak/import')}
                        style={styles.importButton}
                    >
                        <Ionicons name="cloud-upload" size={18} color="#0097A7" />
                        <Text style={styles.importButtonText}>Import</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/kontak/tambah')}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={20} color="#0097A7" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari kontak..."
                        placeholderTextColor="#6c757d"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Search Loading Indicator */}
                {searchLoading && searchQuery.trim() !== '' && (
                    <View style={styles.searchingContainer}>
                        <ActivityIndicator size="small" color="#0097A7" />
                        <Text style={styles.searchingText}>Mencari kontak...</Text>
                    </View>
                )}

                {/* Contact List */}
                {filteredContacts.length === 0 && !loading && !searchLoading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people" size={64} color="#6c757d" />
                        <Text style={styles.emptyText}>
                            {searchQuery.trim() !== '' ? 'Kontak tidak ditemukan' : 'Tidak ada kontak'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery.trim() !== '' 
                                ? 'Coba kata kunci yang berbeda' 
                                : 'Belum ada kontak yang ditambahkan'
                            }
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item, index) => item.id_konsumen ? item.id_konsumen.toString() : `contact-${index}`}
                        renderItem={renderContactItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#0097A7']}
                                tintColor="#0097A7"
                            />
                        }
                    />
                )}

                {/* Bottom Spacing for Tab Bar */}
                {/* <View style={{ height: Math.max(insets.bottom, 20) + 120 }} /> */}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f8f9fa',
    },
    header: {
        // backgroundColor: '#0097A7',
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
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#ffffff',
    },
    importButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0097A7',
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
        marginBottom: 90,
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
    searchInput: {
        fontSize: 16,
        color: '#212529',
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
        color: '#0097A7',
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
    searchingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#e7f5f7',
        borderRadius: 8,
        marginBottom: 12,
    },
    searchingText: {
        fontSize: 14,
        color: '#0097A7',
        fontWeight: '500',
    },
});
