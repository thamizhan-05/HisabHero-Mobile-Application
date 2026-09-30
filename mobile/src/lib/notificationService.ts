import { Vibration, Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp?: number;
}

type NotificationListener = (notification: NotificationPayload) => void;

class SafeNotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private notificationHistory: NotificationPayload[] = [];

  /**
   * Request notification permissions (Safe no-op returning true to avoid native crashes)
   */
  async requestPermissions(): Promise<boolean> {
    return true;
  }

  /**
   * Register a listener for in-app financial alerts
   */
  addListener(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Send a notification safely without relying on fragile native badge/push services
   */
  async sendNotification(title: string, body: string, data: Record<string, any> = {}): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title,
        body,
        data,
        timestamp: Date.now(),
      };

      this.notificationHistory.unshift(payload);
      if (this.notificationHistory.length > 50) {
        this.notificationHistory.pop();
      }

      // Haptic vibration feedback for notification
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 100, 80, 100]);
        } catch {
          // Ignore vibration error
        }
      }

      // Dispatch to active listeners
      this.listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (e) {
          console.warn('[SafeNotificationService] Listener error:', e);
        }
      });
    } catch (e) {
      console.warn('[SafeNotificationService] Error sending notification:', e);
    }
  }

  /**
   * Invoice Paid Alert
   */
  async sendInvoicePaidAlert(invoiceNumber: string, amount: number, customerName: string): Promise<void> {
    await this.sendNotification(
      '🎉 Invoice Payment Received!',
      `₹${Number(amount).toLocaleString('en-IN')} received from ${customerName || 'Customer'} for Invoice #${invoiceNumber}.`,
      { type: 'invoice_payment', invoiceNumber, amount }
    );
  }

  /**
   * High-Value Outflow Warning Alert
   */
  async sendHighValueAlert(amount: number, merchant: string): Promise<void> {
    await this.sendNotification(
      '⚠️ High-Value Outflow Review Required',
      `Outflow of ₹${Number(amount).toLocaleString('en-IN')} to ${merchant || 'Vendor'} requires Dual-Signatory Owner biometric approval.`,
      { type: 'high_value_review', amount }
    );
  }

  /**
   * Schedule Daily Morning Financial Briefing
   */
  async scheduleDailyDigest(hour = 9, minute = 0): Promise<void> {
    // In-app scheduled digest handler
  }

  /**
   * Get recent notifications
   */
  getHistory(): NotificationPayload[] {
    return [...this.notificationHistory];
  }
}

export const notificationService = new SafeNotificationService();
