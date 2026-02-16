import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiService } from '@/services/api';

// Simple vCard parser
interface ParsedContact {
    nama_lengkap: string;
    no_hp: string;
    email?: string;
    alamat_lengkap?: string;
}

function parseVCard(vcfContent: string): ParsedContact[] {
    const contacts: ParsedContact[] = [];
    const vcards = vcfContent.split('BEGIN:VCARD');

    for (let vcard of vcards) {
        if (!vcard.trim()) continue;

        const contact: ParsedContact = {
            nama_lengkap: '',
            no_hp: '',
            email: '',
            alamat_lengkap: ''
        };

        // Extract FN (Full Name)
        const fnMatch = vcard.match(/FN[;:](.+)/i);
        if (fnMatch) {
            contact.nama_lengkap = fnMatch[1].trim();
        } else {
            // Try N (Name) if FN not found
            const nMatch = vcard.match(/N[;:](.+)/i);
            if (nMatch) {
                const nameParts = nMatch[1].split(';');
                contact.nama_lengkap = `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim();
            }
        }

        // Extract TEL (Phone)
        const telMatch = vcard.match(/TEL[;:](.+)/i);
        if (telMatch) {
            contact.no_hp = telMatch[1].replace(/[^0-9+]/g, '').trim();
        }

        // Extract EMAIL
        const emailMatch = vcard.match(/EMAIL[;:](.+)/i);
        if (emailMatch) {
            contact.email = emailMatch[1].trim();
        }

        // Extract ADR (Address)
        const adrMatch = vcard.match(/ADR[;:](.+)/i);
        if (adrMatch) {
            const addressParts = adrMatch[1].split(';');
            contact.alamat_lengkap = addressParts.filter(p => p.trim()).join(' ').trim();
        }

        // Only add if name and phone exist
        if (contact.nama_lengkap && contact.no_hp) {
            contacts.push(contact);
        }
    }

    return contacts;
}

export default function ImportKontakScreen() {
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
    const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
    const [importProgress, setImportProgress] = useState<string>('');

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/vcard', 'text/x-vcard', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log('User cancelled file picker');
                return;
            }

            const file = result.assets[0];
            console.log('Selected file:', file);

            if (!file.uri || !file.name) {
                Alert.alert('Error', 'File tidak valid');
                return;
            }

            // Check file extension
            if (!file.name.toLowerCase().endsWith('.vcf')) {
                Alert.alert('Error', 'Hanya file .vcf yang didukung');
                return;
            }

            setSelectedFile(file.name);
            setLoading(true);

            try {
                // Read file content
                const content = await FileSystem.readAsStringAsync(file.uri);
                console.log('File content length:', content.length);

                // Parse vCard
                const contacts = parseVCard(content);
                console.log('Parsed contacts:', contacts.length);

                if (contacts.length === 0) {
                    Alert.alert('Error', 'Tidak ada kontak yang valid ditemukan dalam file');
                    setSelectedFile(null);
                } else {
                    setParsedContacts(contacts);
                    // Select all contacts by default
                    const allIds = new Set(contacts.map((_, idx) => idx));
                    setSelectedContactIds(allIds);
                    Alert.alert(
                        'Berhasil',
                        `Ditemukan ${contacts.length} kontak.\nTekan "Import" untuk menyimpan ke database.`
                    );
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
                Alert.alert('Error', 'Gagal membaca file. Pastikan format file benar.');
                setSelectedFile(null);
            }

            setLoading(false);
        } catch (error) {
            console.error('File picker error:', error);
            Alert.alert('Error', 'Gagal memilih file');
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedContactIds.size === 0) {
            Alert.alert('Error', 'Silakan pilih minimal 1 kontak untuk diimport');
            return;
        }

        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) {
                Alert.alert('Error', 'Silakan login terlebih dahulu');
                return;
            }

            const userData = JSON.parse(userDataStr);
            const idKonsumen = userData.id_konsumen;
            console.log('Importing contacts for user ID:', idKonsumen);
            // Filter selected contacts
            const contactsToImport = parsedContacts.filter((_, idx) => selectedContactIds.has(idx));

            setLoading(true);
            setImportProgress(`Menyiapkan import ${contactsToImport.length} kontak...`);

            // Prepare bulk data
            const bulkData = contactsToImport.map(contact => ({
                id_kurir: idKonsumen,
                nama_lengkap: contact.nama_lengkap,
                no_hp: contact.no_hp,
                email: contact.email || '',
                alamat_lengkap: contact.alamat_lengkap || ''
            }));

            setImportProgress(`Mengirim data ke server...`);

            // Call bulk import API
            const response = await apiService.bulkAddKonsumen(bulkData);

            setLoading(false);
            setImportProgress('');

            if (response.success) {
                Alert.alert(
                    'Import Selesai',
                    `${contactsToImport.length} kontak berhasil diimport`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                router.push('/(tabs)/kontak');
                            }
                        }
                    ]
                );

                // Reset
                setSelectedFile(null);
                setParsedContacts([]);
                setSelectedContactIds(new Set());
            } else {
                Alert.alert(
                    'Import Gagal',
                    response.message || 'Terjadi kesalahan saat mengimport kontak'
                );
            }

        } catch (error) {
            console.error('Import error:', error);
            Alert.alert('Error', 'Gagal mengimport kontak');
            setLoading(false);
            setImportProgress('');
        }
    };

    const toggleContact = useCallback((index: number) => {
        setSelectedContactIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedContactIds.size === parsedContacts.length) {
            setSelectedContactIds(new Set());
        } else {
            const allIds = new Set(parsedContacts.map((_, idx) => idx));
            setSelectedContactIds(allIds);
        }
    }, [parsedContacts.length, selectedContactIds.size]);

    return (
        <>

            <SafeAreaView style={styles.container} edges={['bottom']}>
                {/* Header Custom */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)/kontak')} style={styles.headerBackButton}>
                        <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.logo}>Import Kontak</Text>
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Instructions */}
                    <View style={styles.instructionCard}>
                        <Ionicons name="information-circle" size={32} color="#0097A7" />
                        <Text style={styles.instructionTitle}>Cara Import Kontak</Text>
                        <View style={styles.instructionList}>
                            <Text style={styles.instructionItem}>1. Export kontak dari perangkat Android ke file .vcf</Text>
                            <Text style={styles.instructionItem}>2. Pilih file .vcf yang telah di-export</Text>
                            <Text style={styles.instructionItem}>3. Tekan "Import" untuk menyimpan kontak</Text>
                        </View>
                    </View>

                    {/* File Picker */}
                    <TouchableOpacity
                        style={styles.pickButton}
                        onPress={handlePickFile}
                        disabled={loading}
                    >
                        <Ionicons name="folder-open" size={24} color="#ffffff" />
                        <Text style={styles.pickButtonText}>Pilih File .vcf</Text>
                    </TouchableOpacity>

                    {/* Selected File Info */}
                    {selectedFile && (
                        <View style={styles.fileInfo}>
                            <Ionicons name="document" size={20} color="#0097A7" />
                            <Text style={styles.fileName}>{selectedFile}</Text>
                            {parsedContacts.length > 0 && (
                                <Text style={styles.contactCount}>
                                    {parsedContacts.length} kontak
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Progress */}
                    {importProgress && (
                        <View style={styles.progressCard}>
                            <ActivityIndicator size="small" color="#0097A7" />
                            <Text style={styles.progressText}>{importProgress}</Text>
                        </View>
                    )}

                    {/* Loading State - File Parsing */}
                    {loading && parsedContacts.length === 0 && (
                        <View style={styles.loadingCard}>
                            <ActivityIndicator size="large" color="#0097A7" />
                            <Text style={styles.loadingText}>Membaca dan memproses file...</Text>
                        </View>
                    )}

                    {/* Preview Contacts */}
                    {parsedContacts.length > 0 && !loading && (
                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <Text style={styles.previewTitle}>
                                    Preview Kontak ({selectedContactIds.size}/{parsedContacts.length})
                                </Text>
                                <TouchableOpacity
                                    onPress={toggleSelectAll}
                                    style={styles.selectAllButton}
                                >
                                    <Ionicons
                                        name={selectedContactIds.size === parsedContacts.length ? 'checkbox' : 'square-outline'}
                                        size={20}
                                        color="#0097A7"
                                    />
                                    <Text style={styles.selectAllText}>
                                        {selectedContactIds.size === parsedContacts.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.previewList} nestedScrollEnabled>
                                {parsedContacts.map((contact, index) => (
                                    <Pressable
                                        key={index}
                                        style={styles.previewItem}
                                        onPress={() => toggleContact(index)}
                                    >
                                        <View style={styles.checkboxContainer}>
                                            <Ionicons
                                                name={selectedContactIds.has(index) ? 'checkbox' : 'square-outline'}
                                                size={24}
                                                color="#0097A7"
                                            />
                                        </View>
                                        <View style={styles.previewItemContent}>
                                            <Text style={styles.previewName}>{contact.nama_lengkap}</Text>
                                            <Text style={styles.previewPhone}>{contact.no_hp}</Text>
                                            {contact.alamat_lengkap && (
                                                <Text style={styles.previewAddress} numberOfLines={1}>
                                                    {contact.alamat_lengkap}
                                                </Text>
                                            )}
                                        </View>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Import Button */}
                    {parsedContacts.length > 0 && (
                        <TouchableOpacity
                            style={[styles.importButton, (loading || selectedContactIds.size === 0) && styles.importButtonDisabled]}
                            onPress={handleImport}
                            disabled={loading || selectedContactIds.size === 0}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={24} color="#ffffff" />
                                    <Text style={styles.importButtonText}>
                                        Import {selectedContactIds.size} Kontak
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0097A7',
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
    headerBackButton: {
        padding: 8,
    },
    headerMenuButton: {
        padding: 8,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    instructionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginTop: 12,
        marginBottom: 16,
    },
    instructionList: {
        width: '100%',
        gap: 12,
    },
    instructionItem: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
    },
    pickButton: {
        backgroundColor: '#0097A7',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    pickButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    fileInfo: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        color: '#212529',
        fontWeight: '500',
    },
    contactCount: {
        fontSize: 12,
        color: '#0097A7',
        fontWeight: '600',
    },
    progressCard: {
        backgroundColor: '#e7f5f7',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressText: {
        fontSize: 14,
        color: '#0097A7',
        fontWeight: '500',
    },
    loadingCard: {
        backgroundColor: '#e7f5f7',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#0097A7',
        fontWeight: '500',
    },
    previewCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        maxHeight: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    selectAllText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#0097A7',
    },
    previewList: {
        maxHeight: 320,
    },
    previewItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    previewItemContent: {
        flex: 1,
    },
    checkboxContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    previewPhone: {
        fontSize: 13,
        color: '#0097A7',
        marginBottom: 2,
    },
    previewAddress: {
        fontSize: 12,
        color: '#6c757d',
    },
    moreText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        paddingVertical: 12,
        fontStyle: 'italic',
    },
    importButton: {
        backgroundColor: '#28a745',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    importButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    importButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});
