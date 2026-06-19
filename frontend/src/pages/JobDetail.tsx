import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ReviewModal } from '../components/ReviewModal';
import type { Job, JobStatus } from '../types';
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../types';
import {
  ArrowLeft, Briefcase, Calendar, Check, Clock, DollarSign,
  Loader2, MapPin, MessageSquare, Play, Star, Trash2,
} from 'lucide-react';
import { formatDate, formatDistance, formatDuration, formatPrice, formatJobLocation } from '../utils';

const gold = '#B87B44';

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, canTask } = useAuth();
  const { addToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getJob(id);
      setJob(data);
      if (data.status === 'completed') {
        const reviews = await api.getReviewsForTask(id);
        setHasReview(Array.isArray(reviews) && reviews.length > 0);
      }
    } catch {
      addToast('Tâche introuvable', 'error');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canTask) {
      api.getCreditBalance().then((b) => setCreditBalance(b.balance)).catch(() => undefined);
    }
  }, [id, canTask]);

  const runAction = async (action: () => Promise<void>, success: string) => {
    setProcessing(true);
    try {
      await action();
      addToast(success, 'success');
      await load();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      addToast(msg ?? 'Action impossible', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !window.confirm('Supprimer cette tâche? Cette action est irréversible.')) return;
    setProcessing(true);
    try {
      await api.deleteJob(job.id);
      addToast('Tâche supprimée', 'success');
      navigate('/jobs');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      addToast(msg ?? 'Impossible de supprimer la tâche', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="leather" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8" style={{ color: gold, animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const statusColors: Record<JobStatus, string> = {
    pending: '#D9A441', accepted: '#7FB069', in_progress: '#6BA3C4',
    completed: '#9A8468', cancelled: '#C46B6B', declined: '#C46B6B',
  };

  const isJobOwner = job.clientId === profile?.id;
  const showTaskerActions = canTask && !isJobOwner;
  const canAccept = showTaskerActions && job.status === 'pending' && (creditBalance ?? 0) > 0;

  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <Link to="/jobs" className="body-f muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft className="w-4 h-4" /> Retour aux tâches
        </Link>

        <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="svc-icon" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase className="w-6 h-6" style={{ color: gold }} />
              </div>
              <div>
                <p className="body-f muted2" style={{ fontSize: 12 }}>{SERVICE_TYPE_LABELS[job.serviceType]}</p>
                <h1 className="serif cream-hi" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 900 }}>{job.title}</h1>
              </div>
            </div>
            <span className="body-f" style={{ fontSize: 12, color: '#1F2F3F', background: statusColors[job.status], padding: '4px 12px', borderRadius: 999, fontWeight: 700 }}>
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>

          <p className="body-f muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{job.description}</p>

          <div className="body-f muted" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24, fontSize: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Calendar className="w-4 h-4" />{formatDate(job.scheduledDate)}</span>
            {job.estimatedDuration > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Clock className="w-4 h-4" />{formatDuration(job.estimatedDuration)}</span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MapPin className="w-4 h-4" />{formatJobLocation(job)}</span>
            {!job.contactRedacted && job.distance != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MapPin className="w-4 h-4" />{formatDistance(job.distance)}</span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><DollarSign className="w-4 h-4" /><span className="cream-hi" style={{ fontWeight: 700 }}>{formatPrice(job.estimatedPrice)}</span></span>
          </div>

          {job.contactRedacted && showTaskerActions && (
            <p className="body-f muted2" style={{ fontSize: 13, marginBottom: 20, fontStyle: 'italic' }}>
              L&apos;adresse complète et les coordonnées du client seront visibles une fois la tâche acceptée.
            </p>
          )}

          {showTaskerActions && job.clientName && !job.contactRedacted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(15,25,36,0.5)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: gold, color: '#1F2F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {job.clientName.charAt(0)}
              </div>
              <div>
                <p className="body-f cream-hi" style={{ fontWeight: 600 }}>{job.clientName}</p>
                {job.clientPhone && (
                  <p className="body-f muted2" style={{ fontSize: 13 }}>{job.clientPhone}</p>
                )}
                <p className="body-f muted2" style={{ fontSize: 13 }}>Client</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(!job.contactRedacted || isJobOwner) && (
            <Link to={`/messages?jobId=${job.id}`} className="ghost-btn" style={{ padding: '10px 16px', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare className="w-4 h-4" /> Messages
            </Link>
            )}

            {showTaskerActions && job.status === 'pending' && (
              <>
                <button onClick={() => runAction(() => api.acceptJob(job.id).then(), 'Job accepté!')} disabled={processing || !canAccept} className="gold-btn" style={{ padding: '10px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: canAccept ? 1 : 0.5 }}>
                  <Check className="w-4 h-4" /> Accepter
                </button>
                {!canAccept && (
                  <Link to="/credits" className="ghost-btn" style={{ padding: '10px 16px', fontSize: 14, textDecoration: 'none' }}>Acheter des crédits</Link>
                )}
              </>
            )}

            {showTaskerActions && job.status === 'accepted' && (
              <>
                <button onClick={() => runAction(() => api.startJob(job.id).then(), 'Job démarré!')} disabled={processing} className="gold-btn" style={{ padding: '10px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Play className="w-4 h-4" /> Démarrer
                </button>
                <button onClick={() => runAction(() => api.completeJob(job.id).then(), 'Job terminé!')} disabled={processing} className="ghost-btn" style={{ padding: '10px 16px', fontSize: 14 }}>
                  Terminer
                </button>
              </>
            )}

            {showTaskerActions && job.status === 'in_progress' && (
              <button onClick={() => runAction(() => api.completeJob(job.id).then(), 'Job terminé!')} disabled={processing} className="gold-btn" style={{ padding: '10px 16px', fontSize: 14 }}>
                Terminer le job
              </button>
            )}

            {job.status === 'completed' && !hasReview && (
              <button onClick={() => setShowReview(true)} className="ghost-btn" style={{ padding: '10px 16px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Star className="w-4 h-4" /> Laisser une évaluation
              </button>
            )}

            {job.status === 'completed' && hasReview && (
              <span className="body-f muted2" style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Check className="w-4 h-4" style={{ color: '#7FB069' }} /> Évaluation envoyée
              </span>
            )}

            {isJobOwner && job.status === 'pending' && (
              <>
                <span className="body-f muted2" style={{ fontSize: 14 }}>En attente d'un travailleur</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={processing}
                  className="ghost-btn"
                  style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#C46B6B', borderColor: 'rgba(196,107,107,0.35)' }}
                >
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewModal
          taskId={job.id}
          taskTitle={job.title}
          onClose={() => setShowReview(false)}
          onSubmitted={() => { setHasReview(true); load(); }}
        />
      )}
    </div>
  );
}
