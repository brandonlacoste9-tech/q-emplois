import { useNavigate, useSearchParams } from 'react-router-dom';
import { JobBookingWizard, type BookingFormData } from '../components/JobBookingWizard';
import { saveBookingDraft } from '../utils/bookingDraft';

export function BookPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleGuestComplete = (data: BookingFormData) => {
    if (!data.serviceType) return;
    saveBookingDraft({
      title: data.title,
      description: data.description,
      serviceType: data.serviceType,
      scheduledDate: data.scheduledDate,
      estimatedPrice: data.estimatedPrice,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      photoUrls: data.photoUrls,
    });
    navigate('/register/client?from=book');
  };

  return (
    <div className="leather" style={{ minHeight: '100vh', color: '#D9B38C' }}>
      <JobBookingWizard mode="guest" searchParams={searchParams} onGuestComplete={handleGuestComplete} />
    </div>
  );
}
