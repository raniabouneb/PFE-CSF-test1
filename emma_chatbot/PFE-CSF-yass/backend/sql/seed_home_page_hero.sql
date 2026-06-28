-- Hero page d’accueil : une ligne id = 1 (chemin public ou URL Cloudinary).
-- Idempotent : création table + insert si absent.

CREATE TABLE IF NOT EXISTS home_page_hero (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  background_image TEXT NOT NULL
);

INSERT INTO home_page_hero (id, background_image)
VALUES (1, '/images/image-hero-accueil.png')
ON CONFLICT (id) DO NOTHING;
