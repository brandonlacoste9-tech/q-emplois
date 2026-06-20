import { Link, type LinkProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type CreditsLinkProps = Omit<LinkProps, 'to'> & {
  children: React.ReactNode;
};

/** Navigates to /credits in tasker mode (or profile setup if not a tasker yet). */
export function CreditsLink({ children, onClick, ...props }: CreditsLinkProps) {
  const { canTask, setMode } = useAuth();

  return (
    <Link
      to={canTask ? '/credits' : '/profile?setup=tasker'}
      {...props}
      onClick={(e) => {
        if (canTask) setMode('tasker');
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
