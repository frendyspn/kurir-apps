import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface OtpInputProps {
    length?: number;
    onComplete?: (otp: string) => void;
    onChangeOtp?: (otp: string) => void;
}

export default function OtpInput({ length = 6, onComplete, onChangeOtp }: OtpInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputs = useRef<(TextInput | null)[]>([]);

    const handleChangeText = (text: string, index: number) => {
        // Hanya terima angka
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        const otpString = newOtp.join('');
        onChangeOtp?.(otpString);

        // Auto focus ke input berikutnya
        if (text && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }

        // Panggil onComplete jika semua terisi
        if (otpString.length === length) {
            onComplete?.(otpString);
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Focus ke input sebelumnya saat backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {otp.map((digit, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => (inputs.current[index] = ref)}
                    style={[styles.input, digit && styles.inputFilled]}
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    input: {
        flex: 1,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 8,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
    },
    inputFilled: {
        borderColor: '#0d6efd',
        backgroundColor: '#f8f9fa',
    },
});