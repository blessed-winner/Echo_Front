import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface TagDto {
  id: number;
  name: string;
}

interface MemoryItemDto {
  id: number;
  front: string;
  back: string;
  text?: string; // Backward compatibility
  source: string | null;
  nextReviewDate: string | null;
  reviewCount: number;
  due: boolean;
  tags: TagDto[] | null;
  noteId: number | null;
  customReminderTime?: string | null;
}

interface NoteDto {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  topic: TopicDto | null;
  tags: TagDto[] | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

const ReviewSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, isAuthLoading, refreshSession } = useUser();

  const navigateBack = useCallback(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from) {
      navigate(from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  }, [location.state, navigate]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueItems, setDueItems] = useState<MemoryItemDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [reviewedCount, setReviewedCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [reviewIntervals, setReviewIntervals] = useState<{againDays: number; hardDays: number; goodDays: number; easyDays: number} | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState<NoteDto | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);

  const currentItem = (dueItems && dueItems.length > 0) ? dueItems[currentIndex] : null;
  const totalItems = dueItems ? dueItems.length : 0;
  const progressPercent = totalItems > 0 ? Math.round((reviewedCount / totalItems) * 100) : 0;

  // Remove <u></u> tags from source
  const cleanSource = currentItem?.source ? currentItem.source.replace(/<\/?u>/g, '') : 'Review Session';

  // Format interval for display
  const formatInterval = (days: number): string => {
    if (days < 1) return '<1d';
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months}mo`;
    }
    const years = Math.round(days / 365);
    return `${years}y`;
  };

  // Fetch and view full note
  const handleViewNote = async () => {
    if (!currentItem || !currentItem.noteId) {
      alert('This memory item is not linked to a note.');
      return;
    }
    
    setLoadingNote(true);
    setShowNoteModal(true);
    
    try {
      const response = await api.get<NoteDto>(`/notes/${currentItem.noteId}`);
      setCurrentNote(response.data);
    } catch (error) {
      console.error('Failed to load note:', error);
      alert('Failed to load note content.');
      setShowNoteModal(false);
    } finally {
      setLoadingNote(false);
    }
  };

  // Fetch intervals for current item
  useEffect(() => {
    if (!currentItem) return;
    
    const fetchIntervals = async () => {
      try {
        const response = await api.get<{againDays: number; hardDays: number; goodDays: number; easyDays: number}>(
          `/memories/${currentItem.id}/preview-intervals`
        );
        setReviewIntervals(response.data);
      } catch (error) {
        console.error('Failed to fetch review intervals:', error);
        // Fallback to static values
        setReviewIntervals({ againDays: 1, hardDays: 2, goodDays: 4, easyDays: 7 });
      }
    };
    
    fetchIntervals();
  }, [currentItem]);

  useEffect(() => {
    let isMounted = true;

    const loadDueItems = async () => {
      if (isAuthLoading || !accessToken) {
        return;
      }

      setIsLoading(true);
      try {
        console.log('Loading review session data...');
        const [dueResponse, analyticsResponse] = await Promise.allSettled([
          api.get<PageResponse<MemoryItemDto>>('/memories/due?limit=50'),
          api.get<{ currentStreak: number }>('/analytics/me')
        ]);

        if (!isMounted) return;

        if (dueResponse.status === 'fulfilled' && dueResponse.value?.data) {
          const dueData = dueResponse.value.data;
          const dueContent = Array.isArray(dueData?.content) ? dueData.content : [];
          console.log('Due items loaded:', dueContent.length);
          setDueItems(dueContent);
        } else {
          console.error('Failed to load due items:', dueResponse.status === 'rejected' ? dueResponse.reason : 'No data');
          setDueItems([]);
        }

        if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value?.data) {
          const streak = analyticsResponse.value.data?.currentStreak ?? 0;
          console.log('Analytics loaded, streak:', streak);
          setCurrentStreak(streak);
        } else {
          console.error('Failed to load analytics:', analyticsResponse.status === 'rejected' ? analyticsResponse.reason : 'No data');
          setCurrentStreak(0);
        }
      } catch (error) {
        console.error('Failed to load review session:', error);
        setDueItems([]);
        setCurrentStreak(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDueItems();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!showAnswer) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      
      switch (e.key) {
        case '1':
          handleReview('AGAIN');
          break;
        case '2':
          handleReview('HARD');
          break;
        case '3':
          handleReview('GOOD');
          break;
        case '4':
          handleReview('EASY');
          break;
        case ' ':
          e.preventDefault();
          if (!showAnswer) {
            setShowAnswer(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, isSubmitting]);

  const handleReview = useCallback(async (rating: ReviewRating) => {
    if (!currentItem || isSubmitting) return;

    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - cardStartTime) / 1000);

    try {
      await api.post(`/memories/${currentItem.id}/review`, {
        rating,
        timeSpentSeconds: timeSpent
      });

      setReviewedCount(prev => prev + 1);

      if (currentIndex < totalItems - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
        setCardStartTime(Date.now());
      } else {
        // Session complete - navigate back
        navigateBack();
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);

      const status = error?.response?.status;
      // If unauthorized, attempt an explicit refresh and retry once
      if (status === 401) {
        try {
          console.log('[ReviewSession] 401 encountered, attempting session refresh...');
          const refreshed = await refreshSession();
          if (refreshed) {
            console.log('[ReviewSession] Refresh succeeded, retrying review submit...');
            await api.post(`/memories/${currentItem.id}/review`, {
              rating,
              timeSpentSeconds: timeSpent
            });

            setReviewedCount(prev => prev + 1);

            if (currentIndex < totalItems - 1) {
              setCurrentIndex(prev => prev + 1);
              setShowAnswer(false);
              setCardStartTime(Date.now());
            } else {
              navigateBack();
            }
            return;
          }
        } catch (retryErr) {
          console.error('[ReviewSession] Retry after refresh failed:', retryErr);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentItem, currentIndex, totalItems, cardStartTime, isSubmitting, navigateBack]);

  const handleExit = () => {
    if (reviewedCount > 0) {
      if (confirm(`You've reviewed ${reviewedCount} card${reviewedCount !== 1 ? 's' : ''}. Exit session?`)) {
        navigateBack();
      }
    } else {
      navigateBack();
    }
  };

  const formatTime = () => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const [currentTime, setCurrentTime] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading review session...</p>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] font-inter flex flex-col">
        <button 
          onClick={navigateBack}
          className="fixed top-8 left-8 flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-[#eceef0] transition-all z-50 group" 
          title="Go back"
        >
          <span className="material-symbols-outlined text-[#75777e] group-hover:rotate-90 transition-transform">close</span>
        </button>

        <div className="fixed top-8 right-8 flex items-center z-50">
          <Link to="/dashboard" className="block">
            <img 
              src="/images/logo_black.png" 
              alt="Echo Logo" 
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-[720px] w-full">
            <div className="bg-white border border-slate-200 rounded-xl p-16 shadow-sm text-center">
              <div className="flex flex-col items-center gap-6">
                <span className="material-symbols-outlined text-slate-300 !text-6xl">check_circle</span>
                <div>
                  <h4 className="text-2xl font-bold text-[#182442] mb-3 font-manrope">All caught up!</h4>
                  <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                    No items due for review right now. Create new memory items to get started.
                  </p>
                </div>
                {currentStreak > 0 && (
                  <div className="flex items-center gap-2 bg-[#ecfdf5] px-4 py-2 rounded-lg border border-[#3c6752]/10">
                    <span className="material-symbols-outlined text-[#3c6752] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    <span className="text-sm font-bold text-[#244f3b]">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Streak</span>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/new')}
                  className="mt-4 bg-[#182442] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#182442]/10"
                >
                  Create Memory Item
                </button>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#dae2ff] opacity-[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#bbead0] opacity-[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#f7f9fb] font-inter text-[#191c1e] selection:bg-[#dae2ff] selection:text-[#0d1a38] relative flex flex-col",
      !showAnswer && "h-screen overflow-hidden"
    )}>
      <button 
        onClick={handleExit}
        className="fixed top-8 left-8 flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-[#eceef0] transition-all z-50 group" 
        title="Exit Session"
      >
        <span className="material-symbols-outlined text-[#75777e] group-hover:rotate-90 transition-transform">close</span>
      </button>

      <div className="fixed top-8 right-8 flex items-center z-50">
        <Link to="/dashboard" className="block">
          <img 
            src="/images/logo_black.png" 
            alt="Echo Logo" 
            className="h-20 w-auto object-contain"
          />
        </Link>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-[720px] w-full mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[#182442] leading-none font-manrope">
                  {cleanSource}
                </h2>
                {currentItem && (
                  <button
                    onClick={handleViewNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all group"
                    title="View full note"
                  >
                    <span className="material-symbols-outlined text-slate-500 !text-[16px] group-hover:text-[#182442] transition-colors">description</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-[#182442] transition-colors">View Note</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-[#45464e] mt-1">
                {currentItem?.tags?.[0]?.name || 'Memory Item'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 bg-[#eceef0] px-4 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[#3c6752] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="text-sm font-bold text-[#244f3b]">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#75777e] text-sm">schedule</span>
              <span className="text-[12px] font-bold text-[#75777e] tracking-widest uppercase">{currentTime}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[720px] w-full mb-12">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[12px] font-bold text-[#75777e] uppercase tracking-widest">Progress</span>
            <span className="text-[12px] font-bold text-[#182442] uppercase tracking-widest">{reviewedCount} / {totalItems} {totalItems === 1 ? 'card' : 'cards'}</span>
          </div>
          <div className="w-full h-1 bg-[#eceef0] rounded-full overflow-hidden">
            <div className="h-full bg-[#3c6752] transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="max-w-[720px] w-full relative">
          <div className="bg-white border border-[#c6c6ce] rounded-xl p-12 md:p-20 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px] md:min-h-[400px]">
            {currentItem?.tags && currentItem.tags.length > 0 && (
              <div className="mb-6">
                <span className="text-[12px] font-bold text-[#96a6bf] bg-[#d3e4fe] px-4 py-1 rounded-full uppercase tracking-widest">
                  {currentItem.tags[0].name}
                </span>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#182442] max-w-lg mb-8 md:mb-12 font-manrope">
              {currentItem?.front || currentItem?.text || 'No prompt available'}
            </h1>
            
            <AnimatePresence mode="wait">
              {!showAnswer ? (
                <motion.button 
                  key="show"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAnswer(true)}
                  className="bg-[#182442] text-white px-12 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10 mt-8"
                >
                  Reveal Back
                </motion.button>
              ) : (
                <motion.div 
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="w-full overflow-hidden"
                >
                  <div className="w-full border-t border-[#e6e8ea] pt-12 mt-12 relative group/answer">
                    <p className="text-lg text-[#45464e] max-w-lg mx-auto leading-relaxed whitespace-pre-wrap">
                      {currentItem?.back || 'No content available'}
                    </p>
                    <button 
                      onClick={() => setShowAnswer(false)}
                      className="absolute top-4 right-0 text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
            <span className="material-symbols-outlined !text-[120px] text-[#182442]">psychology</span>
          </div>
        </div>

        <div className={cn("max-w-[720px] w-full transition-all duration-500", showAnswer ? "mt-12 md:mt-20 min-h-[140px] opacity-100" : "mt-0 min-h-0 opacity-0 overflow-hidden")}>
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleReview('AGAIN')}
                    disabled={isSubmitting}
                    className="group flex flex-col items-center gap-1 p-6 border border-[#ba1a1a]/20 rounded-xl hover:bg-[#ffdad6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-[#ba1a1a]">Again</span>
                    <span className="text-[10px] font-bold text-[#93000a] opacity-60 group-hover:opacity-100 tracking-widest uppercase">
                      {reviewIntervals ? formatInterval(reviewIntervals.againDays) : '1d'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleReview('HARD')}
                    disabled={isSubmitting}
                    className="group flex flex-col items-center gap-1 p-6 border border-[#c6c6ce] rounded-xl hover:bg-[#eceef0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-[#45464e]">Hard</span>
                    <span className="text-[10px] font-bold text-[#75777e] opacity-60 group-hover:opacity-100 tracking-widest uppercase">
                      {reviewIntervals ? formatInterval(reviewIntervals.hardDays) : '2d'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleReview('GOOD')}
                    disabled={isSubmitting}
                    className="group flex flex-col items-center gap-1 p-6 bg-[#182442] rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-white">Good</span>
                    <span className="text-[10px] font-bold text-white/80 group-hover:opacity-100 tracking-widest uppercase">
                      {reviewIntervals ? formatInterval(reviewIntervals.goodDays) : '4d'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleReview('EASY')}
                    disabled={isSubmitting}
                    className="group flex flex-col items-center gap-1 p-6 bg-[#3c6752] rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-white">Easy</span>
                    <span className="text-[10px] font-bold text-white/80 group-hover:opacity-100 tracking-widest uppercase">
                      {reviewIntervals ? formatInterval(reviewIntervals.easyDays) : '7d'}
                    </span>
                  </button>
                </div>

                <div className="flex justify-center mt-12 gap-8">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[#e6e8ea] border border-[#c6c6ce] rounded text-[10px] font-mono">1</kbd>
                    <span className="text-[10px] text-[#75777e] font-bold tracking-widest uppercase">AGAIN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[#e6e8ea] border border-[#c6c6ce] rounded text-[10px] font-mono">2</kbd>
                    <span className="text-[10px] text-[#75777e] font-bold tracking-widest uppercase">HARD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[#e6e8ea] border border-[#c6c6ce] rounded text-[10px] font-mono">3</kbd>
                    <span className="text-[10px] text-[#75777e] font-bold tracking-widest uppercase">GOOD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-[#e6e8ea] border border-[#c6c6ce] rounded text-[10px] font-mono">4</kbd>
                    <span className="text-[10px] text-[#75777e] font-bold tracking-widest uppercase">EASY</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#dae2ff] opacity-[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#bbead0] opacity-[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-[#182442] font-manrope">
                    {currentNote?.title || 'Note'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentNote?.topic?.name || currentItem?.tags?.[0]?.name || 'Memory Item'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-all group"
                >
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 group-hover:rotate-90 transition-all">close</span>
                </button>
              </div>
              <div className="p-8 overflow-y-auto max-h-[calc(80vh-100px)]">
                {loadingNote ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : currentNote ? (
                  <div className="prose prose-slate max-w-none">
                    <div 
                      className="text-base text-[#45464e] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentNote.content }}
                    />
                    {currentNote.tags && currentNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-200">
                        {currentNote.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No note content available.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewSession;
