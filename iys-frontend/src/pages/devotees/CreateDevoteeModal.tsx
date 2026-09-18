import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useCreateDevotee } from '../../hooks/useDevotees';
import { useCentres } from '../../hooks/useCentres';
import { useAuth } from '../../context/AuthContext';
import { ProfileType } from '../../types/devotee';
import { User, Sparkles, Phone, MapPin, AlertCircle, Mail, Building2 } from 'lucide-react';

interface CreateDevoteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreId?: string;
}

export const CreateDevoteeModal: React.FC<CreateDevoteeModalProps> = ({
  isOpen,
  onClose,
  centreId: initialCentreId,
}) => {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const { data: centresData } = useCentres(false, 0, 100);
  const centres = centresData?.content || [];
  const createMutation = useCreateDevotee();

  // 1) Centre Id defaults to login admin's centre id
  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    user?.centreId || initialCentreId || ''
  );

  // 2) First Name and Last Name instead of Full Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initiatedName, setInitiatedName] = useState('');
  const [email, setEmail] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('STUDENT');
  const [initiationStatus, setInitiationStatus] = useState('UNINITIATED');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('MALE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (user?.centreId) {
        setSelectedCentreId(user.centreId);
      } else if (initialCentreId) {
        setSelectedCentreId(initialCentreId);
      } else if (centres.length > 0) {
        setSelectedCentreId(centres[0].id);
      }
    }
  }, [isOpen, user?.centreId, initialCentreId, centres]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setInitiatedName('');
    setEmail('');
    setPhone('');
    setCity('');
    setNotes('');
    setError(null);
    setProfileType('STUDENT');
    setInitiationStatus('UNINITIATED');
    setGender('MALE');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('First Name and Last Name are required.');
      return;
    }

    const effectiveCentreId = isSuperAdmin ? selectedCentreId : (user?.centreId || selectedCentreId);
    if (!effectiveCentreId) {
      setError('Centre ID is required. Please verify centre configuration.');
      return;
    }

    if (initiationStatus !== 'UNINITIATED' && !initiatedName.trim()) {
      setError('Initiated Name is required when Initiation Status is not Uninitiated.');
      return;
    }

    const legalName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      setError(null);
      await createMutation.mutateAsync({
        centreId: effectiveCentreId,
        legalName,
        initiatedName: initiatedName.trim() || undefined,
        email: email.trim() || undefined,
        profileType,
        initiationStatus,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        gender,
        notes: notes.trim() || undefined,
      });

      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to create devotee profile.';
      setError(errorMsg);
    }
  };

  const currentCentre = centres.find((c) => c.id === (user?.centreId || selectedCentreId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New Devotee Profile"
      description="Add a devotee record into the active youth centre database"
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1) Centre Id Section: default selected to login admin centre id */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Youth Centre {isSuperAdmin ? '*' : '(Default Assigned)'}
          </label>

          {isSuperAdmin ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 cursor-pointer"
                required
              >
                <option value="">-- Select Centre --</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.shortCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentCentre?.name || 'Assigned Youth Centre'} {currentCentre?.shortCode ? `(${currentCentre.shortCode})` : ''}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    Centre ID: {user?.centreId || selectedCentreId}
                  </p>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold border border-amber-300">
                Login Admin Centre
              </span>
            </div>
          )}
        </div>

        {/* 2) First Name and Last Name instead of Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Amit"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Last Name *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Patel"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />
        </div>

        {/* Initiated Name */}
        <Input
          label="Initiated Name (Required if initiated)"
          value={initiatedName}
          onChange={(e) => setInitiatedName(e.target.value)}
          placeholder="e.g. Ananta Das (Leave blank if uninitiated)"
          leftIcon={<Sparkles className="w-4 h-4 text-slate-400" />}
        />

        {/* Profile Type, Initiation Status, Gender */}
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

        {/* Contact info: Email, Phone, City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Email (Login/Contact)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="devotee@example.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Pune"
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Initial Notes */}
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
          <Button type="button" variant="outline" size="md" onClick={handleClose}>
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
