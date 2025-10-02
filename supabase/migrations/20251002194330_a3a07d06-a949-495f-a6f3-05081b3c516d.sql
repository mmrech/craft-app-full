-- Add missing RLS policies for profiles table to prevent security warnings

-- Policy: Users can insert their own profile (used by handle_new_user trigger)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Only admins can delete profiles (prevents unauthorized deletions)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));