import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth, ROLE_DASHBOARD } from '../../context/AuthContext';
import api from '../../services/api';
import logoImg from '../../../assets/Logo.png';

export function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, login, setPendingOTP, otpUserId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    inputRefs.current[0]?.focus();
    if (otpUserId) {
      api.sendOTP(otpUserId).catch(err => {
        console.error('Failed to auto-send OTP on mount:', err);
      });
    }
  }, [otpUserId, navigate, user]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    if (!otpUserId) { setError('Session expired. Please login again.'); return; }
    setLoading(true);
    try {
      const data = await api.verifyOTP(otpUserId, code);
      api.setToken(data.token);
      login({
        id: data.user._id || data.user.id,
        name: data.user.name,
        role: data.user.role,
        employeeId: data.user.employeeId,
      });
      setPendingOTP(false);
      navigate(ROLE_DASHBOARD[data.user.role] || '/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpUserId) return;
    try {
      await api.sendOTP(otpUserId);
      setResent(true);
      setCountdown(30);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
      setTimeout(() => setResent(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  const maskedPhone = user ? '+91 ••••• ' + '7890' : '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logoImg} alt="White Horse Manpower" className="h-10 w-auto" />
          <span className="text-slate-800" style={{ fontWeight: 700 }}>White Horse Manpower ATS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Icon */}
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Smartphone className="w-7 h-7 text-green-600" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.4rem' }}>OTP Verification</h1>
            <p className="text-slate-500 text-sm">
              WFH access requires OTP verification. We've sent a 6-digit code to{' '}
              <strong className="text-slate-700">{maskedPhone}</strong>
            </p>
          </div>

          {resent && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              OTP resent successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>
            {/* OTP Inputs */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-12 h-12 text-center border-2 rounded-xl text-slate-800 outline-none transition-colors ${
                    digit
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 focus:border-green-400'
                  }`}
                  style={{ fontWeight: 700, fontSize: '1.25rem' }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-70"
              style={{ fontWeight: 600 }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500">
                Resend OTP in <span className="text-green-600" style={{ fontWeight: 600 }}>{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mx-auto"
                style={{ fontWeight: 500 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend OTP
              </button>
            )}
          </div>

          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-xs text-center" style={{ fontWeight: 500 }}>
              Demo OTP: Check server console for the OTP code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
