-- Location hierarchy: District → Sub-district (14 Kerala districts)
-- Run after schema.sql

-- Districts
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sub-districts
CREATE TABLE sub_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(district_id, name)
);

-- RLS
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read sub_districts" ON sub_districts FOR SELECT USING (true);

-- Update listings
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_locality_id_fkey;
ALTER TABLE listings DROP COLUMN IF EXISTS locality_id;
ALTER TABLE listings ADD COLUMN sub_district_id UUID REFERENCES sub_districts(id);
CREATE INDEX idx_listings_active ON listings(sub_district_id, status, rent_min) WHERE status = 'active';
DROP INDEX IF EXISTS idx_listings_locality;

-- Drop old localities
DROP TABLE IF EXISTS localities CASCADE;

-- SEED: 14 Kerala Districts + Major Sub-Districts

INSERT INTO districts (name) VALUES
  ('Thiruvananthapuram'),('Kollam'),('Pathanamthitta'),('Alappuzha'),
  ('Kottayam'),('Idukki'),('Ernakulam'),('Thrissur'),('Palakkad'),
  ('Malappuram'),('Kozhikode'),('Wayanad'),('Kannur'),('Kasaragod');

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Thiruvananthapuram'),('Neyyattinkara'),('Attingal'),('Nedumangad'),('Varkala'),('Parassala')
) s(name) WHERE d.name = 'Thiruvananthapuram';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kollam'),('Punalur'),('Kottarakkara'),('Kayamkulam'),('Karunagappally'),('Chavara')
) s(name) WHERE d.name = 'Kollam';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Pathanamthitta'),('Thiruvalla'),('Pandalam'),('Adoor'),('Ranni'),('Elappara')
) s(name) WHERE d.name = 'Pathanamthitta';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Alappuzha'),('Cherthala'),('Kayamkulam'),('Mavelikara'),('Chengannur'),('Ambalapuzha'),('Kuttanad')
) s(name) WHERE d.name = 'Alappuzha';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kottayam'),('Pala'),('Changanassery'),('Kanjirapally'),('Vaikom'),('Meenachil'),('Kumarakom')
) s(name) WHERE d.name = 'Kottayam';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Idukki'),('Munnar'),('Thodupuzha'),('Kattappana'),('Nedumkandam'),('Peerumade')
) s(name) WHERE d.name = 'Idukki';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kakkanad'),('Edappally'),('Aluva'),('Perumbavoor'),('Muvattupuzha'),('Kothamangalam'),('Fort Kochi'),('Palarivattom'),('Vyttila'),('Kaloor'),('Mattancherry'),('North Paravur')
) s(name) WHERE d.name = 'Ernakulam';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Thrissur'),('Chalakudy'),('Kodungallur'),('Irinjalakuda'),('Guruvayur'),('Chavakkad'),('Kunnamkulam'),('Mala')
) s(name) WHERE d.name = 'Thrissur';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Palakkad'),('Chittur'),('Ottapalam'),('Shornur'),('Mannarkkad'),('Malampuzha'),('Pattambi')
) s(name) WHERE d.name = 'Palakkad';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Malappuram'),('Manjeri'),('Perinthalmanna'),('Ponnani'),('Tirur'),('Kottakkal'),('Nilambur'),('Kondotty')
) s(name) WHERE d.name = 'Malappuram';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kozhikode'),('Vadakara'),('Koyilandy'),('Ramanattukara'),('Feroke'),('Perambra')
) s(name) WHERE d.name = 'Kozhikode';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kalpetta'),('Sultan Bathery'),('Mananthavady'),('Vythiri'),('Meppadi')
) s(name) WHERE d.name = 'Wayanad';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kannur'),('Thalassery'),('Thaliparamba'),('Payyannur'),('Mattannur'),('Kuthuparamba'),('Dharmadom')
) s(name) WHERE d.name = 'Kannur';

INSERT INTO sub_districts (district_id, name) SELECT d.id, s.name FROM districts d
CROSS JOIN (VALUES
  ('Kasaragod'),('Kanhangad'),('Nileshwar'),('Manjeshwar'),('Bekal'),('Uduma')
) s(name) WHERE d.name = 'Kasaragod';
