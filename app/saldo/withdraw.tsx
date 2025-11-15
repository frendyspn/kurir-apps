import DropdownInput from '@/components/dropdown-input';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BankMethod {
    id_bank?: string;
    nama_bank: string;
    kode_bank?: string;
}

export default function WithdrawScreen() {
    const insets = useSafeAreaInsets();
    const [amount, setAmount] = useState('');
    const [selectedBankId, setSelectedBankId] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankMethods, setBankMethods] = useState<BankMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch bank methods on component mount
    const fetchBankMethods = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getBankList();

            if (response.success && response.data) {
                setBankMethods(Array.isArray(response.data) ? response.data : []);
            } else {
                Alert.alert('Error', response.message || 'Gagal memuat daftar bank');
            }
        } catch (error) {
            console.error('Error fetching bank list:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memuat daftar bank');
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
    const handleBankSelect = useCallback((bankId: string) => {
        setSelectedBankId(bankId);
        // For bank list, we don't auto-fill account details
        // User needs to input manually
    }, []);

    // Handle submit withdraw request
    const handleSubmit = useCallback(async () => {
        if (!amount || parseInt(amount) < 50000) {
            Alert.alert('Error', 'Minimal withdraw Rp 50.000');
            return;
        }

        if (!selectedBankId) {
            Alert.alert('Error', 'Silakan pilih bank tujuan');
            return;
        }

        if (!accountName.trim()) {
            Alert.alert('Error', 'Nama rekening tidak boleh kosong');
            return;
        }

        if (!accountNumber.trim()) {
            Alert.alert('Error', 'Nomor rekening tidak boleh kosong');
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
            const selectedBank = bankMethods.find(bank => bank.id_bank === selectedBankId);
            const response = await apiService.createWithdrawRequest({
                no_hp: user.no_hp,
                amount: amount,
                bank_name: selectedBank?.nama_bank || 'Bank Manual',
                account_name: accountName.trim(),
                account_number: accountNumber.trim(),
                bank_id: selectedBank?.id_bank || null,
            });

            if (response.success && response.data) {
                Alert.alert(
                    'Berhasil',
                    'Permintaan withdraw berhasil diajukan. Admin akan memproses dalam 1-2 hari kerja.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate back to saldo screen
                                router.replace('/(tabs)/saldo');
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.message || 'Gagal membuat request withdraw');
            }
        } catch (error) {
            console.error('Error creating withdraw request:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat membuat request withdraw');
        } finally {
            setSubmitting(false);
        }
    }, [amount, selectedBankId, accountName, accountNumber, bankMethods]);

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
                <Text style={styles.title}>Withdraw Saldo</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Amount Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nominal Withdraw</Text>
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
                    <Text style={styles.minimumAmount}>Minimal withdraw Rp 50.000</Text>
                </View>

                {/* Bank Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pilih Bank Tujuan</Text>

                    {/* Bank Dropdown */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0097A7" />
                            <Text style={styles.loadingText}>Memuat daftar bank...</Text>
                        </View>
                    ) : (
                        <DropdownInput
                            label="Pilih Bank"
                            value={selectedBankId}
                            onChange={handleBankSelect}
                            options={bankMethods.map(bank => ({
                                label: bank.nama_bank,
                                value: bank.id_bank || bank.nama_bank
                            }))}
                            placeholder="Pilih bank tujuan"
                            disabled={!bankMethods.length}
                        />
                    )}
                </View>

                {/* Account Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detail Rekening</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nama Rekening</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Masukkan nama rekening"
                            value={accountName}
                            onChangeText={setAccountName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nomor Rekening</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Masukkan nomor rekening"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="numeric"
                            maxLength={20}
                        />
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Informasi Withdraw</Text>
                    <Text style={styles.infoText}>
                        • Withdraw akan diproses admin{'\n'}
                        • Pastikan data rekening sudah benar{'\n'}
                        • Biaya admin akan dipotong dari nominal withdraw
                    </Text>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: Platform.OS === 'android' ? Math.max(insets.bottom, 20) + 180 : insets.bottom + 120 }} />
            </ScrollView>

            {/* Submit Button */}
            <SafeAreaView style={styles.submitSafeArea}>
                <View style={styles.submitContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!amount || !selectedBankId || !accountName.trim() || !accountNumber.trim() || submitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!amount || !selectedBankId || !accountName.trim() || !accountNumber.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Ajukan Withdraw</Text>
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
        backgroundColor: '#0097A7',
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
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#212529',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    infoCard: {
        backgroundColor: '#e7f1ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0097A7',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#0097A7',
        lineHeight: 20,
    },
    submitSafeArea: {
        backgroundColor: '#ffffff',
    },
    submitContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
    },
    submitButton: {
        backgroundColor: '#0097A7',
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
