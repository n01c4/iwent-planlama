import { env } from '../../../shared/config/index.js';

// =============================================================================
// FIREBASE PUSH NOTIFICATION PROVIDER
// =============================================================================

interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class FirebaseProvider {
  private initialized = false;
  private admin: any = null;

  /**
   * Initialize Firebase Admin SDK
   * Lazy initialization - only when first needed
   */
  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    // Check if Firebase config is available
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
      console.warn('[Firebase] Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    try {
      // Dynamic import to avoid issues when firebase-admin is not installed
      // @ts-ignore - firebase-admin is an optional dependency
      const firebaseAdmin = await import('firebase-admin').catch(() => null);

      if (!firebaseAdmin) {
        console.warn('[Firebase] firebase-admin not installed. Push notifications disabled.');
        return false;
      }

      const privateKey = env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

      this.admin = firebaseAdmin.default;

      if (!this.admin.apps.length) {
        this.admin.initializeApp({
          credential: this.admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            privateKey,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }

      this.initialized = true;
      console.log('[Firebase] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Firebase] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendPush(message: PushMessage): Promise<PushResult> {
    const isReady = await this.initialize();
    if (!isReady || !this.admin) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const fcmMessage = {
        token: message.token,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { imageUrl: message.imageUrl }),
        },
        data: message.data || {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'iwent_default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.admin.messaging().send(fcmMessage);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('[Firebase] Failed to send push:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendPushMultiple(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<{
    successCount: number;
    failureCount: number;
    results: PushResult[];
  }> {
    const isReady = await this.initialize();
    if (!isReady || !this.admin) {
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({ success: false, error: 'Firebase not initialized' })),
      };
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'iwent_default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        tokens,
      };

      const response = await this.admin.messaging().sendEachForMulticast(message);

      const results: PushResult[] = response.responses.map((res: any, index: number) => ({
        success: res.success,
        messageId: res.messageId,
        error: res.error?.message,
      }));

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      };
    } catch (error: any) {
      console.error('[Firebase] Failed to send multicast push:', error.message);
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({ success: false, error: error.message })),
      };
    }
  }

  /**
   * Subscribe tokens to a topic (e.g., event-{eventId})
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    const isReady = await this.initialize();
    if (!isReady || !this.admin) return false;

    try {
      await this.admin.messaging().subscribeToTopic(tokens, topic);
      return true;
    } catch (error: any) {
      console.error('[Firebase] Failed to subscribe to topic:', error.message);
      return false;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<PushResult> {
    const isReady = await this.initialize();
    if (!isReady || !this.admin) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await this.admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('[Firebase] Failed to send to topic:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export const firebaseProvider = new FirebaseProvider();
