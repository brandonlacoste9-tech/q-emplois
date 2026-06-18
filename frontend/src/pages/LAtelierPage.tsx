import { useState } from 'react';
import { Link } from 'react-router-dom';
import { escrowService } from '../services/escrowService';
import { BrandLogo } from '../components/BrandLogo';

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
        <div className="leather" style={{ minHeight: "100vh", color: "#D9B38C" }}>
            {/* Header */}
            <nav style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 40px",
                background: "rgba(31,47,63,0.92)",
                backdropFilter: "blur(12px)",
                borderBottom: "2px dashed rgba(217,179,140,0.2)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link to="/"><BrandLogo size="md" /></Link>
                    <span className="serif gold" style={{ fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontSize: "0.85rem" }}>L'Atelier</span>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} style={{ background: "transparent", border: "1px dashed rgba(217,179,140,0.35)", color: "#D9B38C", padding: "4px 12px", cursor: "pointer", borderRadius: "6px", fontFamily: "monospace", fontSize: 12 }}>
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <div className="serif" style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(145deg, #B87B44, #8B5E30)", display: "flex", justifyContent: "center", alignItems: "center", color: "#1F2F3F", fontWeight: "bold", border: "2px solid rgba(217,179,140,0.3)" }}>
                        M
                    </div>
                </div>
            </nav>

            <main style={{ padding: "40px" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 className="serif cream-hi" style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "8px" }}>{t.title}</h1>
                    <p className="body-f gold" style={{ letterSpacing: "1px" }}>{t.subtitle}</p>
                </header>

                {/* Financial Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {[
                        { label: t.revenue, value: `$${totals.toLocaleString()}.00`, icon: "💰" },
                        { label: t.escrow, value: "$4,500.00", icon: "🔒" },
                        { label: t.taxes, value: `$${taxReserves.total.toFixed(2)}`, icon: "🏛️" }
                    ].map((card, i) => (
                        <div key={i} className="stitch-box" style={{
                            background: "rgba(21,35,50,0.6)",
                            padding: "32px"
                        }}>
                            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>{card.icon}</div>
                            <div className="body-f gold" style={{ fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</div>
                            <div className="serif cream-hi" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Projects Section */}
                <section>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 className="serif cream-hi" style={{ fontSize: "1.8rem", fontWeight: 700 }}>{t.projects}</h2>
                        <button className="gold-btn" style={{ padding: "12px 24px", fontSize: 14 }}>
                            + {t.newProject}
                        </button>
                    </div>

                    <div className="stitch-box" style={{ background: "rgba(21,35,50,0.4)", overflow: "hidden", padding: 0 }}>
                        <table className="body-f" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr className="gold" style={{ background: "rgba(184,123,68,0.12)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(217,179,140,0.08)" }}>
                                        <td className="cream-hi" style={{ padding: "16px", fontWeight: "bold" }}>{p.client}</td>
                                        <td className="muted" style={{ padding: "16px" }}>{p.task}</td>
                                        <td className="cream" style={{ padding: "16px" }}>${p.amount.toLocaleString()}</td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.75rem",
                                                background: p.status === 'Released' ? '#2BD47A' : p.status === 'Locked' ? '#B87B44' : 'rgba(217,179,140,0.18)',
                                                color: p.status === 'Pending' ? '#C4A882' : "#fff"
                                            }}>
                                                {p.status === 'Locked' ? t.statusLocked : p.status === 'Released' ? t.statusReleased : t.statusPending}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ width: "120px", height: "6px", background: "rgba(217,179,140,0.15)", borderRadius: "3px" }}>
                                                <div style={{ width: `${p.progress}%`, height: "100%", background: "#B87B44", borderRadius: "3px" }} />
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
                <div className="stitch-box" style={{ marginTop: "40px", padding: "32px", background: "rgba(21,35,50,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <h3 className="serif cream-hi" style={{ marginBottom: "8px", fontSize: "1.2rem", fontWeight: 700 }}>{t.reports}</h3>
                        <p className="body-f muted2" style={{ fontSize: "0.9rem" }}>{lang === 'fr' ? 'Générez vos fichiers JSON/XML pour la déclaration de TVQ trimestrielle.' : 'Generate your JSON/XML files for quarterly QST filing.'}</p>
                    </div>
                    <button className="ghost-btn" style={{ padding: "12px 24px", fontSize: 14 }}>
                        {lang === 'fr' ? 'Exporter' : 'Export'}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default LAtelierPage;
