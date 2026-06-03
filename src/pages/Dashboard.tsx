import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { ReviewCard } from '../components/ReviewCard';
import { Play, Plus } from 'lucide-react';
import { cn, getDisplayLastName } from '../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../lib/api';
import { eventBus, EVENTS } from '../lib/events';

interface UserAnalyticsDto {
  totalNotes: number;
  totalMemoryItems: number;
  dueItems: number;
  totalReviews: number;
  reviewsToday: number;
  reviewsThisWeek: number;
  retentionRate: number;
  currentStreak: number;
}

interface ReviewSummaryDto {
  totalReviews: number;
  totalReviewedToday: number;
  totalReviewedThisWeek: number;
  successfulReviews: number;
}

interface MemoryStatsDto {
  todayReviewed: number;
  streak: number;
  upcoming: number;
  overdue: number;
}

interface TagDto {
  id: number;
  name: string;
}

interface TopicDto {
  id: number;
  name: string;
  description: string | null;
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
}

interface ReviewDto {
  memoryItemId: number;
  reviewDate: string;
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
  timeSpentSeconds: number;
  intervalBeforeReview: number;
  easeFactorBefore: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

type ReviewPriority = 'CRITICAL' | 'MEDIUM' | 'LOW';

interface DashboardReviewCard {
  id: number;
  priority: ReviewPriority;
  title: string;
  deck: string;
  due: string;
  type: string;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatDeckCount = (value: number) => {
  return String(value).padStart(2, '0');
};

const calculateRetentionScore = (review: ReviewDto): number => {
  // Rating scores: EASY=100, GOOD=80, HARD=40, AGAIN=0
  const ratingScores = {
    'EASY': 100,
    'GOOD': 80,
    'HARD': 40,
    'AGAIN': 0
  };
  
  const baseScore = ratingScores[review.rating] || 0;
  
  // Time bonus/penalty: faster answers get bonus, very slow get penalty
  const timeSpent = review.timeSpentSeconds;
  let timeFactor = 1.0;
  
  if (timeSpent < 3) {
    timeFactor = 0.9; // Too fast, might be guessing
  } else if (timeSpent >= 3 && timeSpent <= 15) {
    timeFactor = 1.1; // Optimal time - confident recall
  } else if (timeSpent > 15 && timeSpent <= 30) {
    timeFactor = 1.0; // Normal time
  } else if (timeSpent > 30) {
    timeFactor = 0.85; // Struggled to recall
  }
  
  return Math.min(100, Math.max(0, baseScore * timeFactor));
};

const calculateWeeklyGraphData = (reviews: ReviewDto[]): { 
  heights: number[]; 
  todayIndex: number;
  retentionRates: number[];
} => {
  // Get the current date and calculate the start of the week (Monday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to get Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Calculate which index is today (0 = Monday, 6 = Sunday)
  const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

  // Initialize data for each day of the week (Mon-Sun)
  const weekData = Array.from({ length: 7 }).map(() => ({ 
    totalReviews: 0, 
    totalScore: 0
  }));

  // Count reviews for each day and calculate scores
  reviews.forEach(review => {
    const reviewDate = new Date(review.reviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    const diffTime = reviewDate.getTime() - monday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Only count reviews from this week (0-6 days from Monday)
    if (diffDays >= 0 && diffDays < 7) {
      weekData[diffDays].totalReviews++;
      weekData[diffDays].totalScore += calculateRetentionScore(review);
    }
  });

  console.log('Review data by day:', weekData, 'Today index:', todayIndex);

  // Calculate retention scores (average score per day)
  const retentionRates = weekData.map(day => {
    if (day.totalReviews === 0) return 0;
    return Math.round(day.totalScore / day.totalReviews);
  });

  // Bar heights represent retention score (20-100 range for visibility)
  const heights = weekData.map(day => {
    if (day.totalReviews === 0) return 0;
    const averageScore = Math.round(day.totalScore / day.totalReviews);
    return Math.max(20, averageScore);
  });

  return { heights, todayIndex, retentionRates };
};

const formatDueLabel = (nextReviewDate: string | null) => {
  if (!nextReviewDate) {
    return 'Due now';
  }

  const nextReview = new Date(nextReviewDate);
  if (Number.isNaN(nextReview.getTime())) {
    return 'Due now';
  }

  const diffMs = nextReview.getTime() - Date.now();
  const diffHours = Math.round(Math.abs(diffMs) / (1000 * 60 * 60));

  if (diffMs <= 0) {
    if (diffHours < 1) {
      return 'Due now';
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return 'Overdue';
  }

  if (diffHours < 1) {
    return 'Due soon';
  }

  if (diffHours < 24) {
    return `In ${diffHours}h`;
  }

  if (diffHours < 48) {
    return 'Tomorrow';
  }

  return `In ${Math.ceil(diffHours / 24)}d`;
};

const getPriority = (item: MemoryItemDto): ReviewPriority => {
  if (item.reviewCount <= 0) {
    return 'CRITICAL';
  }

  if (item.reviewCount === 1) {
    return 'MEDIUM';
  }

  return item.due ? 'MEDIUM' : 'LOW';
};

const toReviewCard = (item: MemoryItemDto): DashboardReviewCard => {
  const title = item.front?.trim() || item.text?.trim() || 'Untitled memory item';
  const deck = item.source?.trim() || 'Unknown source';
  const type = item.tags?.[0]?.name?.trim() || 'Memory Item';

  return {
    id: item.id,
    priority: getPriority(item),
    title,
    deck,
    due: formatDueLabel(item.nextReviewDate),
    type,
  };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, accessToken, isAuthLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reviewProgressValue, setReviewProgressValue] = useState('0 / 0');
  const [reviewProgressPercent, setReviewProgressPercent] = useState(0);
  const [weeklyGoalValue, setWeeklyGoalValue] = useState('0 / 0');
  const [weeklyGoalPercent, setWeeklyGoalPercent] = useState(0);
  const [activeDecksValue, setActiveDecksValue] = useState('00');
  const [retentionRate, setRetentionRate] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [reviewCards, setReviewCards] = useState<DashboardReviewCard[]>([]);
  const [weeklyGraphData, setWeeklyGraphData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyRetentionRates, setWeeklyRetentionRates] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [todayGraphIndex, setTodayGraphIndex] = useState<number>(-1);
  const [topicAvatars, setTopicAvatars] = useState<Array<{ name: string; color: string }>>([]);

  const handleDeleteMemoryItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this memory item?')) {
      return;
    }

    try {
      await api.delete(`/memories/${id}`);
      // Remove from the list
      setReviewCards(prev => prev.filter(card => card.id !== id));
      setDueCount(prev => Math.max(0, prev - 1));
      console.log('Memory item deleted:', id);
    } catch (error) {
      console.error('Failed to delete memory item:', error);
      alert('Failed to delete memory item. Please try again.');
    }
  };

