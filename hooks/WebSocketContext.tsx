import React, { createContext, useContext } from 'react'
import { useWebSocket } from './websocket/connect'

interface WebSocketContextType {
  orpcClient: any | null
  connected: boolean
  reconnectAttempts: number
  websocket: WebSocket | null
  // *** NEW: Assigned order from WebSocket push
  assignedOrder: any | null
  setAssignedOrder: (order: any | null) => void
  // *** NEW: Order updates from WebSocket push
  orderUpdate: any | null
  setOrderUpdate: (update: any | null) => void
  connect: () => void
  disconnect: () => void
  forceReconnect: () => void
  isAppActive: boolean
  lastDisconnectReason: string
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    orpcClient, 
    connected, 
    reconnectAttempts, 
    websocket, 
    assignedOrder, 
    setAssignedOrder, 
    orderUpdate, 
    setOrderUpdate, 
    connect, 
    disconnect,
    forceReconnect,
    isAppActive,
    lastDisconnectReason
  } = useWebSocket()

  return (
    <WebSocketContext.Provider value={{
      orpcClient,
      connected,
      reconnectAttempts,
      websocket,
      assignedOrder,
      setAssignedOrder,
      orderUpdate,
      setOrderUpdate,
      connect,
      disconnect,
      forceReconnect,
      isAppActive,
      lastDisconnectReason
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext)
  if (!context) {
    // Return default context instead of throwing error
    return {
      orpcClient: null,
      connected: false,
      reconnectAttempts: 0,
      websocket: null,
      assignedOrder: null,
      setAssignedOrder: () => {},
      orderUpdate: null,
      setOrderUpdate: () => {},
      connect: () => {},
      disconnect: () => {},
      forceReconnect: () => {},
      isAppActive: true,
      lastDisconnectReason: ''
    }
  }
  return context
}
