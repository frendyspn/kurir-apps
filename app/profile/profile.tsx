import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    useEffect(() => {
        // Redirect to akun screen since profile is part of akun
        router.replace('/akun');
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.message}>Redirecting to Akun screen...</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/akun')}
                >
                    <Text style={styles.buttonText}>Go to Akun</Text>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#0097A7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});