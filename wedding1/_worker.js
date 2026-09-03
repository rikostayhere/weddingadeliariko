/**
 * Cloudflare Worker Backend untuk Undangan Pernikahan Riko & Adel
 * - Melayani API RSVP & Ucapan Doa terhubung ke Cloudflare D1 Database (env.DB)
 * - Melayani file statis web (HTML, gambar, audio) via env.ASSETS
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Header CORS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Tangani preflight OPTIONS request
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // Endpoint: /api/rsvp
        if (url.pathname === "/api/rsvp") {
            // Cari binding D1: dukung env.DB, env.wedding_db, env.db, atau objek D1 apapun di env
            const db = env.DB || env.wedding_db || env.db || env.DATABASE || 
                       Object.values(env || {}).find(v => v && typeof v.prepare === 'function');

            // Pastikan binding database D1 tersedia
            if (!db) {
                const detectedKeys = Object.keys(env || {}).filter(k => k !== 'ASSETS').join(", ") || "kosong";
                return new Response(
                    JSON.stringify({ 
                        success: false, 
                        error: `Database D1 belum terhubung. Variable di env yang terdeteksi: [${detectedKeys}]. Pastikan Variable Name diisi 'DB' dan lakukan 'Retry deployment' di tab Deployments.` 
                    }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // GET: Ambil daftar ucapan doa terbaru dari D1
            if (request.method === "GET") {
                try {
                    // Buat tabel otomatis jika belum ada
                    await db.prepare(`
                        CREATE TABLE IF NOT EXISTS rsvp (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            email TEXT NOT NULL,
                            message TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        );
                    `).run();

                    const { results } = await db.prepare(
                        "SELECT id, name, message, created_at FROM rsvp ORDER BY created_at DESC LIMIT 50"
                    ).all();

                    return new Response(JSON.stringify({ success: true, data: results || [] }), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ success: false, error: err.message }), {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
            }

            // POST: Simpan ucapan doa baru ke D1
            if (request.method === "POST") {
                try {
                    const body = await request.json();
                    const name = (body.name || "").trim();
                    const email = (body.email || "").trim();
                    const message = (body.message || "").trim();

                    if (!name || !message) {
                        return new Response(
                            JSON.stringify({ success: false, error: "Nama dan ucapan doa wajib diisi!" }),
                            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }

                    // Buat tabel jika belum ada
                    await db.prepare(`
                        CREATE TABLE IF NOT EXISTS rsvp (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            email TEXT NOT NULL,
                            message TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        );
                    `).run();

                    // Insert ke D1
                    await db.prepare(
                        "INSERT INTO rsvp (name, email, message, created_at) VALUES (?, ?, ?, datetime('now', '+7 hours'))"
                    ).bind(name, email, message).run();

                    return new Response(
                        JSON.stringify({ success: true, message: "Terima kasih atas ucapan dan doa restunya!" }),
                        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                } catch (err) {
                    return new Response(JSON.stringify({ success: false, error: err.message }), {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
            }

            return new Response("Method not allowed", { status: 405, headers: corsHeaders });
        }

        // Untuk rute selain /api/..., layani file statis (HTML, images, mp3)
        if (env.ASSETS) {
            return await env.ASSETS.fetch(request);
        }

        return new Response("Not found", { status: 404 });
    }
};
