import { useState } from 'react';
import { Link } from 'react-router-dom';
import { escrowService } from '../services/escrowService';

/**
 * 🏛️ L'ATELIER - PRO COMMAND CENTER
 * Quebec-compliant dashboard for tradesmen.
 */

export function LAtelierPage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr');
    const [activeProjects, setActiveProjects] = useState([
        { id: '1', client: "Jean Dupont", task: "Réparation Tuyauterie", amount: 450, status: 'Locked', progress: 60 },
        { id: '2', client: "Marie Leblanc", task: "Installation Électrique", amount: 1200, status: 'Pending', progress: 20 },
        { id: '3', client: "Constructions Elite", task: "Consultation Structure", amount: 3500, status: 'Released', progress: 100 }
    ]);

    const totals = activeProjects.reduce((acc, p) => acc + p.amount, 0);
    const taxReserves = escrowService.calculateTaxReserves(totals);

    const handleRelease = (id: string) => {
        if (window.confirm(lang === 'fr' ? 'Libérer les fonds pour ce jalon ?' : 'Release funds for this milestone?')) {
            setActiveProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'Released', progress: 100 } : p));
            escrowService.releaseMilestone(id, 'M1');
        }
    };

    const t = {
        fr: {
            title: "L'Atelier",
            subtitle: "Centre de Commande Professionnel",
            revenue: "Revenus Totaux",
            escrow: "En Séquestre (Escrow)",
            taxes: "Réserves de Taxes (TPS/TVQ)",
            projects: "Projets Actifs",
            milestones: "Jalons & Paiements",
            statusLocked: "Fonds Verrouillés",
            statusReleased: "Libéré",
            statusPending: "En Attente",
            newProject: "Nouveau Contrat",
            reports: "Rapports Revenu Québec",
            actionRelease: "Libérer"
        },
        en: {
            title: "L'Atelier",
            subtitle: "Professional Command Center",
            revenue: "Total Revenue",
            escrow: "In Escrow",
            taxes: "Tax Reserves (GST/QST)",
            projects: "Active Projects",
            milestones: "Milestones & Payments",
            statusLocked: "Funds Locked",
            statusReleased: "Released",
            statusPending: "Pending",
            newProject: "New Contract",
            reports: "Revenu Québec Reports",
            actionRelease: "Release"
        }
    }[lang];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0C0A09", color: "#F8F2E8", fontFamily: "'Inter', sans-serif" }}>
            {/* Header / Sidebar Sim */}
            <nav style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 40px",
                background: "rgba(26, 15, 10, 0.95)",
                borderBottom: "1px solid #C9A34F"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <Link to="/" style={{ color: "#C9A34F", fontSize: "1.2rem", fontWeight: "bold", textDecoration: "none", fontFamily: "'Cinzel', serif" }}>
                        Q-EMPLOIS
                    </Link>
                    <span style={{ color: "#8B0000", fontWeight: "900", letterSpacing: "2px" }}>L'ATELIER</span>
                </div>

                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} style={{ background: "none", border: "1px solid #C9A34F", color: "#C9A34F", padding: "4px 8px", cursor: "pointer", borderRadius: "4px" }}>
                        {lang.toUpperCase()}
                    </button>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#C9A34F", display: "flex", justifyContent: "center", alignItems: "center", color: "#0C0A09", fontWeight: "bold" }}>
                        M
                    </div>
                </div>
            </nav>

            <main style={{ padding: "40px" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "2.5rem", fontFamily: "'Playfair Display', serif", marginBottom: "8px" }}>{t.title}</h1>
                    <p style={{ color: "#C9A34F", letterSpacing: "1px" }}>{t.subtitle}</p>
                </header>

                {/* Financial Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {[
                        { label: t.revenue, value: `$${totals.toLocaleString()}.00`, icon: "💰" },
                        { label: t.escrow, value: "$4,500.00", icon: "🔒" },
                        { label: t.taxes, value: `$${taxReserves.total.toFixed(2)}`, icon: "🏛️" }
                    ].map((card, i) => (
                        <div key={i} style={{
                            background: "rgba(30, 20, 15, 0.6)",
                            padding: "32px",
                            borderRadius: "12px",
                            border: "1px solid rgba(201, 163, 79, 0.2)",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        }}>
                            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>{card.icon}</div>
                            <div style={{ fontSize: "0.9rem", color: "#C9A34F", marginBottom: "8px", textTransform: "uppercase" }}>{card.label}</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Projects Section */}
                <section>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 style={{ fontSize: "1.8rem", fontFamily: "'Playfair Display', serif" }}>{t.projects}</h2>
                        <button style={{ padding: "12px 24px", background: "#C9A34F", color: "#0C0A09", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                            + {t.newProject}
                        </button>
                    </div>

                    <div style={{ background: "rgba(30, 20, 15, 0.4)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(201, 163, 79, 0.1)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: "rgba(201, 163, 79, 0.1)", color: "#C9A34F", fontSize: "0.85rem", textTransform: "uppercase" }}>
                                    <th style={{ padding: "16px" }}>Client</th>
                                    <th style={{ padding: "16px" }}>Task</th>
                                    <th style={{ padding: "16px" }}>Amount</th>
                                    <th style={{ padding: "16px" }}>Status</th>
                                    <th style={{ padding: "16px" }}>Progress</th>
                                    <th style={{ padding: "16px" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeProjects.map(p => (
                                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td style={{ padding: "16px", fontWeight: "bold" }}>{p.client}</td>
                                        <td style={{ padding: "16px", color: "#ddd" }}>{p.task}</td>
                                        <td style={{ padding: "16px" }}>${p.amount.toLocaleString()}</td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.75rem",
                                                background: p.status === 'Released' ? '#2BD47A' : p.status === 'Locked' ? '#B66D38' : '#444',
                                                color: "#fff"
                                            }}>
                                                {p.status === 'Locked' ? t.statusLocked : p.status === 'Released' ? t.statusReleased : t.statusPending}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ width: "120px", height: "6px", background: "#222", borderRadius: "3px" }}>
                                                <div style={{ width: `${p.progress}%`, height: "100%", background: "#C9A34F", borderRadius: "3px" }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            {p.status === 'Locked' && (
                                                <button
                                                    onClick={() => handleRelease(p.id)}
                                                    style={{ background: "none", border: "1px solid #2BD47A", color: "#2BD47A", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>
                                                    {t.actionRelease}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Reporting CTA */}
                <div style={{ marginTop: "40px", padding: "32px", background: "linear-gradient(135deg, #1a0f0a 0%, #0C0A09 100%)", borderRadius: "12px", border: "1px solid #8B0000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ marginBottom: "8px" }}>{t.reports}</h3>
                        <p style={{ color: "#888", fontSize: "0.9rem" }}>Générez vos fichiers JSON/XML pour la déclaration de TVQ trimestrielle.</p>
                    </div>
                    <button style={{ border: "1px solid #8B0000", background: "none", color: "#8B0000", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                        Exporter
                    </button>
                </div>
            </main>
        </div>
    );
}

export default LAtelierPage;
