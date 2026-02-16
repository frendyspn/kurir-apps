import { AuthColors } from '@/constants/theme';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface FilterChipProps extends TouchableOpacityProps {
    label: string;
    selected?: boolean;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    size?: 'small' | 'medium' | 'large';
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export default function FilterChip({
    label,
    selected = false,
    variant = 'primary',
    size = 'medium',
    containerStyle,
    textStyle,
    ...props
}: FilterChipProps) {
    const chipStyles: StyleProp<ViewStyle> = [
        styles.chip,
        size === 'small' && styles.smallChip,
        size === 'medium' && styles.mediumChip,
        size === 'large' && styles.largeChip,
        selected && styles.selectedChip,
        selected && variant === 'primary' && styles.selectedPrimary,
        selected && variant === 'success' && styles.selectedSuccess,
        selected && variant === 'warning' && styles.selectedWarning,
        selected && variant === 'danger' && styles.selectedDanger,
        containerStyle,
    ];

    const labelStyles: StyleProp<TextStyle> = [
        styles.label,
        size === 'small' && styles.smallLabel,
        size === 'medium' && styles.mediumLabel,
        size === 'large' && styles.largeLabel,
        selected && styles.selectedLabel,
        textStyle,
    ];

    return (
        <TouchableOpacity style={chipStyles} activeOpacity={0.7} {...props}>
            <Text style={labelStyles}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Sizes
    smallChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    mediumChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    largeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    // Selected States
    selectedChip: {
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
    },
    selectedPrimary: {
        backgroundColor: AuthColors.primary,
        borderColor: AuthColors.primary,
    },
    selectedSuccess: {
        backgroundColor: '#28a745',
        borderColor: '#28a745',
    },
    selectedWarning: {
        backgroundColor: '#ffc107',
        borderColor: '#ffc107',
    },
    selectedDanger: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
    },
    // Text Styles
    label: {
        color: '#6c757d',
        fontWeight: '500',
    },
    smallLabel: {
        fontSize: 12,
    },
    mediumLabel: {
        fontSize: 14,
    },
    largeLabel: {
        fontSize: 16,
    },
    selectedLabel: {
        color: '#ffffff',
        fontWeight: '600',
    },
});
