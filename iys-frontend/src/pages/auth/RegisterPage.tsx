import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  GraduationCap,
  MapPin,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCentreId = searchParams.get('centreId');

  const { register } = useAuth();

  // Field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initiatedName, setInitiatedName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [centreId, setCentreId] = useState(queryCentreId || '');
  const [profileType, setProfileType] = useState('STUDENT');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [initiationStatus, setInitiationStatus] = useState('UNINITIATED');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (queryCentreId) {
      setCentreId(queryCentreId);
    }
  }, [queryCentreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const legalName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const effectiveCity = selectedCity === 'OTHER' ? customCity.trim() : selectedCity;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !centreId.trim()) {
      setError('Please fill all required fields: First Name, Last Name, Email, Password, and Centre ID.');
      return;
    }

    if (selectedCity === 'OTHER' && !customCity.trim()) {
      setError('Please specify your city name.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await register({
        legalName,
        initiatedName: initiatedName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        centreId: centreId.trim(),
        profileType,
        city: effectiveCity || undefined,
        initiationStatus,
      });
      navigate('/');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Registration failed. Please check your details.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Left Aesthetic Banner */}
      <div className="md:w-5/12 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-900 p-8 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-100 tracking-wider uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Join the Youth Sangha
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Register Your <br />
            <span className="text-amber-200">Devotee Journey</span>
          </h1>
          <p className="mt-4 text-sm text-amber-100/90 leading-relaxed">
            Connect with counsellors, track your daily sadhana progress, access youth study groups, and serve in youth preaching programs worldwide.
          </p>
        </div>

        <div className="relative z-10 my-8 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
          <p className="text-xs text-amber-200 font-medium tracking-wide uppercase">ISKCON Founder-Acharya</p>
          <p className="text-sm font-serif italic text-white mt-1">
            "Youth are the future pillars of our Krishna consciousness movement. Train them nicely with love and philosophy."
          </p>
          <p className="text-xs text-amber-300/80 mt-2 font-semibold">— His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</p>
        </div>

        <div className="relative z-10 text-xs text-amber-200/80 border-t border-white/10 pt-4">
          ISKCON Youth Services &copy; 2026
        </div>
      </div>

      {/* Right Registration Card */}
      <div className="md:w-7/12 flex items-center justify-center p-6 md:p-14 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-xl bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-200/80 my-4">
          <div className="text-left mb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Devotee Registration</h2>
            <p className="text-xs text-slate-500 mt-1">Create your profile to join your assigned youth centre</p>
          </div>

          {queryCentreId && (
            <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-center gap-2.5 text-amber-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Invited with Centre ID:{' '}
                <span className="font-mono font-bold">{queryCentreId}</span>
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                type="text"
                placeholder="e.g. Ramesh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Last Name *"
                type="text"
                placeholder="e.g. Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            </div>

            {/* Initiated Name */}
            <Input
              label="Initiated Name (If initiated)"
              type="text"
              placeholder="e.g. Ramananda Das (Leave blank if uninitiated)"
              value={initiatedName}
              onChange={(e) => setInitiatedName(e.target.value)}
              leftIcon={<Sparkles className="w-4 h-4" />}
            />

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. ramesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            {/* 2. Centre ID Input instead of dropdown */}
            <Input
              label="Youth Centre ID *"
              type="text"
              placeholder="e.g. 11111111-1111-1111-1111-111111111111"
              value={centreId}
              onChange={(e) => setCentreId(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
              helperText="Enter the Centre UUID provided by your centre coordinator"
              required
            />

            {/* 3. Profile Type Dropdown & 4. Initiation Status Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Profile Type *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 cursor-pointer"
                    required
                  >
                    <option value="STUDENT">Student (College / University)</option>
                    <option value="WORKING_PROFESSIONAL">Working Professional</option>
                    <option value="ALUMNI">Alumni / Graduate</option>
                    <option value="OTHER">Other / Congregation Member</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Initiation Status *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <select
                    value={initiationStatus}
                    onChange={(e) => setInitiationStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 cursor-pointer"
                    required
                  >
                    <option value="UNINITIATED">Uninitiated (Aspirant / Shelter)</option>
                    <option value="FIRST_INITIATED">First Initiated (Hari-Nama Diksha)</option>
                    <option value="SECOND_INITIATED">Second Initiated (Brahmana Diksha)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. City Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                City *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    if (e.target.value !== 'OTHER') {
                      setCustomCity('');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 cursor-pointer"
                  required
                >
                  <option value="">-- Select Your City --</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Mayapur">Mayapur</option>
                  <option value="Vrindavan">Vrindavan</option>
                  <option value="OTHER">Other (Type city name below)</option>
                </select>
              </div>
              {selectedCity === 'OTHER' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter your city name"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    leftIcon={<MapPin className="w-4 h-4" />}
                    required
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <Input
              label="Password (min 8 characters) *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
