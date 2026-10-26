# CogniFlow Motion Design Video Production (35s Master Commercial)

This package contains the complete, production-grade 35-second AI SaaS launch motion design video for **CogniFlow**, built in accordance with the `motion-video-kit` motion grammar, quality bar, and Gauntlet loop standards.

---

## 📁 Project Structure & Deliverables

- **`index.html`**: Master 1920 × 1080 motion design film player with interactive timeline scrubber, scene jump marks, audio/VO toggles, and one-click video exporter.
- **`assets/soundtrack.wav`**: Master 35.0-second 44.1kHz 16-bit stereo PCM soundtrack with 7 distinct emotional musical movements and localized UI sound design.
- **`generate_audio.py`**: Python mathematical audio synthesis script used to generate `soundtrack.wav`.
- **`motion.js`**: Deterministic 1920 × 1080 animation engine and canvas compositor with easing functions, dynamic light trails, and particle physics.
- **`audio-engine.js`**: Web Audio & Web Speech synthesis synchronization engine.
- **`styles.css`**: Pixel-perfect design system stylesheet implementing the CogniFlow brand identity.
- **`export-video.js`**: Client-side video recording engine that captures 1080p canvas frames + mixed audio stream into an `.mp4` or `.webm` video file.
- **`BRIEF.md`**: Formal production brief.
- **`STORYBOARD.md`**: Beat-by-beat storyboard ledger.
- **`GAUNTLET_LEDGER.md`**: Quality verification report against the 15 `motion-video-kit` criteria.
- **`../motion-video-kit.zip`**: Saved copy of the motion video kit.
- **`../.agent/skills/business-motion-film/`**: Installed motion video skill for future projects.

---

## 🎨 Visual Design System

- **Soft Cloud**: `#F7F7FF` (Background)
- **Electric Violet**: `#7357FF` (Brand highlights & primary action buttons)
- **Digital Blue**: `#A9BFFF` (Gradients & neural connection lines)
- **Midnight Ink**: `#171B35` (High-contrast typography)
- **Lavender Mist**: `#E9DFFF` (Glassmorphic AI panels)
- **Flow Green**: `#20C997` (Successful workflow restoration & active sync)

---

## 🎬 35-Second Scene Timeline

1. **Scene 1 (00.0s – 04.0s) — The Overload**:
   - Clean browser interface with tabs (Figma, Slack, Jira, Notion, Gmail).
   - Rapid incoming notification cascade, stacking modals, mounting cognitive overload.
   - On-screen typography: *“Too many tools.”*, *“Too many interruptions.”*
2. **Scene 2 (04.0s – 08.0s) — Lost Context**:
   - Tab switching, document disappears, cursor pauses mid-screen.
   - Optical frost blur (`backdrop-filter: blur(18px)`) washes in.
   - On-screen typography: *“Where was I?”*
3. **Scene 3 (08.0s – 12.0s) — The AI Reveal**:
   - Frozen workspace, 3D glowing violet-and-blue memory symbol emerges.
   - Glowing light trails branch out and connect the 4 scattered project tabs.
   - On-screen typography: *“What if your browser remembered?”*
4. **Scene 4 (12.0s – 18.0s) — Meet CogniFlow**:
   - Polished Chrome extension sidepanel slides in from right.
   - AI Summary card, related workflow tabs (Figma, Jira, Notion, Slack), prominent violet `Resume Workflow` button.
   - On-screen typography: *“Meet CogniFlow”*, *“Your AI workflow memory.”*
5. **Scene 5 (18.0s – 25.0s) — How It Works**:
   - Beat 1: Context linked (*“Remember context.”*).
   - Beat 2: AI Summary checklist expands (*“Summarize progress.”*).
   - Beat 3: User clicks `Resume Workflow`, turns Flow Green (*“Resume where you left off.”*).
6. **Scene 6 (25.0s – 30.0s) — Back in Flow**:
   - Clutter dissolves; clean split-screen workspace restores.
   - Green `● FLOW STATE RESTORED` badge glows; 3% cinematic camera push.
   - On-screen typography: *“Less mental rebuilding.”*, *“More meaningful work.”*
7. **Scene 7 (30.0s – 35.0s) — Brand Ending**:
   - Soft Cloud background with subtle violet gradient.
   - 3D glass CogniFlow logo scales up gently.
   - On-screen typography: *“CogniFlow”*, *“Your work. Remembered.”*, `cogniflow.ai · Add to Chrome`.
   - 2.0s stable hold and crystal logo chime.

---

## 🚀 How to Run & Export

1. Open `index.html` in your browser (Google Chrome or Microsoft Edge recommended).
2. Press **Spacebar** or click **▶ Play Film** to watch the film in real-time with full synchronized audio and voice-over.
3. Use the **Scene Buttons** (`S1` to `S7`) or **Scrubber** to inspect any timestamp frame-by-frame.
4. Click **Export 1080p Video** to automatically record and download `CogniFlow-Launch-Film-1080p.webm` (or `.mp4`).
