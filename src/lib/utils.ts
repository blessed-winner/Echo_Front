import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Plain text from HTML — strips tags (e.g. underline) for list previews. */
export function stripHtml(html: string): string {
  if (!html) return '';
  const normalized = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ');
  const doc = new DOMParser().parseFromString(normalized, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

type ApiDateInput = string | undefined | null | number[];

/** Parse Spring/Jackson dates (ISO string or [y, m, d, …] array). */
export function parseApiDate(value: ApiDateInput): Date | null {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0, sec = 0] = value;
    if (typeof y !== 'number' || typeof m !== 'number' || typeof d !== 'number') return null;
    const date = new Date(y, m - 1, d, h, min, sec);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Calendar date for note metadata (e.g. Jun 1, 2025). */
export function formatDisplayDate(value: ApiDateInput): string {
  const date = parseApiDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Last token of a display name, or the whole string if single-word. */
export function getDisplayLastName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

/** YYYY-MM-DD in local timezone (avoids UTC shift from toISOString). */
export function toLocalDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  
  // Ensure we're working in local timezone, not UTC
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Echo brand palette for deck/topic avatars — navy & slate only. */
export const TOPIC_AVATAR_COLORS = [
  'bg-[#182442]',
  'bg-[#2a3654]',
  'bg-[#3d4d6f]',
  'bg-slate-600',
  'bg-slate-500',
  'bg-[#182442]/75',
  'bg-slate-700',
  'bg-[#1e2d52]',
] as const;

/** Legend + cell shades (Less → More). Index 0 = no activity. */
export const HEATMAP_LEGEND_COLORS = [
  'bg-slate-100',
  'bg-[#182442]/55',
  'bg-[#182442]/80',
  'bg-[#182442]',
] as const;

/** Fixed review-count tiers — matches HEATMAP_LEGEND_COLORS. */
export function getHeatmapCellColor(count: number): string {
  if (count <= 0) return HEATMAP_LEGEND_COLORS[0];
  if (count === 1) return HEATMAP_LEGEND_COLORS[1];
  if (count <= 4) return HEATMAP_LEGEND_COLORS[2];
  return HEATMAP_LEGEND_COLORS[3];
}

export interface HeatmapCell {
  date: string;
  count: number;
  color: string;
}

export function getHeatmapWeekCount(cellCount: number): number {
  return Math.ceil(cellCount / 7);
}

export function buildHeatmapCells(
  reviews: Array<{ reviewDate: string }>,
  cellCount: number
): HeatmapCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + mondayOffset - (cellCount - 1));

  const datesList: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < cellCount; i++) {
    datesList.push(toLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const reviewCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    if (!r.reviewDate) return;
    const key = toLocalDateKey(r.reviewDate);
    if (key) {
      reviewCounts[key] = (reviewCounts[key] || 0) + 1;
    }
  });

  // Debug: Log today's data
  const todayKey = toLocalDateKey(today);
  console.log('[Heatmap] Today:', todayKey, 'Reviews today:', reviewCounts[todayKey] || 0);
  console.log('[Heatmap] All review dates:', Object.keys(reviewCounts).sort());

  return datesList.map((dateStr) => {
    const count = reviewCounts[dateStr] || 0;
    return {
      date: dateStr,
      count,
      color: getHeatmapCellColor(count),
    };
  });
}
