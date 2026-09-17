import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useCreateDevotee } from '../../hooks/useDevotees';
import { ProfileType } from '../../types/devotee';
import { User, Sparkles, Phone, MapPin, AlertCircle, Mail } from 'lucide-react';

interface CreateDevoteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
}

export const CreateDevoteeModal: React.FC<CreateDevoteeModalProps> = ({
  isOpen,
  onClose,
  centreId,
}) => {
  const createMutation = useCreateDevotee();

  const [legalName, setLegalName] = useState('');
  const [initiatedName, setInitiatedName] = useState('');
  const [email, setEmail] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('STUDENT');
  const [initiationStatus, setInitiationStatus] = useState('UNINITIATED');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('MALE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName || !centreId) {
      setError('Legal Name and Centre are required.');
      return;
    }

    try {
      setError(null);
      await createMutation.mutateAsync({
        centreId,
        legalName,
        initiatedName: initiatedName || undefined,
        email: email.trim() || undefined,
        profileType,
        initiationStatus,
        phone: phone || undefined,
        city: city || undefined,
        gender,
        notes: notes || undefined,
      });
      onClose();
      // Reset form
      setLegalName('');
      setInitiatedName('');
      setEmail('');
      setPhone('');
      setCity('');
      setNotes('');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to create devotee profile.';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Devotee Profile"
      description="Add a devotee record into the active youth centre database"
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Legal Full Name *"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="e.g. Amit Patel"
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Initiated Name"
            value={initiatedName}
            onChange={(e) => setInitiatedName(e.target.value)}
            placeholder="e.g. Ananta Das"
            leftIcon={<Sparkles className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Profile Type *
            </label>
            <select
              value={profileType}
              onChange={(e) => setProfileType(e.target.value as ProfileType)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20"
            >
              <option value="STUDENT">Student</option>
              <option value="WORKING_PROFESSIONAL">Working Professional</option>
              <option value="ALUMNI">Alumni</option>
              <option value="OTHER">Other / General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Initiation Status
            </label>
            <select
              value={initiationStatus}
              onChange={(e) => setInitiationStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20"
            >
              <option value="UNINITIATED">Uninitiated / Aspirant</option>
              <option value="FIRST_INITIATED">Harinama (1st Init)</option>
              <option value="SECOND_INITIATED">Brahmin (2nd Init)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20"
            >
              <option value="MALE">Male (Prabhuji)</option>
              <option value="FEMALE">Female (Mataji)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Email (Login/Contact)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="devotee@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Pune"
            leftIcon={<MapPin className="w-4 h-4" />}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Initial Devotional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Chanting rounds, interest in youth programs, seva preferences..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20"
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
            Create Devotee Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
