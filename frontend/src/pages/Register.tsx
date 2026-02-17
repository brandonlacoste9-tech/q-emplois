import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { HardHat, Mail, Lock, User, Phone, Check, AlertCircle } from 'lucide-react';
import { SERVICE_TYPE_LABELS, type ServiceType } from '../types';

const SERVICE_TYPES: ServiceType[] = [
  'plomberie',
  'electricite',
  'menuiserie',
  'peinture',
  'chauffage',
  'climatisation',
  'toiture',
  'renovation',
  'jardinage',
  'menage',
];

export function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceTypes: [] as ServiceType[],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const toggleServiceType = (type: ServiceType) => {
    setFormData((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(type)
        ? prev.serviceTypes.filter((t) => t !== type)
        : [...prev.serviceTypes, type],
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.serviceTypes.length === 0) {
      setError('Veuillez sélectionner au moins un type de service');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        serviceTypes: formData.serviceTypes,
      });
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-quebec-blue rounded-xl flex items-center justify-center">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-quebec-blue">Q-Emplois</h1>
              <p className="text-sm text-gray-500">Portail des artisans</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-quebec-blue text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        <Card shadow="md">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Informations personnelles'}
              {step === 2 && 'Créer un mot de passe'}
              {step === 3 && 'Types de services'}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 && 'Parle-nous un peu de toi'}
              {step === 2 && 'Choisis un mot de passe sécurisé'}
              {step === 3 && 'Quels services proposes-tu?'}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Jean"
                      required
                    />
                    <Input
                      label="Nom"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Tremblay"
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    leftIcon={<Mail className="w-5 h-5" />}
                    placeholder="jean@email.com"
                    required
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    leftIcon={<Phone className="w-5 h-5" />}
                    placeholder="(514) 123-4567"
                    required
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-5 h-5" />}
                    placeholder="••••••••"
                    required
                  />
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    leftIcon={<Lock className="w-5 h-5" />}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 8 caractères
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleServiceType(type)}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                          formData.serviceTypes.includes(type)
                            ? 'border-quebec-blue bg-blue-50 text-quebec-blue'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {SERVICE_TYPE_LABELS[type]}
                          {formData.serviceTypes.includes(type) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBack}
                  >
                    Retour
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleNext}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isLoading}
                  >
                    Créer mon compte
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Déjà un compte?</span>{' '}
              <Link to="/login" className="text-quebec-blue font-medium hover:underline">
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
