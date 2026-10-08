import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions({
      ...options,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
    setVisible(true);
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    setVisible(false);
    setTimeout(() => {
      button.onPress?.();
    }, 100);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>{alertOptions.title}</Text>
            <Text style={styles.message}>{alertOptions.message}</Text>
            <View style={styles.buttonContainer}>
              {alertOptions.buttons?.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#000',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});
