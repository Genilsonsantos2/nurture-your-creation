-- Migration: Add WhatsApp Evolution API settings
DO $$ 
BEGIN 
    -- 1. Add whatsapp_api_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_api_url') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_api_url TEXT;
    END IF;

    -- 2. Add whatsapp_api_key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_api_key') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_api_key TEXT;
    END IF;

    -- 3. Add whatsapp_instance_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_instance_name') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_instance_name TEXT;
    END IF;

    -- 4. Add whatsapp_bot_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_bot_type') THEN
        ALTER TABLE public.settings ADD COLUMN whatsapp_bot_type TEXT DEFAULT 'manual'; -- 'manual' (wa.me) or 'evolution'
    END IF;
END $$;
