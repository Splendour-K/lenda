-- Add audit columns to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_used boolean DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz;

-- Expand status lifecycle: Requested → Accepted → Delivered → Returned
-- (otp is generated at Requested; lender accepts → Accepted; lender verifies OTP → Delivered)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN (
    'Requested',
    'Accepted',
    'Ongoing',
    'Delivered',
    'Returned',
    'Rejected',
    'Disputed'
  ));

-- Verification audit log table
CREATE TABLE IF NOT EXISTS public.verification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  attempted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  input_code text NOT NULL,
  is_success boolean NOT NULL,
  otp_attempts_at_time integer DEFAULT 0,
  attempted_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view verification logs." ON public.verification_logs;
CREATE POLICY "Participants can view verification logs." ON public.verification_logs
  FOR SELECT USING (auth.uid() = attempted_by);

DROP POLICY IF EXISTS "Authenticated users can insert logs." ON public.verification_logs;
CREATE POLICY "Authenticated users can insert logs." ON public.verification_logs
  FOR INSERT WITH CHECK (auth.uid() = attempted_by);
