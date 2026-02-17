import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import type { Job, JobStatus, ServiceType } from '../types';
import { 
  SERVICE_TYPE_LABELS, 
  JOB_STATUS_LABELS 
} from '../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Check, 
  X, 
  Filter,
  Briefcase,
  ChevronDown,
  Loader2,
  Search
} from 'lucide-react';
import { formatPrice, formatDate, formatDuration, formatDistance, cn } from '../utils';

const TABS: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
];

const SERVICE_TYPES: ServiceType[] = [
  'plomberie', 'electricite', 'menuiserie', 'peinture', 
  'chauffage', 'climatisation', 'toiture', 'renovation'
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
      if (selectedServiceType) {
        filters.serviceType = selectedServiceType;
      }
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
    } catch (error) {
      addToast('Erreur lors de l\'acceptation', 'error');
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
    } catch (error) {
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
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setProcessingJob(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-500">Gère tes demandes de travail</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filtres
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de service
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedServiceType('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedServiceType === ''
                      ? 'bg-quebec-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedServiceType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedServiceType === type
                        ? 'bg-quebec-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {SERVICE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                activeTab === tab.value
                  ? 'bg-quebec-blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-quebec-blue" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun job {activeTab === 'pending' ? 'en attente' : JOB_STATUS_LABELS[activeTab].toLowerCase()}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'pending' 
                  ? 'Reviens plus tard pour voir les nouvelles demandes'
                  : 'Les jobs apparaîtront ici une fois que tu les auras acceptés'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onComplete={handleComplete}
                isProcessing={processingJob === job.id}
              />
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
  const getStatusBadge = (status: JobStatus) => {
    const variants: Record<JobStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      pending: 'warning',
      accepted: 'success',
      in_progress: 'info',
      completed: 'default',
      cancelled: 'error',
      declined: 'error',
    };
    return <Badge variant={variants[status]}>{JOB_STATUS_LABELS[status]}</Badge>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-quebec-blue" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{SERVICE_TYPE_LABELS[job.serviceType]}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
            </div>
          </div>
          {getStatusBadge(job.status)}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(job.scheduledDate)}</span>
          </div>
          {job.scheduledTime && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{job.scheduledTime}</span>
              {job.estimatedDuration > 0 && (
                <span className="text-gray-400">({formatDuration(job.estimatedDuration)})</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {job.distance ? formatDistance(job.distance) : job.address.city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-gray-900">{formatPrice(job.estimatedPrice)}</span>
          </div>
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {job.clientName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{job.clientName}</p>
            <p className="text-xs text-gray-500">Client</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {job.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {job.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(job.id)}
                isLoading={isProcessing}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onDecline(job.id)}
                isLoading={isProcessing}
                leftIcon={<X className="w-4 h-4" />}
              >
                Refuser
              </Button>
            </>
          )}
          {job.status === 'accepted' && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onComplete(job.id)}
              isLoading={isProcessing}
            >
              Marquer terminé
            </Button>
          )}
          {job.status === 'in_progress' && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onComplete(job.id)}
              isLoading={isProcessing}
            >
              Terminer le job
            </Button>
          )}
          {(job.status === 'completed' || job.status === 'declined' || job.status === 'cancelled') && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
            >
              Job {JOB_STATUS_LABELS[job.status].toLowerCase()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
