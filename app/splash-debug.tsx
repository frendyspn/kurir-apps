import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

const SPLASH_IMAGE = require('../assets/images/splash-icon.png');

export default function SplashDebugScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();

    const previewStyle = useMemo(() => {
        const base = {
            width: Math.min(width - 32, 420),
            height: Math.min(height * 0.34, 280),
        };

        return [styles.previewFrame, base];
    }, [width, height]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Splash Debug</Text>
                        <Text style={styles.subtitle}>Preview untuk cek crop gambar splash</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Ukuran layar</Text>
                    <Text style={styles.infoValue}>{Math.round(width)} x {Math.round(height)}</Text>
                    <Text style={styles.infoHint}>
                        Preview ini sudah diset mengikuti splash asli dengan resizeMode contain.
                    </Text>
                </View>

                <View style={styles.previewWrapper}>
                    <View style={previewStyle as any}>
                        <Image
                            source={SPLASH_IMAGE}
                            resizeMode="contain"
                            style={styles.image}
                        />
                    </View>
                </View>

                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>Cara pakai</Text>
                    <Text style={styles.noteText}>
                        1. Buka route ini dari navigator atau tombol debug di Home.
                    </Text>
                    <Text style={styles.noteText}>
                        2. Bandingkan tampilan dengan splash asli saat app cold start.
                    </Text>
                    <Text style={styles.noteText}>
                        3. Jika masih terasa terlalu kecil/besar, sesuaikan imageWidth di app.json.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0097A7',
    },
    content: {
        padding: 16,
        paddingTop: 48,
        paddingBottom: 32,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
    },
    subtitle: {
        marginTop: 2,
        fontSize: 13,
        color: 'rgba(255,255,255,0.82)',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6c757d',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    infoValue: {
        marginTop: 6,
        fontSize: 20,
        fontWeight: '800',
        color: '#212529',
    },
    infoHint: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
        color: '#495057',
    },
    previewWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewFrame: {
        overflow: 'hidden',
        borderRadius: 20,
        backgroundColor: '#0097A7',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    noteCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 16,
        padding: 16,
    },
    noteTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1d4f7a',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 13,
        lineHeight: 19,
        color: '#495057',
        marginBottom: 6,
    },
});