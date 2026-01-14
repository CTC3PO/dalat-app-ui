import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import type { NotificationMode } from '@/lib/types';

// Configure VAPID details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:hello@dalat.app`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badgeCount?: number;
  requireInteraction?: boolean;
  notificationId?: string;
  notificationMode?: NotificationMode;
  actions?: Array<{
    action: string;
    title: string;
    url?: string;
  }>;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number; message?: string };

    // 410 Gone or 404 means subscription is no longer valid
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      return { success: false, error: 'subscription_expired' };
    }

    console.error('Push notification error:', webPushError.message);
    return { success: false, error: webPushError.message };
  }
}

/**
 * Send push notification to all of a user's devices
 * Returns count of successful sends and cleans up expired subscriptions
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = await createClient();

  // Get all subscriptions for this user (using service role bypasses RLS)
  // Include notification_mode to pass to service worker
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, notification_mode')
    .eq('user_id', userId);

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  // Send to all subscriptions in parallel
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      // Include notification mode and badge count in payload
      const payloadWithMode: PushNotificationPayload = {
        ...payload,
        badgeCount: payload.badgeCount ?? 1,
        notificationMode: (sub.notification_mode as NotificationMode) || 'sound_and_vibration',
      };

      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payloadWithMode
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error === 'subscription_expired') {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }

  return { sent, failed };
}

/**
 * Update badge count for all of a user's devices
 */
export async function updateBadgeCount(
  userId: string,
  count: number
): Promise<void> {
  await sendPushToUser(userId, {
    title: '',
    body: '',
    badgeCount: count,
    tag: 'badge-update',
  });
}
