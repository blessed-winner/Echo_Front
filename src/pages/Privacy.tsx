import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, Printer, ChevronRight, Eye, Database, Server, UserCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';

const sections = [
  { id: 'overview', title: '1. Privacy Overview' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'use-of-information', title: '3. How We Use Your Data' },
  { id: 'cognitive-data', title: '4. Cognitive Analytics & Learning Metrics' },
  { id: 'cookies', title: '5. Cookies & Local Storage' },
  { id: 'third-parties', title: '6. Third-Party Services & OAuth' },
  { id: 'data-security', title: '7. Data Security Safeguards' },
  { id: 'user-rights', title: '8. Your Rights (GDPR & CCPA)' },
  { id: 'retention', title: '9. Data Retention & Deletion' },
  { id: 'contact', title: '10. Privacy Contact & DPO' },
];

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#182442] font-inter pb-20 selection:bg-[#182442]/10">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#182442] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <Link to="/" className="flex items-center">
              <img
                src="/images/logo_black.png"
                alt="Echo Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Legal Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <Link
              to="/terms"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#182442] transition-all"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#182442] text-white shadow-sm transition-all"
            >
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#182442] bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              title="Print document"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#182442] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#2a3a61] transition-all shadow-sm active:scale-95"
              >
                Go to Dashboard
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-[#182442] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#2a3a61] transition-all shadow-sm active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Banner */}
      <section className="bg-[#182442] text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-bold uppercase tracking-widest border border-white/10">
              Data Protection & Trust
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/60 text-xs font-medium">Effective: September 7, 2026</span>
          </div>
          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
          >
            Privacy Policy
          </h1>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="text-base md:text-lg text-white/70 max-w-2xl leading-relaxed"
          >
            At Echo Memory Assistant, your trust and data privacy are fundamental. We are transparent about what information we collect, how it powers your learning, and how we protect it.
          </p>
        </div>
      </section>

      {/* Quick Highlights Summary Box */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">No Data Selling</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We never sell your personal data or study notes to third parties or advertisers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">Encrypted Storage</h4>
              <p className="text-xs text-slate-500 leading-relaxed">All note data and learning metrics are encrypted in transit and at rest.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">Full Export Control</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Export your complete knowledge archive or erase your account at any time in Settings.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Eye size={18} className="text-[#182442]" />
                <h3 className="font-bold text-sm text-[#182442] font-manrope">Table of Contents</h3>
              </div>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                      activeSection === sec.id
                        ? 'bg-[#182442]/5 text-[#182442] font-bold border-l-4 border-[#182442]'
                        : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-[#182442]'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight size={14} className={activeSection === sec.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-bold text-[#182442] mb-1">
                    <Database size={16} className="text-[#182442]" />
                    <span>Data Rights Inquiry?</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Reach our Data Protection Officer directly at{' '}
                    <a href="mailto:dpo@echo-memory.app" className="text-[#182442] underline font-bold">
                      dpo@echo-memory.app
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Detailed Document Body */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-10 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            {/* Section 1 */}
            <section id="overview" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  1
                </span>
                Privacy Overview
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  This Privacy Policy describes how Echo Memory Assistant collects, uses, stores, and protects personal information when you interact with our website, web application, and related services.
                </p>
                <p>
                  Echo operates under strict principles of data minimization and privacy-by-design. We only collect the data necessary to provide personalized spaced repetition, track your retention progress, and deliver a reliable service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="information-collected" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  2
                </span>
                Information We Collect
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>We collect information in three primary categories:</p>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">Account & Profile Information</h4>
                    <p className="text-xs text-slate-500">Your name, email address, password hash, profile avatar image, and preference settings.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">Knowledge Base Content</h4>
                    <p className="text-xs text-slate-500">Notes, flashcards, topics, tags, equations, code blocks, and media files you create or upload.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <h4 className="font-bold text-xs text-[#182442] uppercase tracking-wider mb-1">Technical & Usage Logs</h4>
                    <p className="text-xs text-slate-500">IP address, browser type, device identifiers, session timestamps, and error logs for diagnostic optimization.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="use-of-information" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  3
                </span>
                How We Use Your Data
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>Your data is processed strictly for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>To operate, maintain, and render your personal flashcards and notes.</li>
                  <li>To calculate spaced repetition intervals (SM-2 / adaptive memory spacing algorithms).</li>
                  <li>To authenticate logins and verify email addresses.</li>
                  <li>To compute cognitive performance statistics, retention curves, and study streaks.</li>
                  <li>To send essential security alerts and user-configured review reminders.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="cognitive-data" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  4
                </span>
                Cognitive Analytics & Learning Metrics
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  When you complete review sessions, Echo records interaction timestamps, rating selections ("Again", "Hard", "Good", "Easy"), and response durations.
                </p>
                <p>
                  These metrics are used exclusively to adjust your individual forgetting curves and calculate personalized optimal review intervals. Aggregated, fully anonymized statistics may be analyzed to improve system algorithm accuracy.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="cookies" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  5
                </span>
                Cookies & Local Storage
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  Echo uses essential cookies and local storage tokens (`localStorage`) solely to maintain your authenticated session and preserve theme/editor preferences across page refreshes. We do not use third-party tracking or advertising cookies.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="third-parties" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  6
                </span>
                Third-Party Services & OAuth
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  If you sign in using Google or GitHub OAuth, we receive basic profile information (such as your name, primary email address, and avatar URL) authorized by your OAuth permissions. We do not obtain or store your third-party account passwords.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="data-security" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  7
                </span>
                Data Security Safeguards
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#182442]">
                    <Server size={18} />
                    <span>Technical & Organizational Controls</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
                    <li>TLS 1.3 encryption for all data in transit across web connections.</li>
                    <li>AES-256 encryption at rest for database records and file storage.</li>
                    <li>Strict role-based access controls and infrastructure monitoring.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="user-rights" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  8
                </span>
                Your Rights (GDPR & CCPA)
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>Depending on your jurisdiction, you possess explicit rights regarding your personal data:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li><strong>Right to Access:</strong> Request a copy of your personal data stored by Echo.</li>
                  <li><strong>Right to Portability:</strong> Export a full archive of your notes and cards in JSON format (available instantly in Settings).</li>
                  <li><strong>Right to Rectification:</strong> Edit or update inaccurate profile details.</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Schedule your account and content for permanent deletion.</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="retention" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  9
                </span>
                Data Retention & Account Deletion
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  We retain your account data for as long as your account remains active. If you initiate account deletion in Settings, your data is scheduled for permanent purge after a 15-day grace period, during which you may log in to cancel the pending deletion.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="contact" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  10
                </span>
                Privacy Contact & DPO
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>For any privacy requests or inquiries regarding your rights under GDPR or CCPA:</p>
                <div className="bg-[#182442] text-white rounded-2xl p-6 space-y-2">
                  <p className="font-bold text-sm font-manrope">Data Protection Officer</p>
                  <p className="text-xs text-white/80">Email: dpo@echo-memory.app</p>
                  <p className="text-xs text-white/80">Address: Echo Memory Assistant Inc., 100 Learning Plaza, San Francisco, CA</p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
