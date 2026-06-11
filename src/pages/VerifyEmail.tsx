import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await api.get<string>(`/auth/verify?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage(response.data || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: { message: 'Email verified! You can now log in.' }
          });
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-[#182442] animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-[#182442]" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-slate-400" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-on-surface mb-3 font-manrope">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-on-surface-variant mb-8">
            {message}
          </p>

          {/* Action Buttons */}
          {status === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined !text-[16px]">schedule</span>
                <span>Redirecting to login in 3 seconds...</span>
              </div>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 bg-[#182442] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 bg-[#182442] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/signup', { replace: true })}
                className="w-full py-3 bg-white text-[#182442] border-2 border-slate-200 rounded-xl font-bold hover:border-[#182442] transition-all"
              >
                Sign Up Again
              </button>
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-sm text-slate-500 hover:text-[#182442] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
