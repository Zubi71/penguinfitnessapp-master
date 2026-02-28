-- Add missing columns to community_event_participants table
ALTER TABLE public.community_event_participants 
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Update status constraint to include 'pending'
ALTER TABLE public.community_event_participants 
DROP CONSTRAINT IF EXISTS community_event_participants_status_check;

ALTER TABLE public.community_event_participants 
ADD CONSTRAINT community_event_participants_status_check 
CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled', 'pending'));

-- Add index for invoice_id
CREATE INDEX IF NOT EXISTS idx_community_event_participants_invoice_id ON public.community_event_participants(invoice_id);

-- Add index for payment_status
CREATE INDEX IF NOT EXISTS idx_community_event_participants_payment_status ON public.community_event_participants(payment_status);
