import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCentres } from '../../hooks/useCentres';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Mail, Lock, User, Phone, Sparkles, AlertCircle, ArrowRight, Building, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCentreId = searchParams.get('centreId');

  const { register } = useAuth();
  const { data: centresData, isLoading: centresLoading } = useCentres(false, 0, 50);

  const [legalName, setLegalName] = useState('');
  const [initiatedName, setInitiatedName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [centreId, setCentreId] = useState(queryCentreId || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (queryCentreId) {
      setCentreId(queryCentreId);
    }
  }, [queryCentreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCentreId = centreId || centresData?.content?.[0]?.id;

    if (!legalName || !email || !password || !effectiveCentreId) {
      setError('Please fill all required fields and ensure a centre is selected.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await register({
        legalName,
        initiatedName: initiatedName || undefined,
        email,
        phone: phone || undefined,
        password,
        centreId: effectiveCentreId,
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
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-200/80">
          <div className="text-left mb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Devotee Registration</h2>
            <p className="text-xs text-slate-500 mt-1">Create your profile to join your local youth centre</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Legal Full Name *"
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Initiated Name (If initiated)"
                type="text"
                placeholder="e.g. Ramananda Das"
                value={initiatedName}
                onChange={(e) => setInitiatedName(e.target.value)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              />
            </div>

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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Youth Centre *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                {centresData?.content && centresData.content.length > 0 ? (
                  <select
                    value={centreId || centresData.content[0]?.id || ''}
                    onChange={(e) => setCentreId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20"
                    required
                  >
                    {centresData.content.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.shortCode}) - {c.city}, {c.country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Enter Centre UUID (e.g. 11111111-1111-1111-1111-111111111111)"
                    value={centreId}
                    onChange={(e) => setCentreId(e.target.value)}
                    leftIcon={<Building className="w-4 h-4" />}
                    helperText={centresLoading ? 'Loading available centres...' : 'No pre-seeded centre loaded yet; enter centre UUID'}
                    required
                  />
                )}
              </div>
            </div>

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
