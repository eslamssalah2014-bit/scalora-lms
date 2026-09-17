-- ==============================================================================
-- Supabase SQL Migration: Create Payments Table for Kashier Live & LMS Payments
-- Description: Creates the payments table, indexes, foreign keys, triggers, and
--              Row Level Security (RLS) policies for Scalora LMS.
-- Note: Uses quoted camelCase identifiers to match Prisma schema and PostgreSQL definitions.
-- ==============================================================================

-- 1. Create Payments Table (if not exists)
CREATE TABLE IF NOT EXISTS public.payments (
    "id" TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'EGP',
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    "provider" VARCHAR(30) NOT NULL DEFAULT 'KASHIER', -- 'KASHIER' | 'INSTAPAY' | 'MOCK' | 'STRIPE' | 'PAYMOB'
    "transactionId" VARCHAR(191) NOT NULL,
    "metadata" TEXT,
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT payments_transactionId_key UNIQUE ("transactionId"),
    CONSTRAINT fk_payments_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_course FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE
);

-- 2. Add refund and metadata columns if payments table already existed
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS "refundReason" TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS "metadata" TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS "provider" VARCHAR(30) NOT NULL DEFAULT 'KASHIER';

-- 3. Create Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_payments_userId ON public.payments("userId");
CREATE INDEX IF NOT EXISTS idx_payments_courseId ON public.payments("courseId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments("status");
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments("provider");
CREATE INDEX IF NOT EXISTS idx_payments_transactionId ON public.payments("transactionId");
CREATE INDEX IF NOT EXISTS idx_payments_createdAt ON public.payments("createdAt" DESC);

-- 4. Link payments to enrollments if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments' 
        AND column_name = 'paymentId'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_enrollments_payment'
        ) THEN
            ALTER TABLE public.enrollments 
            ADD CONSTRAINT fk_enrollments_payment 
            FOREIGN KEY ("paymentId") REFERENCES public.payments(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 5. Auto-update updatedAt timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payments_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Policy A: Students can view their own payment records
DROP POLICY IF EXISTS "Students can view their own payments" ON public.payments;
CREATE POLICY "Students can view their own payments"
    ON public.payments
    FOR SELECT
    USING (
        auth.uid()::text = "userId"
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
