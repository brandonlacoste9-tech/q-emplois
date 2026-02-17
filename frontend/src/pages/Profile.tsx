import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { FileUpload } from '../components/FileUpload';
import { StarRating } from '../components/StarRating';
import { api } from '../services/api';
import { SERVICE_TYPE_LABELS, type ServiceType, type TradesmanProfile } from '../types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Check, 
  Upload,
  Edit2,
  Award,
  Save,
  X
} from 'lucide-react';
import { formatPrice } from '../utils';

const SERVICE_TYPES: ServiceType[] = [
  'plomberie', 'electricite', 'menuiserie', 'peinture', 
  'chauffage', 'climatisation', 'toiture', 'renovation',
  'jardinage', 'menage', 'demenagement', 'autre'
];

export function Profile() {
  const { profile: initialProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<TradesmanProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TradesmanProfile>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFormData(initialProfile);
    }
  }, [initialProfile]);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profile || {});
    setSelectedFile(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Upload license if selected
      if (selectedFile) {
        await api.uploadLicense(selectedFile);
      }
      
      // Update profile
      await api.updateProfile(formData);
      await refreshProfile();
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServiceType = (type: ServiceType) => {
    const currentTypes = formData.serviceTypes || [];
    setFormData({
      ...formData,
      serviceTypes: currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type],
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quebec-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-gray-500">Gère tes informations personnelles</p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit} leftIcon={<Edit2 className="w-4 h-4" />}>
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} leftIcon={<X className="w-4 h-4" />}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                isLoading={isLoading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-quebec-blue rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                
                <div className="flex justify-center mt-2">
                  <StarRating 
                    rating={profile.rating} 
                    showValue 
                    reviewCount={profile.reviewCount} 
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {profile.isVerified ? (
                    <Badge variant="success" className="flex items-center gap-1 justify-center">
                      <Check className="w-3 h-3" />
                      Profil vérifié
                    </Badge>
                  ) : (
                    <Badge variant="warning">Vérification en cours</Badge>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{profile.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-4">
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Taux horaire</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(profile.hourlyRate || 0)}/h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rayon de service</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.serviceRadius || 10} km
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    value={isEditing ? formData.firstName || '' : profile.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    leftIcon={<User className="w-5 h-5" />}
                  />
                  <Input
                    label="Nom"
                    value={isEditing ? formData.lastName || '' : profile.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    leftIcon={<User className="w-5 h-5" />}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={isEditing ? formData.email || '' : profile.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    leftIcon={<Mail className="w-5 h-5" />}
                  />
                  <Input
                    label="Téléphone"
                    value={isEditing ? formData.phone || '' : profile.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    leftIcon={<Phone className="w-5 h-5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Types de services</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleServiceType(type)}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                          (formData.serviceTypes || []).includes(type)
                            ? 'border-quebec-blue bg-blue-50 text-quebec-blue'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {SERVICE_TYPE_LABELS[type]}
                          {(formData.serviceTypes || []).includes(type) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.serviceTypes || []).map((type) => (
                      <Badge key={type} variant="info">
                        {SERVICE_TYPE_LABELS[type]}
                      </Badge>
                    ))}
                    {(profile.serviceTypes || []).length === 0 && (
                      <p className="text-gray-500 text-sm">Aucun service sélectionné</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing & Radius */}
            <Card>
              <CardHeader>
                <CardTitle>Tarification et rayon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux horaire ($/h)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={isEditing ? formData.hourlyRate || '' : profile.hourlyRate || ''}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                        disabled={!isEditing}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rayon de service (km)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={isEditing ? formData.serviceRadius || '' : profile.serviceRadius || ''}
                        onChange={(e) => setFormData({ ...formData, serviceRadius: parseInt(e.target.value) })}
                        disabled={!isEditing}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                    {isEditing && (
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={formData.serviceRadius || 10}
                        onChange={(e) => setFormData({ ...formData, serviceRadius: parseInt(e.target.value) })}
                        className="w-full mt-2"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* License Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Licence et certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Numéro de licence (optionnel)"
                  value={isEditing ? formData.licenseNumber || '' : profile.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  disabled={!isEditing}
                  placeholder="ex: RBQ-1234-5678"
                />
                
                {isEditing ? (
                  <FileUpload
                    label="Document de licence"
                    onFileSelect={setSelectedFile}
                    value={selectedFile}
                    helperText="Télécharge ton permis ou licence professionnelle"
                  />
                ) : profile.licenseDocument ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Award className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Licence téléchargée</p>
                      <p className="text-xs text-green-600">Document vérifié par notre équipe</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun document téléchargé</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
