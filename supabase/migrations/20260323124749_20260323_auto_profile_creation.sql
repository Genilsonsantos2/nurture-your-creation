/*
  # Auto-create profile on user signup

  1. Changes
    - Create trigger function to automatically create profile when new user signs up
    - Attach trigger to auth.users table
    - This ensures every user has a profile record with proper role assignment

  2. Security
    - Uses trigger to enforce data consistency
    - Profile inherits user email and metadata
    - Role defaults to 'Funcionário' as per existing setup
*/

-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role_label
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Funcionário'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create trigger
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();