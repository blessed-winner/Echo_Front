import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';

const LandingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background font-inter text-text-primary selection:bg-indigo-600/20 selection:text-indigo-900 overflow-x-hidden">
      <div className="flex-grow">
        {/* Navigation — floating centered pill */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-[#182442] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-[#182442]/40 transition-all duration-300 overflow-hidden">
          <div className="px-6 h-[66px] flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/images/logo_white.png" 
                alt="Echo Logo" 
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* Nav links — Desktop */}
            <div className="hidden md:flex items-center gap-7 text-sm">
              <a href="#" className="font-bold text-white underline underline-offset-4 decoration-2 decoration-white/40">Home</a>
              <a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-white/70 hover:text-white transition-colors">Testimonials</a>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-[#182442] px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden md:block px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-white text-[#182442] px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-xl shadow-black/10 active:scale-95"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined !text-[24px]">
                  {isMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <div className={cn(
            "md:hidden transition-all duration-300 ease-in-out border-t border-white/5",
            isMenuOpen ? "max-h-[400px] opacity-100 py-6" : "max-h-0 opacity-0 pointer-events-none"
          )}>
            <div className="flex flex-col items-center gap-6 px-6">
              <a href="#" onClick={() => setIsMenuOpen(false)} className="font-bold text-white">Home</a>
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">Testimonials</a>
              <div className="w-full h-px bg-white/5 my-2"></div>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all"
                >
                  Go to Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section — Full-viewport centered layout */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24 pb-8">
        <div className="max-w-3xl mx-auto w-full">

          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-sm mb-6">
            <span className="relative flex h-1 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#182442] opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#182442]"></span>
            </span>
            Echo is now live
          </div>

          {/* Heading — Cormorant Garamond, bold black */}
          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-[1.08] tracking-tight mb-2"
          >
            Learn it today.
          </h1>
          {/* Italic accent line */}
          <h2
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-5xl md:text-6xl lg:text-7xl font-normal italic text-[#182442] leading-[1.08] tracking-tight mb-6"
          >
            Remember forever.
          </h2>

          {/* Subtitle — DM Sans */}
          <p
            style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
            className="text-base md:text-lg text-slate-500 max-w-lg mx-auto leading-relaxed mb-8"
          >
            Echo uses <span className="text-[#182442] font-medium">precision scheduling</span> and{' '}
            <span className="text-[#182442] font-medium">cognitive science</span> to ensure the things you learn stay in your{' '}
            <span className="text-[#182442] font-medium">long-term memory</span>{' '}with{' '}
            <span className="text-[#182442] font-medium">minimal effort</span> — because knowledge is only valuable if it{' '}
            <span className="text-[#182442] font-medium">stays with you</span>.
          </p>

          {/* CTA Card — mirrors reference "Join the waitlist" card */}
          <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-3">
                {[
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBCx1RCWyd3WgDkr-W39sFW-ZJr5PLBuF2QwW34BPHD3qDHNetV3LCcRhGiEa3_-gqlBtz3feL7nQEtJ0r6T4DGhJNdBbDMqFqo-i6slzcWucjywyzTBqhp6BzgNQTwMiTMqKhvrJPIYj7LSDkmHt_7WIfAktCFyncJkAOfqKYvxadKCmjxHfolnTdvBICNXQCrkfJi7RNkWmHKTL4nJ4X_FPezVw6ZKqonOa8rDOPC0LLtKD5nds9wt3HM9tJMIIyY81nVEcama0M",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDi-H-D5yBQr3irGnn0eCdXwE1MqMXqIq8yk7_1e26Tl92pOMgjJzjb-8pmtMrjzbBeeS3Ze8WONH7vFP5Cw5-t1xNzI-2wcZI6qynUoNZqNjEcvoR9qSxWXfCAe0PZASPGqSulcFJZXIcxAGq59JQkMMLNC4lt3EeuNHyP1W1K9W7yhBKDzMS4AyPs2RTYbzegs_VeT6kP4AEkg0P2DlmmL9Gy5JQHDeEllX87xaxrFreii3IciPqfTp68b7Hloo0G5bIKk6cVUj0",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDjzSSo-lfHr_UZUX9Tnc5MwnFqOPt6dh4-71Cr0_8-FmyPOqVHZSkrRLKkN3i2JOogu0Y3t4sPw8G1g6b3ORdr2fTiQrP2-nch1fcxHKE2WV6C0xKGiD6Zr9Pe-z4GPY-OdKRTR7iciYa-wFCC3_kifVb8OGl5-3Trr5tKK59dugRKlOSPSt-xHvz1NC0ue-9ZwjZummFJ2undD4Uag7RaNcl215hIy2zIEj1JUk6VvxcEoV4L7QirFolGZvxeGBR1OCRuFOTdtT8"
                ].map((src, i) => (
                  <img key={i} src={src} alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-500">50k+</span>
            </div>

            <p className="text-xl font-bold text-[#182442] font-manrope mb-5">Start Learning Today</p>

            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter Your Email"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] transition-all"
              />
              <Link
                to="/signup"
                className="bg-[#182442] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2a3a61] transition-all whitespace-nowrap shadow-lg shadow-primary/20"
              >
                Get Started
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Section — with subtle fluid background animation */}
      <section className="bg-[#182442] text-white py-24 relative overflow-hidden">
        {/* Animated Background Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <style>
              {`
                @keyframes flow {
                  0% { transform: translateX(-25%); }
                  100% { transform: translateX(25%); }
                }
                .flow-line {
                  animation: flow 20s ease-in-out infinite alternate;
                }
                .flow-line-reverse {
                  animation: flow 25s ease-in-out infinite alternate-reverse;
                }
              `}
            </style>
            <path 
              className="flow-line" 
              d="M0,160 C320,300 420,100 640,200 C860,300 960,100 1280,200 L1440,250 L1440,400 L0,400 Z" 
              fill="white" 
            />
            <path 
              className="flow-line-reverse" 
              d="M0,200 C320,100 420,300 640,200 C860,100 960,300 1280,200 L1440,150 L1440,400 L0,400 Z" 
              fill="white" 
              opacity="0.6"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10 relative z-10">
          <div>
            <h3 className="text-4xl font-bold font-manrope mb-2 tracking-tight">14,800+</h3>
            <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Learners</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold font-manrope mb-2 tracking-tight">2.4M+</h3>
            <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Reviews</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold font-manrope mb-2 tracking-tight">99.9%</h3>
            <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Uptime</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold font-manrope mb-2 tracking-tight">4.9/5</h3>
            <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Rating</p>
          </div>
        </div>
      </section>

      {/* Features — Reference Two-Column Layout */}
      <section id="features" className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* Left Column — sticky on scroll */}
            <div className="md:sticky md:top-28">
              <span className="inline-block px-3 py-1 rounded-full border border-amber-200 text-amber-100 text-xs font-semibold mb-6 tracking-wide">
                What Powers Echo
              </span>

              <h2 className="text-4xl md:text-5xl font-bold text-[#182442] font-manrope mb-6 leading-[1.15]">
                Engineered<br/>for focus.
              </h2>

              <p
                style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
                className="text-sm text-slate-500 leading-relaxed"
              >
                Remembering what you study is a{' '}
                <span className="text-[#182442] font-medium">precision science</span>.{' '}
                Research shows that over{' '}
                <span className="text-[#182442] font-medium">80% of new information</span>{' '}
                is forgotten within a week without deliberate review — leading to{' '}
                <span className="text-[#182442] font-medium">wasted study hours</span>{' '}and{' '}
                <span className="text-[#182442] font-medium">declining performance</span>.
              </p>

              <Link
                to="/signup"
                className="inline-flex items-center gap-2 mt-8 text-sm font-bold text-[#182442] hover:text-indigo-600 transition-colors group"
              >
                Explore all features
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Column — Stacked Feature Cards */}
            <div className="flex flex-col gap-4">

              {/* Card 1 */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <h3 className="text-base font-bold text-[#182442] font-manrope mb-2">Adaptive Scheduling</h3>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                  Echo calculates exactly{' '}
                  <span className="text-[#182442] font-medium">when you're about to forget</span>{' '}
                  a concept and resurfaces it at the{' '}
                  <span className="text-[#182442] font-medium">optimal review moment</span> —
                  maximizing <span className="text-[#182442] font-medium">long-term retention</span>{' '}
                  with every session.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <h3 className="text-base font-bold text-[#182442] font-manrope mb-2">Active Recall Engine</h3>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                  Simply re-reading notes{' '}
                  <span className="text-[#182442] font-medium">fails when knowledge doesn't stick</span>.{' '}
                  Echo transforms passive notes into{' '}
                  <span className="text-[#182442] font-medium">active retrieval challenges</span>{' '}
                  that forge lasting memory bonds and eliminate{' '}
                  <span className="text-[#182442] font-medium">wasted revision time</span>.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <h3 className="text-base font-bold text-[#182442] font-manrope mb-2">Performance Insight</h3>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                  Studying{' '}
                  <span className="text-[#182442] font-medium">without visibility</span>{' '}
                  into your retention patterns means missing critical signals.{' '}
                  Echo surfaces your{' '}
                  <span className="text-[#182442] font-medium">cognitive performance data</span>{' '}
                  so every session is <span className="text-[#182442] font-medium">smarter than the last</span>.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>



      {/* How it Works — Alternating Vertical Timeline */}
      <section id="how-it-works" className="py-24 bg-white px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#182442] font-manrope mb-3 tracking-tight">How it works</h2>
            <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-xl text-slate-500">
              Three steps to <span className="text-[#182442] font-semibold underline decoration-slate-300 underline-offset-4">permanent retention</span>.
            </p>
          </div>

          <div className="relative">
            {/* Central Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-100 md:-translate-x-1/2"></div>

            <div className="space-y-16">
              {/* Step 1 - Left */}
              <div className="relative flex flex-col md:flex-row items-center group">
                <div className="flex-1 md:pr-16 md:text-right w-full pl-12 md:pl-0 flex md:justify-end">
                  <div className="relative max-w-sm">
                    {/* The "Resting" card behind */}
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#182442] rounded-2xl"></div>
                    <div className="relative bg-white border border-slate-200 rounded-2xl p-5 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-[#182442] font-manrope mb-2">Input Knowledge</h3>
                      <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                        Import notes, copy snippets, or create cards from scratch. 
                        Echo accepts <span className="text-[#182442] font-medium">images, LaTeX, and code blocks</span>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 md:left-1/2 w-7 h-7 rounded-full bg-[#182442] text-white font-bold font-manrope text-sm flex items-center justify-center md:-translate-x-1/2 shadow-lg z-10 outline outline-4 outline-white">
                  1
                </div>
                <div className="hidden md:block flex-1"></div>
              </div>

              {/* Step 2 - Right */}
              <div className="relative flex flex-col md:flex-row-reverse items-center group">
                <div className="flex-1 md:pl-16 w-full pl-12 md:pl-0 flex md:justify-start">
                  <div className="relative max-w-sm">
                    {/* The "Resting" card behind */}
                    <div className="absolute inset-0 -translate-x-1.5 translate-y-1.5 bg-[#182442] rounded-2xl"></div>
                    <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-[#182442] font-manrope mb-2">Precision Scheduling</h3>
                      <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                        Our algorithm sets the <span className="text-[#182442] font-medium">optimal review date</span> based on your unique forgetting curve and performance history.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 md:left-1/2 w-7 h-7 rounded-full bg-[#182442] text-white font-bold font-manrope text-sm flex items-center justify-center md:-translate-x-1/2 shadow-lg z-10 outline outline-4 outline-white">
                  2
                </div>
                <div className="hidden md:block flex-1"></div>
              </div>

              {/* Step 3 - Left */}
              <div className="relative flex flex-col md:flex-row items-center group">
                <div className="flex-1 md:pr-16 md:text-right w-full pl-12 md:pl-0 flex md:justify-end">
                  <div className="relative max-w-sm">
                    {/* The "Resting" card behind */}
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#182442] rounded-2xl"></div>
                    <div className="relative bg-white border border-slate-200 rounded-2xl p-5 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
                      <h3 className="text-lg font-bold text-[#182442] font-manrope mb-2">Active Recall</h3>
                      <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-slate-500 leading-relaxed">
                        Review daily. The more effort your brain takes to <span className="text-[#182442] font-medium">retrieve information</span>, the <span className="text-[#182442] font-medium">stronger the memory bond</span>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 md:left-1/2 w-7 h-7 rounded-full bg-[#182442] text-white font-bold font-manrope text-sm flex items-center justify-center md:-translate-x-1/2 shadow-lg z-10 outline outline-4 outline-white">
                  3
                </div>
                <div className="hidden md:block flex-1"></div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-[#f7f9fb] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-4 h-[1px] bg-[#182442]/30" />
              <span className="text-[10px] font-bold text-[#182442]/50 uppercase tracking-widest">Voices</span>
              <span className="w-4 h-[1px] bg-[#182442]/30" />
            </div>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-4xl md:text-5xl text-[#182442] font-medium leading-tight"
            >
              Trusted by <span className="italic">focused</span> learners
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'I completely ditched Anki for this. The interface makes studying a joy rather than a chore.',
                initials: 'JT',
                name: 'James T.',
                role: 'Law Student',
              },
              {
                quote:
                  'Phenomenal for medical school. The adaptive scheduling is noticeably better than any open-source alternative.',
                initials: 'MC',
                name: 'Madison Chen',
                role: 'Med Student, Penn',
              },
              {
                quote:
                  "Finally, a tool that respects cognitive load and doesn't spam me with gamification junk.",
                initials: 'SJ',
                name: 'Sarah Jenkins',
                role: 'Researcher',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between min-h-[220px]"
              >
                <p
                  style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
                  className="text-sm text-slate-500 leading-relaxed"
                >
                  <span className="text-[#182442]/25 font-serif text-lg leading-none mr-0.5">"</span>
                  {item.quote}
                  <span className="text-[#182442]/25 font-serif text-lg leading-none ml-0.5">"</span>
                </p>
                <div className="flex items-center gap-3 pt-6 mt-8 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-[#182442]/8 border border-[#182442]/10 flex items-center justify-center text-[10px] font-bold text-[#182442] tracking-wide">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#182442] font-manrope">{item.name}</p>
                    <p
                      style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
                      className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5"
                    >
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#182442] font-manrope mb-6">Simple, transparent pricing.</h2>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-bold ${!isAnnual ? 'text-[#182442]' : 'text-slate-400'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 bg-[#182442] rounded-full relative transition-colors focus:outline-none"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAnnual ? "left-7" : "left-1"}`}></div>
              </button>
              <span className={`text-sm font-bold ${isAnnual ? 'text-[#182442]' : 'text-slate-400'}`}>
                Annual <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs ml-1">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Basic */}
            <div className="echo-card p-8">
              <h3 className="text-2xl font-bold text-[#182442] font-manrope mb-2">Basic</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#182442]">$0</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> 500 active cards
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> Basic scheduling algo
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> Web interface only
                 </li>
              </ul>
              <Link to="/signup" className="block w-full py-3 text-center rounded-xl border-2 border-slate-200 text-[#182442] font-bold hover:border-[#182442] transition-colors">
                Current Plan
              </Link>
            </div>

            {/* Pro — border, badge & button all use #182442 */}
            <div className="echo-card p-8 relative border-2 border-[#182442] shadow-xl shadow-[#182442]/10 transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#182442] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-[#182442] font-manrope mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-[#182442]">{isAnnual ? '$8' : '$10'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                 <li className="flex items-center gap-3 text-sm text-[#182442] font-semibold">
                   <Check size={16} className="text-[#182442]" /> Unlimited Cards
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-[#182442]" /> All Apps &amp; Mobile Sync
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-[#182442]" /> Precision Scheduler V2
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-[#182442]" /> Advanced Formatting
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-[#182442]" /> Priority Support
                 </li>
              </ul>
              <Link to="/signup" className="block w-full py-3 text-center rounded-xl bg-[#182442] text-white font-bold hover:bg-[#2a3a61] transition-colors shadow-lg shadow-[#182442]/20">
                Upgrade to Pro
              </Link>
            </div>

            {/* Team */}
            <div className="echo-card p-8">
              <h3 className="text-2xl font-bold text-[#182442] font-manrope mb-2">Team</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#182442]">{isAnnual ? '$24' : '$30'}</span>
                <span className="text-slate-500 font-medium">/mo/user</span>
              </div>
              <ul className="space-y-4 mb-8">
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> Everything in Pro
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> Shared Knowledge Base
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> Collaborative Reviews
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-600">
                   <Check size={16} className="text-emerald-500" /> SSO & Admin Panel
                 </li>
              </ul>
              <button className="block w-full py-3 text-center rounded-xl border-2 border-slate-200 text-[#182442] font-bold hover:border-[#182442] transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      </div>

      {/* Footer / CTA — Reference warm-cream layout */}
      <footer className="bg-[#f7f9fb] pt-8 pb-8 px-6">
        {/* CTA Block — #182442 background, wider, tighter padding */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-[#182442] rounded-[32px] px-10 py-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-manrope mb-8 leading-snug">
              Start your precision learning<br />
              journey today.
            </h2>

            {/* Email capture card */}
            <div className="max-w-lg mx-auto bg-white border border-white/10 rounded-2xl p-6 shadow-md text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-3">
                  {[
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBCx1RCWyd3WgDkr-W39sFW-ZJr5PLBuF2QwW34BPHD3qDHNetV3LCcRhGiEa3_-gqlBtz3feL7nQEtJ0r6T4DGhJNdBbDMqFqo-i6slzcWucjywyzTBqhp6BzgNQTwMiTMqKhvrJPIYj7LSDkmHt_7WIfAktCFyncJkAOfqKYvxadKCmjxHfolnTdvBICNXQCrkfJi7RNkWmHKTL4nJ4X_FPezVw6ZKqonOa8rDOPC0LLtKD5nds9wt3HM9tJMIIyY81nVEcama0M",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDi-H-D5yBQr3irGnn0eCdXwE1MqMXqIq8yk7_1e26Tl92pOMgjJzjb-8pmtMrjzbBeeS3Ze8WONH7vFP5Cw5-t1xNzI-2wcZI6qynUoNZqNjEcvoR9qSxWXfCAe0PZASPGqSulcFJZXIcxAGq59JQkMMLNC4lt3EeuNHyP1W1K9W7yhBKDzMS4AyPs2RTYbzegs_VeT6kP4AEkg0P2DlmmL9Gy5JQHDeEllX87xaxrFreii3IciPqfTp68b7Hloo0G5bIKk6cVUj0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDjzSSo-lfHr_UZUX9Tnc5MwnFqOPt6dh4-71Cr0_8-FmyPOqVHZSkrRLKkN3i2JOogu0Y3t4sPw8G1g6b3ORdr2fTiQrP2-nch1fcxHKE2WV6C0xKGiD6Zr9Pe-z4GPY-OdKRTR7iciYa-wFCC3_kifVb8OGl5-3Trr5tKK59dugRKlOSPSt-xHvz1NC0ue-9ZwjZummFJ2undD4Uag7RaNcl215hIy2zIEj1JUk6VvxcEoV4L7QirFolGZvxeGBR1OCRuFOTdtT8"
                  ].map((src, i) => (
                    <img key={i} src={src} alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <span style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm font-medium text-slate-500">50k+</span>
              </div>
              <p className="text-lg font-bold text-[#182442] font-manrope mb-5">Join The Waitlist</p>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] transition-all"
                />
                <Link
                  to="/signup"
                  className="bg-[#182442] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2a3a61] transition-all whitespace-nowrap shadow-lg shadow-[#182442]/20"
                  style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
                >
                  Subscribe
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links & Brand Section */}
        <div className="bg-[#182442] rounded-t-[48px] pt-12 pb-8 px-6 mt-16 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
                <Link to="/" className="inline-block mb-8 ml-[15px]">
                  <img 
                    src="/images/logo_white.png" 
                    alt="Echo Logo" 
                    className="h-20 w-auto object-contain"
                  />
                </Link>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs">
                  Precision learning through cognitive engineering. Master any domain with our high-fidelity system.
                </p>
                <div className="flex gap-4">
                  {['twitter', 'linkedin', 'github'].map((platform) => (
                    <a key={platform} href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#182442] transition-all">
                      <span className="material-symbols-outlined !text-[18px]">
                        {platform === 'twitter' ? 'share' : platform === 'linkedin' ? 'person' : 'code'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Product Column */}
              <div className="flex flex-col gap-4">
                <span className="font-bold text-white text-lg mb-2">Product</span>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Features</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Mobile App</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">API</a>
              </div>

              {/* Company Column */}
              <div className="flex flex-col gap-4">
                <span className="font-bold text-white text-lg mb-2">Company</span>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">About Us</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Careers</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Blog</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Legal</a>
              </div>

              {/* Support Column */}
              <div className="flex flex-col gap-4">
                <span className="font-bold text-white text-lg mb-2">Support</span>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Help Center</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Community</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Status</a>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/10">
              <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-white/40 text-xs">
                © {new Date().getFullYear()} Echo Memory Assistant. All rights reserved.
              </p>
              <div className="flex gap-8 text-xs text-white/40">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
