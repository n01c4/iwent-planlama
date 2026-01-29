import { getSupabaseClient, isSupabaseConfigured } from './supabase.js';

// Types for broadcast payloads
export interface BroadcastMessagePayload {
  id: string;
  chatRoomId: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  replyTo: {
    id: string;
    content: string;
    senderName: string | null;
  } | null;
  createdAt: string;
}

export interface BroadcastTypingPayload {
  userId: string;
  userName: string | null;
  isTyping: boolean;
}

export interface BroadcastReadReceiptPayload {
  userId: string;
  messageId: string | null;
  readAt: string;
}

export interface BroadcastPresencePayload {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

class RealtimeService {
  /**
   * Broadcast new message to chat room channel
   * Channel format: chat:{chatId}
   */
  async broadcastMessage(chatRoomId: string, message: BroadcastMessagePayload): Promise<void> {
    if (!isSupabaseConfigured()) {
      // Supabase not configured, skip broadcast
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`chat:${chatRoomId}`);

      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });

      // Unsubscribe after sending
      await supabase.removeChannel(channel);
    } catch (error) {
      console.error('[Realtime] Failed to broadcast message:', error);
    }
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTyping(chatRoomId: string, payload: BroadcastTypingPayload): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`chat:${chatRoomId}`);

      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload,
      });

      await supabase.removeChannel(channel);
    } catch (error) {
      console.error('[Realtime] Failed to broadcast typing:', error);
    }
  }

  /**
   * Broadcast read receipt
   */
  async broadcastReadReceipt(chatRoomId: string, payload: BroadcastReadReceiptPayload): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`chat:${chatRoomId}`);

      await channel.send({
        type: 'broadcast',
        event: 'read_receipt',
        payload,
      });

      await supabase.removeChannel(channel);
    } catch (error) {
      console.error('[Realtime] Failed to broadcast read receipt:', error);
    }
  }

  /**
   * Broadcast user presence (online/offline)
   * Channel format: user:{userId}
   */
  async broadcastPresence(payload: BroadcastPresencePayload): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`user:${payload.userId}`);

      await channel.send({
        type: 'broadcast',
        event: 'presence',
        payload,
      });

      await supabase.removeChannel(channel);
    } catch (error) {
      console.error('[Realtime] Failed to broadcast presence:', error);
    }
  }

  /**
   * Broadcast notification to user
   * Channel format: user:{userId}
   */
  async broadcastNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`user:${userId}`);

      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          ...notification,
          createdAt: new Date().toISOString(),
        },
      });

      await supabase.removeChannel(channel);
    } catch (error) {
      console.error('[Realtime] Failed to broadcast notification:', error);
    }
  }
}

export const realtimeService = new RealtimeService();
