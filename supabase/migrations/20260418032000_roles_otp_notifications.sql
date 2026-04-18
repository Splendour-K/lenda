-- Step 1: Add role column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'borrower';

-- Step 2: Add OTP code column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_code text;

-- Step 3: Expand the status check constraint to include 'Delivered'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('Requested', 'Accepted', 'Ongoing', 'Delivered', 'Returned', 'Rejected', 'Disputed'));

-- Step 4: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 5: RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
CREATE POLICY "Users can view own notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications." ON public.notifications;
CREATE POLICY "System can insert notifications." ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
CREATE POLICY "Users can update own notifications." ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
