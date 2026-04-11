
ALTER TABLE public.profiles
ADD COLUMN health_conditions text[] DEFAULT '{}',
ADD COLUMN medications text[] DEFAULT '{}';
