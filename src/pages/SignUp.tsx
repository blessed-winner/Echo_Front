import React, { useEffect, useState } from 'react';
import { Mail, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isAuthLoading } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const carouselSlides = [
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8kLYYIGPq3MO3B8TrmM-bYAgQWYUXql6HNKhvmPdq6vTo0nMcX5p6GUqmOZs2Xq1h-L5FHHh6dcPI541f0zp8UVYZXyxs4XcShkN7B5F3KGBzDcjkbCVCtmanvfk4rSDSZ7t7_6nYMxpzErvH7Ad6n1ndFKsT3bS3_HrhwV1tIF_5JJ9gC5BNetnOayOAyY2GunxUCRHeSfX3oIV7Hq_4Qhb24Hq6Qc4ITXDQ1JCWs8YexVUnr8ax37X4IClF7mTA_LWClH6v77w",
      title: "Master anything with spaced repetition",
      description: "Echo leverages cognitive science to ensure you never forget what you've learned. Build long-term memory through intelligent review sessions."
    },
    {
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi-H-D5yBQr3irGnn0eCdXwE1MqMXqIq8yk7_1e26Tl92pOMgjJzjb-8pmtMrjzbBeeS3Ze8WONH7vFP5Cw5-t1xNzI-2wcZI6qynUoNZqNjEcvoR9qSxWXfCAe0PZASPGqSulcFJZXIcxAGq59JQkMMLNC4lt3EeuNHyP1W1K9W7yhBKDzMS4AyPs2RTYbzegs_VeT6kP4AEkg0P2DlmmL9Gy5JQHDeEllX87xaxrFreii3IciPqfTp68b7Hloo0G5bIKk6cVUj0",
      title: "Master Your Memory.",
      description: "The intelligent spaced repetition system designed for lifelong learners and professionals."
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const message = await register(name, email, password);
      setSuccess(message || 'Registration successful. Please check your email.');
      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Registration successful. Please check your email to verify your account.' },
        });
      }, 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Branding & Visual Sidebar (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#182442] overflow-hidden items-center justify-center p-12">
        {/* Abstract Background for Visual Interest */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        </div>

        {/* Carousel Background Images */}
        <div className="absolute inset-0 z-0">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: currentSlide === index ? 0.2 : 0 }}
            >
              <img
                alt="Background"
                className="w-full h-full object-cover"
                src={slide.image}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-12">
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
              <h1 className="text-5xl font-bold text-white mb-6 font-manrope leading-[1.1]">{slide.title}</h1>
              <p className="text-xl text-white/80 font-medium leading-relaxed mb-10">
                {slide.description}
              </p>
            </div>
          ))}

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: 'bolt', label: 'Active Recall' },
              { icon: 'auto_graph', label: 'Adaptive Spacing' },
              { icon: 'analytics', label: 'Cognitive Analytics' }
            ].map((feature) => (
              <div key={feature.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-white !text-[18px]">{feature.icon}</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Carousel Indicators with Progress Bar */}
          <div className="flex gap-2">
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

        {/* Decorative Illustration Image */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[#182442] to-transparent z-10"></div>
      </div>

      {/* Sign Up Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface px-8 animate-in slide-in-from-right-8 duration-700 overflow-hidden">
        <div className="w-full max-w-[440px]">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-on-surface mb-3 font-manrope">Create your account</h1>
            <p className="text-on-surface-variant">Join a community of lifelong learners and professionals.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#3c6752]">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="name">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  className="w-full px-4 py-3.5 pl-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all placeholder:text-slate-400"
                  id="name"
                  placeholder="Enter your full name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  className="w-full px-4 py-3.5 pl-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all placeholder:text-slate-400"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="password">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all placeholder:text-slate-400"
                  id="password"
                  placeholder="Min. 8 characters"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
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

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                className="mt-1 w-4 h-4 rounded-md border-slate-200 text-primary focus:ring-primary accent-primary"
                id="terms"
                type="checkbox"
                required
              />
              <label className="text-xs text-on-surface-variant leading-relaxed" htmlFor="terms">
                I agree to the <a className="text-primary font-bold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-bold hover:underline" href="#">Privacy Policy</a>.
              </label>
            </div>

            {/* Verification Note */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="material-symbols-outlined text-[#3c6752] !text-[20px]">info</span>
              <p className="text-xs text-[#3c6752] font-medium leading-tight">
                We'll send a verification link to your email to activate your account.
              </p>
            </div>

            <button
              className="w-full py-4 bg-[#182442] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-100">
            <p className="text-sm text-on-surface-variant">
              Already have an account?
              <Link className="text-primary font-bold hover:underline ml-1" to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
