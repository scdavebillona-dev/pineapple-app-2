# PineAI System - Professional Refactor Plan

## Overview
A comprehensive redesign and restructuring plan to transform the PineAI System into a professional-grade pineapple scanning and management application.

---

## 1. Branding & Theme Consistency

### App Configuration Updates
- **App Name**: "PineAI System"
- **Splash Screen**: Custom branded splash with PineAI logo, orange theme (#EA580C)
- **App Icons**: Updated with PineAI branding

### Theme Enhancement (`constants/theme.ts`)
```typescript
export const Theme = {
  colors: {
    primary: '#EA580C',
    primaryDark: '#C2410C',
    primaryLight: '#FB923C',
    secondary: '#0D9488',
    accent: '#FBBF24',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceElevated: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    lg: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  },
};
```

---

## 2. Splash/Loading Screen

### New Loading Screen Component
**File**: `components/splash-screen.tsx`

**Features**:
- PineAI Logo (pineapple icon + "PineAI System" text)
- Animated fade-in/pulse effect
- Orange gradient background matching theme
- Smooth transition to app content
- Loading progress indicator (optional)

**Design**:
```
┌────────────────────────────┐
│                            │
│                            │
│       🍍 [Logo]            │
│       PineAI               │
│       SYSTEM               │
│                            │
│       ○ ○ ○ (loading)      │
│                            │
└────────────────────────────┘
```

---

## 3. Login Page Redesign

### Professional Login Screen
**File**: `app/(auth)/login.tsx`

**Improvements**:
1. **Header Section**:
   - Logo beside "PineAI" text
   - Tagline: "Intelligent Pineapple Classification"
   
2. **Input Fields**:
   - Floating labels with focus animation
   - Focus state with elevated border glow
   - Icon animations on focus
   - Input validation visual feedback
   
3. **Buttons**:
   - Gradient primary button
   - Subtle hover/press states
   - Loading spinner integration
   
4. **Additional Features**:
   - "Remember me" checkbox
   - Forgot password link
   - Social login placeholders (for future)
   - Animated background elements

**Wireframe**:
```
┌────────────────────────────┐
│                            │
│    🍍 PineAI System        │
│    Intelligent Pineapple   │
│    Classification          │
│                            │
│  ┌──────────────────────┐  │
│  │ 👤 Username          │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 🔒 Password      👁  │  │
│  └──────────────────────┘  │
│                            │
│  ☐ Remember me   Forgot?   │
│                            │
│  ┌──────────────────────┐  │
│  │      Sign In         │  │
│  └──────────────────────┘  │
│                            │
│  Don't have an account?    │
│  Sign Up                   │
│                            │
└────────────────────────────┘
```

---

## 4. Dashboard Redesign

### Professional Dashboard
**File**: `app/(app)/home.tsx`

**Layout Sections**:

1. **Welcome Header**:
   - User greeting with time-based message
   - User avatar
   - Quick action button

2. **Statistics Cards Row**:
   - Total Scans (animated counter)
   - Queen variety count
   - Smooth Cayenne count
   - Average confidence %

3. **Quick Actions Grid**:
   - Large "New Scan" button (prominent)
   - "View Storage" button
   - "Analytics" button
   - "Settings" button

4. **Recent Activity Feed**:
   - Last 5 scans with thumbnails
   - Timestamp, variety, confidence
   - Subtle animations on load

5. **Insights Card** (new):
   - Weekly scan summary
   - Quality distribution chart
   - Tips for better scanning

**Wireframe**:
```
┌─────────────────────────────────┐
│  Good Morning, John! 👋         │
│  Ready to classify pineapples?  │
├─────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐        │
│ │ Total   │ │ Queen   │        │
│ │ 156     │ │ 89      │        │
│ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐        │
│ │ Smooth  │ │ Avg     │        │
│ │ 67      │ │ 94.2%   │        │
│ └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │      📷 New Scan          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │ Storage   │ │ Analytics │   │
│  └───────────┘ └───────────┘   │
├─────────────────────────────────┤
│  Recent Activity                │
│  ──────────────────────────────│
│  [img] Queen • 98% • 2 min ago │
│  [img] Smooth • 95% • 5 min ago│
│  [img] Queen • 91% • 1 hr ago  │
└─────────────────────────────────┘
```

---

## 5. Storage Section (Replacing Database)

### New Storage Screen
**File**: `app/(app)/storage.tsx`

**Features**:

1. **Header with Stats**:
   - Total items count
   - Storage used indicator
   - Last sync time

2. **Search & Filter Bar**:
   - Search by variety, date, quality
   - Filter chips: All | Queen | Smooth Cayenne
   - Sort options: Recent | Oldest | Confidence
   
3. **Item List Grid/List View**:
   - Toggle between grid and list
   - Each item shows:
     - Thumbnail image
     - Variety name
     - Confidence badge
     - Quality grade
     - Timestamp
   - Swipe to delete
   - Tap to view details

4. **Item Detail Modal**:
   - Full image view
   - All scan metadata
   - Export/Share options
   - Delete confirmation

5. **Bulk Actions**:
   - Select multiple items
   - Export selected
   - Delete selected

**Wireframe**:
```
┌─────────────────────────────────┐
│  Storage               148 items│
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ 🔍 Search scans...        │  │
│  └───────────────────────────┘  │
│                                 │
│  [All] [Queen] [Smooth Cayenne] │
│                                 │
│  Sort: Recent ▼     ☰ ⫘        │
├─────────────────────────────────┤
│  ┌──────┬──────────────────┐   │
│  │ 📷   │ Queen            │   │
│  │      │ 98.2% • Premium  │   │
│  │      │ Mar 6, 2:30 PM   │   │
│  └──────┴──────────────────┘   │
│  ┌──────┬──────────────────┐   │
│  │ 📷   │ Smooth Cayenne   │   │
│  │      │ 95.1% • Grade A  │   │
│  │      │ Mar 6, 11:15 AM  │   │
│  └──────┴──────────────────┘   │
│  ...                            │
└─────────────────────────────────┘
```

---

## 6. Camera Screen Refactor

### Remove Real-Time Scanning
**Changes**:
- Remove `realtime` mode completely
- Keep only: Capture and Upload modes
- Simplify UI with two clear options

### Simplified Camera Flow
1. **Landing State**: Two large buttons
   - "Take Photo" - Opens camera
   - "Upload Image" - Opens gallery

2. **Preview State**:
   - Show captured/selected image
   - "Analyze" button
   - "Retake/Reselect" button

3. **Results State**:
   - Analysis results overlay
   - Save to storage button
   - New scan button

---

## 7. New Components Library

### UI Components (`components/ui/`)

```
components/
├── ui/
│   ├── button.tsx          # Primary, Secondary, Ghost, Outline variants
│   ├── card.tsx            # Elevated card with shadow
│   ├── input.tsx           # Input with floating label & focus states
│   ├── badge.tsx           # Status badges (confidence, quality)
│   ├── avatar.tsx          # User avatar component
│   ├── search-bar.tsx      # Search input with filter
│   ├── filter-chips.tsx    # Horizontal scrollable chips
│   ├── stat-card.tsx       # Statistics display card
│   ├── item-card.tsx       # Storage item card
│   ├── empty-state.tsx     # Empty state placeholder
│   ├── loading-skeleton.tsx # Skeleton loading states
│   ├── modal.tsx           # Consistent modal design
│   ├── toast.tsx           # Toast notifications
│   └── progress-bar.tsx    # Progress indicators
```

---

## 8. Optimized Folder Structure

### New Structure
```
pineapple-app-2/
├── app/
│   ├── _layout.tsx                 # Root layout with splash
│   ├── index.tsx                   # Entry point (redirects)
│   ├── (auth)/
│   │   ├── _layout.tsx             # Auth layout
│   │   ├── login.tsx               # Login screen
│   │   ├── signup.tsx              # Signup screen
│   │   └── forgot-password.tsx     # (new) Password recovery
│   └── (app)/
│       ├── _layout.tsx             # App tab layout
│       ├── home.tsx                # Dashboard
│       ├── camera.tsx              # Scanning (simplified)
│       ├── storage.tsx             # Storage (renamed from database)
│       └── profile.tsx             # User profile
│
├── components/
│   ├── ui/                         # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── search-bar.tsx
│   │   ├── filter-chips.tsx
│   │   ├── stat-card.tsx
│   │   ├── item-card.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── modal.tsx
│   │   └── progress-bar.tsx
│   ├── screens/                    # Screen-specific components
│   │   ├── dashboard/
│   │   │   ├── welcome-header.tsx
│   │   │   ├── stats-row.tsx
│   │   │   ├── quick-actions.tsx
│   │   │   └── recent-activity.tsx
│   │   ├── camera/
│   │   │   ├── camera-controls.tsx
│   │   │   ├── result-modal.tsx
│   │   │   └── image-preview.tsx
│   │   └── storage/
│   │       ├── item-list.tsx
│   │       ├── item-detail-modal.tsx
│   │       └── filter-section.tsx
│   ├── splash-screen.tsx           # App splash/loading
│   ├── themed-text.tsx
│   └── themed-view.tsx
│
├── constants/
│   ├── theme.ts                    # Enhanced theme system
│   ├── typography.ts               # Typography definitions
│   └── layout.ts                   # Layout constants
│
├── context/
│   ├── auth-context.tsx
│   └── storage-context.tsx         # (new) Centralized storage state
│
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-theme.ts                # Enhanced theme hook
│   ├── use-storage.ts              # (new) Storage operations
│   ├── use-scan-history.ts         # (new) Scan history management
│   └── use-animation.ts            # (new) Common animations
│
├── lib/
│   ├── storage.ts                  # AsyncStorage wrapper
│   ├── image-cache.ts              # (new) Image caching utilities
│   └── analytics.ts                # (new) Analytics helpers
│
├── services/
│   ├── ml-inference.ts             # ML model service
│   └── storage-service.ts          # (new) Storage operations
│
├── types/
│   ├── index.ts                    # Shared TypeScript types
│   ├── scan.ts                     # Scan-related types
│   └── user.ts                     # User-related types
│
├── utils/
│   ├── format.ts                   # Date, number formatting
│   ├── validation.ts               # Input validation
│   └── helpers.ts                  # General helpers
│
└── assets/
    ├── images/
    │   ├── logo.png                # PineAI logo
    │   ├── pineapple-icon.png      # App icon
    │   └── splash-icon.png         # Splash screen
    ├── fonts/
    └── model/
```

---

## 9. Additional Features

### New Capabilities

1. **Analytics Screen** (optional future)
   - Weekly/monthly scan charts
   - Quality distribution pie chart
   - Export reports as PDF

2. **Scan History Management**
   - Group by date
   - Batch delete
   - Export to CSV

3. **User Preferences**
   - Default camera mode
   - Image quality settings
   - Notification preferences

4. **Offline Support**
   - Cache all scans locally
   - Sync indicator
   - Background sync when online

5. **Accessibility**
   - Focus indicators on all interactive elements
   - Screen reader support
   - High contrast mode option

6. **Performance**
   - Image lazy loading
   - List virtualization (FlashList)
   - Skeleton loading states

---

## 10. Implementation Priority

### Phase 1: Foundation (Week 1)
1. [ ] Update theme system with extended colors and spacing
2. [ ] Create splash screen component
3. [ ] Build reusable UI component library
4. [ ] Restructure folder organization

### Phase 2: Authentication (Week 1-2)
1. [ ] Redesign login screen with logo
2. [ ] Add focus states and animations
3. [ ] Update signup screen to match
4. [ ] Add "Remember me" functionality

### Phase 3: Dashboard (Week 2)
1. [ ] Build dashboard components (welcome, stats, quick actions)
2. [ ] Implement recent activity feed
3. [ ] Add animated counters
4. [ ] Create insights card

### Phase 4: Storage (Week 2-3)
1. [ ] Rename database to storage
2. [ ] Build storage list with images
3. [ ] Implement search and filter
4. [ ] Add item detail modal
5. [ ] Implement swipe-to-delete

### Phase 5: Camera (Week 3)
1. [ ] Remove real-time scanning mode
2. [ ] Simplify to capture/upload flow
3. [ ] Update result modal design
4. [ ] Improve image preview

### Phase 6: Polish (Week 3-4)
1. [ ] Add loading skeletons throughout
2. [ ] Implement toast notifications
3. [ ] Add haptic feedback
4. [ ] Performance optimization
5. [ ] Accessibility improvements

---

## 11. Design System Guidelines

### Color Usage
- **Primary (Orange)**: CTAs, active states, branding
- **Secondary (Teal)**: Secondary actions, tags
- **Success (Green)**: High confidence, positive states
- **Warning (Amber)**: Medium confidence, alerts
- **Error (Red)**: Low confidence, errors

### Typography Hierarchy
- **H1**: Screen titles (32px, bold)
- **H2**: Section headers (24px, bold)
- **H3**: Card titles (20px, semibold)
- **Body**: Main content (16px, regular)
- **Caption**: Meta info, labels (12px, medium)

### Spacing Scale
- **4px**: Tight grouping
- **8px**: Related elements
- **16px**: Standard padding
- **24px**: Section separation
- **32px**: Major sections

### Shadow Levels
- **sm**: Subtle cards, inputs
- **md**: Elevated cards, modals
- **lg**: Floating elements, dropdowns

### Focus States
- All interactive elements show focus ring
- Orange border glow (2px) on focus
- Animated transitions (200ms ease)

---

## Summary

This refactor transforms PineAI System into a professional, polished application with:

✅ Consistent branding and theme  
✅ Professional login experience  
✅ Intuitive dashboard with insights  
✅ Full-featured storage management  
✅ Simplified scanning workflow  
✅ Clean, organized codebase  
✅ Reusable component library  
✅ Enhanced user experience  

The implementation follows mobile best practices and creates a foundation for future feature expansion.
