import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfirmTopUpScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [buktiTransfer, setBuktiTransfer] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const topUpId = params.topUpId as string;
    const amount = params.amount as string;
    const bankName = params.bankName as string;
    const accountNumber = params.accountNumber as string;
    const accountName = params.accountName as string;

    // Handle hardware back button
    React.useEffect(() => {
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

    // Handle image picker
    const handlePickImage = useCallback(async () => {
        try {
            // Request permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission needed', 'Permission to access camera roll is required!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setBuktiTransfer(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Gagal memilih gambar');
        }
    }, []);

    // Handle upload bukti transfer
    const handleUploadBukti = useCallback(async () => {
        if (!buktiTransfer) {
            Alert.alert('Error', 'Silakan pilih bukti transfer terlebih dahulu');
            return;
        }

        try {
            setUploading(true);
            const response = await apiService.uploadTopUpProof({
                top_up_id: topUpId,
                bukti_transfer_uri: buktiTransfer,
            });

            if (response.success) {
                Alert.alert(
                    'Berhasil',
                    'Bukti transfer berhasil diupload. Top up Anda sedang diproses.',
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
                Alert.alert('Error', response.message || 'Gagal upload bukti transfer');
            }
        } catch (error) {
            console.error('Error uploading bukti transfer:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat upload bukti transfer');
        } finally {
            setUploading(false);
        }
    }, [buktiTransfer, topUpId]);

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
                <Text style={styles.title}>Konfirmasi Top Up</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Top Up Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Informasi Top Up</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nominal</Text>
                        <Text style={styles.infoValue}>
                            Rp {parseInt(amount).toLocaleString('id-ID')}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bank Tujuan</Text>
                        <Text style={styles.infoValue}>{bankName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>No. Rekening</Text>
                        <Text style={styles.infoValue}>{accountNumber}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Atas Nama</Text>
                        <Text style={styles.infoValue}>{accountName}</Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionCard}>
                    <Text style={styles.instructionTitle}>Petunjuk Transfer</Text>
                    <Text style={styles.instructionText}>
                        1. Transfer sesuai nominal yang tertera ke rekening tujuan{'\n'}
                        2. Pastikan nominal transfer sesuai persis{'\n'}
                        3. Upload bukti transfer dalam format gambar{'\n'}
                        4. Tunggu konfirmasi dari admin (1-2 hari kerja)
                    </Text>
                </View>

                {/* Upload Bukti Transfer */}
                <View style={styles.uploadSection}>
                    <Text style={styles.uploadTitle}>Upload Bukti Transfer</Text>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handlePickImage}
                    >
                        {buktiTransfer ? (
                            <Image
                                source={{ uri: buktiTransfer }}
                                style={styles.uploadedImage}
                            />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="camera" size={48} color="#6c757d" />
                                <Text style={styles.uploadText}>Pilih Gambar</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {buktiTransfer && (
                        <TouchableOpacity
                            style={styles.changeImageButton}
                            onPress={handlePickImage}
                        >
                            <Text style={styles.changeImageText}>Ganti Gambar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom spacing */}
                <View style={{ height: Platform.OS === 'android' ? Math.max(insets.bottom, 20) + 180 : insets.bottom + 120 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!buktiTransfer || uploading) && styles.submitButtonDisabled
                    ]}
                    onPress={handleUploadBukti}
                    disabled={!buktiTransfer || uploading}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Kirim Bukti Transfer</Text>
                    )}
                </TouchableOpacity>
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
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        flex: 1,
        textAlign: 'right',
    },
    instructionCard: {
        backgroundColor: '#e7f1ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0097A7',
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 14,
        color: '#0097A7',
        lineHeight: 20,
    },
    uploadSection: {
        marginBottom: 16,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 12,
    },
    uploadButton: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    uploadPlaceholder: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    uploadText: {
        marginTop: 8,
        fontSize: 16,
        color: '#6c757d',
    },
    uploadedImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    changeImageButton: {
        marginTop: 12,
        alignItems: 'center',
        padding: 8,
    },
    changeImageText: {
        fontSize: 14,
        color: '#0097A7',
        fontWeight: '500',
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
