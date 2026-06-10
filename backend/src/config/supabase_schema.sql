-- Supabase Schema for Unifind

-- 1. สร้างตาราง USERS (ถ้าไม่ได้ใช้ Supabase Auth ทั้งหมด แต่ต้องการเก็บข้อมูลเพิ่มเติม)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- กรณีใช้ Supabase Auth, id จะเป็น auth.uid()
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. สร้างตาราง CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
);

-- เพิ่มข้อมูลตั้งต้น (Seed) ให้ Categories
INSERT INTO public.categories (name, icon) VALUES 
('Electronics', 'laptop'),
('Documents', 'file-text'),
('Clothing', 'shirt'),
('Accessories', 'watch'),
('Other', 'box')
ON CONFLICT DO NOTHING;

-- 3. สร้างตาราง LOCATIONS
CREATE TABLE IF NOT EXISTS public.locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- เพิ่มข้อมูลตั้งต้นให้ Locations
INSERT INTO public.locations (name, description) VALUES 
('อาคารเรียน 1', 'ห้องเรียนและลานกว้าง'),
('ห้องสมุด', 'โซนอ่านหนังสือและที่นั่งทำคอม'),
('โรงอาหาร', 'บริเวณโต๊ะทานข้าวและร้านอาหาร'),
('ลานจอดรถ', 'ลานจอดรถมอเตอร์ไซค์และรถยนต์')
ON CONFLICT DO NOTHING;

-- 4. สร้างตาราง ITEMS
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id INT REFERENCES public.categories(id),
  location_id INT REFERENCES public.locations(id),
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
  image_url TEXT,
  date_found_or_lost DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. สร้างตาราง CLAIMS
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_description TEXT,
  proof_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ตั้งค่า Row Level Security (RLS) เพื่อความปลอดภัยเบื้องต้น
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- นโยบายตัวอย่าง (ให้ทุกคนดู categories, locations, items ได้)
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Locations are viewable by everyone." ON public.locations FOR SELECT USING (true);
CREATE POLICY "Items are viewable by everyone." ON public.items FOR SELECT USING (true);

-- อนุญาตให้เพิ่ม Items ถ้าผู้ใช้ล็อกอิน (สมมติว่าใช้ authenticated)
-- CREATE POLICY "Individuals can create items." ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
