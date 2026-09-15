-- ==============================================================================
-- Supabase SQL Migration: Create Payments Table for Kashier Live & LMS Payments
-- Description: Creates the payments table, indexes, foreign keys, triggers, and
--              Row Level Security (RLS) policies for Scalora LMS.
-- ==============================================================================

-- 1. Create Payments Table (if not exists)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    currency VARCHAR(10) NOT NULL DEFAULT 'EGP',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    provider VARCHAR(30) NOT NULL DEFAULT 'KASHIER', -- 'KASHIER' | 'INSTAPAY' | 'MOCK' | 'STRIPE' | 'PAYMOB'
    transaction_id VARCHAR(191) NOT NULL,
    metadata TEXT,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT payments_transaction_id_key UNIQUE (transaction_id),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- 2. Add refund columns if payments table already existed from previous setup
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. Create Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON public.payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- 4. Link payments to enrollments if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments' 
        AND column_name = 'payment_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_enrollments_payment'
        ) THEN
            ALTER TABLE public.enrollments 
            ADD CONSTRAINT fk_enrollments_payment 
            FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Policy A: Students can view their own payment records
DROP POLICY IF EXISTS "Students can view their own payments" ON public.payments;
CREATE POLICY "Students can view their own payments"
    ON public.payments
    FOR SELECT
    USING (
        auth.uid()::text = user_id
        OR
        (auth.jwt() ->> 'role') = 'ADMIN'
    );

-- Policy B: Admins have full access to view, update, and refund payments
DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
CREATE POLICY "Admins have full access to payments"
    ON public.payments
    FOR ALL
    USING (
        (auth.jwt() ->> 'role') = 'ADMIN'
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Policy C: Service role can manage all payments (Backend server access)
DROP POLICY IF EXISTS "Service role has complete control over payments" ON public.payments;
CREATE POLICY "Service role has complete control over payments"
    ON public.payments
    FOR ALL
    USING (current_setting('role') = 'service_role');

COMMENT ON TABLE public.payments IS 'Stores all processed LMS transactions across Kashier Live, InstaPay, and direct checkouts.';
