import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.79:8000';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  category_id: number;
  created_at: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type ProductMenuProps = {
  userId: number;
  userName: string;
  userBalance: number;
  onLogout: () => void;
  onOpenHistory: () => void;
};

export default function ProductMenu({
  userId,
  userName,
  userBalance,
  onLogout,
  onOpenHistory,
}: ProductMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/products/?active_only=true`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'No se pudieron obtener los productos.',
        );
      }

      setProducts(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      Alert.alert('Error al cargar productos', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refreshProducts = () => {
    setIsRefreshing(true);
    loadProducts();
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Producto agotado');
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          Alert.alert(
            'Stock insuficiente',
            `Solo hay ${product.stock} unidades disponibles.`,
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const decreaseQuantity = (productId: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId,
      ),
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0,
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }, [cart]);

  const confirmPurchase = async () => {
    if (cart.length === 0) {
      Alert.alert(
        'Carrito vacío',
        'Agrega al menos un producto.',
      );

      return;
    }

    Alert.alert(
      'Confirmar compra',
      `Total: $${cartTotal.toFixed(2)}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Comprar',
          onPress: createOrder,
        },
      ],
    );
  };

  const createOrder = async () => {
    try {
      setIsBuying(true);

      const response = await fetch(
        `${API_URL}/orders/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            items: cart.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
            })),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'No se pudo crear la orden.',
        );
      }

      Alert.alert(
        'Compra realizada',
        `Pedido #${data.id}\nTotal: $${Number(
          data.total,
        ).toFixed(2)}\nEstado: ${data.status}`,
      );

      setCart([]);
      await loadProducts();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      Alert.alert(
        'No se pudo completar la compra',
        message,
      );
    } finally {
      setIsBuying(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const available = item.stock > 0;

    const cartItem = cart.find(
      (cartProduct) =>
        cartProduct.product.id === item.id,
    );

    return (
      <View style={styles.productCard}>
        <View style={styles.productInformation}>
          <Text style={styles.productName}>
            {item.name}
          </Text>

          <Text style={styles.productDescription}>
            {item.description || 'Sin descripción'}
          </Text>

          <Text style={styles.productPrice}>
            ${item.price.toFixed(2)}
          </Text>

          <Text
            style={[
              styles.stockText,
              !available && styles.outOfStockText,
            ]}
          >
            {available
              ? `Disponibles: ${item.stock}`
              : 'Producto agotado'}
          </Text>

          {cartItem && (
            <Text style={styles.inCartText}>
              En carrito: {cartItem.quantity}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            !available && styles.disabledButton,
          ]}
          disabled={!available}
          onPress={() => addToCart(item)}
        >
          <Text style={styles.addButtonText}>
            {available ? 'Agregar' : 'Agotado'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Cargando productos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
  <View style={styles.header}>
    <View style={styles.headerInfo}>
      <Text style={styles.title}>
        Cafetería Escolar
      </Text>

      <Text style={styles.welcomeText}>
        Bienvenido, {userName}
      </Text>

      <Text style={styles.balanceText}>
        Saldo: ${userBalance.toFixed(2)}
      </Text>
    </View>

    <View style={styles.headerButtons}>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={onOpenHistory}
      >
        <Text style={styles.headerButtonText}>
          Pedidos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text style={styles.headerButtonText}>
          Salir
        </Text>
      </TouchableOpacity>
    </View>
  </View>

      <Text style={styles.sectionTitle}>
        Productos disponibles
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProducts}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No hay productos
            </Text>

            <Text style={styles.emptyText}>
              Registra productos desde Swagger.
            </Text>
          </View>
        }
      />

      <View style={styles.cartPanel}>
        <Text style={styles.cartTitle}>
          Carrito ({cartCount})
        </Text>

        {cart.length === 0 ? (
          <Text style={styles.emptyCartText}>
            Todavía no agregas productos.
          </Text>
        ) : (
          <ScrollView
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
          >
            {cart.map((item) => (
              <View
                key={item.product.id}
                style={styles.cartItem}
              >
                <View style={styles.cartItemInformation}>
                  <Text style={styles.cartItemName}>
                    {item.product.name}
                  </Text>

                  <Text style={styles.cartItemSubtotal}>
                    ${(
                      item.product.price *
                      item.quantity
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      decreaseQuantity(
                        item.product.id,
                      )
                    }
                  >
                    <Text style={styles.quantityButtonText}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      addToCart(item.product)
                    }
                  >
                    <Text style={styles.quantityButtonText}>
                      +
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      removeFromCart(
                        item.product.id,
                      )
                    }
                  >
                    <Text style={styles.removeButtonText}>
                      Quitar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalValue}>
            ${cartTotal.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.buyButton,
            (cart.length === 0 || isBuying) &&
              styles.disabledButton,
          ]}
          disabled={
            cart.length === 0 || isBuying
          }
          onPress={confirmPurchase}
        >
          {isBuying ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buyButtonText}>
              Confirmar compra
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    color: '#59341f',
    fontSize: 25,
    fontWeight: 'bold',
  },

  welcomeText: {
    marginTop: 4,
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },

  balanceText: {
    marginTop: 3,
    color: '#6b5548',
    fontSize: 13,
  },

  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#b53a3a',
  },

  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 10,
    color: '#59341f',
    fontSize: 21,
    fontWeight: 'bold',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  productCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  productInformation: {
    flex: 1,
    paddingRight: 10,
  },

  productName: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'bold',
  },

  productDescription: {
    marginTop: 4,
    color: '#666666',
    fontSize: 13,
  },

  productPrice: {
    marginTop: 7,
    color: '#7a4b2a',
    fontSize: 17,
    fontWeight: 'bold',
  },

  stockText: {
    marginTop: 3,
    color: '#397443',
    fontSize: 12,
  },

  outOfStockText: {
    color: '#b53a3a',
  },

  inCartText: {
    marginTop: 4,
    color: '#375a8c',
    fontSize: 12,
    fontWeight: '600',
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: '#7a4b2a',
  },

  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.45,
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
    marginTop: 8,
    color: '#666666',
    textAlign: 'center',
  },

  cartPanel: {
    maxHeight: '45%',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4d8ce',
    backgroundColor: '#ffffff',
  },

  cartTitle: {
    color: '#59341f',
    fontSize: 20,
    fontWeight: 'bold',
  },

  emptyCartText: {
    marginTop: 8,
    color: '#777777',
  },

  cartList: {
    maxHeight: 150,
    marginTop: 8,
  },

  cartItem: {
    marginBottom: 9,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  cartItemInformation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cartItemName: {
    flex: 1,
    color: '#333333',
    fontWeight: '600',
  },

  cartItemSubtotal: {
    color: '#7a4b2a',
    fontWeight: 'bold',
  },

  quantityControls: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7a4b2a',
  },

  quantityButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  quantityText: {
    minWidth: 35,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },

  removeButton: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  removeButtonText: {
    color: '#b53a3a',
    fontWeight: 'bold',
  },

  totalRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  totalLabel: {
    color: '#333333',
    fontSize: 19,
    fontWeight: 'bold',
  },

  totalValue: {
    color: '#7a4b2a',
    fontSize: 20,
    fontWeight: 'bold',
  },

  buyButton: {
    marginTop: 12,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#397443',
  },

  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},

historyButton: {
  marginRight: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 9,
  backgroundColor: '#7a4b2a',
},

headerButtonText: {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 'bold',
},
});