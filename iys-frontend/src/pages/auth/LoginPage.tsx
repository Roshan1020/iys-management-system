import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Mail, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login({ email, password });
      navigate('/');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Invalid email or password.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@iskcon.org');
    setPassword('Admin@123456');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Left Aesthetic Banner */}
      <div className="md:w-1/2 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-900 p-8 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-100 tracking-wider uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            ISKCON Youth Services Platform
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            Empowering Youth in <br />
            <span className="text-amber-200">Devotional Service</span>
          </h1>
          <p className="mt-4 text-sm md:text-base text-amber-100/90 max-w-lg leading-relaxed">
            Centralized platform for devotee profiles, sadhana tracking, youth preaching contacts, mentor connections, and event management across all centres.
          </p>
        </div>

        <div className="relative z-10 my-10 md:my-0 space-y-4">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <p className="text-xs text-amber-200 font-medium tracking-wide uppercase">Scriptural Inspiration</p>
            <p className="text-sm font-serif italic text-white mt-1">
              "In this endeavor there is no loss or diminution, and a little advancement upon this path can protect one from the most dangerous type of fear."
            </p>
            <p className="text-xs text-amber-300/80 mt-2 font-semibold">— Bhagavad Gita 2.40</p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-amber-200/80 flex items-center justify-between border-t border-white/10 pt-4">
          <span>International Society for Krishna Consciousness</span>
          <span>Phase 1 Monolith</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-14 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-200/80">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl mx-auto shadow-md shadow-orange-500/25 mb-3">
              🪷
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Please sign in to access your youth centre dashboard</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. devotee@iskcon.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" className="rounded text-amber-600 focus:ring-amber-500" />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-amber-700 hover:text-amber-800 font-medium hover:underline"
              >
                Quick-fill admin
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New devotee or youth member?{' '}
              <Link to="/register" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
