import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const AuthSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeOAuth } = useUser();
  const [message, setMessage] = useState('Finalizing sign in...');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    let redirectTimer: number | undefined;

    if (!token) {
      setMessage('Missing authentication token.');
      redirectTimer = window.setTimeout(() => {
        navigate('/login', { replace: true, state: { message: 'OAuth sign-in was not completed.' } });
      }, 1500);

      return () => {
        if (redirectTimer) {
          window.clearTimeout(redirectTimer);
        }
      };
    }

    const finalize = async () => {
      try {
        await completeOAuth(token);
        setMessage('Sign in complete. Redirecting to your dashboard...');
        redirectTimer = window.setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 900);
      } catch {
        setMessage('We could not finish signing you in.');
        redirectTimer = window.setTimeout(() => {
          navigate('/login', { replace: true, state: { message: 'OAuth sign-in failed. Please try again.' } });
        }, 1500);
      }
    };

    void finalize();

    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [completeOAuth, location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#182442]/5 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[#182442] !text-[28px]">verified</span>
        </div>
        <h1 className="text-3xl font-bold text-[#182442] font-manrope mb-2">Authentication</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
