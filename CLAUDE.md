# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `npm run dev` - Starts Vite dev server on port 3000 with host 0.0.0.0
- **Build**: `npm run build` - Creates production build
- **Preview**: `npm run preview` - Preview production build locally

## Architecture Overview

**Data Storage**: All application data is persisted in localStorage under key `starachiever_data_v6`. The app supports data migration from earlier versions (v4, v5).

**Multi-Child Architecture**: Each child has isolated data including tasks, rewards, badges, categories, history, and statistics. The active child is tracked via `activeChildId`.

**Component Structure**:
- `Layout.tsx` - Main app shell with navigation tabs
- `TaskCard.tsx` - Individual task display with completion toggle
- `RewardCard.tsx` - Reward redemption interface
- `ProfileTab.tsx` - Child's stats and achievements view
- `CalendarTab.tsx` - Daily completion history visualization
- `ParentMode.tsx` - Password-protected admin panel
- `GeminiBuddy.tsx` - AI-powered encouragement and activity suggestions
- `Modal.tsx` - Confirmation and alert dialogs

**Service Layer**:
- `services/geminiService.ts` - Google Gemini AI integration using `@google/genai`

## Type System

All types defined in `types.ts`. Key types:
- `ChildProfile` - Complete data structure for a child
- `Task`, `Reward`, `Badge` - Core entities
- `Category` - Custom task categories (v6 feature)
- `BadgeCriteria` - Serializable achievement conditions
- `DailyTaskCompletion` - Detailed daily history with timestamps
- `PointRedemption` - Reward redemption records

## Constants and Initial Data

- `constants.ts` - Contains `INITIAL_TASKS`, `INITIAL_REWARDS`, `INITIAL_BADGES`, and `createDefaultChild()` factory
- `constants/categories.ts` - Category system including 12 color schemes, 30 emoji icons, and 4 default categories (学习/健康/家务/其他)

## Key Implementation Details

**Daily Task Reset**: When a child opens the app on a new day (tracked via `lastLoginDate`), tasks are automatically reset to `completed: false`. Streak calculation occurs during this transition.

**Category System** (v6): Tasks can be organized into custom categories. Each category has an id, name, icon, color scheme, and archive status. Default categories are created for new children.

**Badge Criteria**: Achievement unlocking uses serializable criteria objects:
- `TOTAL_TASKS` - Cumulative tasks completed
- `TOTAL_POINTS` - Cumulative points earned
- `STREAK` - Consecutive days
- `CATEGORY_COUNT` - Tasks in specific category

**Data Export**: Two formats available via Parent Mode:
- Excel export (via `components/exportToExcel.ts`) - Daily completion records, redemption history, cumulative stats
- JSON export - Complete data backup

## Important Notes

- All UI text is in Simplified Chinese
- Tailwind CSS is loaded via CDN (not build step)
- The app uses React 19.2.4 with TypeScript
- Icons from `lucide-react` and emojis for tasks/categories
- When adding new features, ensure localStorage migration logic is updated if schema changes
