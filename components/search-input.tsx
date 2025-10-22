import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchInputProps {
    label?: string;
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
}

export default function SearchInput({ label, value, onChange, placeholder, onClear }: SearchInputProps) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                <Ionicons name="search-outline" size={20} color="#6c757d" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder || 'Cari...'}
                    placeholderTextColor="#adb5bd"
                />
                {value ? (
                    <TouchableOpacity 
                        onPress={() => {
                            onChange('');
                            onClear?.();
                        }}
                        style={styles.clearButton}
                    >
                        <Ionicons name="close-circle" size={20} color="#6c757d" />
                    </TouchableOpacity>
                ) : null}
            </View>
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
        paddingVertical: 0,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#212529',
        paddingVertical: 12,
    },
    clearButton: {
        padding: 4,
    },
});
