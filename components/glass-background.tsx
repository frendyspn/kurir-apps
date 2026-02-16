import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { AuthColors } from '../constants/theme';

export default function GlassBackground() {
    return (
        <View style={styles.background}>
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />
            <BlurView intensity={28} tint="light" style={styles.glassOverlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    glowTop: {
        position: 'absolute',
        top: -140,
        left: -80,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: AuthColors.glowTop,
        opacity: 0.5,
    },
    glowBottom: {
        position: 'absolute',
        bottom: -160,
        right: -120,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: AuthColors.glowBottom,
        opacity: 0.45,
    },
    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor: 'rgba(255, 255, 255, 0.04)',
        backgroundColor: '#5FA8E8',
    },
});
