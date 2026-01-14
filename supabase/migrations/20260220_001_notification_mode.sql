-- Add notification_mode column to push_subscriptions
-- Allows users to control how notifications alert them per device

ALTER TABLE push_subscriptions
ADD COLUMN notification_mode text DEFAULT 'sound_and_vibration'
  CHECK (notification_mode IN ('sound_and_vibration', 'sound_only', 'vibration_only', 'silent'));

-- Users can update their own subscription preferences
CREATE POLICY "push_subscriptions_update_own"
ON push_subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
