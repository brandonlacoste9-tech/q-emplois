import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SERVICE_TYPE_LABELS, type ServiceType, type TradesmanProfile } from '../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Check,
  Edit2,
  Award,
  Save,
  X,
  Star,
  Coins,
} from 'lucide-react';
import { formatPrice } from '../utils';
import { useToast } from '../components/Toast';
import { gold } from '../styles/design-tokens';
import { UserAvatar } from '../components/UserAvatar';
import { ImageUpload } from '../components/ImageUpload';
import { CreditsLink } from '../components/CreditsLink';
import {
  getTaskerVerificationStatus,
  VERIFICATION_LABELS,
  VERIFICATION_HINTS,
} from '../utils/taskerVerification';
import { FEATURE_L_ATELIER } from '../utils/featureFlags';

const card: React.CSSProperties = { background: 'rgba(21,35,50,0.7)', padding: 20 };

// Focused on regular local jobs (not prestige trades)
const SERVICE_TYPES: ServiceType[] = [
  'demenagement', 'menage', 'montage_meubles', 'nettoyage',
  'jardinage', 'livraison', 'coursier', 'autre',
];

export function Profile() {
  const { profile: initialProfile, refreshProfile, canTask } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const showTaskerSetup = searchParams.get('setup') === 'tasker';
  const [profile, setProfile] = useState<TradesmanProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TradesmanProfile>>({});
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; comment?: string; createdAt: string }>>([]);
  const [escrowContracts, setEscrowContracts] = useState<Array<{ id: string; taskDescription: string; status: string; milestones: Array<{ id: string; status: string; description: string; amount: number }> }>>([]);

  useEffect(() => {
    if (showTaskerSetup && !canTask) setIsEditing(true);
  }, [showTaskerSetup, canTask]);

  useEffect(() => {
    if (initialProfile?.id) {
      api.getReviewsForUser(initialProfile.id).then(setReviews).catch(() => setReviews([]));
    }
  }, [initialProfile?.id]);

  useEffect(() => {
    if (canTask) {
      api.getCreditBalance().then((b) => setCreditBalance(b.balance)).catch(() => undefined);
    }
  }, [canTask]);

  useEffect(() => {
    if (!FEATURE_L_ATELIER) return;
    api.getEscrowContracts().then(setEscrowContracts).catch(() => setEscrowContracts([]));
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFormData(initialProfile);
    }
  }, [initialProfile]);

  const handleEdit = () => { setIsEditing(true); setFormData(profile || {}); };
  const handleCancel = () => { setIsEditing(false); setFormData(profile || {}); };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
      if (canTask) {
        await api.updateProvider({
          serviceTypes: formData.serviceTypes || profile?.serviceTypes || [],
          hourlyRate: formData.hourlyRate,
          serviceRadiusKm: formData.serviceRadius,
          licenseNumber: formData.licenseNumber,
          licenseDocumentUrl: formData.licenseDocument,
          locationAddress: formData.address?.street,
        });
      }
      await refreshProfile();
      setIsEditing(false);
      addToast('Profil enregistré', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_DOC_BYTES) {
      addToast('Fichier trop volumineux (max 5 Mo)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.uploadLicenseDocument({
          data: reader.result as string,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        await refreshProfile();
        addToast('Document téléversé — en attente de vérification', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Échec du téléversement';
        addToast(msg, 'error');
      }
    };
    reader.onerror = () => addToast('Impossible de lire le fichier', 'error');
    reader.readAsDataURL(file);
  };

  const toggleServiceType = (type: ServiceType) => {
    const current = formData.serviceTypes || [];
    setFormData({
      ...formData,
      serviceTypes: current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    });
  };

  if (!profile) {
    return (
      <div className="leather" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(217,179,140,0.2)', borderBottomColor: gold, animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const verificationStatus = getTaskerVerificationStatus(profile, profile?.verificationExpiresAt);
  const verificationColors: Record<typeof verificationStatus, string> = {
    verified: '#7FB069',
    pending: '#D9A441',
    rejected: '#C46B6B',
    unverified: '#C46B6B',
    expired: '#C46B6B',
  };

  const field = (label: string, value: string | number | undefined, onChange: (v: string) => void, icon: React.ReactNode, type = 'text', placeholder = '') => (
    <div>
      <label className="q-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(217,179,140,0.5)', display: 'flex' }}>{icon}</span>
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing}
          placeholder={placeholder}
          className="q-field"
          style={{ paddingLeft: 38, opacity: isEditing ? 1 : 0.75 }}
        />
      </div>
    </div>
  );

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900 }}>Mon profil</h1>
            <p className="body-f muted" style={{ fontSize: 15, marginTop: 4 }}>Gère tes informations personnelles</p>
          </div>
          {!isEditing ? (
            <button onClick={handleEdit} className="gold-btn" style={{ padding: '8px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Edit2 className="w-4 h-4" /> Modifier
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCancel} className="ghost-btn" style={{ padding: '8px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <X className="w-4 h-4" /> Annuler
              </button>
              <button onClick={handleSave} disabled={isLoading} className="gold-btn" style={{ padding: '8px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {showTaskerSetup && !canTask && (
          <div className="stitch-box body-f" style={{ ...card, marginBottom: 20, padding: 16, background: 'rgba(184,123,68,0.12)' }}>
            <p className="cream-hi" style={{ fontWeight: 600, marginBottom: 6 }}>Activer le mode travailleur</p>
            <p className="muted" style={{ fontSize: 14 }}>Choisissez vos types de services, votre ville et téléversez une pièce d&apos;identité pour postuler aux jobs.</p>
          </div>
        )}

        {canTask && verificationStatus !== 'verified' && (
          <div
            className="stitch-box body-f"
            style={{
              ...card,
              marginBottom: 20,
              padding: 16,
              background: verificationStatus === 'rejected'
                ? 'rgba(196,107,107,0.12)'
                : 'rgba(184,123,68,0.12)',
              borderColor: verificationStatus === 'rejected' ? 'rgba(196,107,107,0.35)' : undefined,
            }}
          >
            <p className="cream-hi" style={{ fontWeight: 600, marginBottom: 6 }}>{VERIFICATION_LABELS[verificationStatus]}</p>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>{VERIFICATION_HINTS[verificationStatus]}</p>
            {verificationStatus === 'rejected' && profile?.rejectionReason && (
              <p className="body-f" style={{ fontSize: 13, marginTop: 10, color: '#E8D5C5' }}>
                <strong>Motif :</strong> {profile.rejectionReason}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="stitch-box" style={{ ...card, textAlign: 'center' }}>
              <div style={{ margin: '0 auto 14px', width: 'fit-content' }}>
                <UserAvatar
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  avatarUrl={profile.avatar}
                  size={84}
                  fontSize={28}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <ImageUpload
                  purpose="avatar"
                  value={profile.avatar ? [profile.avatar] : []}
                  onChange={async (urls) => {
                    // Optimistic update: show the new avatar immediately
                    if (urls[0]) {
                      setProfile((prev) => prev ? { ...prev, avatar: urls[0] } : prev);
                    }
                    await refreshProfile();
                    addToast('Photo de profil mise à jour', 'success');
                  }}
                />
              </div>
              <h2 className="serif cream-hi" style={{ fontSize: 20, fontWeight: 900 }}>{profile.firstName} {profile.lastName}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <Star className="w-4 h-4" style={{ color: gold, fill: gold }} />
                <span className="body-f cream-hi" style={{ fontWeight: 700, fontSize: 14 }}>{(profile.rating ?? 0).toFixed(1)}</span>
                <span className="body-f muted2" style={{ fontSize: 13 }}>({profile.reviewCount ?? 0} avis)</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <span className="body-f" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, color: '#1F2F3F', background: verificationColors[verificationStatus] }}>
                  {verificationStatus === 'verified' ? <><Check className="w-3 h-3" /> {VERIFICATION_LABELS.verified}</> : VERIFICATION_LABELS[verificationStatus]}
                </span>
                {canTask && (
                  <p className="body-f muted2" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
                    {VERIFICATION_HINTS[verificationStatus]}
                  </p>
                )}
                {canTask && verificationStatus === 'verified' && profile?.verificationExpiresAt && (
                  <p className="body-f muted2" style={{ fontSize: 11, marginTop: 4 }}>
                    Valide jusqu'au {new Date(profile.verificationExpiresAt).toLocaleDateString('fr-CA')}
                  </p>
                )}
              </div>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                <span className="body-f muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}><Mail className="w-4 h-4" style={{ color: 'rgba(217,179,140,0.5)' }} />{profile.email}</span>
                <span className="body-f muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}><Phone className="w-4 h-4" style={{ color: 'rgba(217,179,140,0.5)' }} />{profile.phone}</span>
              </div>
            </div>

            {canTask && creditBalance !== null && (
              <div className="stitch-box" style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Coins className="w-5 h-5" style={{ color: gold }} />
                  <div>
                    <p className="body-f muted2" style={{ fontSize: 13 }}>Crédits disponibles</p>
                    <p className="serif cream-hi" style={{ fontSize: 22, fontWeight: 900 }}>{creditBalance}</p>
                  </div>
                </div>
                <CreditsLink className="ghost-btn" style={{ padding: '8px 14px', fontSize: 13, textDecoration: 'none' }}>Acheter</CreditsLink>
              </div>
            )}

            {canTask && (
            <div className="stitch-box" style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p className="body-f muted2" style={{ fontSize: 13 }}>Taux horaire</p>
                <p className="serif cream-hi" style={{ fontSize: 26, fontWeight: 900 }}>{formatPrice(profile.hourlyRate || 0)}/h</p>
              </div>
              <div>
                <p className="body-f muted2" style={{ fontSize: 13 }}>Rayon de service</p>
                <p className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700 }}>{profile.serviceRadius || 10} km</p>
              </div>
            </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, gridColumn: 'span 1' }}>
            {/* Personal info */}
            <div className="stitch-box" style={card}>
              <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Informations personnelles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {field('Prénom', isEditing ? formData.firstName : profile.firstName, (v) => setFormData({ ...formData, firstName: v }), <User className="w-4 h-4" />)}
                {field('Nom', isEditing ? formData.lastName : profile.lastName, (v) => setFormData({ ...formData, lastName: v }), <User className="w-4 h-4" />)}
                {field('Email', isEditing ? formData.email : profile.email, (v) => setFormData({ ...formData, email: v }), <Mail className="w-4 h-4" />, 'email')}
                {field('Téléphone', isEditing ? formData.phone : profile.phone, (v) => setFormData({ ...formData, phone: v }), <Phone className="w-4 h-4" />)}
              </div>
            </div>

            <div className="stitch-box" style={card}>
              <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Profil travailleur</h3>
              {!canTask && (
                <p className="body-f muted2" style={{ fontSize: 13, marginBottom: 16 }}>
                  Ajoutez au moins un type de service pour activer le mode « Je travaille ».
                </p>
              )}
            {/* Services */}
            <div style={{ marginBottom: 20 }}>
              <h4 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Types de services</h4>
              {isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {SERVICE_TYPES.map((type) => {
                    const on = (formData.serviceTypes || []).includes(type);
                    return (
                      <button key={type} type="button" onClick={() => toggleServiceType(type)} style={{ padding: 12, borderRadius: 8, fontSize: 14, textAlign: 'left', cursor: 'pointer', fontFamily: "'Lora', Georgia, serif", border: on ? `1px solid ${gold}` : '1px dashed rgba(217,179,140,0.3)', background: on ? 'rgba(184,123,68,0.15)' : 'transparent', color: on ? '#E8CDB0' : '#9A8468' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {SERVICE_TYPE_LABELS[type]}{on && <Check className="w-4 h-4" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(profile.serviceTypes || []).map((type) => (
                    <span key={type} className="body-f" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 999, background: 'rgba(184,123,68,0.15)', color: '#E8CDB0', border: '1px solid rgba(184,123,68,0.3)' }}>
                      {SERVICE_TYPE_LABELS[type]}
                    </span>
                  ))}
                  {(profile.serviceTypes || []).length === 0 && <p className="body-f muted2" style={{ fontSize: 14 }}>Aucun service sélectionné</p>}
                </div>
              )}
            </div>

            {/* Telegram Notifications */}
            {canTask && (
              <div style={{ marginBottom: 20 }}>
                <h4 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  Alertes Telegram
                </h4>
                <div className="stitch-box" style={{ padding: 16, background: 'rgba(21,35,50,0.55)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Telegram logo icon */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 6.612l-1.685 7.94c-.127.565-.46.703-.93.437l-2.57-1.893-1.24 1.194c-.137.137-.252.252-.516.252l.184-2.61 4.75-4.29c.207-.183-.045-.285-.32-.102L7.63 14.71l-2.53-.79c-.55-.172-.56-.55.115-.814l9.88-3.81c.458-.165.86.112.835.516z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="body-f cream-hi" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                          {profile.telegramId ? 'Telegram connecté' : 'Telegram non connecté'}
                        </p>
                        <p className="body-f muted2" style={{ fontSize: 12, margin: 0, marginTop: 2 }}>
                          {profile.telegramId
                            ? 'Alertes en temps réel + bouton Postuler directement dans le chat'
                            : 'Reçois les nouvelles tâches instantanément'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {profile.telegramId ? (
                        <>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(127,176,105,0.18)', color: '#7FB069', border: '1px solid rgba(127,176,105,0.3)' }}>
                            ✓ Connecté
                          </span>
                          <button
                            id="btn-telegram-disconnect"
                            onClick={async () => {
                              try {
                                await api.disconnectTelegram();
                                await refreshProfile();
                                addToast('Telegram déconnecté', 'success');
                              } catch {
                                addToast('Erreur lors de la déconnexion', 'error');
                              }
                            }}
                            className="ghost-btn"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            Déconnecter
                          </button>
                        </>
                      ) : profile.telegramBotLink ? (
                        <a
                          id="btn-telegram-connect"
                          href={profile.telegramBotLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gold-btn"
                          style={{ padding: '7px 16px', fontSize: 13, textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }}
                        >
                          Connecter Telegram
                        </a>
                      ) : (
                        <span className="body-f muted2" style={{ fontSize: 12 }}>Bot non configuré</span>
                      )}
                    </div>
                  </div>

                  {!profile.telegramId && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(34,158,217,0.08)', borderRadius: 8, border: '1px solid rgba(34,158,217,0.2)' }}>
                      <p className="body-f muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                        <strong style={{ color: '#E8CDB0' }}>Comment ça marche ?</strong><br />
                        1. Clique sur <strong>Connecter Telegram</strong><br />
                        2. Notre bot s'ouvre — clique <strong>Démarrer</strong><br />
                        3. C'est tout ! Tu recevras des alertes avec un bouton <strong>Postuler</strong> intégré.
                      </p>
                    </div>
                  )}

                  {profile.telegramId && (
                    <p className="body-f muted2" style={{ fontSize: 12, marginTop: 12, margin: '12px 0 0' }}>
                      💡 Quand une tâche correspond à tes services, tu reçois un message Telegram avec les boutons <strong>Postuler</strong> (1 crédit) et <strong>Passer</strong> directement dans le chat.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pricing & radius */}
            <div style={{ marginBottom: 20 }}>
              <h4 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tarification et zone</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {field('Ville / secteur de base', isEditing ? formData.address?.street : profile.address?.street, (v) => setFormData({ ...formData, address: { ...formData.address, street: v, city: formData.address?.city ?? '', postalCode: formData.address?.postalCode ?? '' } }), <MapPin className="w-4 h-4" />, 'text', 'ex: Montréal, H2X')}
                {field('Taux horaire ($/h)', isEditing ? formData.hourlyRate : profile.hourlyRate, (v) => setFormData({ ...formData, hourlyRate: parseFloat(v) }), <DollarSign className="w-4 h-4" />, 'number')}
                {field('Rayon de service (km)', isEditing ? formData.serviceRadius : profile.serviceRadius, (v) => setFormData({ ...formData, serviceRadius: parseInt(v) }), <MapPin className="w-4 h-4" />, 'number')}
              </div>
              {isEditing && (
                <input type="range" min={1} max={50} value={formData.serviceRadius || 10} onChange={(e) => setFormData({ ...formData, serviceRadius: parseInt(e.target.value) })} style={{ width: '100%', marginTop: 12, accentColor: gold }} />
              )}
            </div>

            {/* Certification */}
            <div>
              <h4 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Award className="w-5 h-5" style={{ color: gold }} /> Pièce d'identité et certifications
              </h4>
              {field("Numéro de certification (optionnel)", isEditing ? formData.licenseNumber : profile.licenseNumber, (v) => setFormData({ ...formData, licenseNumber: v }), <Award className="w-4 h-4" />, 'text', 'ex: CERT-1234-5678')}
              <div style={{ marginTop: 14 }}>
                {canTask && verificationStatus !== 'verified' && (
                  <div style={{ marginBottom: 12 }}>
                    <label className="q-label">Pièce d&apos;identité (requis, max 5 Mo — image ou PDF)</label>
                    <input type="file" accept="image/*,.pdf" onChange={handleDocumentUpload} className="q-field" style={{ padding: 8 }} />
                    <p className="body-f muted2" style={{ fontSize: 12, marginTop: 8 }}>
                      Téléversement immédiat — vérification par l&apos;équipe sous 48 h.
                    </p>
                  </div>
                )}
                {profile.licenseDocument ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: verificationStatus === 'verified' ? 'rgba(127,176,105,0.12)' : 'rgba(217,164,65,0.12)', borderRadius: 8 }}>
                    <Award className="w-5 h-5" style={{ color: verificationStatus === 'verified' ? '#7FB069' : '#D9A441' }} />
                    <div>
                      <p className="body-f cream-hi" style={{ fontSize: 14, fontWeight: 600 }}>Document téléversé</p>
                      <p className="body-f muted2" style={{ fontSize: 12 }}>
                        {verificationStatus === 'verified'
                          ? 'Identité confirmée par notre équipe'
                          : 'En attente de vérification (sous 48 h)'}
                      </p>
                    </div>
                  </div>
                ) : canTask ? null : (
                  <p className="body-f muted2" style={{ fontSize: 14 }}>Aucun document téléversé</p>
                )}
              </div>
            </div>
            </div>

            {reviews.length > 0 && (
              <div className="stitch-box" style={card}>
                <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Star className="w-5 h-5" style={{ color: gold }} /> Avis reçus
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ padding: 12, background: 'rgba(15,25,36,0.5)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className="w-4 h-4" style={{ color: gold, fill: n <= r.rating ? gold : 'transparent' }} />
                        ))}
                      </div>
                      {r.comment && <p className="body-f muted" style={{ fontSize: 14 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {FEATURE_L_ATELIER && (
            <div className="stitch-box" style={{ ...card, marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Coins className="w-5 h-5" style={{ color: gold }} /> L'Atelier
                </h3>
                <Link to="/latelier" className="body-f" style={{ color: '#7FB069', fontSize: 13, textDecoration: 'none' }}>
                  Voir tout →
                </Link>
              </div>
              {escrowContracts.length === 0 ? (
                <p className="body-f muted2" style={{ fontSize: 14 }}>Aucun contrat actif.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {escrowContracts.slice(0, 3).map((c) => {
                    const released = c.milestones.filter((m: any) => m.status === 'RELEASED').length;
                    const total = c.milestones.length;
                    return (
                      <div key={c.id} style={{ padding: 12, background: 'rgba(15,25,36,0.5)', borderRadius: 8 }}>
                        <p className="body-f cream-hi" style={{ fontWeight: 600, fontSize: 14 }}>{c.taskDescription}</p>
                        <p className="body-f muted2" style={{ fontSize: 12, marginTop: 4 }}>
                          {released}/{total} jalons · {c.status === 'locked' ? '🔒 Verrouillé' : c.status === 'pending' ? '⏳ En attente' : '✅ Complété'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
