import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ title, loading, variant = 'primary', style, ...props }: ButtonProps) {
    const buttonStyles = [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        style,
    ];

    const textStyles = [
        styles.buttonText,
        variant === 'outline' && styles.outlineButtonText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            activeOpacity={0.8}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#0097A7' : '#ffffff'} />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#0097A7',
        shadowColor: '#0097A7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    secondaryButton: {
        backgroundColor: '#6c757d',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButtonText: {
        color: '#0097A7',
    },
});