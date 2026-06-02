import React, { useState, useEffect } from 'react';
import { Edit2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EchoToast } from '../components/EchoToast';

const Toggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <button
    onClick={onToggle}
    className={cn(
      'w-11 h-6 rounded-full transition-all duration-300 relative flex items-center px-0.5 shrink-0',
      active ? 'bg-[#182442]' : 'bg-slate-200'
    )}
    aria-checked={active}
    role="switch"
  >
    <div
      className={cn(
        'w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300',
        active ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
);

const SectionEyebrow: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2.5 mb-6">
    <span
      className="material-symbols-outlined !text-[16px] text-[#182442]/40"
      style={{ fontVariationSettings: "'FILL' 0" }}
    >
      {icon}
    </span>
    <span className="text-[10px] font-bold text-[#182442]/40 uppercase tracking-[0.2em]">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

const Settings: React.FC = () => {
  const { userName, userEmail, profileImage, setProfileImage, updateUserProfile } = useUser();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize form fields when user data is available
  useEffect(() => {
    if (userName) setFullName(userName);
    if (userEmail) setEmail(userEmail);
  }, [userName, userEmail]);

  const [notifications, setNotifications] = useState({
    reviews: true,
    achievements: true,
    updates: false,
    weekly: true,
  });

  const [reviewLimit, setReviewLimit] = useState(150);
  const [sessionTarget, setSessionTarget] = useState('25');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setIsUploadModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateUserProfile(fullName, email);
    alert('Profile updated successfully!');
  };

  const handleUpdatePassword = () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    // TODO: Backend integration for password update
    alert('Password updated successfully!');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = () => {
    // TODO: Backend integration — POST schedule account deletion
    setIsDeleteModalOpen(false);
    setDeleteToast(
      'Your account is scheduled for deletion in 15 days. Log in before then to cancel.'
    );
    setTimeout(() => setDeleteToast(null), 8000);
  };

  const toggle = (key: keyof typeof notifications) =>
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const notifItems = [
    { key: 'reviews' as const, label: 'Daily Review Reminders', desc: 'Cards ready for review' },
    { key: 'achievements' as const, label: 'Milestones', desc: 'Streaks & mastery breakthroughs' },
    { key: 'updates' as const, label: 'System Updates', desc: 'New features & improvements' },
    { key: 'weekly' as const, label: 'Weekly Summary', desc: 'Cognitive growth report' },
  ];

  return (
    <div className="max-w-[860px] mx-auto p-xl animate-in fade-in slide-in-from-bottom-4 duration-700">

      <ConfirmDialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete your Echo account?"
        variant="danger"
        confirmLabel="Schedule deletion"
        description={
          <>
            <p className="mb-3">
              Your account and all notes, topics, and review history will be permanently removed{' '}
              <span className="font-semibold text-[#182442]">15 days</span> after you confirm.
            </p>
            <p className="mb-3">
              You can cancel by signing in at any time before that date. After 15 days, deletion
              cannot be undone.
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              A confirmation email will be sent when scheduling is available.
            </p>
          </>
        }
        onConfirm={handleConfirmDeleteAccount}
      />

      {deleteToast && (
        <div className="mb-6">
          <EchoToast message={deleteToast} variant="info" onDismiss={() => setDeleteToast(null)} />
        </div>
      )}

      {/* ── Photo Upload Modal ─────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[#182442]/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsUploadModalOpen(false)}
          />
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <h3 className="text-2xl font-bold text-[#182442] mb-2 font-manrope">Update Photo</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-sm text-slate-500 mb-8 font-medium">
              Select a new profile image for your Echo account.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 hover:border-[#182442] hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#182442] group-hover:bg-white transition-all">
                <span className="material-symbols-outlined !text-[32px]">upload_file</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#182442]">Click to upload</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">PNG, JPG up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setProfileImage(null); setIsUploadModalOpen(false); }}
                className="flex-1 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Editorial Header ───────────────────────────────────────── */}
      <header className="mb-12 animate-in slide-in-from-left duration-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-[1px] bg-[#182442]/20" />
          <span className="text-[10px] font-bold text-[#182442]/40 uppercase tracking-[0.2em]">
            System Preferences
          </span>
        </div>
        <h2
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-5xl text-[#182442] font-medium leading-none mb-4"
        >
          Account <span className="italic">Settings</span>
        </h2>
        <p
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          className="text-base text-slate-500 max-w-xl leading-relaxed"
        >
          Your preferences, identity and cognitive engine — all in one place.
        </p>
      </header>

      <div className="space-y-5">

        {/* ── Card 1 · Profile Identity ──────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Gradient accent strip */}
          <div className="h-1.5 bg-gradient-to-r from-[#182442] via-[#2a4070] to-[#182442]/40" />
          <div className="p-8">
            <SectionEyebrow icon="person" label="Identity" />
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="relative w-24 h-24">
                  {profileImage ? (
                    <img
                      alt="Profile"
                      src={profileImage}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:scale-[1.02] transition-transform"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#182442] to-[#2a3a61] flex flex-col items-center justify-center text-white border-4 border-white shadow-xl group-hover:scale-[1.02] transition-transform">
                      <span className="material-symbols-outlined !text-[48px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                        person
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="absolute -bottom-2 -right-2 bg-[#182442] text-white p-2.5 rounded-xl border-4 border-white shadow-lg hover:scale-110 transition-all active:scale-95"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-center mt-5 font-bold text-slate-400 uppercase tracking-widest">
                  Photo
                </p>
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Full Name</label>
                  <input
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all font-medium"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Email Address</label>
                  <input
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all font-medium"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div className="md:col-span-2 pt-1">
                  <button 
                    onClick={handleSaveProfile}
                    className="bg-[#182442] text-white px-8 py-3 rounded-xl font-bold text-sm hover:shadow-xl shadow-md shadow-[#182442]/20 transition-all active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2 · Security + Study Engine (2-col) ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Security */}
          <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
            <SectionEyebrow icon="lock" label="Security" />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">New Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-3 pr-12 text-sm focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#182442] transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Confirm Password</label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-3 pr-12 text-sm focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#182442] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleUpdatePassword}
                className="w-full mt-2 bg-[#182442] text-white py-3 rounded-xl font-bold text-sm hover:shadow-xl shadow-md shadow-[#182442]/20 transition-all active:scale-[0.98]"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Study Engine */}
          <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <SectionEyebrow icon="psychology" label="Study Engine" />
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Daily Review Limit</label>
                  <span className="font-bold text-[#182442] text-sm bg-slate-50 px-2.5 py-0.5 rounded-lg">
                    {reviewLimit}
                  </span>
                </div>
                <input
                  className="w-full accent-[#182442] h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                  type="range"
                  value={reviewLimit}
                  min={50}
                  max={500}
                  onChange={e => setReviewLimit(Number(e.target.value))}
                />
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-300">50</span>
                  <span className="text-[10px] font-bold text-slate-300">500</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Session Target</label>
                <select
                  value={sessionTarget}
                  onChange={e => setSessionTarget(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all font-bold text-[#182442]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <option value="15">15 Minutes</option>
                  <option value="25">25 Minutes (Pomodoro)</option>
                  <option value="45">45 Minutes</option>
                  <option value="unlimited">Unlimited Focus</option>
                </select>
              </div>
              {/* Algorithm mini-stats */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { label: 'Easy', value: '1.3×' },
                  { label: 'Hard', value: '0.7×' },
                  { label: 'New', value: '1d' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="font-bold text-[#182442] font-manrope text-lg">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 3 · Notifications ─────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <SectionEyebrow icon="notifications" label="Notifications" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notifItems.map(item => (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none',
                  notifications[item.key]
                    ? 'bg-[#182442]/[0.03] border-[#182442]/10'
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                )}
              >
                <div className="min-w-0 mr-3">
                  <p className={cn('font-bold text-sm', notifications[item.key] ? 'text-[#182442]' : 'text-slate-500')}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-xs text-slate-400 mt-0.5 truncate">
                    {item.desc}
                  </p>
                </div>
                <Toggle active={notifications[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 4 · Danger Zone + Data Portability ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">

          {/* Data Export */}
          <div className="bg-slate-50 border border-slate-100 rounded-[28px] p-8">
            <SectionEyebrow icon="download" label="Data Portability" />
            <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-sm text-slate-500 mb-6 leading-relaxed">
              Export a full archive of your knowledge base in JSON format.
            </p>
            <button className="flex items-center gap-2 bg-white text-[#182442] px-6 py-3 rounded-xl font-bold text-sm hover:shadow-md transition-all border border-slate-200 active:scale-[0.98]">
              <span className="material-symbols-outlined !text-[18px]">download</span>
              Export Data Archive
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#fff8f8] border border-red-100/80 rounded-[28px] p-8">
            <SectionEyebrow icon="warning" label="Danger Zone" />
            <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-sm text-slate-500 mb-6 leading-relaxed">
              Permanently erase all notes, topics, and review history. This{' '}
              <span className="text-red-500 font-bold">cannot be undone.</span>
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 border border-red-200 text-red-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined !text-[18px]">delete_forever</span>
              Delete My Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
