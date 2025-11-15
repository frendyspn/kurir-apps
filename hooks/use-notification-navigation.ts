import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useNotificationNavigation() {
  const router = useRouter();

  const handleNotificationNavigation = useCallback((remoteMessage: any) => {
    const { data } = remoteMessage;

    if (!data) return;

    console.log('🧭 Navigating based on notification:', data);

    // Example navigation logic based on notification type
    switch (data.type) {
      case 'new_order':
        // Navigate to live order detail
        if (data.order_id) {
          router.push(`/live-order/detail?id=${data.order_id}`);
        } else {
          router.push('/live-order');
        }
        break;

      case 'order_assigned':
        // Navigate to assigned order
        if (data.order_id) {
          router.push(`/live-order/detail?id=${data.order_id}`);
        } else {
          router.push('/live-order');
        }
        break;

      case 'order_completed':
        // Navigate to transaction detail
        if (data.transaction_id) {
          router.push(`/transaksi-manual/detail?id=${data.transaction_id}&from=notification`);
        } else {
          router.push('/transaksi-manual');
        }
        break;

      case 'payment_received':
        // Navigate to balance/saldo screen
        router.push('/saldo');
        break;

      case 'contact_request':
        // Navigate to contacts
        if (data.contact_id) {
          router.push(`/kontak/detail?id=${data.contact_id}`);
        } else {
          router.push('/kontak');
        }
        break;

      case 'system_notification':
        // Navigate to notifications or home
        router.push('/');
        break;

      default:
        console.log('Unknown notification type:', data.type);
        router.push('/');
    }
  }, [router]);

  return { handleNotificationNavigation };
}
