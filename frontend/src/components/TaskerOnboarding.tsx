import { Link } from 'react-router-dom';
import { Check, Circle, ChevronRight } from 'lucide-react';
import { gold } from '../styles/design-tokens';
import { CreditsLink } from './CreditsLink';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  link: string;
}

interface TaskerOnboardingProps {
  steps: OnboardingStep[];
}

export function TaskerOnboarding({ steps }: TaskerOnboardingProps) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="stitch-box" style={{ background: 'rgba(21,35,50,0.7)', padding: 20, marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 className="serif cream-hi" style={{ fontSize: 18, fontWeight: 700 }}>Premiers pas</h3>
          <p className="body-f muted2" style={{ fontSize: 13, marginTop: 4 }}>
            {doneCount}/{steps.length} étapes complétées pour commencer à accepter des jobs
          </p>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="serif cream-hi" style={{ fontSize: 14, fontWeight: 700 }}>{doneCount}/{steps.length}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step) => {
          const RowLink = step.link === '/credits' ? CreditsLink : Link;
          return (
          <RowLink
            key={step.id}
            to={step.link}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 8,
              background: step.done ? 'rgba(127,176,105,0.1)' : 'rgba(15,25,36,0.5)',
              border: step.done ? '1px solid rgba(127,176,105,0.3)' : '1px dashed rgba(217,179,140,0.2)',
            }}
          >
            {step.done ? (
              <Check className="w-5 h-5" style={{ color: '#7FB069', flexShrink: 0 }} />
            ) : (
              <Circle className="w-5 h-5" style={{ color: gold, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p className="body-f cream-hi" style={{ fontSize: 14, fontWeight: 600 }}>{step.label}</p>
              <p className="body-f muted2" style={{ fontSize: 12 }}>{step.description}</p>
            </div>
            {!step.done && <ChevronRight className="w-4 h-4" style={{ color: gold }} />}
          </RowLink>
          );
        })}
      </div>
    </div>
  );
}
