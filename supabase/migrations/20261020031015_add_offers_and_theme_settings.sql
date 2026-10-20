CREATE TABLE IF NOT EXISTS public.offers_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  badge varchar(100),
  description text,
  type varchar(30) NOT NULL DEFAULT 'text_card' CHECK (type IN ('text_card', 'banner_image')),
  banner_url text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_original numeric(10,2),
  price_current numeric(10,2),
  currency varchar(10) NOT NULL DEFAULT 'ر.س',
  cta_text varchar(100) NOT NULL DEFAULT 'طلب الباقة عبر واتساب',
  whatsapp_message_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT offers_packages_dates_valid CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT offers_packages_features_array CHECK (jsonb_typeof(features) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_offers_packages_active_order
  ON public.offers_packages (is_active, display_order ASC);

CREATE TABLE IF NOT EXISTS public.app_theme_settings (
  id varchar(50) PRIMARY KEY DEFAULT 'current_settings',
  active_theme varchar(50) NOT NULL DEFAULT 'default',
  force_theme_override boolean NOT NULL DEFAULT false,
  enable_time_greetings boolean NOT NULL DEFAULT true,
  enable_offers_section boolean NOT NULL DEFAULT true,
  custom_greetings_override jsonb,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT app_theme_settings_singleton CHECK (id = 'current_settings')
);

INSERT INTO public.app_theme_settings (id)
VALUES ('current_settings')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.offers_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_theme_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Offers" ON public.offers_packages;
CREATE POLICY "Public Read Active Offers"
  ON public.offers_packages FOR SELECT
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

DROP POLICY IF EXISTS "Public Read Theme Settings" ON public.app_theme_settings;
CREATE POLICY "Public Read Theme Settings"
  ON public.app_theme_settings FOR SELECT USING (true);

GRANT SELECT ON public.offers_packages, public.app_theme_settings TO anon, authenticated;
GRANT ALL ON public.offers_packages, public.app_theme_settings TO service_role;
