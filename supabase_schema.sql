-- ==============================================================================
-- RouteWise AI — Swiggy & Zomato Real-Time Delivery Schema for Supabase
-- Paste and Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create Profiles Table (Stores user roles: customer, driver, kitchen)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'driver', 'kitchen')) NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  cuisines TEXT[] NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Navi Mumbai',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  rating NUMERIC(2,1) DEFAULT 4.5,
  cost_for_two INT DEFAULT 400,
  prep_time_minutes INT DEFAULT 15,
  is_veg BOOLEAN DEFAULT FALSE,
  phone TEXT,
  image_url TEXT,
  badge TEXT,
  discount TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_veg BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2,1) DEFAULT 4.6,
  description TEXT,
  image_url TEXT,
  bestseller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT NOT NULL,
  customer_lat DOUBLE PRECISION NOT NULL,
  customer_lon DOUBLE PRECISION NOT NULL,
  restaurant_id TEXT REFERENCES public.restaurants(id),
  restaurant_name TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT DEFAULT 'Ramesh Kumar',
  driver_phone TEXT DEFAULT '+91 98201 44821',
  driver_vehicle TEXT DEFAULT 'Hero Splendor (MH-46-AZ-8921)',
  status TEXT CHECK (status IN ('placed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered')) DEFAULT 'placed',
  status_title TEXT DEFAULT 'Order Confirmed',
  status_message TEXT DEFAULT 'Restaurant has received your order.',
  delivery_otp VARCHAR(4) NOT NULL DEFAULT '4829',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 499,
  road_geometry JSONB DEFAULT '[]'::jsonb,
  estimated_mins INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Driver Locations Table (High-Speed Realtime Telemetry)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  order_id TEXT PRIMARY KEY,
  driver_id TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0.0,
  speed DOUBLE PRECISION DEFAULT 0.0,
  is_real_device BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Enable Supabase Realtime Replication
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable Row Level Security (RLS) with open demo policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read on restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Allow public read on menu_items" ON public.menu_items FOR SELECT USING (true);

CREATE POLICY "Allow public read on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Allow public all on driver_locations" ON public.driver_locations FOR ALL USING (true);

-- ==============================================================================
-- Seed Authentic Indian Restaurants & Menus
-- ==============================================================================
INSERT INTO public.restaurants (id, name, tagline, cuisines, address, locality, city, latitude, longitude, rating, cost_for_two, prep_time_minutes, is_veg, phone, image_url, badge, discount)
VALUES 
(
  'rest-behrouz-kharghar',
  'Behrouz Biryani',
  'Royal & Authentic Dum Biryani',
  ARRAY['Biryani', 'North Indian', 'Mughlai', 'Desserts'],
  'Shop 4, Crystal Plaza, Sector 7, Kharghar, Navi Mumbai 410210',
  'Sector 7, Kharghar',
  'Navi Mumbai',
  19.0358,
  73.0674,
  4.6,
  450,
  18,
  FALSE,
  '+91 22 6876 2100',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  'Bestseller',
  '20% OFF UPTO ₹100'
),
(
  'rest-dominos-vashi',
  'Domino''s Pizza',
  'Hot & Fresh Hand Tossed Pizzas',
  ARRAY['Pizza', 'Italian', 'Fast Food', 'Garlic Bread'],
  'Plot 12, Sector 17 Commercial Area, Vashi, Navi Mumbai 400703',
  'Sector 17, Vashi',
  'Navi Mumbai',
  19.0765,
  72.9992,
  4.4,
  400,
  15,
  FALSE,
  '+91 22 2789 5500',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'Super Fast 20m',
  '₹125 OFF ON ₹399'
),
(
  'rest-haldiram-nerul',
  'Haldiram''s Sweets & Restaurant',
  'Traditional Indian Mithai & Street Delights',
  ARRAY['North Indian', 'Street Food', 'Sweets', 'Chaat'],
  'Sector 28, Nerul West, Near Railway Station, Navi Mumbai 400706',
  'Sector 28, Nerul',
  'Navi Mumbai',
  19.0341,
  73.0142,
  4.5,
  350,
  14,
  TRUE,
  '+91 22 2770 1200',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  'Pure Veg',
  'FLAT 15% OFF'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Menu Items
INSERT INTO public.menu_items (id, restaurant_id, name, category, price, is_veg, rating, description, image_url, bestseller)
VALUES
(
  'item-bb-1',
  'rest-behrouz-kharghar',
  'Dum Gosht Biryani (Mutton)',
  'Biryani',
  499,
  FALSE,
  4.7,
  'Tender pieces of mutton slow cooked with aromatic long-grain Basmati rice, saffron, and royal spices.',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
  TRUE
),
(
  'item-bb-2',
  'rest-behrouz-kharghar',
  'Subz-e-Biryani (Veg Dum)',
  'Biryani',
  349,
  TRUE,
  4.5,
  'Fresh seasonal vegetables, paneer cubes, and basmati rice infused with whole cardamom and rose water.',
  'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&auto=format&fit=crop&q=80',
  TRUE
),
(
  'item-dom-1',
  'rest-dominos-vashi',
  'Farmhouse Pizza (Medium)',
  'Pizzas',
  429,
  TRUE,
  4.6,
  'Delightful combination of onion, crisp capsicum, grilled mushroom, and fresh juicy tomatoes.',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Demo Order
INSERT INTO public.orders (
  id, customer_name, customer_phone, customer_address, customer_lat, customer_lon,
  restaurant_id, restaurant_name, status, status_title, status_message, delivery_otp,
  total_amount, road_geometry
)
VALUES (
  'ZOM-84920',
  'Pooja Verma',
  '+91 98205 11920',
  'Flat 301, Sector 7, Utsav Chowk Circle, Kharghar, Navi Mumbai',
  19.0345,
  73.0678,
  'rest-behrouz-kharghar',
  'Behrouz Biryani',
  'out_for_delivery',
  'Rider On The Way',
  'Ramesh Kumar is en route with your hot food.',
  '4829',
  530,
  '[[19.0358, 73.0674], [19.0352, 73.0676], [19.0345, 73.0678]]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Driver Location
INSERT INTO public.driver_locations (order_id, driver_id, latitude, longitude, heading, speed, is_real_device)
VALUES ('ZOM-84920', 'driver-1', 19.0352, 73.0676, 45.0, 24.5, FALSE)
ON CONFLICT (order_id) DO NOTHING;
