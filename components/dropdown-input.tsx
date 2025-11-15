
// --- KODE BARU DIMULAI DI SINI ---
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    error?: string;
    disabled?: boolean;
}

const DropdownInput: React.FC<DropdownInputProps> = ({ label, value, onChange, options, placeholder, error, disabled }) => {
    const [showModal, setShowModal] = useState(false);
    const overlayOpacity = useState(new Animated.Value(0))[0];

    const selectedOption = options.find(opt => opt.value === value);

    const handleOpenModal = () => {
        setShowModal(true);
        Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseModal = () => {
        Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowModal(false);
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[
                    styles.input,
                    error && styles.inputError,
                    disabled && styles.inputDisabled,
                ]}
                onPress={() => !disabled && handleOpenModal()}
                disabled={disabled}
            >
                <Text
                    style={[
                        styles.inputText,
                        !value && styles.placeholder,
                        disabled && styles.textDisabled,
                    ]}
                >
                    {selectedOption ? selectedOption.label : (placeholder || 'Pilih opsi')}
                </Text>
                <Ionicons
                    name="chevron-down-outline"
                    size={20}
                    color={disabled ? '#ced4da' : '#6c757d'}
                />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={showModal}
                transparent
                animationType="none"
                onRequestClose={handleCloseModal}
            >
                {/* Full screen container with backdrop and bottom sheet as siblings */}
                <View style={styles.fullscreenContainer} pointerEvents="box-none">
                    {/* Backdrop with fade animation */}
                    <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                        <TouchableOpacity
                            style={styles.backdropTouchable}
                            activeOpacity={1}
                            onPress={handleCloseModal}
                        />
                    </Animated.View>

                    {/* Bottom sheet modal content */}
                    <View style={styles.bottomSheetContainer}>
                        <View style={options.length < 3 ? styles.modalContentAuto : styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{label}</Text>
                                <TouchableOpacity onPress={handleCloseModal}>
                                    <Ionicons name="close" size={24} color="#212529" />
                                </TouchableOpacity>
                            </View>
                            {options.length < 3 ? (
                                <View style={styles.nonScrollList}>
                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={`${option.value}-${index}`}
                                            style={[
                                                styles.optionItem,
                                                value === option.value && styles.optionItemSelected,
                                            ]}
                                            onPress={() => {
                                                onChange(option.value);
                                                handleCloseModal();
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    value === option.value && styles.optionTextSelected,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                            {value === option.value && (
                                                <Ionicons name="checkmark" size={20} color="#0097A7" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <ScrollView style={styles.optionsList}>
                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={`${option.value}-${index}`}
                                            style={[
                                                styles.optionItem,
                                                value === option.value && styles.optionItemSelected,
                                            ]}
                                            onPress={() => {
                                                onChange(option.value);
                                                handleCloseModal();
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    value === option.value && styles.optionTextSelected,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                            {value === option.value && (
                                                <Ionicons name="checkmark" size={20} color="#0097A7" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default DropdownInput;

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
    inputError: {
        borderColor: '#dc3545',
        borderWidth: 1.5,
    },
    inputDisabled: {
        backgroundColor: '#f8f9fa',
        opacity: 0.6,
    },
    textDisabled: {
        color: '#ced4da',
    },
    errorText: {
        fontSize: 12,
        color: '#dc3545',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    fullscreenContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 0,
    },
    backdropTouchable: {
        flex: 1,
    },
    bottomSheetContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 1,
        paddingBottom: Platform.OS === 'android' ? 0 : 34, // accommodate nav bar / home indicator
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        width: '100%',
        alignSelf: 'center',
    },
    modalContentAuto: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        alignSelf: 'center',
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
    nonScrollList: {
        // Let the items flow naturally without scroll when few options
        width: '100%',
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
        color: '#0097A7',
        fontWeight: '600',
    },
});