  const handleRescheduleMemoryItem = async (id: number, type: 'POSTPONE' | 'ADVANCE') => {
    try {
      await api.post(`/memories/${id}/reschedule`, { type });
      // Refresh the dashboard data
      setReviewCards(prev => prev.filter(card => card.id !== id));
      setDueCount(prev => Math.max(0, prev - 1));
      console.log('Memory item rescheduled:', id, type);
    } catch (error) {
      console.error('Failed to reschedule memory item:', error);
      alert('Failed to reschedule memory item. Please try again.');
    }
  };

  // Refresh data when navigating back from review session
  useEffect(() => {
    if (location.state?.from === '/review') {
      setRefreshTrigger(prev => prev + 1);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (isAuthLoading || !accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch all data in parallel
        const analyticsPromise = api.get<UserAnalyticsDto>('/analytics/me');
        const reviewSummaryPromise = api.get<ReviewSummaryDto>('/reviews/summary');
        const memoryStatsPromise = api.get<MemoryStatsDto>('/memories/stats');
        const dueItemsPromise = api.get<PageResponse<MemoryItemDto>>('/memories/due?limit=3');
        const topicsPromise = api.get<PageResponse<TopicDto>>('/topics?page=0&size=3');
        const recentReviewsPromise = api.get<PageResponse<ReviewDto>>('/reviews/recent?limit=500');

        const [analyticsResult, reviewSummaryResult, memoryStatsResult, dueItemsResult, topicsResult, recentReviewsResult] =
          await Promise.allSettled([
            analyticsPromise,
            reviewSummaryPromise,
            memoryStatsPromise,
            dueItemsPromise,
            topicsPromise,
            recentReviewsPromise,
          ]);

        if (!isMounted) {
          return;
        }        const analytics =
          analyticsResult.status === 'fulfilled' && analyticsResult.value?.data
            ? analyticsResult.value.data
            : null;
        const reviewSummary =
          reviewSummaryResult.status === 'fulfilled' && reviewSummaryResult.value?.data
            ? reviewSummaryResult.value.data
            : null;
        const memoryStats =
          memoryStatsResult.status === 'fulfilled' && memoryStatsResult.value?.data
            ? memoryStatsResult.value.data
            : null;
        const dueItems =
          dueItemsResult.status === 'fulfilled' && dueItemsResult.value?.data?.content
            ? (Array.isArray(dueItemsResult.value.data.content) ? dueItemsResult.value.data.content : [])
            : [];
        const topicsData =
          topicsResult.status === 'fulfilled' && topicsResult.value?.data?.content
            ? (Array.isArray(topicsResult.value.data.content) ? topicsResult.value.data.content : [])
            : [];
        const topicsCount =
          topicsResult.status === 'fulfilled' && topicsResult.value?.data?.totalElements
            ? topicsResult.value.data.totalElements
            : 0;
        const recentReviews =
          recentReviewsResult.status === 'fulfilled' && recentReviewsResult.value?.data?.content
            ? (Array.isArray(recentReviewsResult.value.data.content) ? recentReviewsResult.value.data.content : [])
            : [];

        console.log('Dashboard data loaded:', {
          analytics: analytics ? 'success' : 'failed',
          reviewSummary: reviewSummary ? 'success' : 'failed',
          memoryStats: memoryStats ? 'success' : 'failed',
          dueItems: dueItems.length,
          topics: topicsCount,
          topicsData: topicsData.length,
          recentReviews: recentReviews.length
        });

        // Set topic avatars for Active Decks card
        const avatars = topicsData.map((topic: TopicDto) => ({
          name: topic.name,
          color: '' // Color will be assigned by StatCard
        }));
        console.log('Topic avatars prepared:', avatars);
        setTopicAvatars(avatars);

        const totalMemoryItems = analytics?.totalMemoryItems ?? 0;
        const totalReviews = analytics?.totalReviews ?? reviewSummary?.totalReviews ?? 0;
        const reviewsThisWeek = analytics?.reviewsThisWeek ?? reviewSummary?.totalReviewedThisWeek ?? 0;
        const reviewedToday = memoryStats?.todayReviewed ?? reviewSummary?.totalReviewedToday ?? 0;
        const streak = analytics?.currentStreak ?? memoryStats?.streak ?? 0;
        const dueItemsCount = analytics?.dueItems ?? memoryStats?.overdue ?? (dueItems ? dueItems.length : 0);

        // Calculate weekly graph data from actual reviews
        const { heights: graphData, todayIndex, retentionRates } = calculateWeeklyGraphData(recentReviews);
        console.log('Weekly graph data calculated:', graphData, 'Retention rates:', retentionRates, 'Today index:', todayIndex);

        setWeeklyGraphData(graphData);
        setWeeklyRetentionRates(retentionRates);
        setTodayGraphIndex(todayIndex);
        setRetentionRate(
          reviewSummary?.successfulReviews ?? analytics?.retentionRate ?? 0
        );
        setReviewProgressValue(
          `${formatNumber(reviewedToday)} / ${formatNumber(Math.max(totalMemoryItems, 1))}`
        );
        setReviewProgressPercent(
          totalMemoryItems > 0 ? Math.min(100, Math.round((reviewedToday / totalMemoryItems) * 100)) : 0
        );
        setWeeklyGoalValue(
          `${formatNumber(reviewsThisWeek)} / ${formatNumber(Math.max(totalReviews, 1))}`
        );
        setWeeklyGoalPercent(
          totalReviews > 0 ? Math.min(100, Math.round((reviewsThisWeek / totalReviews) * 100)) : 0
        );
        setActiveDecksValue(formatDeckCount(topicsCount));
        setDueCount(dueItemsCount);
        setCurrentStreak(streak);
        
        console.log('Dashboard state updated:', {
          reviewProgressValue: `${formatNumber(reviewedToday)} / ${formatNumber(Math.max(totalMemoryItems, 1))}`,
          weeklyGoalValue: `${formatNumber(reviewsThisWeek)} / ${formatNumber(Math.max(totalReviews, 1))}`,
          activeDecksValue: formatDeckCount(topicsCount),
          retentionRate: reviewSummary?.successfulReviews ?? analytics?.retentionRate ?? 0,
          dueCount: dueItemsCount,
          streak,
          topicAvatarsCount: avatars.length
        });
        
        const backendReviewCards = dueItems.map(toReviewCard);
        setReviewCards(backendReviewCards);

        if (streak > 0) {
          document.title = `Echo Dashboard | ${streak} Day Streak`;
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
      } finally {
        if (isMounted) {
          console.log('Dashboard: Setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    console.log('Dashboard useEffect triggered:', { isAuthLoading, hasAccessToken: !!accessToken });
    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, refreshTrigger]);

  return (
    <div className="max-w-[1200px] mx-auto p-gutter space-y-gutter animate-in fade-in duration-700 pb-24">
      {/* Header Section — Editorial Style */}
      <section className="mb-12 animate-in slide-in-from-left duration-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-[#182442]/40 uppercase tracking-[0.2em]">Personal Dashboard</span>
          </div>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl text-[#182442]/90 font-medium leading-tight mb-2">
          Welcome back, <span className="italic">{getDisplayLastName(userName) || 'there'}.</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[15px] text-slate-400 max-w-xl">
          {isLoading ? (
            'Loading your progress...'
          ) : retentionRate > 0 ? (
            <>Your retention is at an all-time high. Ready for today's <span className="text-[#182442]/60 font-medium">focus session</span>?</>
          ) : (
            'Start your learning journey by creating your first memory item.'
          )}
        </p>
      </section>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Main Retention Chart */}
        <div className="md:col-span-8 echo-card flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                Memory Performance
              </p>
              <h3 className="text-2xl font-bold text-primary mt-1">Retention Rate</h3>
            </div>
            {isLoading ? (
              <div className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-xs font-bold animate-pulse">
                Loading...
              </div>
            ) : retentionRate > 0 ? (
              <div className="px-3 py-1 bg-[#ecfdf5] text-[#3c6752] rounded-full text-xs font-bold border border-[#3c6752]/10">
                {retentionRate.toFixed(1)}% Peak
              </div>
            ) : (
              <div className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-xs font-bold">
                No data yet
              </div>
            )}
          </div>

          {/* Chart Simulation - Compact Geometry (Thin bars, tight gaps) */}
          <div className="h-48 w-full flex items-end gap-2 px-4 mt-8">
            {weeklyGraphData.map((h, i) => {
              const isToday = i === todayGraphIndex;
              const retentionRate = weeklyRetentionRates[i];
              
              // Calculate actual pixel height (max 192px for h-48 = 12rem = 192px)
              const pixelHeight = isLoading ? 96 : (h === 0 ? 8 : Math.round((h / 100) * 180)); // Use 180px max
              
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                >
                  {/* Percentage label - only show if there's data */}
                  {!isLoading && h > 0 && (
                    <span className={cn(
                      "text-[9px] font-bold transition-all duration-700 ease-out",
                      isToday ? "text-[#182442]" : "text-slate-400"
                    )}
                    style={{ transitionDelay: `${i * 100 + 200}ms` }}
                    >
                      {retentionRate}%
                    </span>
                  )}
                  {/* Bar */}
                  <div
                    className={cn(
                      "w-full transition-all duration-700 ease-out",
                      isLoading 
                        ? "bg-slate-100 animate-pulse" 
                        : h === 0 
                          ? "bg-slate-100" 
                          : isToday
                            ? "bg-[#182442] shadow-[0_0_20px_rgba(24,36,66,0.2)]" 
                            : "bg-slate-200 hover:bg-[#182442]/10"
                    )}
                    style={{ 
                      height: `${pixelHeight}px`,
                      transitionDelay: `${i * 100}ms` 
                    }}
                    title={isToday ? `Today: ${retentionRate}% retention` : `${retentionRate}% retention`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-50 uppercase px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Learning Mastery Card */}
        <div className="md:col-span-4 bg-[#182442] bg-gradient-to-br from-[#182442] to-[#0f172a] text-white rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Learning Mastery</p>
            {isLoading ? (
              <h3 className="text-[34px] font-medium mt-4 leading-none font-manrope animate-pulse">Loading...</h3>
            ) : currentStreak > 0 ? (
              <>
                <h3 className="text-[34px] font-medium mt-4 leading-none font-manrope">{currentStreak} Day Streak</h3>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-white/70 mt-4 leading-relaxed">
                  Keep up the great work! You're building a strong learning habit.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-[34px] font-medium mt-4 leading-none font-manrope">Start Today</h3>
                <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-sm text-white/70 mt-4 leading-relaxed">
                  Begin your learning streak by reviewing your first item.
                </p>
              </>
            )}
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7daa92] !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-2xl font-bold text-[#7daa92]">{isLoading ? '...' : currentStreak > 0 ? `+${currentStreak * 35} XP` : '0 XP'}</span>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Progress Tracker Cards */}
        <StatCard
          title="Review Progress"
          value={isLoading ? 'Loading...' : reviewProgressValue}
          progress={reviewProgressPercent}
          icon="task_alt"
          className="md:col-span-4"
        />
        <StatCard
          title="Weekly Goal"
          value={isLoading ? 'Loading...' : weeklyGoalValue}
          progress={weeklyGoalPercent}
          icon="calendar_month"
          className="md:col-span-4"
        />
        <StatCard
          title="Active Decks"
          value={isLoading ? '...' : activeDecksValue}
          topicAvatars={topicAvatars}
          className="md:col-span-4"
        />
      </div>

      {/* Due for Review Section */}
      <section className="mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-[1px] bg-[#182442]/30"></span>
              <span className="text-[10px] font-bold text-[#182442]/50 uppercase tracking-widest">Priority Queue</span>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl text-[#182442] font-medium leading-none mb-3">Due for <span className="italic">Review</span></h3>
            <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-slate-500 text-sm">
              {isLoading ? 'Loading your items...' : reviewCards.length > 0 ? 'Personalized items ready for your focus session.' : 'No items due for review yet.'}
            </p>
          </div>
          {!isLoading && dueCount > 0 && (
            <button 
              onClick={() => navigate('/review', { state: { from: location.pathname } })}
              className="bg-[#182442] text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
            >
              <Play size={18} fill="currentColor" />
              Start Session ({dueCount} Items)
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[1, 2, 3].map((i) => (
              <div key={i} className="echo-card h-48 animate-pulse bg-slate-50"></div>
            ))}
          </div>
        ) : reviewCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {reviewCards.map((card, index) => (
              <ReviewCard
                key={`${card.id}-${index}`}
                id={card.id}
                priority={card.priority}
                title={card.title}
                deck={card.deck}
                due={card.due}
                type={card.type}
                onDelete={handleDeleteMemoryItem}
                onReschedule={handleRescheduleMemoryItem}
              />
            ))}
          </div>
        ) : (
          <div className="echo-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-slate-300 !text-6xl">check_circle</span>
              <div>
                <h4 className="text-lg font-bold text-slate-700 mb-2">All caught up!</h4>
                <p className="text-sm text-slate-500">No items due for review right now. Create new memory items to get started.</p>
              </div>
              <button 
                onClick={() => navigate('/new')}
                className="mt-4 bg-[#182442] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Create Memory Item
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Secondary CTA Area - Refined Masterpiece Section */}
      {!isLoading && dueCount > 5 && (
        <section className="bg-[#182442] rounded-2xl p-10 flex flex-col md:flex-row items-center gap-8 mt-20 relative overflow-hidden group shadow-2xl shadow-[#182442]/20">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
          
          <div className="flex-1 space-y-3 text-center md:text-left relative z-10">
            <h4 className="text-2xl font-bold text-white font-manrope tracking-tight">Feeling overwhelmed?</h4>
            <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-white/70 text-base leading-relaxed max-w-xl">
              Our AI coach can help you prioritize your study load based on upcoming exam dates and your cognitive load capacity.
            </p>
          </div>
          <div className="flex gap-4 relative z-10">
            <button className="bg-white/10 text-white border border-white/20 px-8 py-3 text-[14px] font-bold rounded-xl hover:bg-white/20 transition-all">
              Dismiss
            </button>
            <button className="bg-white text-[#182442] px-8 py-3 text-[14px] rounded-xl font-bold hover:shadow-xl transition-all shadow-lg shadow-black/10">
              Optimize My Deck
            </button>
          </div>
        </section>
      )}

      {/* FAB - Fixed Action Button */}
      <button 
        onClick={() => navigate('/new')}
        className="fab-btn group"
      >
        <Plus size={32} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default Dashboard;
