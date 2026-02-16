import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    textStyle?: StyleProp<TextStyle>;
    spinnerColor?: string;
}

export default function Button({
    title,
    loading,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    style,
    textStyle,
    spinnerColor,
    disabled,
    ...props
}: ButtonProps) {
    const buttonStyles: StyleProp<ViewStyle> = [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'ghost' && styles.ghostButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'success' && styles.successButton,
        size === 'small' && styles.smallButton,
        size === 'medium' && styles.mediumButton,
        size === 'large' && styles.largeButton,
        fullWidth && styles.fullWidth,
        disabled && styles.disabledButton,
        style,
    ];

    const textStyles: StyleProp<TextStyle> = [
        styles.buttonText,
        variant === 'outline' && styles.outlineButtonText,
        variant === 'ghost' && styles.ghostButtonText,
        variant === 'danger' && styles.dangerButtonText,
        variant === 'success' && styles.successButtonText,
        size === 'small' && styles.smallText,
        size === 'medium' && styles.mediumText,
        size === 'large' && styles.largeText,
        disabled && styles.disabledText,
        textStyle,
    ];

    const getSpinnerColor = () => {
        if (spinnerColor) return spinnerColor;
        if (variant === 'outline' || variant === 'ghost') return '#0097A7';
        return '#ffffff';
    };

    return (
        <TouchableOpacity
            style={buttonStyles}
            activeOpacity={0.8}
            disabled={loading || disabled}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getSpinnerColor()} />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    // Variants
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    dangerButton: {
        backgroundColor: '#dc3545',
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    successButton: {
        backgroundColor: '#28a745',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#e9ecef',
        shadowOpacity: 0,
        elevation: 0,
    },
    // Sizes
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    mediumButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    largeButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    fullWidth: {
        width: '100%',
    },
    // Text Styles
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    outlineButtonText: {
        color: '#0097A7',
    },
    ghostButtonText: {
        color: '#0097A7',
    },
    dangerButtonText: {
        color: '#ffffff',
    },
    successButtonText: {
        color: '#ffffff',
    },
    disabledText: {
        color: '#adb5bd',
    },
    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },
});