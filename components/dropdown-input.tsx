import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DropdownOption {
    label: string;
    value: string;
}

interface DropdownInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
}

export default function DropdownInput({ label, value, onChange, options, placeholder }: DropdownInputProps) {
    const [showModal, setShowModal] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowModal(true)}
            >
                <Text style={[styles.inputText, !value && styles.placeholder]}>
                    {selectedOption ? selectedOption.label : (placeholder || 'Pilih opsi')}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#6c757d" />
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#212529" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.optionsList}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={`${option.value}-${index}`}
                                    style={[
                                        styles.optionItem,
                                        value === option.value && styles.optionItemSelected
                                    ]}
                                    onPress={() => {
                                        onChange(option.value);
                                        setShowModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        value === option.value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {value === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#0d6efd" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    optionsList: {
        maxHeight: 400,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    optionItemSelected: {
        backgroundColor: '#e7f1ff',
    },
    optionText: {
        fontSize: 16,
        color: '#212529',
    },
    optionTextSelected: {
        color: '#0d6efd',
        fontWeight: '600',
    },
});
