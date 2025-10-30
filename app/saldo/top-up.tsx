import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BankMethod {
    id_rekening: string;
    nama_bank: string;
    no_rekening: string;
    pemilik_rekening: string;
}

export default function TopUpScreen() {
    const insets = useSafeAreaInsets();
    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState<BankMethod | null>(null);
    const [bankMethods, setBankMethods] = useState<BankMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch bank methods on component mount
    const fetchBankMethods = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getTopUpMethods();

            if (response.success && response.data) {
                setBankMethods(Array.isArray(response.data) ? response.data : []);
            } else {
                Alert.alert('Error', response.message || 'Gagal memuat metode pembayaran');
            }
        } catch (error) {
            console.error('Error fetching bank methods:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memuat metode pembayaran');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBankMethods();
    }, [fetchBankMethods]);

    // Handle hardware back button
    useEffect(() => {
        const backAction = () => {
            router.back();
            return true; // Prevent default behavior (exit app)
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, []);

    // Handle amount input formatting
    const handleAmountChange = useCallback((text: string) => {
        // Remove non-numeric characters
        const numericValue = text.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    }, []);

    // Format amount for display
    const formatAmount = useCallback((value: string) => {
        if (!value) return '';
        const number = parseInt(value);
        return `Rp ${number.toLocaleString('id-ID')}`;
    }, []);

    // Handle bank selection
    const handleBankSelect = useCallback((bank: BankMethod) => {
        setSelectedBank(bank);
    }, []);

    // Handle submit top up request
    const handleSubmit = useCallback(async () => {
        if (!amount || parseInt(amount) < 10000) {
            Alert.alert('Error', 'Minimal top up Rp 10.000');
            return;
        }

        if (!selectedBank) {
            Alert.alert('Error', 'Silakan pilih metode pembayaran');
            return;
        }

        try {
            setSubmitting(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);
            const response = await apiService.createTopUpRequest({
                no_hp: user.no_hp,
                amount: amount,
                bank_id: selectedBank.id_rekening,
            });

            if (response.success && response.data) {
                // Navigate to confirm screen with top up data
                router.push({
                    pathname: '/saldo/confirm-top-up',
                    params: {
                        topUpId: response.data.id || response.data.top_up_id,
                        amount: amount,
                        bankName: selectedBank.nama_bank,
                        accountNumber: selectedBank.no_rekening,
                        accountName: selectedBank.pemilik_rekening,
                    },
                });
            } else {
                Alert.alert('Error', response.message || 'Gagal membuat request top up');
            }
        } catch (error) {
            console.error('Error creating top up request:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat membuat request top up');
        } finally {
            setSubmitting(false);
        }
    }, [amount, selectedBank]);

    // Render bank method item
    const renderBankMethod = useCallback(({ item }: { item: BankMethod }) => (
        <TouchableOpacity
            style={[
                styles.bankMethodItem,
                selectedBank?.id_rekening === item.id_rekening && styles.selectedBankMethod
            ]}
            onPress={() => handleBankSelect(item)}
        >
            <View style={styles.bankMethodInfo}>
                <Text style={styles.bankName}>{item.nama_bank}</Text>
                <Text style={styles.accountInfo}>
                    {item.no_rekening} - {item.pemilik_rekening}
                </Text>
            </View>
            {selectedBank?.id_rekening === item.id_rekening && (
                <Ionicons name="checkmark-circle" size={24} color="#0d6efd" />
            )}
        </TouchableOpacity>
    ), [selectedBank, handleBankSelect]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.title}>Top Up Saldo</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Amount Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nominal Top Up</Text>
                    <View style={styles.amountInputContainer}>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="Masukkan nominal"
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        {amount && (
                            <Text style={styles.amountDisplay}>
                                {formatAmount(amount)}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.minimumAmount}>Minimal top up Rp 10.000</Text>
                </View>

                {/* Bank Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0d6efd" />
                            <Text style={styles.loadingText}>Memuat metode pembayaran...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={bankMethods}
                            keyExtractor={(item) => item.id_rekening}
                            renderItem={renderBankMethod}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Tidak ada metode pembayaran tersedia</Text>
                            }
                        />
                    )}
                </View>

                {/* Bottom spacing */}
                <View style={{ height: Platform.OS === 'android' ? 20 : 20 }} />
            </ScrollView>

            {/* Submit Button */}
            <SafeAreaView style={styles.submitSafeArea}>
                <View style={styles.submitContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!amount || !selectedBank || submitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!amount || !selectedBank || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Lanjutkan</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
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
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 12,
    },
    amountInputContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    amountInput: {
        fontSize: 18,
        color: '#212529',
        paddingVertical: 8,
    },
    amountDisplay: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 4,
    },
    minimumAmount: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 8,
        textAlign: 'right',
    },
    bankMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedBankMethod: {
        borderColor: '#0d6efd',
        borderWidth: 2,
    },
    bankMethodInfo: {
        flex: 1,
    },
    bankName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    accountInfo: {
        fontSize: 14,
        color: '#6c757d',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#6c757d',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6c757d',
        fontSize: 14,
        marginTop: 20,
        marginBottom: 20,
    },
    submitContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
    },
    submitSafeArea: {
        backgroundColor: '#ffffff',
    },
    submitButton: {
        backgroundColor: '#0d6efd',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
