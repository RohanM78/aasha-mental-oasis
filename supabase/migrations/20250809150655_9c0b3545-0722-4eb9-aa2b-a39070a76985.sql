-- Ensure RLS remains enforced on patients table and remove any public SELECT access
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive public SELECT policy if present
DROP POLICY IF EXISTS "Public can check patient email existence" ON public.patients;