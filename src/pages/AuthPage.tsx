import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOTP = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message);
    else setStep('otp');
    setLoading(false);
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) setError(error.message);
    else onAuth();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold text-emerald-700">BB Meta</h1>
          <p className="text-sm text-gray-500 mt-1">Brainy Bunch Parent Portal</p>
        </div>

        {step === 'phone' ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+60123456789"
              className="w-full border rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={sendOTP}
              disabled={loading || !phone}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full border rounded-lg px-4 py-3 mb-4 text-center text-2xl tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={verifyOTP}
              disabled={loading || !otp}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full text-sm text-gray-500 mt-3 hover:text-emerald-600">
              ← Change phone number
            </button>
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">Powered by Vibe Coding ⚡</p>
          <a href="https://vibecoderlab.ai" className="text-xs text-emerald-500 hover:underline">VibeCoderLab.ai</a>
        </div>
      </div>
    </div>
  );
}
