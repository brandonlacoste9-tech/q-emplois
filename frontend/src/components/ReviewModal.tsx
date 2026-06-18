import { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const gold = '#B87B44';

interface ReviewModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ taskId, taskTitle, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReview({ taskId, rating, comment: comment || undefined });
      addToast('Merci pour votre évaluation!', 'success');
      onSubmitted();
      onClose();
    } catch {
      addToast("Impossible d'envoyer l'évaluation", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.95)', padding: 28, maxWidth: 420, width: '100%' }}>
        <h3 className="serif cream-hi" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Évaluer la tâche</h3>
        <p className="body-f muted" style={{ fontSize: 14, marginBottom: 20 }}>{taskTitle}</p>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Star className="w-7 h-7" style={{ color: gold, fill: n <= rating ? gold : 'transparent' }} />
              </button>
            ))}
          </div>
          <textarea
            className="q-field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (optionnel)"
            rows={3}
            style={{ width: '100%', marginBottom: 16, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="ghost-btn" style={{ flex: 1, padding: 10 }}>Annuler</button>
            <button type="submit" disabled={loading} className="gold-btn" style={{ flex: 1, padding: 10 }}>
              {loading ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
