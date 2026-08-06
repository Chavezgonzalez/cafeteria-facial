import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.79:8000';

type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Order = {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type OrderHistoryProps = {
  userId: number;
  userName: string;
  onBack: () => void;
};

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  return translations[status] || status;
}

export default function OrderHistory({
  userId,
  userName,
  onBack,
}: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/orders/user/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'No se pudo cargar el historial.',
        );
      }

      setOrders(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const refreshOrders = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const date = new Date(item.created_at);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>
            Pedido #{item.id}
          </Text>

          <Text style={styles.status}>
            {translateStatus(item.status)}
          </Text>
        </View>

        <Text style={styles.date}>
          {date.toLocaleDateString()} —{' '}
          {date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        <View style={styles.separator} />

        {item.items.map((orderItem) => (
          <View
            key={orderItem.id}
            style={styles.itemRow}
          >
            <Text style={styles.itemText}>
              Producto #{orderItem.product_id} ×{' '}
              {orderItem.quantity}
            </Text>

            <Text style={styles.itemSubtotal}>
              ${Number(orderItem.subtotal).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalValue}>
            ${Number(item.total).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando historial...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>
            ← Menú
          </Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>
            Mis pedidos
          </Text>

          <Text style={styles.userName}>
            {userName}
          </Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={
          orders.length === 0
            ? styles.emptyList
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshOrders}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Todavía no tienes pedidos
            </Text>

            <Text style={styles.emptyText}>
              Realiza una compra y aparecerá aquí.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5eee8',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  backButton: {
    marginRight: 18,
    paddingVertical: 10,
  },

  backButtonText: {
    color: '#7a4b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },

  title: {
    color: '#59341f',
    fontSize: 25,
    fontWeight: 'bold',
  },

  userName: {
    marginTop: 3,
    color: '#666666',
    fontSize: 14,
  },

  list: {
    padding: 16,
  },

  orderCard: {
    marginBottom: 15,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  orderNumber: {
    color: '#333333',
    fontSize: 19,
    fontWeight: 'bold',
  },

  status: {
    color: '#7a4b2a',
    fontSize: 14,
    fontWeight: 'bold',
  },

  date: {
    marginTop: 6,
    color: '#777777',
    fontSize: 13,
  },

  separator: {
    marginVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  itemRow: {
    marginBottom: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  itemText: {
    color: '#444444',
  },

  itemSubtotal: {
    color: '#444444',
    fontWeight: '600',
  },

  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  totalLabel: {
    color: '#333333',
    fontSize: 17,
    fontWeight: 'bold',
  },

  totalValue: {
    color: '#7a4b2a',
    fontSize: 18,
    fontWeight: 'bold',
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#59341f',
    fontSize: 21,
    fontWeight: 'bold',
  },

  emptyText: {
    marginTop: 9,
    color: '#666666',
    textAlign: 'center',
  },
});