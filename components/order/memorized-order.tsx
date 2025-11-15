import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MemorizedOrderProps {
    // Add props here when needed
}

const MemorizedOrder: React.FC<MemorizedOrderProps> = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Memorized Order</Text>
            <Text style={styles.subtitle}>Coming Soon...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6c757d',
    },
});

export default MemorizedOrder;
