# Skill: Workspace Kit Development & Text Processing Engine

## Overview
Operational specification and code execution rules for Workspace Kit—a Next.js 13+ App Router utility suite designed for plain-text cleaning, PDF management, due date calculations, and realtime workspace state persistence.

## System Context & Inputs
<context>
- Framework: Next.js (App Router), React, Tailwind CSS
- Persistence: Browser localStorage, sessionStorage, Supabase activity logging
- Target Environment: Gemini Code Assist / Agentic IDEs
- Core Files:
  - `lib/textUtils.js`: Core regex filters, text sanitization, and layout-preserving algorithms.
  - `components/LineDeleter.js`: Plain-text paste interceptor, cursor position tracker, and space remover.
  - `components/DueDateCalculator.js`: Schedule generator supporting `DD/MM/YYYY` typing, flexible date parsing, auto-selection, and a single popover calendar.
  - `components/ActiveHeartbeat.js`: User presence background heartbeat mechanism.
  - `app/page.js`: Two-column drag-and-drop workspace layout manager.
</context>

## Operational Rules & Execution Logic

### 1. Text Cleaner & Paste Sanitizer (`LineDeleter.js` & `textUtils.js`)
* **Preserve Layout Integrity:** Never rearrange line breaks (`\n`), indents, or blank lines upon standard paste. Intercept pasted content via `e.clipboardData.getData('text/plain')`.
* **Strip Image & Glyph Artifacts:** Execute multi-stage regex cleaning inside `cleanPastedText()`:
    * **Outlook PUA Glyphs:** Wipe `\uE000-\uF8FF` (e.g., `` placeholders).
    * **Star Glyphs:** Wipe `[★☆⭐🌟✨✪✩✰⭒\u2600-\u26FF\u2700-\u27BF]+`.
    * **AI & Alt Captions:** Strip lines matching `AI-generated content may be incorrect` and image alt descriptions matching `/(A|An|The)?\s*[\w\s,-]*(logo|graphic|icon|banner|image|picture)\b\.?/gi`.
* **Prevent Selection Index Mismatch:** Derive paste replacement selection range using `e.target.value` directly from the DOM rather than React state to eliminate Windows `\r\n` character offset glitches during `Ctrl + A` overwrites.

### 2. Due Date Calculator (`DueDateCalculator.js`)
* **Date Standard:** Enforce `DD/MM/YYYY` display and input parsing across all calculations and schedule lineups.
* **Segment Typing & Auto-Select:** Allow manual typing of individual day, month, or year segments. Attach `onFocus={(e) => e.target.select()}` to automatically highlight input text on field entry.
* **Single Calendar Picker:** Maintain exactly one interactive popover calendar toggle (`📅`). Sync `viewYear` and `viewMonth` state dynamically with valid `baseDate` changes.
* **Paste Parser (`parseDmyOrFlexible`):** Convert pasted string formats (`DD/MM/YYYY`, `YYYY-MM-DD`, `25 Aug 2026`) into standard `DD/MM/YYYY` strings automatically.
* **Prevent Page Highlighting:** Apply `select-none` to outer component wrappers to prevent `Ctrl + A` hotkeys from highlighting surrounding web app UI elements.

### 3. Workspace Layout & Drag-and-Drop (`app/page.js`)
* **Two-Column Grid:** Organize workspace into `left` and `right` drop zones (`lg:col-span-6` each).
* **Tool Reordering:** Support dragging between columns for `tools` (Main Tools), `calculator` (Basic Calculator), and `notepad` (Quick Note).
* **Layout Persistence:** Save two-column state mapping to `localStorage` under key `workspace_columns_layout`. Provide a `🔄 Reset Layout` action to clear saved layouts and restore defaults.

### 4. Realtime Presence Tracking (`ActiveHeartbeat.js`)
* **Pulse Frequency:** Issue a `GET` ping to `/api/heartbeat` every 15 seconds.
* **Tab Focus Re-Ping:** Bind event listeners to `visibilitychange` and `focus` to immediately register user presence when switching back to the workspace tab.

## Constraint Checklist

<rules>
- [ ] DO NOT reformat or trim paragraph line breaks during clipboard paste unless the user explicitly clicks "Remove Blank Lines".
- [ ] DO NOT duplicate native or popover calendar elements within DueDateCalculator.
- [ ] DO NOT store unparsed raw Outlook Private Use Area (PUA) characters in Supabase activity logs.
- [ ] ALWAYS use `e.target.value` when computing start/end offsets in custom paste event handlers.
</rules>