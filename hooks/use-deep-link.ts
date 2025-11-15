import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export function useDeepLinkHandler() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Handle initial URL when app is opened from deep link
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    // Handle deep links when app is already running
    const handleURLChange = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    // Set up listeners
    const subscription = Linking.addEventListener('url', handleURLChange);

    // Handle initial URL
    handleInitialURL();

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    try {
      console.log('Handling deep link:', url);

      // Parse the URL
      const parsedUrl = new URL(url);

      // Handle different deep link patterns
      if (parsedUrl.protocol === 'mitra-klikquick:') {
        // Custom scheme deep links
        handleCustomSchemeDeepLink(parsedUrl);
      } else if (parsedUrl.hostname.includes('satu-kurir') || parsedUrl.hostname.includes('kurir-apps')) {
        // Universal links
        handleUniversalDeepLink(parsedUrl);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  const handleCustomSchemeDeepLink = (url: URL) => {
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);

    console.log('Custom scheme deep link:', { path, params });

    // Navigate based on path
    switch (path) {
      case '/login':
        router.replace('/auth/login');
        break;
      case '/home':
        router.replace('/(tabs)');
        break;
      case '/contacts':
        router.replace('/(tabs)/kontak');
        break;
      case '/balance':
        router.replace('/(tabs)/saldo');
        break;
      case '/transactions':
        router.replace('/(tabs)/transaksi');
        break;
      case '/manual-transactions':
        router.replace('/transaksi-manual');
        break;
      case '/live-orders':
        router.replace('/live-order');
        break;
      case '/add-manual-transaction':
        router.replace('/transaksi-manual/tambah');
        break;
      case '/add-live-order':
        router.replace('/live-order/tambah');
        break;
      case '/add-contact':
        router.replace('/kontak/tambah');
        break;
      case '/top-up':
        router.replace('/saldo/top-up');
        break;
      case '/withdraw':
        router.replace('/saldo/withdraw');
        break;
      case '/transfer':
        router.replace('/saldo/transfer');
        break;
      default:
        // Handle dynamic routes
        handleDynamicRoutes(path, params);
        break;
    }
  };

  const handleUniversalDeepLink = (url: URL) => {
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);

    console.log('Universal deep link:', { path, params });

    // Similar logic as custom scheme but for web URLs
    handleCustomSchemeDeepLink(url);
  };

  const handleDynamicRoutes = (path: string, params: Record<string, string>) => {
    // Handle routes with parameters
    if (path.startsWith('/contact/')) {
      const id = path.split('/contact/')[1];
      router.replace({
        pathname: '/kontak/detail',
        params: { contact: JSON.stringify({ id_konsumen: id }) }
      });
    } else if (path.startsWith('/manual-transaction/')) {
      const id = path.split('/manual-transaction/')[1];
      // Navigate to transaction detail - you'll need to implement this
      console.log('Navigate to manual transaction:', id);
    } else if (path.startsWith('/live-order/')) {
      const id = path.split('/live-order/')[1];
      router.replace({
        pathname: '/live-order/detail',
        params: { id: id }
      });
    } else if (path.startsWith('/order/')) {
      const id = path.split('/order/')[1];
      // Navigate to order detail - you'll need to implement this
      console.log('Navigate to order:', id);
    } else if (path.startsWith('/confirm-top-up/')) {
      const id = path.split('/confirm-top-up/')[1];
      router.replace({
        pathname: '/saldo/confirm-top-up',
        params: { id: id }
      });
    } else {
      console.log('Unknown deep link path:', path);
    }
  };

  return {
    // You can return functions to manually handle deep links if needed
    handleDeepLink,
  };
}
