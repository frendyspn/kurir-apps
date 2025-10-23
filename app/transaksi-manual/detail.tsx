import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function TransaksiDetailScreen() {
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
