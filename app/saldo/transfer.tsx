import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransferScreen() {
    const insets = useSafeAreaInsets();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [receiverData, setReceiverData] = useState<{
        nama_lengkap: string;
        no_hp: string;
    } | null>(null);

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

    // Handle phone number input formatting
    const handlePhoneNumberChange = useCallback((text: string) => {
        // Remove non-numeric characters
        const numericValue = text.replace(/[^0-9]/g, '');
        // Limit to 15 digits (Indonesian phone number max length)
        setPhoneNumber(numericValue.substring(0, 15));
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

    // Format phone number for display
    const formatPhoneNumber = useCallback((value: string) => {
        if (!value) return '';
        // Format as Indonesian phone number
        if (value.startsWith('0')) {
            return value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim();
        } else if (value.startsWith('62')) {
            return value.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '+$1 $2 $3 $4').trim();
        }
        return value;
    }, []);

    // Handle submit transfer request (after confirmation)
    const handleSubmit = useCallback(async () => {
        if (!receiverData) {
            Alert.alert('Error', 'Data penerima tidak ditemukan');
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
            const response = await apiService.createTransferRequest({
                no_hp_sender: user.no_hp,
                no_hp_receiver: phoneNumber.trim(),
                amount: amount,
            });

            if (response.success && response.data) {
                Alert.alert(
                    'Berhasil',
                    'Transfer berhasil dilakukan.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate back to saldo tab
                                router.replace('/(tabs)/saldo');
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.message || 'Gagal melakukan transfer');
            }
        } catch (error) {
            console.error('Error creating transfer request:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat melakukan transfer');
        } finally {
            setSubmitting(false);
            setShowConfirmModal(false);
        }
    }, [phoneNumber, amount, receiverData]);

    // Handle check user and show confirmation
    const handleCheckUser = useCallback(async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Nomor HP tujuan tidak boleh kosong');
            return;
        }

        if (phoneNumber.length < 10) {
            Alert.alert('Error', 'Nomor HP tidak valid');
            return;
        }

        if (!amount || parseInt(amount) < 10000) {
            Alert.alert('Error', 'Minimal transfer Rp 10.000');
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.checkUserByPhone(phoneNumber.trim());

            if (response.success && response.data) {
                setReceiverData(response.data?.data);
                setShowConfirmModal(true);
            } else {
                Alert.alert('Error', response.message || 'User dengan nomor HP tersebut tidak ditemukan');
            }
        } catch (error) {
            console.error('Error checking user:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memeriksa user');
        } finally {
            setLoading(false);
        }
    }, [phoneNumber, amount]);

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
                <Text style={styles.title}>Transfer Saldo</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Phone Number Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nomor HP Tujuan</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Masukkan nomor HP tujuan"
                            value={phoneNumber}
                            onChangeText={handlePhoneNumberChange}
                            keyboardType="phone-pad"
                            maxLength={15}
                        />
                        {phoneNumber && (
                            <Text style={styles.inputDisplay}>
                                {formatPhoneNumber(phoneNumber)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nominal Transfer</Text>
                    <View style={styles.amountInputContainer}>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="Masukkan nominal transfer"
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
                    <Text style={styles.minimumAmount}>Minimal transfer Rp 10.000</Text>
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Informasi Transfer</Text>
                    <Text style={styles.infoText}>
                        • Transfer akan diproses secara real-time{'\n'}
                        • Pastikan nomor HP tujuan sudah benar{'\n'}
                        • Biaya admin akan dipotong dari nominal transfer
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
                            (!phoneNumber.trim() || !amount || loading) && styles.submitButtonDisabled
                        ]}
                        onPress={handleCheckUser}
                        disabled={!phoneNumber.trim() || !amount || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Transfer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Confirmation Modal */}
            {showConfirmModal && receiverData && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Konfirmasi Transfer</Text>
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                disabled={submitting}
                            >
                                <Ionicons name="close" size={24} color="#6c757d" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Receiver Info */}
                            <View style={styles.receiverInfo}>
                                <View style={styles.receiverIcon}>
                                    <Ionicons name="person-circle" size={40} color="#0097A7" />
                                </View>
                                <View style={styles.receiverDetails}>
                                    <Text style={styles.receiverName}>{receiverData.nama_lengkap}</Text>
                                    <Text style={styles.receiverPhone}>{formatPhoneNumber(receiverData.no_hp)}</Text>
                                </View>
                            </View>

                            {/* Transfer Details */}
                            <View style={styles.transferDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Nominal Transfer</Text>
                                    <Text style={styles.detailValue}>{formatAmount(amount)}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Biaya Admin</Text>
                                    <Text style={styles.detailValue}>Rp 0</Text>
                                </View>
                                <View style={[styles.detailRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>{formatAmount(amount)}</Text>
                                </View>
                            </View>

                            {/* Warning */}
                            <View style={styles.warningCard}>
                                <Ionicons name="warning" size={20} color="#ffc107" />
                                <Text style={styles.warningText}>
                                    Pastikan data penerima sudah benar. Transfer tidak dapat dibatalkan.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowConfirmModal(false)}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Lanjutkan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
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
    inputContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    textInput: {
        fontSize: 16,
        color: '#212529',
        paddingVertical: 8,
    },
    inputDisplay: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 4,
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
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        margin: 20,
        maxHeight: '80%',
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
    },
    modalBody: {
        padding: 20,
    },
    receiverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    receiverIcon: {
        marginRight: 12,
    },
    receiverDetails: {
        flex: 1,
    },
    receiverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    receiverPhone: {
        fontSize: 14,
        color: '#6c757d',
    },
    transferDetails: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    detailValue: {
        fontSize: 14,
        color: '#212529',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0097A7',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffeaa7',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#856404',
        marginLeft: 8,
        lineHeight: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#0097A7',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
