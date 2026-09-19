import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request push and local notification permissions from user
   */
  requestPermissions: async (): Promise<boolean> => {
    try {
      const existing: any = await Notifications.getPermissionsAsync();
      let isGranted = existing.status === 'granted' || existing.granted === true;

      if (!isGranted) {
        const requested: any = await Notifications.requestPermissionsAsync();
        isGranted = requested.status === 'granted' || requested.granted === true;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'HisabHero Financial Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
        });
      }

      return isGranted;
    } catch (e) {
      console.warn('Failed to request notification permissions:', e);
      return false;
    }
  },

  /**
   * Send an immediate local push notification
   */
  sendNotification: async (title: string, body: string, data = {}): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          color: '#10b981',
        },
        trigger: null, // null means trigger immediately
      });
    } catch (e) {
      console.warn('Failed to trigger notification:', e);
    }
  },

  /**
   * Invoice Paid Alert
   */
  sendInvoicePaidAlert: async (invoiceNumber: string, amount: number, customerName: string): Promise<void> => {
    await notificationService.sendNotification(
      '🎉 Invoice Payment Received!',
      `₹${Number(amount).toLocaleString('en-IN')} received from ${customerName || 'Customer'} for Invoice #${invoiceNumber}.`,
      { type: 'invoice_payment', invoiceNumber, amount }
    );
  },

  /**
   * High-Value Outflow Warning Alert
   */
  sendHighValueAlert: async (amount: number, merchant: string): Promise<void> => {
    await notificationService.sendNotification(
      '⚠️ High-Value Outflow Review Required',
      `Outflow of ₹${Number(amount).toLocaleString('en-IN')} to ${merchant || 'Vendor'} requires Dual-Signatory Owner biometric approval.`,
      { type: 'high_value_review', amount }
    );
  },

  /**
   * Schedule Daily Morning CFO Financial Briefing (e.g. 9:00 AM)
   */
  scheduleDailyDigest: async (hour = 9, minute = 0): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 HisabHero Morning Financial Briefing',
          body: 'Your business cash runway and daily cash flow forecast are ready. Tap to view insights.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (e) {
      console.warn('Failed to schedule daily digest:', e);
    }
  }
};
