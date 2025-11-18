import React, { useEffect } from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";


interface Props {
  visible: boolean;
  title: string;
  body: string;
  onPress?: () => void;
  onHide?: () => void;
}

export default function InAppNotification({
  visible,
  title,
  body,
  onPress,
  onHide
}: Props) {
  const colorScheme = useColorScheme?.() || "light";
  const isDark = colorScheme === "dark";
  const translateY = useSharedValue(-100);

  // Show animation
  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      // Auto hide after 4s
      const timer = setTimeout(() => {
        hide();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    translateY.value = withTiming(-100, {
      duration: 300,
      easing: Easing.in(Easing.cubic),
    });
    onHide?.();
  };

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  // Theme colors (adjust as needed)
  const bgColor = isDark ? "#222C37" : "#F5F7FA";
  const titleColor = isDark ? "#F5F7FA" : "#222C37";
  const bodyColor = isDark ? "#B0B8C1" : "#4A5568";
  const shadowColor = isDark ? "#000" : "#222C37";

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          zIndex: 999,
        },
        animatedStyles,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: bgColor,
          padding: 16,
          borderRadius: 16,
          shadowColor: shadowColor,
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          borderWidth: isDark ? 0 : 1,
          borderColor: isDark ? undefined : "#E2E8F0",
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* Icon aplikasi di kiri */}
        <IconAppNotification />
        <View>
        <Text style={{ color: titleColor, fontWeight: "700", fontSize: 16, letterSpacing: 0.2, marginLeft: 12 }}>
          {title}
        </Text>
        <Text style={{ color: bodyColor, marginTop: 6, fontSize: 14, lineHeight: 20, marginLeft: 12 }}>
          {body}
        </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
// Komponen icon aplikasi (bisa diganti dengan gambar lokal sesuai kebutuhan)
function IconAppNotification() {
  return (
    <Image
      source={require('../assets/images/icon.png')}
      style={{ width: 28, height: 28, marginRight: 8, resizeMode: 'contain' }}
      accessibilityLabel="App Icon"
    />
  );
}
