import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import type { Job, JobStatus, ServiceType } from '../types';
import { SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from '../types';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Check,
  X,
  Filter,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { formatPrice, formatDate, formatDuration, formatDistance } from '../utils';

const gold = '#B87B44';

const TABS: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
];

// Focused on regular local jobs (not prestige trades)
const SERVICE_TYPES: ServiceType[] = [
  'demenagement', 'menage', 'montage_meubles', 'nettoyage',
  'jardinage', 'livraison', 'coursier', 'autre',
];

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<JobStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [processingJob, setProcessingJob] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadJobs();
  }, [activeTab, selectedServiceType]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const filters: { status?: string; serviceType?: string } = { status: activeTab };
      if (selectedServiceType) filters.serviceType = selectedServiceType;
      const data = await api.getJobs(filters);
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      addToast('Erreur lors du chargement des jobs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    setProcessingJob(jobId);
    try {
      await api.acceptJob(jobId);
      addToast('Job accepté avec succès!', 'success');
      loadJobs();
    } catch {
      addToast("Erreur lors de l'acceptation", 'error');
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
      loadJobs();
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
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

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900 }}>Jobs</h1>
            <p className="body-f muted" style={{ fontSize: 15, marginTop: 4 }}>Gère tes demandes de travail</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="ghost-btn" style={{ padding: '8px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Filter className="w-4 h-4" /> Filtres
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{ ...chip(activeTab === tab.value), whiteSpace: 'nowrap', borderRadius: 8 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : jobs.length === 0 ? (
          <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 48, textAlign: 'center' }}>
            <Briefcase className="w-16 h-16" style={{ margin: '0 auto 16px', color: 'rgba(217,179,140,0.3)' }} />
            <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Aucun job {activeTab === 'pending' ? 'en attente' : JOB_STATUS_LABELS[activeTab].toLowerCase()}
            </h3>
            <p className="body-f muted">
              {activeTab === 'pending'
                ? 'Reviens plus tard pour voir les nouvelles demandes'
                : 'Les jobs apparaîtront ici une fois que tu les auras acceptés'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onAccept={handleAccept} onDecline={handleDecline} onComplete={handleComplete} isProcessing={processingJob === job.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onComplete: (id: string) => void;
  isProcessing: boolean;
}

function JobCard({ job, onAccept, onDecline, onComplete, isProcessing }: JobCardProps) {
  const statusColors: Record<JobStatus, string> = {
    pending: '#D9A441', accepted: '#7FB069', in_progress: '#6BA3C4',
    completed: '#9A8468', cancelled: '#C46B6B', declined: '#C46B6B',
  };

  return (
    <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 18, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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

      {/* Details */}
      <div className="body-f muted" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, fontSize: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Calendar className="w-4 h-4" style={{ flexShrink: 0 }} />{formatDate(job.scheduledDate)}</span>
        {job.scheduledTime && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Clock className="w-4 h-4" style={{ flexShrink: 0 }} />{job.scheduledTime}
            {job.estimatedDuration > 0 && <span className="muted2">({formatDuration(job.estimatedDuration)})</span>}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MapPin className="w-4 h-4" style={{ flexShrink: 0 }} />{job.distance ? formatDistance(job.distance) : job.address.city}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><DollarSign className="w-4 h-4" style={{ flexShrink: 0 }} /><span className="cream-hi" style={{ fontWeight: 700 }}>{formatPrice(job.estimatedPrice)}</span></span>
      </div>

      {/* Client */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(15,25,36,0.5)', borderRadius: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: gold, color: '#1F2F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
          {job.clientName.charAt(0)}
        </div>
        <div>
          <p className="body-f cream-hi" style={{ fontSize: 14, fontWeight: 600 }}>{job.clientName}</p>
          <p className="body-f muted2" style={{ fontSize: 12 }}>Client</p>
        </div>
      </div>

      {/* Description */}
      <p className="body-f muted" style={{ fontSize: 14, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {job.description}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {job.status === 'pending' && (
          <>
            <button onClick={() => onAccept(job.id)} disabled={isProcessing} className="gold-btn" style={{ flex: 1, padding: '8px', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check className="w-4 h-4" /> Accepter
            </button>
            <button onClick={() => onDecline(job.id)} disabled={isProcessing} className="ghost-btn" style={{ flex: 1, padding: '8px', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <X className="w-4 h-4" /> Refuser
            </button>
          </>
        )}
        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <button onClick={() => onComplete(job.id)} disabled={isProcessing} className="gold-btn" style={{ width: '100%', padding: '8px', fontSize: 14 }}>
            {job.status === 'accepted' ? 'Marquer terminé' : 'Terminer le job'}
          </button>
        )}
        {(job.status === 'completed' || job.status === 'declined' || job.status === 'cancelled') && (
          <button disabled className="ghost-btn" style={{ width: '100%', padding: '8px', fontSize: 14, opacity: 0.5, cursor: 'default' }}>
            Job {JOB_STATUS_LABELS[job.status].toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}
