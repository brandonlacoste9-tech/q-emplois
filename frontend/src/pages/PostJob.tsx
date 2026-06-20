import { useSearchParams } from 'react-router-dom';
import { JobBookingWizard } from '../components/JobBookingWizard';

export function PostJob() {
  const [searchParams] = useSearchParams();

  return (
    <div className="leather">
      <JobBookingWizard mode="authenticated" searchParams={searchParams} />
    </div>
  );
}
