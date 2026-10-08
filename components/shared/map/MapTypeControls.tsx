import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Map, Box, Navigation, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '@/hooks/ThemeContext';

interface MapTypeControlsProps {
  mapType?: 'standard' | 'satellite';
  onMapTypeChange?: (type: 'standard' | 'satellite') => void;
  onLocationPress?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const MapTypeControls: React.FC<MapTypeControlsProps> = ({ 
  mapType = 'standard', 
  onMapTypeChange,
  onLocationPress,
  onZoomIn,
  onZoomOut,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Zoom Controls */}
      {(onZoomIn || onZoomOut) && (
        <View style={[styles.controlGroup, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', marginBottom: 12 }]}>
          {onZoomIn && (
            <>
              <TouchableOpacity 
                style={[
                  styles.button,
                  { borderTopLeftRadius: 8, borderTopRightRadius: 8 }
                ]} 
                onPress={onZoomIn}
              >
                <Plus size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
              {onZoomOut && <View style={{ height: 1, backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />}
            </>
          )}
          
          {onZoomOut && (
            <TouchableOpacity 
              style={[
                styles.button,
                { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }
              ]} 
              onPress={onZoomOut}
            >
              <Minus size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Map Type & Location Controls */}
      <View style={[styles.controlGroup, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        {/* Location - Top button */}
        {onLocationPress && (
          <>
            <TouchableOpacity 
              style={[
                styles.button,
                { borderTopLeftRadius: 8, borderTopRightRadius: 8 }
              ]} 
              onPress={onLocationPress}
            >
              <Navigation 
                size={16} 
                color={isDark ? '#FFFFFF' : '#000000'} 
                fill={isDark ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
            {onMapTypeChange && <View style={{ height: 1, backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />}
          </>
        )}
        
        {/* Map Type Switcher */}
        {onMapTypeChange && (
          <>
            <TouchableOpacity 
              style={[
                styles.button,
                !onLocationPress && { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                mapType === 'standard' && { backgroundColor: '#10B981' }
              ]} 
              onPress={() => onMapTypeChange('standard')}
            >
              <Map 
                size={20} 
                color={mapType === 'standard' ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')} 
              />
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />
            
            <TouchableOpacity 
              style={[
                styles.button,
                { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                mapType === 'satellite' && { backgroundColor: '#10B981' }
              ]} 
              onPress={() => onMapTypeChange('satellite')}
            >
              <Box 
                size={20} 
                color={mapType === 'satellite' ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')} 
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: '60%', // Moved down from 50%
    transform: [{ translateY: -100 }],
  },
  controlGroup: {
    flexDirection: 'column',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
