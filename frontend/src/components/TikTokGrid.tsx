import { useState } from 'react';

interface TikTokCardProps {
    id: string;
    thumbnail: string;
    caption: string;
    views: string;
}

export function TikTokGrid() {
    const [lang] = useState<'fr' | 'en'>('fr'); // Simplified heritage

    const videos: TikTokCardProps[] = [
        { id: '1', thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=80', caption: 'Comment j\'ai trouvé ma première job de livraison en 2 min 👋', views: '12.4K' },
        { id: '2', thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80', caption: 'L\'Atelier change tout pour les pros du Québec 🛠️', views: '45.2K' },
        { id: '3', thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80', caption: 'Parlons de l\'IA Max sur WhatsApp 📱', views: '8.9K' },
        { id: '4', thumbnail: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=400&q=80', caption: 'Libération des fonds sécurisée ! 🔒', views: '21.5K' }
    ];

    return (
        <section style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "2rem", fontFamily: "'Playfair Display', serif", color: "#F2D4B6", marginBottom: "40px", textAlign: "center" }}>
                {lang === 'fr' ? "La Communauté en Action" : "Community in Action"}
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "24px"
            }}>
                {videos.map(v => (
                    <div key={v.id} style={{
                        position: "relative",
                        aspectRatio: "9/16",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backgroundColor: "#000",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
                        cursor: "pointer",
                        border: "1px solid rgba(201,163,79,0.2)",
                        transition: "transform 0.3s ease"
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <img src={v.thumbnail} alt={v.caption} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />

                        {/* Overlay */}
                        <div style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "20px",
                            background: "linear-gradient(transparent, rgba(0,0,0,0.9))"
                        }}>
                            <p style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px", lineHeight: "1.4" }}>{v.caption}</p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#C9A34F" }}>
                                <span>▶ {v.views} views</span>
                                <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px" }}>#QEMPLOIS</span>
                            </div>
                        </div>

                        {/* TikTok Icon Placeholder */}
                        <div style={{ position: "absolute", top: "20px", right: "20px", opacity: 0.8 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.94-.93 3.88-2.61 4.88-2.73 1.63-6.42.92-8.31-1.57-1.89-2.49-1.39-6.3 1.25-8.15 1.57-1.12 3.69-1.3 5.5-.66.08-1.55.03-3.11.03-4.66-2.6-.7-5.32-.23-7.51 1.4-2.18 1.63-3.41 4.31-3.23 7.03.17 2.72 1.83 5.23 4.28 6.46 2.45 1.23 5.48 1.05 7.73-.49 2.25-1.54 3.4-4.22 3.39-6.93V.02z" /></svg>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <button style={{
                    padding: "12px 32px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #C9A34F",
                    color: "#C9A34F",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A34F"; e.currentTarget.style.color = "#000"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C9A34F"; }}
                >
                    {lang === 'fr' ? "Suivez-nous sur TikTok" : "Follow us on TikTok"}
                </button>
            </div>
        </section>
    );
}
