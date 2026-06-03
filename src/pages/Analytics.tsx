import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { buildHeatmapCells, cn, getHeatmapWeekCount, HEATMAP_LEGEND_COLORS } from '../lib/utils';
import { api } from '../lib/api';
import { useUser } from '../context/UserContext';
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

interface AdminSystemAnalyticsDto {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  totalMemoryItems: number;
  totalReviews: number;
  totalTags: number;
}

interface MemoryStatsDto {
  todayReviewed: number;
  streak: number;
  upcoming: number;
  overdue: number;
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

interface MemoryItemDto {
  id: number;
  front: string;
  back: string;
  text?: string; // Backward compatibility
  reviewCount: number;
  createdAt: string;
}

const Analytics: React.FC = () => {
  const { accessToken, isAuthLoading, userRole } = useUser();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [heatmapView, setHeatmapView] = useState<'6months' | 'year'>(() => {
    const saved = localStorage.getItem('heatmapView');
    return (saved === 'year' || saved === '6months') ? saved : '6months';
  });

  // Persist heatmap view preference
  useEffect(() => {
    localStorage.setItem('heatmapView', heatmapView);
  }, [heatmapView]);

  // Refresh data when navigating back from review session OR when page becomes visible
  useEffect(() => {
    if (location.state?.from === '/review') {
      console.log('Analytics: Detected return from review session, refreshing data...');
      setRefreshTrigger(prev => prev + 1);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Listen for global refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Analytics: Received global refresh event');
      setRefreshTrigger(prev => prev + 1);
    };

    eventBus.on(EVENTS.REVIEW_COMPLETED, handleRefresh);
    eventBus.on(EVENTS.DATA_REFRESH_NEEDED, handleRefresh);

    return () => {
      eventBus.off(EVENTS.REVIEW_COMPLETED, handleRefresh);
      eventBus.off(EVENTS.DATA_REFRESH_NEEDED, handleRefresh);
    };
  }, []);

  // Refresh data when page becomes visible (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isAuthLoading && accessToken) {
        console.log('Analytics: Page became visible, refreshing data...');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthLoading, accessToken]);

  // States
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsDto | null>(null);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminSystemAnalyticsDto | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStatsDto | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewDto[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItemDto[]>([]);
  const [masteryBreakdown, setMasteryBreakdown] = useState({ mastered: 0, reviewing: 0, learning: 0 });

  useEffect(() => {
    let isMounted = true;

    const fetchAnalyticsData = async () => {
      console.log('Analytics: fetchAnalyticsData called', { isAuthLoading, hasAccessToken: !!accessToken });
      
      // Wait for auth to complete
      if (isAuthLoading) {
        console.log('Analytics: Waiting for auth...');
        return;
      }

      // Ensure we have a token before making API calls
      if (!accessToken) {
        console.log('Analytics: No access token');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log('Analytics: Starting API calls with token present');
      
      try {
        console.log('Loading analytics data...', { refreshTrigger, timestamp: new Date().toISOString() });
        // Add timestamp to prevent caching - use unique timestamp for each request
        const timestamp = Date.now();
        const userAnalyticsPromise = api.get<UserAnalyticsDto>(`/analytics/me?_t=${timestamp}`);
        const memoryStatsPromise = api.get<MemoryStatsDto>(`/memories/stats?_t=${timestamp + 1}`);
        const recentReviewsPromise = api.get<PageResponse<ReviewDto>>(`/reviews/recent?limit=1000&_t=${timestamp + 2}`);
        const memoryItemsPromise = api.get<PageResponse<MemoryItemDto>>(`/memories?page=0&size=200&_t=${timestamp + 3}`);

        const isAdmin = userRole === 'ADMIN';
        const adminPromise = isAdmin 
          ? api.get<AdminSystemAnalyticsDto>('/admin/system/analytics')
          : Promise.resolve(null);

        const [
          userAnalyticsResult,
          memoryStatsResult,
          recentReviewsResult,
          memoryItemsResult,
          adminResult
        ] = await Promise.allSettled([
          userAnalyticsPromise,
          memoryStatsPromise,
          recentReviewsPromise,
          memoryItemsPromise,
          adminPromise
        ]);

        if (!isMounted) return;

        const uAnalytics = userAnalyticsResult.status === 'fulfilled' && userAnalyticsResult.value?.data 
          ? userAnalyticsResult.value.data 
          : null;
        const mStats = memoryStatsResult.status === 'fulfilled' && memoryStatsResult.value?.data 
          ? memoryStatsResult.value.data 
          : null;
        const rReviews = recentReviewsResult.status === 'fulfilled' && recentReviewsResult.value?.data?.content 
          ? (Array.isArray(recentReviewsResult.value.data.content) ? recentReviewsResult.value.data.content : [])
          : [];
        const mItems = memoryItemsResult.status === 'fulfilled' && memoryItemsResult.value?.data?.content 
          ? (Array.isArray(memoryItemsResult.value.data.content) ? memoryItemsResult.value.data.content : [])
          : [];
        const aAnalytics = adminResult.status === 'fulfilled' && adminResult.value?.data 
          ? adminResult.value.data 
          : null;

        console.log('Analytics data loaded:', {
          userAnalytics: uAnalytics ? 'success' : 'failed',
          memoryStats: mStats ? 'success' : 'failed',
          recentReviews: rReviews.length,
          recentReviewsSample: rReviews.slice(0, 5).map(r => ({ 
            date: r.reviewDate, 
            rating: r.rating,
            dateType: typeof r.reviewDate 
          })),
          memoryItems: mItems.length,
          adminAnalytics: aAnalytics ? 'success' : 'not admin'
        });

        setUserAnalytics(uAnalytics);
        setMemoryStats(mStats);
        setRecentReviews(rReviews);
        setMemoryItems(mItems);
        if (aAnalytics) {
          setAdminAnalytics(aAnalytics);
        }

        // Calculate mastery breakdown
        let masteredCount = 0;
        let reviewingCount = 0;
        let learningCount = 0;

        if (mItems && Array.isArray(mItems)) {
          mItems.forEach(item => {
            if (item.reviewCount === 0) {
              learningCount++;
            } else if (item.reviewCount >= 5) {
              masteredCount++;
            } else {
              reviewingCount++;
            }
          });
        }

        const totalItems = uAnalytics?.totalMemoryItems ?? (mItems ? mItems.length : 0);
        if (mItems && mItems.length > 0 && totalItems > mItems.length) {
          const scale = totalItems / mItems.length;
          const scaledMastered = Math.round(masteredCount * scale);
          const scaledReviewing = Math.round(reviewingCount * scale);
          const scaledLearning = totalItems - scaledMastered - scaledReviewing;
          setMasteryBreakdown({
            mastered: Math.max(0, scaledMastered),
            reviewing: Math.max(0, scaledReviewing),
            learning: Math.max(0, scaledLearning)
          });
        } else {
          setMasteryBreakdown({
            mastered: masteredCount,
            reviewing: reviewingCount,
            learning: learningCount
          });
        }

        console.log('Mastery breakdown:', { masteredCount, reviewingCount, learningCount });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalyticsData();
    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, userRole, refreshTrigger]);

  // Helpers for Heatmap
  const getPastMonths = () => {
    const months = [];
    const date = new Date();
    const count = heatmapView === 'year' ? 11 : 5;
    for (let i = count; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }).toUpperCase());
    }
    return months;
  };

  const heatmapCellCount = heatmapView === 'year' ? 364 : 168;

  const heatmapCells = useMemo(() => {
    const cells = buildHeatmapCells(recentReviews, heatmapCellCount);
    
    // Debug output
    console.log('[Heatmap Build]', {
      totalReviews: recentReviews.length,
      cellsWithData: cells.filter(c => c.count > 0).length,
      sampleCells: cells.filter(c => c.count > 0).slice(0, 5)
    });
    
    return cells;
  }, [recentReviews, heatmapCellCount]);

  const heatmapWeekCount = getHeatmapWeekCount(heatmapCellCount);

  // Helpers for Retention Rate
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
    // Ideal time: 5-15 seconds
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

  const getWeeklyRetentionData = () => {
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
    if (recentReviews && Array.isArray(recentReviews)) {
      recentReviews.forEach(review => {
        if (!review.reviewDate) return;
        
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
    }

    console.log('Weekly retention data by day:', weekData, 'Today index:', todayIndex);
    console.log('Recent reviews for this week:', recentReviews.filter(r => {
      const reviewDate = new Date(r.reviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      const diffTime = reviewDate.getTime() - monday.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    }).map(r => ({ date: r.reviewDate, rating: r.rating })));

    // Calculate display values for each day
    return weekData.map((day, index) => {
      if (day.totalReviews === 0) {
        return { rate: 0, displayHeight: 0, hasData: false, isToday: index === todayIndex, reviews: 0 };
      }
      
      // Calculate average retention score for the day
      const averageScore = Math.round(day.totalScore / day.totalReviews);
      
      // Bar height represents retention score (20-100 range for visibility)
      const displayHeight = Math.max(20, averageScore);
      
      return { 
        rate: averageScore, 
        displayHeight,
        hasData: true, 
        isToday: index === todayIndex,
        reviews: day.totalReviews
      };
    });
  };

  const weeklyData = getWeeklyRetentionData();
  const chartValues = weeklyData.map(d => d.displayHeight);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const retentionRate = userAnalytics?.retentionRate ?? 0;
  const currentStreak = userAnalytics?.currentStreak ?? memoryStats?.streak ?? 0;

  // New items created in last 7 days
  const newItemsAdded = Array.isArray(memoryItems) 
    ? memoryItems.filter(item => {
        const diff = Date.now() - new Date(item.createdAt).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      }).length
    : 0;

  const totalMemoryItems = userAnalytics?.totalMemoryItems ?? 0;
  const masteredPercent = totalMemoryItems > 0 ? (masteryBreakdown.mastered / totalMemoryItems) * 100 : 0;
  const reviewingPercent = totalMemoryItems > 0 ? (masteryBreakdown.reviewing / totalMemoryItems) * 100 : 0;
  const learningPercent = totalMemoryItems > 0 ? (masteryBreakdown.learning / totalMemoryItems) * 100 : 0;

  // Average review response time
  const totalTimeSpent = Array.isArray(recentReviews) 
    ? recentReviews.reduce((sum, r) => sum + r.timeSpentSeconds, 0)
    : 0;
  const avgResponseTime = recentReviews && recentReviews.length > 0
    ? (totalTimeSpent / recentReviews.length).toFixed(1)
    : '0';

  const showAdminRow = userRole === 'ADMIN' && adminAnalytics;

  return (
    <div className="max-w-[1200px] mx-auto p-gutter space-y-gutter animate-in fade-in duration-700 pb-24">
      {/* Header Section — Editorial Style */}
      <header className="mb-12 animate-in slide-in-from-left duration-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-[1px] bg-[#182442]/20"></div>
          <span className="text-[10px] font-bold text-[#182442]/40 uppercase tracking-[0.2em]">Cognitive Insights</span>
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              setRefreshTrigger(prev => prev + 1);
            }}
            className="ml-auto px-4 py-2 bg-[#182442] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">refresh</span>
            Refresh Data
          </button>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl text-[#182442] font-medium leading-none mb-4">
          Cognitive <span className="italic">Performance</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-base text-slate-500 max-w-2xl leading-relaxed">
          A detailed analysis of your <span className="text-[#182442] font-medium">learning trajectory</span>, retention patterns, and system-wide mastery distribution.
        </p>
      </header>

      {/* Admin Stats Row */}
      {showAdminRow && adminAnalytics && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-in fade-in duration-500">
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Users</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#182442] font-manrope">{formatNumber(adminAnalytics.totalUsers)}</span>
              <span className="text-[#3c6752] text-xs font-bold">
                {adminAnalytics.totalUsers > 0 ? `+${Math.round((adminAnalytics.activeUsers / adminAnalytics.totalUsers) * 100)}% active` : '0%'}
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Knowledge Units</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#182442] font-manrope">
                {formatNumber(adminAnalytics.totalNotes + adminAnalytics.totalMemoryItems)}
              </span>
              <span className="text-[#3c6752] text-xs font-bold">+{formatNumber(adminAnalytics.totalMemoryItems)} cards</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Review Velocity</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#182442] font-manrope">{formatNumber(adminAnalytics.totalReviews)}</span>
              <span className="text-slate-400 text-xs font-bold">Total</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg. Retention</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#182442] font-manrope">
                {retentionRate > 0 ? `${retentionRate.toFixed(1)}%` : '92.4%'}
              </span>
              <span className="text-[#3c6752] text-xs font-bold">Personal</span>
            </div>
          </div>
        </section>
      )}

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Mastery Heatmap: Span 8 columns */}
        <div className="col-span-12 md:col-span-8 bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-[#182442] font-manrope">Mastery Heatmap</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setHeatmapView('year')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded uppercase tracking-widest transition-colors",
                  heatmapView === 'year' 
                    ? "bg-[#182442] text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Year
              </button>
              <button 
                onClick={() => setHeatmapView('6months')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded uppercase tracking-widest transition-colors",
                  heatmapView === '6months' 
                    ? "bg-[#182442] text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Last 6 Months
              </button>
            </div>
          </div>
          {/* Heatmap Section */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">
              {getPastMonths().map(m => <span key={m}>{m}</span>)}
            </div>
            <div className="w-full">
              <div
                className="grid w-full gap-[3px] py-1"
                style={{
                  gridTemplateColumns: `repeat(${heatmapWeekCount}, minmax(0, 1fr))`,
                  gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                  gridAutoFlow: 'column',
                }}
              >
                {isLoading ? (
                  Array.from({ length: heatmapCellCount }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full rounded-[3px] bg-slate-100 animate-pulse",
                        heatmapView === '6months' ? "h-[14px]" : "aspect-square"
                      )}
                    />
                  ))
                ) : (
                  heatmapCells.map((cell, i) => (
                    <div
                      key={`${cell.date}-${i}`}
                      title={`${cell.count} review${cell.count === 1 ? '' : 's'} on ${cell.date}`}
                      className={cn(
                        'w-full rounded-[3px] transition-colors hover:ring-1 hover:ring-[#182442]/25 cursor-pointer',
                        heatmapView === '6months' ? "h-[14px]" : "aspect-square",
                        cell.color
                      )}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Less</span>
              <div className="flex gap-1">
                {HEATMAP_LEGEND_COLORS.map((color) => (
                  <div key={color} className={cn('w-3 h-3 rounded-sm', color)} />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">More</span>
            </div>
          </div>
        </div>

        {/* Mastery Level Breakdown: Span 4 columns */}
        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 p-8 rounded-xl flex flex-col shadow-sm">
          <h3 className="text-xl font-bold text-[#182442] mb-8 font-manrope">Memory Items</h3>
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MASTERED</span>
                <span className="text-xl font-bold text-[#182442] font-manrope">
                  {isLoading ? '...' : formatNumber(masteryBreakdown.mastered)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3c6752] transition-all duration-500" 
                  style={{ width: `${isLoading ? 0 : masteredPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">REVIEWING</span>
                <span className="text-xl font-bold text-[#182442] font-manrope">
                  {isLoading ? '...' : formatNumber(masteryBreakdown.reviewing)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#182442] transition-all duration-500" 
                  style={{ width: `${isLoading ? 0 : reviewingPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LEARNING</span>
                <span className="text-xl font-bold text-[#182442] font-manrope">
                  {isLoading ? '...' : formatNumber(masteryBreakdown.learning)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ba1a1a]/60 transition-all duration-500" 
                  style={{ width: `${isLoading ? 0 : learningPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Trends: Span 5 columns */}
        <div className="col-span-12 md:col-span-5 bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-[#182442] font-manrope">Retention Rate</h3>
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
          <div className="h-48 w-full flex items-end gap-2 px-4 relative">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-slate-100 rounded-t-xs animate-pulse"
                  style={{ height: '96px', transitionDelay: `${i * 100}ms` }}
                ></div>
              ))
            ) : (
              chartValues.map((h, i) => {
                const dayData = weeklyData[i];
                const isToday = dayData?.isToday;
                const retentionRate = dayData?.rate || 0;
                const reviewCount = dayData?.reviews || 0;
                
                // Calculate actual pixel height (max 192px for h-48 = 12rem = 192px)
                const pixelHeight = h === 0 ? 8 : Math.round((h / 100) * 180); // Use 180px max for content
                
                return (
                  <div 
                    key={i} 
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    {/* Percentage label - only show if there's data */}
                    {h > 0 && (
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
                        "w-full rounded-t-lg transition-all duration-700 ease-out",
                        h === 0 
                          ? "bg-slate-100" 
                          : isToday 
                            ? "bg-[#182442] shadow-[0_0_20px_rgba(24,36,66,0.2)]" 
                            : "bg-slate-200 hover:bg-[#182442]/10"
                      )}
                      style={{ 
                        height: `${pixelHeight}px`,
                        transitionDelay: `${i * 100}ms`
                      }}
                      title={`${reviewCount} review${reviewCount !== 1 ? 's' : ''}, ${retentionRate}% retention${isToday ? ' (Today)' : ''}`}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-50 uppercase px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Reviews Over Time: Span 7 columns */}
        <div className="col-span-12 md:col-span-7 bg-white border border-slate-200 p-8 rounded-xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined !text-[120px] pointer-events-none select-none">timeline</span>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-[#182442] font-manrope">Reviews Activity</h3>
              <select className="text-[10px] font-bold uppercase tracking-widest border-none bg-slate-50 rounded-lg focus:ring-0 text-slate-600 cursor-pointer px-4 py-2">
                <option>Weekly View</option>
                <option>Monthly View</option>
              </select>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">WEEKLY VOLUME</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-3xl font-bold text-[#182442] font-manrope">
                      {isLoading ? '...' : formatNumber(userAnalytics?.reviewsThisWeek ?? 0)}
                    </h4>
                    <p className="text-[#3c6752] text-sm font-bold">
                      {userAnalytics && userAnalytics.totalReviews > 0 ? `↑ ${((userAnalytics.reviewsThisWeek / Math.max(userAnalytics.totalReviews, 1)) * 100).toFixed(1)}%` : 'Active'}
                    </p>
                  </div>
                </div>
                <div className="w-32 h-16">
                  <svg className="w-full h-full stroke-[#3c6752] fill-none stroke-2" viewBox="0 0 100 30">
                    <path d="M0,25 L15,18 L30,22 L45,10 L60,15 L75,5 L100,12" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
              </div>
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">New Items Added</p>
                  <p className="text-xl font-bold text-[#182442] font-manrope">
                    {isLoading ? '...' : newItemsAdded}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Cards Matured</p>
                  <p className="text-xl font-bold text-[#182442] font-manrope">
                    {isLoading ? '...' : masteryBreakdown.mastered}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Velocity Card (Unique Asymmetric Layout) */}
        <div className="col-span-12 bg-[#182442] text-white p-12 rounded-xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjzSSo-lfHr_UZUX9Tnc5MwnFqOPt6dh4-71Cr0_8-FmyPOqVHZSkrRLKkN3i2JOogu0Y3t4sPw8G1g6b3ORdr2fTiQrP2-nch1fcxHKE2WV6C0xKGiD6Zr9Pe-z4GPY-OdKRTR7iciYa-wFCC3_kifVb8OGl5-3Trr5tKK59dugRKlOSPSt-xHvz1NC0ue-9ZwjZummFJ2undD4Uag7RaNcl215hIy2zIEj1JUk6VvxcEoV4L7QirFolGZvxeGBR1OCRuFOTdtT8" 
              alt="Contextual accent"
            />
          </div>
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block border border-white/10">PERFORMANCE INSIGHT</span>
            <h3 className="text-3xl font-bold mb-4 font-manrope">Cognitive Load is Optimal</h3>
            <p className="text-[16px] text-white/70 leading-relaxed font-inter">
              {currentStreak > 0 
                ? `You are on a ${currentStreak}-day review streak! Based on your recent reviews, your optimal review window is between 08:00 and 10:00 AM.`
                : 'Establish a daily review streak to optimize your cognitive window and recall rates.'}
            </p>
          </div>
          <div className="relative z-10 flex gap-12 mt-8 md:mt-0">
            <div className="text-center">
              <p className="text-4xl font-bold font-manrope">
                {retentionRate > 0 ? `${retentionRate.toFixed(0)}%` : '0%'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">RETENTION RATE</p>
            </div>
            <div className="hidden md:block h-16 w-px bg-white/20"></div>
            <div className="text-center">
              <p className="text-4xl font-bold font-manrope">
                {avgResponseTime}s
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">AVG. RESPONSE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
