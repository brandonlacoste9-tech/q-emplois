import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ReviewModal } from '../components/ReviewModal';
import type { Job, JobStatus, ServiceType, PriceGuideRange } from '../types';
import { SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from '../types';
import {
  MapPin, Calendar, Clock, DollarSign, Check, Filter, Briefcase, Loader2, Play, Coins, Trash2,
} from 'lucide-react';
import { formatPrice, formatDate, formatDuration, formatJobLocation } from '../utils';
import { gold } from '../styles/design-tokens';
import {
  canTaskerApply,
  getTaskerVerificationStatus,
  VERIFICATION_HINTS,
  VERIFICATION_LABELS,
} from '../utils/taskerVerification';

const deleteBtnStyle: React.CSSProperties = {
  padding: 4,
  minWidth: 0,
  lineHeight: 0,
  color: '#C46B6B',
  borderColor: 'rgba(196,107,107,0.35)',
  flexShrink: 0,
};

const TASKER_TABS: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'Disponibles' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
];

const CLIENT_TABS: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
];

const SERVICE_TYPES: ServiceType[] = [
  'demenagement', 'menage', 'montage_meubles', 'nettoyage',
  'jardinage', 'livraison', 'coursier', 'autre',
];

export function Jobs() {
  const { profile, isClientMode, canTask } = useAuth();
  const isClient = isClientMode;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<string>(isClient ? 'all' : 'pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [processingJob, setProcessingJob] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [reviewJob, setReviewJob] = useState<Job | null>(null);
  const [priceGuides, setPriceGuides] = useState<Record<string, PriceGuideRange>>({});
  const { addToast } = useToast();

  useEffect(() => {
    api.getPriceGuides().then(setPriceGuides).catch(() => undefined);
  }, []);

  useEffect(() => {
    setActiveTab(isClientMode ? 'all' : 'pending');
  }, [isClientMode]);

  useEffect(() => {
    if (!isClientMode) {
      api.getCreditBalance()
        .then((b) => setCreditBalance(b.balance))
        .catch(() => setCreditBalance(null));
    }
  }, [isClientMode]);

  useEffect(() => {
    loadJobs();
  }, [activeTab, selectedServiceType, isClientMode]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const filters: { status?: string; serviceType?: string; perspective?: 'mine' | 'board' } = {
        perspective: isClientMode ? 'mine' : 'board',
      };
      if (activeTab !== 'all') filters.status = activeTab;
      if (selectedServiceType) filters.serviceType = selectedServiceType;
      const data = await api.getJobs(filters);
      if (isClientMode) {
        setJobs(data);
      } else if (activeTab === 'pending') {
        setJobs(data.filter((j) => j.status === 'pending'));
      } else {
        setJobs(data);
      }
    } catch {
      addToast('Erreur lors du chargement des jobs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (creditBalance === 0) {
      addToast('Crédits insuffisants — achetez un pack', 'error');
      return;
    }
    setProcessingJob(jobId);
    try {
      await api.applyToJob(jobId);
      addToast('Candidature envoyée!', 'success');
      const bal = await api.getCreditBalance();
      setCreditBalance(bal.balance);
      loadJobs();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      if (msg?.includes('Crédits insuffisants')) {
        addToast('Crédits insuffisants', 'error');
      } else {
        addToast("Erreur lors de la candidature", 'error');
      }
    } finally {
      setProcessingJob(null);
    }
  };

  const handleStart = async (jobId: string) => {
    setProcessingJob(jobId);
    try {
      await api.startJob(jobId);
      addToast('Job démarré!', 'success');
      loadJobs();
    } catch {
      addToast('Erreur au démarrage', 'error');
    } finally {
      setProcessingJob(null);
    }
  };

  const handleDecline = async (jobId: string) => {
    setProcessingJob(jobId);
    try {
      await api.declineJob(jobId);
      addToast('Job refusé', 'info');
      loadJobs();
    } catch {
      addToast('Erreur lors du refus', 'error');
    } finally {
      setProcessingJob(null);
    }
  };

  const handleComplete = async (jobId: string) => {
    setProcessingJob(jobId);
    try {
      await api.completeJob(jobId);
      addToast('Job marqué comme terminé!', 'success');
      const job = jobs.find((j) => j.id === jobId);
      if (job) setReviewJob(job);
      loadJobs();
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setProcessingJob(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Supprimer cette tâche? Cette action est irréversible.')) return;
    setProcessingJob(jobId);
    try {
      await api.deleteJob(jobId);
      addToast('Tâche supprimée', 'success');
      loadJobs();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      addToast(msg ?? 'Impossible de supprimer la tâche', 'error');
    } finally {
      setProcessingJob(null);
    }
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Lora', Georgia, serif", transition: 'all 0.2s',
    border: active ? `1px solid ${gold}` : '1px dashed rgba(217,179,140,0.3)',
    background: active ? gold : 'transparent',
    color: active ? '#1F2F3F' : '#D9B38C', fontWeight: active ? 700 : 400,
  });

  const tabs = isClient ? CLIENT_TABS : TASKER_TABS;
  const verificationStatus = getTaskerVerificationStatus(profile);
  const taskerCanApply = canTaskerApply(profile);

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900 }}>
              {isClient ? 'Mes tâches' : 'Jobs'}
            </h1>
            <p className="body-f muted" style={{ fontSize: 15, marginTop: 4 }}>
              {isClient ? 'Suivez vos tâches publiées' : 'Gère tes demandes de travail'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isClient && creditBalance !== null && (
              <Link to="/credits" className="stitch-box body-f" style={{ padding: '8px 14px', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,35,50,0.7)' }}>
                <Coins className="w-4 h-4" style={{ color: gold }} />
                <span className="cream-hi" style={{ fontWeight: 700 }}>{creditBalance}</span>
                <span className="muted2">crédits</span>
              </Link>
            )}
            {!isClient && (
              <button onClick={() => setShowFilters(!showFilters)} className="ghost-btn" style={{ padding: '8px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Filter className="w-4 h-4" /> Filtres
              </button>
            )}
            {isClient && (
              <Link to="/post-job" className="gold-btn" style={{ padding: '8px 16px', fontSize: 14, textDecoration: 'none' }}>
                + Publier
              </Link>
            )}
          </div>
        </div>

        {!isClient && canTask && !taskerCanApply && (
          <div className="stitch-box body-f" style={{ background: 'rgba(184,123,68,0.12)', padding: 16, marginBottom: 20 }}>
            <p className="cream-hi" style={{ fontWeight: 600, marginBottom: 6 }}>{VERIFICATION_LABELS[verificationStatus]}</p>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>{VERIFICATION_HINTS[verificationStatus]}</p>
            <Link to="/profile" className="gold-btn" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
              Compléter la vérification
            </Link>
          </div>
        )}

        {showFilters && !isClient && (
          <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 18, marginBottom: 20 }}>
            <p className="q-label" style={{ marginBottom: 10 }}>Type de service</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setSelectedServiceType('')} style={chip(selectedServiceType === '')}>Tous</button>
              {SERVICE_TYPES.map((type) => (
                <button key={type} onClick={() => setSelectedServiceType(type)} style={chip(selectedServiceType === type)}>
                  {SERVICE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {tabs.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{ ...chip(activeTab === tab.value), whiteSpace: 'nowrap', borderRadius: 8 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 48, textAlign: 'center' }}>
            <Briefcase className="w-16 h-16" style={{ margin: '0 auto 16px', color: 'rgba(217,179,140,0.3)' }} />
            <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucun job</h3>
            <p className="body-f muted">
              {isClient ? 'Publiez votre première tâche pour commencer.' : 'Reviens plus tard pour voir les nouvelles demandes.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isClient={isClient}
                onAccept={handleAccept}
                onStart={handleStart}
                onDecline={handleDecline}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onReview={() => setReviewJob(job)}
                isProcessing={processingJob === job.id}
                canApply={!isClient && taskerCanApply && (creditBalance ?? 0) > 0 && job.myApplicationStatus !== 'pending'}
                verificationBlocked={!isClient && canTask && !taskerCanApply}
                priceGuide={priceGuides[job.serviceType] ?? priceGuides.autre}
                canDelete={isClient && job.status === 'pending' && job.clientId === profile?.id}
              />
            ))}
          </div>
        )}
      </div>

      {reviewJob && (
        <ReviewModal
          taskId={reviewJob.id}
          taskTitle={reviewJob.title}
          onClose={() => setReviewJob(null)}
          onSubmitted={loadJobs}
        />
      )}
    </div>
  );
}

interface JobCardProps {
  job: Job;
  isClient: boolean;
  onAccept: (id: string) => void;
  onStart: (id: string) => void;
  onDecline: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: () => void;
  isProcessing: boolean;
  canApply: boolean;
  verificationBlocked?: boolean;
  canDelete: boolean;
  priceGuide?: PriceGuideRange;
}

function JobCard({ job, isClient, onAccept, onStart, onComplete, onDelete, onReview, isProcessing, canApply, verificationBlocked, canDelete, priceGuide }: JobCardProps) {
  const statusColors: Record<JobStatus, string> = {
    pending: '#D9A441', accepted: '#7FB069', in_progress: '#6BA3C4',
    completed: '#9A8468', cancelled: '#C46B6B', declined: '#C46B6B',
  };

  return (
    <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 18, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div className="svc-icon" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase className="w-5 h-5" style={{ color: gold }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="body-f muted2" style={{ fontSize: 12 }}>{SERVICE_TYPE_LABELS[job.serviceType]}</p>
            <h3 className="serif cream-hi" style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</h3>
          </div>
        </div>
        <span className="body-f" style={{ fontSize: 11, color: '#1F2F3F', background: statusColors[job.status], padding: '2px 8px', borderRadius: 999, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="body-f muted" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, fontSize: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Calendar className="w-4 h-4" style={{ flexShrink: 0 }} />{formatDate(job.scheduledDate)}</span>
        {job.estimatedDuration > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Clock className="w-4 h-4" style={{ flexShrink: 0 }} />{formatDuration(job.estimatedDuration)}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MapPin className="w-4 h-4" style={{ flexShrink: 0 }} />{formatJobLocation(job)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><DollarSign className="w-4 h-4" style={{ flexShrink: 0 }} /><span className="cream-hi" style={{ fontWeight: 700 }}>{formatPrice(job.estimatedPrice)}</span></span>
      </div>

      {!isClient && !job.contactRedacted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(15,25,36,0.5)', borderRadius: 8, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: gold, color: '#1F2F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
            {job.clientName.charAt(0)}
          </div>
          <div>
            <p className="body-f cream-hi" style={{ fontSize: 14, fontWeight: 600 }}>{job.clientName}</p>
            <p className="body-f muted2" style={{ fontSize: 12 }}>Client</p>
          </div>
        </div>
      )}

      {!isClient && job.contactRedacted && job.status === 'pending' && (
        <p className="body-f muted2" style={{ fontSize: 12, marginBottom: 14, fontStyle: 'italic' }}>
          Postulez pour être considéré; le client choisira un travailleur.
        </p>
      )}

      {job.myApplicationStatus === 'pending' && (
        <p className="body-f" style={{ fontSize: 12, marginBottom: 14, color: '#D9A441' }}>
          Candidature envoyée
        </p>
      )}

      {!isClient && !job.contactRedacted && job.addressRedacted && job.status === 'accepted' && (
        <p className="body-f muted2" style={{ fontSize: 12, marginBottom: 14, fontStyle: 'italic' }}>
          Adresse exacte visible lorsque vous démarrez le job.
        </p>
      )}

      <p className="body-f muted" style={{ fontSize: 14, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {job.description}
      </p>
      {!isClient && job.status === 'pending' && priceGuide && (
        <p className="body-f muted2" style={{ fontSize: 12, marginBottom: 12 }}>
          Fourchette typique: {priceGuide.min}–{priceGuide.max} ${priceGuide.unit === 'hour' ? '/h' : ''}
        </p>
      )}
      </Link>

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
        {!isClient && job.status === 'pending' && job.myApplicationStatus !== 'pending' && (
          <>
            <button onClick={() => onAccept(job.id)} disabled={isProcessing || !canApply} className="gold-btn" style={{ flex: 1, minWidth: 120, padding: '8px', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canApply ? 1 : 0.5 }}>
              <Check className="w-4 h-4" /> Postuler
            </button>
            {!canApply && verificationBlocked && (
              <Link to="/profile" className="ghost-btn" style={{ flex: 1, minWidth: 120, padding: '8px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}>
                Vérification requise
              </Link>
            )}
            {!canApply && !verificationBlocked && (
              <Link to="/credits" className="ghost-btn" style={{ flex: 1, minWidth: 120, padding: '8px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}>
                Acheter crédits
              </Link>
            )}
          </>
        )}
        {!isClient && job.status === 'accepted' && (
          <>
            <button onClick={() => onStart(job.id)} disabled={isProcessing} className="gold-btn" style={{ flex: 1, padding: '8px', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Play className="w-4 h-4" /> Démarrer
            </button>
            <button onClick={() => onComplete(job.id)} disabled={isProcessing} className="ghost-btn" style={{ flex: 1, padding: '8px', fontSize: 14 }}>
              Terminer
            </button>
          </>
        )}
        {!isClient && job.status === 'in_progress' && (
          <button onClick={() => onComplete(job.id)} disabled={isProcessing} className="gold-btn" style={{ width: '100%', padding: '8px', fontSize: 14 }}>
            Terminer le job
          </button>
        )}
        {job.status === 'completed' && (
          <button onClick={onReview} className="ghost-btn" style={{ width: '100%', padding: '8px', fontSize: 14 }}>
            Laisser une évaluation
          </button>
        )}
        {canDelete && (
          <>
            <span className="body-f muted2" style={{ fontSize: 12, flex: 1, textAlign: 'center' }}>
              {(job.pendingApplicationCount ?? 0) > 0
                ? `${job.pendingApplicationCount} candidature(s) en attente`
                : 'En attente de candidatures'}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(job.id); }}
              disabled={isProcessing}
              className="ghost-btn"
              title="Supprimer"
              aria-label="Supprimer"
              style={deleteBtnStyle}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
        {isClient && job.status === 'pending' && !canDelete && (
          <span className="body-f muted2" style={{ fontSize: 12, width: '100%', textAlign: 'center' }}>
            {(job.pendingApplicationCount ?? 0) > 0
              ? `${job.pendingApplicationCount} candidature(s) en attente`
              : 'En attente de candidatures'}
          </span>
        )}
      </div>
    </div>
  );
}
