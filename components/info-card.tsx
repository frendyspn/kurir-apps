import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface InfoCardProps {
    title: string;
    value: string | number;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    icon?: ReactNode;
    rightElement?: ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    valueStyle?: StyleProp<TextStyle>;
}

export default function InfoCard({
    title,
    value,
    variant = 'default',
    icon,
    rightElement,
    containerStyle,
    titleStyle,
    valueStyle,
}: InfoCardProps) {
    const cardStyles: StyleProp<ViewStyle> = [
        styles.card,
        variant === 'primary' && styles.primaryCard,
        variant === 'success' && styles.successCard,
        variant === 'warning' && styles.warningCard,
        variant === 'danger' && styles.dangerCard,
        containerStyle,
    ];

    return (
        <View style={cardStyles}>
            <View style={styles.header}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[styles.title, titleStyle]}>{title}</Text>
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>
            <Text style={[styles.value, valueStyle]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 0,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        // elevation: 4,
    },
    primaryCard: {
        backgroundColor: '#e7f1ff',
        borderLeftWidth: 4,
        borderLeftColor: '#0097A7',
    },
    successCard: {
        backgroundColor: '#d4edda',
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    warningCard: {
        backgroundColor: '#fff3cd',
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    dangerCard: {
        backgroundColor: '#f8d7da',
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        marginRight: 8,
    },
    title: {
        flex: 1,
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    rightElement: {
        marginLeft: 8,
    },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212529',
    },
});
