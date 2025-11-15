import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EditKendaraanModal from './edit-kendaraan-modal';

export default function KendaraanModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [data, setData] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchData = async () => {
        const local = await AsyncStorage.getItem('userData');
        let no_hp = '';
        if (local) {
            const parsed = JSON.parse(local);
            no_hp = parsed.no_hp;
        }
        if (no_hp) {
            const result = await require('../../services/api').apiService.cekStatusSopir(no_hp);
            if (result.success && result.data?.data) {
                setData(result.data.data);
            } else {
                setData(null);
            }
        } else {
            setData(null);
        }
    };
    useEffect(() => {
        if (visible) fetchData();
    }, [visible]);

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
                            <Text style={styles.title}>Data Kendaraan</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#0097A7" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoGroup}>
                            <Text style={styles.label}>Tipe Kendaraan</Text>
                            <Text style={styles.value}>{data?.jenis_kendaraan || '-'}</Text>
                            <Text style={styles.label}>Merek</Text>
                            <Text style={styles.value}>{data?.merek || '-'}</Text>
                            <Text style={styles.label}>Plat Nomor</Text>
                            <Text style={styles.value}>{data?.plat_nomor || '-'}</Text>

                            <Text style={styles.label}>Foto SIM</Text>
                            {data?.lampiran ? (
                                <Image source={{ uri: data.lampiran }} style={styles.image} resizeMode="cover" />
                            ) : (
                                <Text style={styles.value}>-</Text>
                            )}

                            <Text style={styles.label}>Foto STNK</Text>
                            {data?.lampiran_stnk ? (
                                <Image source={{ uri: data.lampiran_stnk }} style={styles.image} resizeMode="cover" />
                            ) : (
                                <Text style={styles.value}>-</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.editButton} onPress={() => { onClose(); setTimeout(() => setShowEditModal(true), 300); }}>
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <EditKendaraanModal
                visible={showEditModal}
                onClose={() => { setShowEditModal(false); fetchData(); }}
                kendaraanData={data}
                onSave={() => fetchData()}
            />
        </>
    );
}

const styles = StyleSheet.create({
    image: {
        width: 120,
        height: 80,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#eee',
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
        color: '#0097A7',
    },
    closeButton: {
        padding: 4,
    },
    infoGroup: {
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
    editButton: {
        backgroundColor: '#0097A7',
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
});
