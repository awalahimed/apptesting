import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native'
import { useWebSocketContext } from '../../hooks/WebSocketContext'
import { useAlert } from '@/components/shared/CustomAlert'
import { MapPin, Truck, Package, DollarSign, X } from 'lucide-react-native'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export const DriverOrderScreen: React.FC = () => {
  const { orpcClient, connected, websocket } = useWebSocketContext()
  const { showAlert } = useAlert()
  const [incomingOrder, setIncomingOrder] = useState<any>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offeredPrice, setOfferedPrice] = useState('')
  const [priceError, setPriceError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!connected || !websocket) return

    // Listen for order broadcasts
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'order_broadcast') {
          setIncomingOrder(data.data)
          setShowOfferModal(true)
        }
      } catch (e) {
        console.log('WebSocket message:', event.data)
      }
    }

    websocket.addEventListener('message', handleMessage)
    
    return () => {
      if (websocket) {
        websocket.removeEventListener('message', handleMessage)
      }
    }
  }, [connected, websocket])

  const handleSubmitOffer = async () => {
    if (!orpcClient || !incomingOrder) return

    const price = parseFloat(offeredPrice)
    
    // Validate price
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price')
      return
    }
    
    if (price > 99999999.99) {
      setPriceError('Price cannot exceed 99,999,999.99 ETB')
      return
    }
    
    setPriceError('') // Clear any previous errors

    try {
      setSubmitting(true)
      await orpcClient.driver.createOffer({
        orderId: incomingOrder.orderId,
        offeredPrice: price,
      })
      
      showAlert({ title: 'Success', message: 'Your offer has been submitted! The customer will review it.' })
      setIncomingOrder(null)
      setShowOfferModal(false)
      setOfferedPrice('')
    } catch (error: any) {
      showAlert({ title: 'Error', message: error.message || 'Failed to submit offer' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDismiss = () => {
    setIncomingOrder(null)
    setShowOfferModal(false)
    setOfferedPrice('')
  }

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>WebSocket Disconnected</Text>
        <Text style={styles.subtitle}>Please check your connection</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Driver Dashboard - Connected</Text>
      <Text style={styles.subtitle}>Waiting for new orders...</Text>
      
      <Modal
        visible={showOfferModal && incomingOrder !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Order Available</Text>
              <TouchableOpacity onPress={handleDismiss}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {incomingOrder && (
              <>
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.success} />
                    <Text style={styles.detailText}>{incomingOrder.pickupAddress}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.error} />
                    <Text style={styles.detailText}>{incomingOrder.deliveryAddress}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Truck size={16} color={colors.primary} />
                    <Text style={styles.detailText}>
                      {incomingOrder.vehicleType?.charAt(0).toUpperCase() + incomingOrder.vehicleType?.slice(1)}
                    </Text>
                  </View>
                  {incomingOrder.materials && (
                    <View style={styles.detailRow}>
                      <Package size={16} color={colors.warning} />
                      <Text style={styles.detailText}>
                        {Array.isArray(incomingOrder.materials) 
                          ? incomingOrder.materials.join(', ') 
                          : 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Your Offer (Birr)</Text>
                  <View style={[
                    styles.priceInputContainer,
                    priceError && { borderColor: '#EF4444', borderWidth: 2 }
                  ]}>
                    <DollarSign size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.priceInput}
                      value={offeredPrice}
                      onChangeText={(text) => {
                        setOfferedPrice(text)
                        // Clear error when user starts typing
                        if (priceError) setPriceError('')
                      }}
                      placeholder="Enter your price"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.currency}>ETB</Text>
                  </View>
                  {priceError ? (
                    <Text style={[styles.errorText, { color: '#EF4444' }]}>
                      {priceError}
                    </Text>
                  ) : (
                    <Text style={styles.hint}>
                      Enter your delivery charge (max: 99,999,999.99 ETB)
                    </Text>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleDismiss}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.submitButton, submitting && styles.buttonDisabled]}
                    onPress={handleSubmitOffer}
                    disabled={submitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {submitting ? 'Submitting...' : 'Submit Offer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  orderDetails: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  currency: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.errorLight,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
})
