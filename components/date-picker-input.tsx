import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerInputProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    placeholder?: string;
}

export default function DatePickerInput({ label, value, onChange, placeholder }: DatePickerInputProps) {
    const [show, setShow] = useState(false);

    const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        if (selectedDate) {
            onChange(selectedDate);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={styles.input}
                onPress={() => setShow(true)}
            >
                <Text style={[styles.inputText, !value && styles.placeholder]}>
                    {value ? formatDate(value) : (placeholder || 'Pilih tanggal')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6c757d" />
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    inputText: {
        fontSize: 14,
        color: '#212529',
        flex: 1,
    },
    placeholder: {
        color: '#adb5bd',
    },
});
