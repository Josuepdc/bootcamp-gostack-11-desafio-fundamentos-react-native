import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsJSON = await AsyncStorage.getItem(
        '@GoMarketplace:cartProducts',
      );

      if (productsJSON) {
        setProducts(JSON.parse(productsJSON));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(item => {
        if (item.id === id) {
          const updatedProduct: Product = {
            ...item,
            quantity: item.quantity + 1,
          };
          return updatedProduct;
        }
        return item;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products
        .map(item => {
          if (item.id === id) {
            const updatedProduct: Product = {
              ...item,
              quantity: item.quantity - 1,
            };
            return updatedProduct;
          }
          return item;
        })
        .filter(item => item.quantity !== 0);

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const foundProduct = products.find(item => item.id === product.id);

      if (foundProduct) {
        increment(foundProduct.id);
      } else {
        const newProduct: Product = {
          ...product,
          quantity: 1,
        };
        const updatedProducts = [...products, newProduct];

        setProducts(updatedProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:cartProducts',
          JSON.stringify(updatedProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
