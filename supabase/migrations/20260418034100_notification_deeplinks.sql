-- Add deep-link and transaction reference to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

-- Notification click log for audit/dispute tracking
CREATE TABLE IF NOT EXISTS public.notification_click_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_click_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own click logs." ON public.notification_click_logs;
CREATE POLICY "Users can insert own click logs." ON public.notification_click_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own click logs." ON public.notification_click_logs;
CREATE POLICY "Users can view own click logs." ON public.notification_click_logs
  FOR SELECT USING (auth.uid() = user_id);
