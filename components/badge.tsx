import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface BadgeProps {
    count?: number;
    variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info';
    size?: 'small' | 'medium' | 'large';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    maxCount?: number;
}

export default function Badge({
    count = 0,
    variant = 'danger',
    size = 'medium',
    style,
    textStyle,
    maxCount = 99,
}: BadgeProps) {
    if (count <= 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

    const badgeStyles: StyleProp<ViewStyle> = [
        styles.badge,
        variant === 'primary' && styles.primaryBadge,
        variant === 'danger' && styles.dangerBadge,
        variant === 'warning' && styles.warningBadge,
        variant === 'success' && styles.successBadge,
        variant === 'info' && styles.infoBadge,
        size === 'small' && styles.smallBadge,
        size === 'medium' && styles.mediumBadge,
        size === 'large' && styles.largeBadge,
        style,
    ];

    const textStyles: StyleProp<TextStyle> = [
        styles.badgeText,
        size === 'small' && styles.smallText,
        size === 'medium' && styles.mediumText,
        size === 'large' && styles.largeText,
        textStyle,
    ];

    return (
        <View style={badgeStyles}>
            <Text style={textStyles}>{displayCount}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    // Variants
    primaryBadge: {
        backgroundColor: '#0097A7',
    },
    dangerBadge: {
        backgroundColor: '#dc3545',
    },
    warningBadge: {
        backgroundColor: '#ffc107',
    },
    successBadge: {
        backgroundColor: '#28a745',
    },
    infoBadge: {
        backgroundColor: '#17a2b8',
    },
    // Sizes
    smallBadge: {
        minWidth: 16,
        height: 16,
    },
    mediumBadge: {
        minWidth: 20,
        height: 20,
    },
    largeBadge: {
        minWidth: 24,
        height: 24,
    },
    // Text Styles
    badgeText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    smallText: {
        fontSize: 10,
    },
    mediumText: {
        fontSize: 12,
    },
    largeText: {
        fontSize: 14,
    },
});
