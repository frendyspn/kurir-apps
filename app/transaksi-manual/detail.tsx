import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

export default function TransaksiDetailScreen() {
    useEffect(() => {
        const backAction = () => {
            // Handle back action - could navigate back or show confirmation
            return true; // Prevent default behavior
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Detail Transaksi',
                    headerShown: true,
                }}
            />
            <View style={styles.container}>
                <Text style={styles.text}>Detail Transaksi</Text>
                <Text style={styles.subtext}>Halaman ini sedang dalam pengembangan</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    subtext: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
});
