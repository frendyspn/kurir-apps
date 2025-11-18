import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface PelangganSearchInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => Promise<void>;
    onClearResults?: () => void;
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
    searchPlaceholder?: string;
    selectedLabel?: string;
    isSearching?: boolean;
}

export default function PelangganSearchInput({
    label,
    value,
    onChange,
    onSearch,
    onClearResults,
    options,
    placeholder = 'Pilih pelanggan',
    searchPlaceholder = 'Cari dengan no HP atau nama',
    selectedLabel,
    isSearching = false,
}: PelangganSearchInputProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = async () => {
        if (searchQuery.trim()) {
            await onSearch(searchQuery.trim());
        }
    };

    const handleSelect = (selectedValue: string, selectedLabel: string) => {
        onChange(selectedValue);
        setModalVisible(false);
        setSearchQuery('');
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSearchQuery('');
        if (onClearResults) {
            onClearResults();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        if (onClearResults) {
            onClearResults();
        }
    };

    const displayText = selectedLabel || placeholder;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            
            <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.inputText, !selectedLabel && styles.placeholderText]}>
                    {displayText}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6c757d" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <Ionicons name="close" size={24} color="#212529" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Section */}
                        <View style={styles.searchSection}>
                            <View style={styles.searchInputContainer}>
                                <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder={searchPlaceholder}
                                    placeholderTextColor="#adb5bd"
                                    onSubmitEditing={handleSearch}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={handleClearSearch}
                                        style={styles.clearButton}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#6c757d" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                                onPress={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                            >
                                {isSearching ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <Ionicons name="search" size={18} color="#ffffff" />
                                        <Text style={styles.searchButtonText}>Cari</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Results */}
                        <ScrollView style={styles.optionsList}>
                            {(() => {
                                if (isSearching) {
                                    return (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color="#0097A7" />
                                            <Text style={styles.loadingText}>Mencari pelanggan...</Text>
                                        </View>
                                    );
                                } else if (options.length === 0) {
                                    return (
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="search-outline" size={48} color="#adb5bd" />
                                            <Text style={styles.emptyText}>
                                                {searchQuery ? 'Pelanggan tidak ditemukan' : 'Masukkan no HP atau nama untuk mencari'}
                                            </Text>
                                            <Text style={styles.emptySubtext}>
                                                {searchQuery ? 'Coba kata kunci lain' : 'Klik tombol "Cari" untuk memulai'}
                                            </Text>
                                        </View>
                                    );
                                } else {
                                    return (
                                        <>
                                            <Text style={styles.resultCount}>
                                                Ditemukan {options.length} pelanggan
                                            </Text>
                                            {options.map((option, index) => (
                                                <TouchableOpacity
                                                    key={`${option.value}-${index}`}
                                                    style={[
                                                        styles.option,
                                                        value === option.value && styles.selectedOption,
                                                    ]}
                                                    onPress={() => handleSelect(option.value, option.label)}
                                                >
                                                    <View style={styles.optionContent}>
                                                        <Ionicons 
                                                            name="person-circle-outline" 
                                                            size={24} 
                                                            color={value === option.value ? '#0097A7' : '#6c757d'} 
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.optionText,
                                                                value === option.value && styles.selectedOptionText,
                                                            ]}
                                                        >
                                                            {option.label}
                                                        </Text>
                                                    </View>
                                                    {value === option.value && (
                                                        <Ionicons name="checkmark-circle" size={24} color="#0097A7" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </>
                                    );
                                }
                            })()}
                        </ScrollView>
                    </View>
                </View>
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
    inputContainer: {
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
    placeholderText: {
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
        height: '85%',
        paddingBottom: 20,
        display: 'flex',
        flexDirection: 'column',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    searchSection: {
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#212529',
    },
    clearButton: {
        padding: 4,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0097A7',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    searchButtonDisabled: {
        backgroundColor: '#6c757d',
        opacity: 0.6,
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    optionsList: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#6c757d',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
    resultCount: {
        fontSize: 12,
        color: '#6c757d',
        marginVertical: 12,
        fontWeight: '500',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    selectedOption: {
        backgroundColor: '#e7f1ff',
        borderRadius: 8,
        borderBottomColor: 'transparent',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    optionText: {
        fontSize: 14,
        color: '#212529',
        flex: 1,
    },
    selectedOptionText: {
        fontWeight: '600',
        color: '#0097A7',
    },
});
