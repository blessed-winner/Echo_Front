import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft, Printer, ChevronRight, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

const sections = [
  { id: 'introduction', title: '1. Introduction & Agreement' },
  { id: 'services', title: '2. Description of Echo Services' },
  { id: 'account', title: '3. Account Registration & Security' },
  { id: 'acceptable-use', title: '4. Acceptable Use Policy' },
  { id: 'intellectual-property', title: '5. Intellectual Property Rights' },
  { id: 'user-content', title: '6. User Content & Knowledge Base Data' },
  { id: 'service-availability', title: '7. Service Availability & Changes' },
  { id: 'disclaimers', title: '8. Disclaimers & Limitation of Liability' },
  { id: 'termination', title: '9. Termination & Cancellation' },
  { id: 'contact', title: '10. Contact Information' },
];

const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const [activeSection, setActiveSection] = useState('introduction');

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
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#182442] text-white shadow-sm transition-all"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#182442] transition-all"
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
              Legal Documentation
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/60 text-xs font-medium">Effective: September 7, 2026</span>
          </div>
          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
          >
            Terms of Service
          </h1>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="text-base md:text-lg text-white/70 max-w-2xl leading-relaxed"
          >
            Please read these terms carefully before using Echo Memory Assistant. By creating an account or using our application, you agree to be bound by these provisions.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <FileText size={18} className="text-[#182442]" />
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
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Questions about Terms?</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Contact our legal & support team at{' '}
                    <a href="mailto:support@echo-memory.app" className="text-[#182442] underline font-bold">
                      support@echo-memory.app
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Detailed Document Body */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-10 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  1
                </span>
                Introduction & Agreement
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  Welcome to <strong>Echo Memory Assistant</strong> ("Echo", "we", "us", or "our"). Echo is an advanced spaced-repetition and cognitive flashcard application designed to enhance long-term knowledge retention.
                </p>
                <p>
                  By registering for an account, downloading, accessing, or using any part of the Echo web or mobile application, you ("User" or "you") agree that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree with any portion of these Terms, you must immediately discontinue use of the platform.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="services" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  2
                </span>
                Description of Echo Services
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  Echo provides tools for creating, organizing, scheduling, and reviewing knowledge assets using intelligent cognitive algorithms. Features include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>Active recall review management and adaptive scheduling.</li>
                  <li>Rich-text note editing, LaTeX equation rendering, code snippet formatting, and image attachments.</li>
                  <li>Cognitive analytics, performance dashboards, and streak tracking.</li>
                  <li>Account management and cross-device synchronization.</li>
                </ul>
                <p>
                  We continuously refine Echo features and reserve the right to modify, replace, or discontinue components of the service at any time to improve system stability or cognitive performance models.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="account" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  3
                </span>
                Account Registration & Security
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  To access Echo, you must register for an account using a valid email address or an authorized OAuth provider (such as Google or GitHub).
                </p>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#182442]">
                    <Lock size={16} />
                    <span>Your Security Responsibilities</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
                    <li>Provide accurate, complete, and updated registration details.</li>
                    <li>Maintain the confidentiality of your login credentials.</li>
                    <li>Promptly notify us if you suspect unauthorized access to your account.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="acceptable-use" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  4
                </span>
                Acceptable Use Policy
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>You agree to use Echo solely for lawful personal or educational purposes. You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>Upload or transmit content that infringes upon copyright, trademark, or intellectual property rights of third parties.</li>
                  <li>Attempt to reverse-engineer, decompile, or extract source code from Echo applications.</li>
                  <li>Use automated bots, scrapers, or excessive API requests that disrupt service infrastructure.</li>
                  <li>Distribute malware, phishing materials, or illegal content through shared cards or notes.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="intellectual-property" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  5
                </span>
                Intellectual Property Rights
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  Echo, including software code, brand identity, user interface design, logos, and spaced repetition scheduling engine algorithms, are the exclusive property of Echo and its licensors, protected by intellectual property laws.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="user-content" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  6
                </span>
                User Content & Knowledge Base Data
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  <strong>You retain full ownership of all notes, topics, flashcards, and study materials you create within Echo.</strong>
                </p>
                <p>
                  By creating content, you grant Echo a limited, non-exclusive license strictly necessary to store, render, index, and synchronize your data to deliver the application services to you across your devices. We do not sell or monetize your personal study notes.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="service-availability" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  7
                </span>
                Service Availability & Changes
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  We strive for 99.9% service uptime. However, scheduled maintenance, system updates, or unexpected server outages may occasionally occur. We provide export tools in Settings so you can back up your knowledge base at any time.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="disclaimers" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  8
                </span>
                Disclaimers & Limitation of Liability
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  Echo is provided on an "AS IS" and "AS AVAILABLE" basis. While our algorithms are crafted according to cognitive science research, we do not guarantee specific academic, exam, or career outcomes.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="termination" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  9
                </span>
                Termination & Account Deletion
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>
                  You may delete your account at any time via the Settings panel. Upon account deletion, all active flashcards, progress stats, and personal data will be scheduled for permanent removal in accordance with our data retention schedule.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="contact" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-[#182442] font-manrope border-b border-slate-100 pb-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#182442]/10 text-[#182442] flex items-center justify-center text-sm font-black">
                  10
                </span>
                Contact Information
              </h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-slate-600 leading-relaxed space-y-4 text-sm">
                <p>For questions or formal inquiries regarding these Terms of Service, please contact us:</p>
                <div className="bg-[#182442] text-white rounded-2xl p-6 space-y-2">
                  <p className="font-bold text-sm font-manrope">Echo Legal & Compliance Team</p>
                  <p className="text-xs text-white/80">Email: legal@echo-memory.app</p>
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

export default Terms;
