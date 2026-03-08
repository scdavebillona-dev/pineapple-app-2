/**
 * PineAI System - Shared TypeScript Types
 */

// Scan-related types
export interface ScanResult {
  id: string;
  timestamp: string;
  label: string;
  confidence: number;
  quality?: string;
  qualityConfidence?: number;
  maturity?: string;
  maturityConfidence?: number;
  image?: string;
  notes?: string;
}

export interface ScanRecord extends ScanResult {
  userId?: string;
}

// User-related types
export interface User {
  id?: string;
  username: string;
  email: string;
  createdAt?: string;
  avatar?: string;
}

export interface StoredUser extends User {
  password: string;
}

// Statistics types
export interface ScanStats {
  total: number;
  queen: number;
  smoothCayenne: number;
  avgConfidence: number;
  todayCount?: number;
  weeklyCount?: number;
}

// Filter types
export type SortOption = 'recent' | 'oldest' | 'confidence-high' | 'confidence-low';
export type FilterVariety = 'all' | 'Queen' | 'Smooth' | 'Smooth Cayenne';
export type ViewMode = 'list' | 'grid';

export interface StorageFilters {
  search: string;
  variety: FilterVariety;
  sort: SortOption;
  viewMode: ViewMode;
}

// Camera types
export type CameraMode = 'capture' | 'upload';

export interface CameraState {
  mode: CameraMode;
  isProcessing: boolean;
  capturedImage: string | null;
  result: ScanResult | null;
}

// UI types
export interface TabIconProps {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Navigation types
export type RootStackParamList = {
  '(auth)': undefined;
  '(app)': undefined;
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  'forgot-password': undefined;
};

export type AppTabParamList = {
  home: undefined;
  camera: undefined;
  storage: undefined;
  profile: undefined;
};
