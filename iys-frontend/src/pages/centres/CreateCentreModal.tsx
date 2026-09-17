import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useCreateCentre } from '../../hooks/useCentres';
import { Building2, Globe, MapPin, Mail, Phone, AlertCircle } from 'lucide-react';

interface CreateCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCentreModal: React.FC<CreateCentreModalProps> = ({ isOpen, onClose }) => {
  const createMutation = useCreateCentre();

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortCode || !city || !country) {
      setError('Please fill in Centre Name, Short Code, City, and Country.');
      return;
    }

    try {
      setError(null);
      await createMutation.mutateAsync({
        name,
        shortCode: shortCode.toUpperCase(),
        city,
        state: state || undefined,
        country,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
      });
      onClose();
      // Reset
      setName('');
      setShortCode('');
      setCity('');
      setState('');
      setContactEmail('');
      setContactPhone('');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to create centre.';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Establish New Youth Centre"
      description="Create a new ISKCON youth centre location in the multi-tenant registry"
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Centre Name *"
          placeholder="e.g. ISKCON Pune NVCC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Building2 className="w-4 h-4" />}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Short Code (3-4 Letters) *"
            placeholder="e.g. PUN"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />

          <Input
            label="City *"
            placeholder="e.g. Pune"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="State / Province"
            placeholder="e.g. Maharashtra"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />

          <Input
            label="Country *"
            placeholder="e.g. India"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            leftIcon={<Globe className="w-4 h-4" />}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Email"
            type="email"
            placeholder="youth@iskconpune.org"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Contact Phone"
            placeholder="+91 9876543210"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={createMutation.isPending}
          >
            Create Centre
          </Button>
        </div>
      </form>
    </Modal>
  );
};
