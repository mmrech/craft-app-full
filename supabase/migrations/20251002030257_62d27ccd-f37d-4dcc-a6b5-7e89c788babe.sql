-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Delete existing documents with NULL user_id (no owner)
DELETE FROM public.clinical_extractions WHERE document_id IN (SELECT id FROM public.documents WHERE user_id IS NULL);
DELETE FROM public.pdf_extractions WHERE document_id IN (SELECT id FROM public.documents WHERE user_id IS NULL);
DELETE FROM public.documents WHERE user_id IS NULL;

-- Now make user_id NOT NULL for documents
ALTER TABLE public.documents
  ALTER COLUMN user_id SET NOT NULL;

-- Add user_id to clinical_extractions table
ALTER TABLE public.clinical_extractions
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to pdf_extractions table
ALTER TABLE public.pdf_extractions
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Update RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Public can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Public can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Public can update documents" ON public.documents;
DROP POLICY IF EXISTS "Public can delete documents" ON public.documents;

CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for clinical_extractions
DROP POLICY IF EXISTS "Public can view all extractions" ON public.clinical_extractions;
DROP POLICY IF EXISTS "Public can insert extractions" ON public.clinical_extractions;
DROP POLICY IF EXISTS "Public can delete extractions" ON public.clinical_extractions;

CREATE POLICY "Users can view extractions for their documents"
  ON public.clinical_extractions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = clinical_extractions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert extractions for their documents"
  ON public.clinical_extractions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = clinical_extractions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete extractions for their documents"
  ON public.clinical_extractions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = clinical_extractions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all extractions"
  ON public.clinical_extractions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for pdf_extractions
DROP POLICY IF EXISTS "Public can view extractions" ON public.pdf_extractions;
DROP POLICY IF EXISTS "Public can insert extractions" ON public.pdf_extractions;

CREATE POLICY "Users can view pdf extractions for their documents"
  ON public.pdf_extractions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = pdf_extractions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pdf extractions for their documents"
  ON public.pdf_extractions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = pdf_extractions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all pdf extractions"
  ON public.pdf_extractions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();