import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface OtpInputProps {
    length?: number;
    value?: string;
    onChange?: (otp: string) => void;
    onComplete?: (otp: string) => void;
    onChangeOtp?: (otp: string) => void;
    error?: string;
}

export default function OtpInput({ length = 4, value, onChange, onComplete, onChangeOtp, error }: OtpInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputs = useRef<(TextInput | null)[]>([]);

    // Sync with external value
    useEffect(() => {
        if (value !== undefined) {
            const otpArray = value.split('').slice(0, length);
            const paddedOtp = [...otpArray, ...Array(length - otpArray.length).fill('')];
            setOtp(paddedOtp);
        }
    }, [value, length]);

    const handleChangeText = (text: string, index: number) => {
        // Hanya terima angka
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        const otpString = newOtp.join('');
        
        // Call both onChange handlers
        onChange?.(otpString);
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
        <View>
            <View style={styles.container}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputs.current[index] = ref;
                        }}
                        style={[
                            styles.input, 
                            digit && styles.inputFilled,
                            error && styles.inputError
                        ]}
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
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    input: {
        width: 52,
        height: 56,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 12,
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
    },
    inputFilled: {
        borderColor: '#0097A7',
        backgroundColor: '#f8f9fa',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
});