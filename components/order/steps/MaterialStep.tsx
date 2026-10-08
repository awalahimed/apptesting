import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Package, FileText, Scale } from 'lucide-react-native';

interface MaterialStepProps {
  data: any;
  onNext: (data: any) => void;
}

const materialTypes = [
  'Documents',
  'Electronics',
  'Clothing',
  'Food Items',
  'Furniture',
  'Medical Supplies',
  'Books',
  'Other',
];

export function MaterialStep({ data, onNext }: MaterialStepProps) {
  const [materialType, setMaterialType] = useState(data.materialType || '');
  const [description, setDescription] = useState(data.description || '');
  const [weight, setWeight] = useState(data.weight?.toString() || '');

  const handleNext = () => {
    if (materialType && description) {
      onNext({
        materialType,
        description,
        weight: weight ? parseFloat(weight) : undefined,
      });
    }
  };

  const isValid = materialType && description;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>What are you sending?</Text>
        
        {/* Material Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#1a9b7f" />
            <Text style={styles.sectionTitle}>Package Type</Text>
          </View>
          
          <View style={styles.materialGrid}>
            {materialTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.materialChip,
                  materialType === type && styles.materialChipSelected,
                ]}
                onPress={() => setMaterialType(type)}
              >
                <Text
                  style={[
                    styles.materialChipText,
                    materialType === type && styles.materialChipTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#1a9b7f" />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your package (e.g., fragile items, size, special instructions)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Weight (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Scale size={20} color="#1a9b7f" />
            <Text style={styles.sectionTitle}>Weight (Optional)</Text>
          </View>
          
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight in kg"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isValid}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontFamily: 'Sora',
    fontSize: 16,
    color: '#78838D',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginLeft: 8,
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  materialChipSelected: {
    borderColor: '#1a9b7f',
    backgroundColor: '#F0FDF4',
  },
  materialChipText: {
    fontFamily: 'Sora',
    fontSize: 14,
    color: '#78838D',
  },
  materialChipTextSelected: {
    color: '#1a9b7f',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Sora',
    fontSize: 16,
    color: '#191919',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Sora',
    fontSize: 16,
    color: '#191919',
    height: 100,
  },
  nextButton: {
    backgroundColor: '#1a9b7f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});