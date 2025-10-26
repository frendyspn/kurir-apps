import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiService } from '../../services/api';
import EditProfileModal from './edit-profile-modal';
import EditProfilePhotoModal from './edit-profile-photo-modal';

export default function ProfileModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave?: (data: any) => void }) {
    const [userData, setUserData] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    async function handleSaveEdit(data: any) {
        // Update state dan reload dari AsyncStorage agar data sinkron
        setUserData(data);
        try {
            const local = await AsyncStorage.getItem('userData');
            if (local) {
                setUserData(JSON.parse(local));
            }
        } catch (err) {
            // fallback: tetap pakai data dari parameter
        }
        // Notify parent component to refresh data
        if (onSave) {
            onSave(data);
        }
    }

    useEffect(() => {
        const fetchUserData = async () => {
            const local = await AsyncStorage.getItem('userData');
            let no_hp = '';
            let localData = null;
            if (local) {
                const parsed = JSON.parse(local);
                no_hp = parsed.no_hp;
                localData = parsed; // Simpan data lokal untuk digabungkan
            }
            if (no_hp) {
                const result = await apiService.cekNoHpRegistration(no_hp);
                if (result.success && result.data?.data) {
                    // Gabungkan data dari API dengan data lokal (untuk kendaraan)
                    const apiData = result.data.data;
                    const combinedData = { ...apiData, ...localData };
                    console.log('Combined user data:', combinedData);
                    setUserData(combinedData);
                } else {
                    setUserData(localData); // Fallback ke data lokal jika API gagal
                }
            } else {
                setUserData(localData);
            }
        };
        if (visible) fetchUserData();
    }, [visible, showEditModal, showPhotoModal]);

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Data Profile</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#0d6efd" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.label}>Nama Lengkap</Text>
                            <Text style={styles.value}>{userData?.nama_lengkap || '-'}</Text>
                            <Text style={styles.label}>No HP</Text>
                            <Text style={styles.value}>{userData?.no_hp || '-'}</Text>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{userData?.email || '-'}</Text>
                            <Text style={styles.label}>Alamat</Text>
                            <Text style={styles.value}>{userData?.alamat_lengkap || '-'}{userData?.kecamatan && ', Kec. ' + userData?.kecamatan}{userData?.kota && ', Kota ' + userData?.kota}{userData?.provinsi && ', Prov. ' + userData?.provinsi}</Text>
                            <Text style={styles.label}>Tempat Lahir</Text>
                            <Text style={styles.value}>{userData?.tempat_lahir || '-'}</Text>
                            <Text style={styles.label}>Tanggal Lahir</Text>
                            <Text style={styles.value}>{userData?.tanggal_lahir || '-'}</Text>
                        </View>

                        {/* Photo Upload Section */}
                        {/* <View style={styles.photoSection}>
                            <TouchableOpacity
                                style={styles.photoUploadButton}
                                onPress={() => {
                                    console.log('Opening photo modal with userData:', userData);
                                    onClose();
                                    setTimeout(() => setShowPhotoModal(true), 300);
                                }}
                            >
                                <Ionicons name="camera" size={20} color="#0d6efd" />
                                <Text style={styles.photoUploadText}>Update Foto Profile</Text>
                            </TouchableOpacity>
                        </View> */}

                        <TouchableOpacity style={styles.editButton} onPress={() => { onClose(); setTimeout(() => setShowEditModal(true), 300); }}>
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                userData={userData}
                onSave={handleSaveEdit}
            />
            <EditProfilePhotoModal
                visible={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                userData={userData}
                onSave={handleSaveEdit}
            />
        </>
    );
}

const styles = StyleSheet.create({
    editButton: {
        backgroundColor: '#0d6efd',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 24,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0d6efd',
    },
    closeButton: {
        padding: 4,
    },
    profileInfo: {
        marginTop: 8,
    },
    label: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 12,
    },
    value: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '500',
    },
    photoSection: {
        marginTop: 16,
        marginBottom: 8,
    },
    photoUploadButton: {
        backgroundColor: '#e7f1ff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    photoUploadText: {
        color: '#0d6efd',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
