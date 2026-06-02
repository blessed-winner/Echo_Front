import React, { useEffect, useMemo, useState } from 'react';
import { Mail, LogIn, Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

type LocationState = {
  message?: string;
  from?: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, startOAuth, isAuthenticated, isAuthLoading } = useUser();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(state?.message ?? null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const carouselSlides = [
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi-H-D5yBQr3irGnn0eCdXwE1MqMXqIq8yk7_1e26Tl92pOMgjJzjb-8pmtMrjzbBeeS3Ze8WONH7vFP5Cw5-t1xNzI-2wcZI6qynUoNZqNjEcvoR9qSxWXfCAe0PZASPGqSulcFJZXIcxAGq59JQkMMLNC4lt3EeuNHyP1W1K9W7yhBKDzMS4AyPs2RTYbzegs_VeT6kP4AEkg0P2DlmmL9Gy5JQHDeEllX87xaxrFreii3IciPqfTp68b7Hloo0G5bIKk6cVUj0",
      title: "Master Your Memory.",
      description: "The intelligent spaced repetition system designed for lifelong learners and professionals."
    },
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8kLYYIGPq3MO3B8TrmM-bYAgQWYUXql6HNKhvmPdq6vTo0nMcX5p6GUqmOZs2Xq1h-L5FHHh6dcPI541f0zp8UVYZXyxs4XcShkN7B5F3KGBzDcjkbCVCtmanvfk4rSDSZ7t7_6nYMxpzErvH7Ad6n1ndFKsT3bS3_HrhwV1tIF_5JJ9gC5BNetnOayOAyY2GunxUCRHeSfX3oIV7Hq_4Qhb24Hq6Qc4ITXDQ1JCWs8YexVUnr8ax37X4IClF7mTA_LWClH6v77w",
      title: "Master anything with spaced repetition",
      description: "Echo leverages cognitive science to ensure you never forget what you've learned. Build long-term memory through intelligent review sessions."
    }
  ];

  // Auto-advance carousel with progress bar
  useEffect(() => {
    let progressValue = 0;
    
    const progressInterval = setInterval(() => {
      progressValue += 2;
      
      if (progressValue >= 100) {
        progressValue = 0;
        setCurrentSlide((current) => (current + 1) % carouselSlides.length);
      }
      
      setProgress(progressValue);
    }, 100);

    return () => clearInterval(progressInterval);
  }, [carouselSlides.length]);

  // Reset progress when manually changing slides
  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const oauthButtons = useMemo(() => ([
    {
      label: 'Google',
      provider: 'google' as const,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      label: 'GitHub',
      provider: 'github' as const,
      icon: (
        <svg height="20" viewBox="0 0 24 24" width="20" className="fill-current">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      ),
    },
  ]), []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate((state?.from as string | undefined) ?? '/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Branding & Visual Sidebar (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#182442] overflow-hidden items-center justify-center p-12">
        {/* Carousel Background Images */}
        <div className="absolute inset-0 z-0">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: currentSlide === index ? 0.2 : 0 }}
            >
              <img
                className="w-full h-full object-cover"
                alt="Background"
                src={slide.image}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[#182442] to-transparent z-10"></div>

        <div className="relative z-20 max-w-md text-center">
          <div className="mb-12 flex justify-center">
            <div className="w-full max-w-[240px]">
              <img
                src="/images/logo_white.png"
                alt="Echo Logo"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          
          {/* Carousel Content with proper height */}
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className="transition-opacity duration-1000 ease-in-out"
              style={{ 
                opacity: currentSlide === index ? 1 : 0,
                position: currentSlide === index ? 'relative' : 'absolute',
                top: currentSlide === index ? 'auto' : 0,
                left: currentSlide === index ? 'auto' : 0,
                right: currentSlide === index ? 'auto' : 0,
                pointerEvents: currentSlide === index ? 'auto' : 'none'
              }}
            >
              <h2 className="text-5xl font-bold text-white mb-6 font-manrope">{slide.title}</h2>
              <p className="text-xl text-white/80 font-medium">
                {slide.description}
              </p>
            </div>
          ))}
          
          {/* Carousel Indicators with Progress Bar */}
          <div className="mt-12 flex justify-center gap-2">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
                style={{ width: currentSlide === index ? '48px' : '8px' }}
                aria-label={`Go to slide ${index + 1}`}
              >
                {/* Background */}
                <div className="absolute inset-0 bg-white/30"></div>
                {/* Progress fill */}
                {currentSlide === index && (
                  <div 
                    className="absolute inset-0 bg-white transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                )}
                {/* Static fill for non-active */}
                {currentSlide !== index && (
                  <div className="absolute inset-0 bg-white/30"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface px-8 animate-in slide-in-from-right-8 duration-700 overflow-hidden">
        <div className="w-full max-w-[440px]">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-on-surface mb-3 font-manrope">Welcome back</h1>
            <p className="text-on-surface-variant">Please enter your details to sign in to your account.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Auth Providers */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {oauthButtons.map((button) => (
              <button
                key={button.provider}
                type="button"
                onClick={() => startOAuth(button.provider)}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-outline/10 rounded-xl font-bold text-on-surface hover:bg-surface-variant/50 transition-all active:scale-95"
              >
                {button.icon}
                {button.label}
              </button>
            ))}
          </div>

          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t border-outline/10"></div>
            <span className="px-4 text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Or continue with</span>
            <div className="flex-grow border-t border-outline/10"></div>
          </div>

          {/* Primary Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  className="w-full px-4 py-3.5 pl-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all placeholder:text-slate-400"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="password">Password</label>
                <a className="text-[10px] text-primary hover:underline font-black uppercase" href="#">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all placeholder:text-slate-400"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#182442] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                className="w-4 h-4 rounded-md border-outline/20 text-primary focus:ring-primary accent-primary"
                id="remember"
                type="checkbox"
              />
              <label className="text-xs text-on-surface-variant font-medium" htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button
              className="w-full py-4 bg-[#182442] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              <LogIn size={18} />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?
              <Link className="text-primary font-bold hover:underline ml-1" to="/signup">Sign up for free</Link>
            </p>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[10px] text-on-surface-variant/40 leading-relaxed font-medium uppercase tracking-tighter">
              By signing in, you agree to our <br/>
              <a className="underline hover:text-on-surface transition-colors" href="#">Terms of Service</a> and <a className="underline hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
