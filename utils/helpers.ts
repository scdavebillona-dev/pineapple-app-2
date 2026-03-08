/**
 * PineAI System - General Helper Utilities
 */

import { FilterVariety, ScanResult, ScanStats, SortOption } from '@/types';

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate statistics from scan records
 */
export function calculateStats(scans: ScanResult[]): ScanStats {
  const total = scans.length;
  const queen = scans.filter((s) => s.label === 'Queen').length;
  const smoothCayenne = scans.filter((s) => s.label === 'Smooth' || s.label === 'Smooth Cayenne').length;
  
  const avgConfidence =
    total > 0
      ? scans.reduce((sum, s) => sum + s.confidence, 0) / total
      : 0;

  // Calculate today's count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = scans.filter((s) => new Date(s.timestamp) >= today).length;

  // Calculate this week's count
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyCount = scans.filter((s) => new Date(s.timestamp) >= weekAgo).length;

  return {
    total,
    queen,
    smoothCayenne,
    avgConfidence,
    todayCount,
    weeklyCount,
  };
}

/**
 * Filter scans by variety
 */
export function filterByVariety(
  scans: ScanResult[],
  variety: FilterVariety
): ScanResult[] {
  if (variety === 'all') return scans;
  return scans.filter((s) => s.label === variety);
}

/**
 * Filter scans by search query
 */
export function filterBySearch(
  scans: ScanResult[],
  query: string
): ScanResult[] {
  if (!query.trim()) return scans;
  const lowerQuery = query.toLowerCase();
  return scans.filter(
    (s) =>
      s.label.toLowerCase().includes(lowerQuery) ||
      s.quality?.toLowerCase().includes(lowerQuery) ||
      s.notes?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort scans by option
 */
export function sortScans(
  scans: ScanResult[],
  sortOption: SortOption
): ScanResult[] {
  const sorted = [...scans];
  switch (sortOption) {
    case 'recent':
      return sorted.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    case 'confidence-high':
      return sorted.sort((a, b) => b.confidence - a.confidence);
    case 'confidence-low':
      return sorted.sort((a, b) => a.confidence - b.confidence);
    default:
      return sorted;
  }
}

/**
 * Get quality grade color
 */
export function getQualityColor(quality?: string): string {
  switch (quality) {
    case 'Premium':
      return '#10B981'; // green
    case 'Grade A':
      return '#3B82F6'; // blue
    case 'Grade B':
      return '#F59E0B'; // amber
    case 'Standard':
      return '#6B7280'; // gray
    default:
      return '#9CA3AF'; // light gray
  }
}

/**
 * Get confidence color based on value
 */
export function getConfidenceColor(confidence: number): string {
  const value = confidence > 1 ? confidence : confidence * 100;
  if (value >= 90) return '#10B981'; // green
  if (value >= 75) return '#3B82F6'; // blue
  if (value >= 60) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
