-- Skema Database Cloudflare D1 untuk RSVP & Ucapan Doa Pernikahan
CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk mempercepat query ucapan terbaru
CREATE INDEX IF NOT EXISTS idx_rsvp_created_at ON rsvp(created_at DESC);
