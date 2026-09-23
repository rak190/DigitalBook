# Oxford Learner's Bookshelf Redesign - E2E Test Infrastructure

**Project**: English File 4th Edition Pre-Intermediate Digital Workbook Redesign  
**Document Version**: 1.0.0  
**Status**: 🟢 OPERATIONAL & READY  
**Lead Track**: E2E Testing Track (`teamwork_preview_test_writer_1`)  
**Target Platform**: React 18, Vite 6, TypeScript 5, Tailwind CSS, Playwright, Python `unittest`  

---

## 1. Test Infrastructure Overview

The testing infrastructure establishes a comprehensive, requirement-driven, opaque-box End-to-End (E2E) test harness verifying all 44 features defined in `ORIGINAL_REQUEST.md` and `PROJECT.md` across four rigorous testing tiers.

### Core Testing Principles:
1. **Opaque-Box Verification**: Tests interact strictly through external contracts (DOM selectors, URLs, hash changes, user events, and `localStorage` storage schemas), remaining immune to internal implementation refactoring.
2. **Deterministic Expected Outputs**: Every assertion is derived directly from authoritative coursebook scans (`page_12.jpg`), official answer keys (`data/answer-key.json`), and audio transcripts (`data/audio.json`).
3. **Dual Execution Engine**:
   - **Live Browser Execution**: Connects to the active React/Vite development server (default: `http://localhost:8000` or `http://localhost:5173`) via Playwright in headless Chromium/Edge.
   - **Offline Contract & State Validation**: Self-contained test harness executing DOM contract verification, state machine validation, and coordinate geometry calculations even in isolated offline CI environments.
4. **Non-Destructive Grading Guarantees**: Enforces that checking answers or displaying answer keys never erases student input.

---

## 2. Directory Layout & Test Artifacts

```
DigitalTextbook/
├── tests/
│   └── e2e/
│       ├── __init__.py                      # E2E test package marker
│       ├── conftest.py                      # Shared fixtures, reference data, and TestContext
│       ├── test_tier1_feature_coverage.py   # Tier 1: 44 Features (>=5 checks each = 220 assertions)
│       ├── test_tier2_boundary_corner.py    # Tier 2: 29 Boundary cases (145 assertions)
│       ├── test_tier3_cross_feature.py      # Tier 3: 11 Cross-feature combinations (69 assertions)
│       ├── test_tier4_real_world_scenarios.py # Tier 4: 4 Real-world student/teacher workflows (55 assertions)
│       ├── run_all_e2e.py                   # Master test runner with colorized reporting & JSON metrics
│       ├── verify_test_suite.py             # AST static analysis and assertion counting harness
│       └── e2e_test_report.json             # Structured JSON test run report
├── TEST_INFRA.md                            # This test infrastructure document
└── TEST_READY.md                            # Test readiness publication & feature verification checklist
```

---

## 3. Test Execution Commands

### 3.1 Master Test Runner (All 4 Tiers)
Runs the complete suite across all 44 features and outputs detailed tier summaries and assertion totals:
```powershell
python tests/e2e/run_all_e2e.py
```

### 3.2 Pytest Execution
If `pytest` is installed in the active environment:
```powershell
pytest tests/e2e/ -v --tb=short
```

### 3.3 Individual Tier Execution
Run any tier independently using Python's built-in `unittest` runner:
```powershell
# Tier 1: Feature Coverage (Features 1 to 44)
python -m unittest tests.e2e.test_tier1_feature_coverage -v

# Tier 2: Boundary & Corner Cases
python -m unittest tests.e2e.test_tier2_boundary_corner -v

# Tier 3: Cross-Feature Combinations
python -m unittest tests.e2e.test_tier3_cross_feature -v

# Tier 4: Real-World Student Scenarios
python -m unittest tests.e2e.test_tier4_real_world_scenarios -v
```

### 3.4 Static Verification & Assertion Audit
Validates test suite AST syntax, parses all methods, and confirms that assertion counts meet the target (>= 480 checks):
```powershell
python tests/e2e/verify_test_suite.py
```

---

## 4. 4-Tier Test Architecture & Coverage Breakdown

| Tier | Category | Scope | Test Methods | Total Assertions / Checks |
|------|----------|-------|--------------|---------------------------|
| **Tier 1** | **Feature Coverage** | 100% coverage of all 44 features in PROJECT.md (R1 to R6). >=5 assertions per feature. | 44 | **220** |
| **Tier 2** | **Boundary & Corner Cases** | Edge cases: empty inputs, whitespace, zoom clamps [50%, 250%], non-numeric page jumper, 404 audio TTS fallback, punctuation stripping, compound blanks (4a/4b, 9a/9b), responsive collapse, corrupt JSON recovery, debounce, double-click tolerance. | 29 | **145** |
| **Tier 3** | **Cross-Feature Combinations** | Pairwise interactions: Zoom + Hotspot click, Audio dock + Page jump, Word bank + Blank auto-advance, Check + Edit + Re-check, Check + Show + Reset, Dock <-> Float modal switch, Deep link + Back button, Theme switch + Contrast, Fit-to-Width + Drawer, Fullscreen + Scrubber, Audio speed + Typing. | 11 | **69** |
| **Tier 4** | **Real-World Scenarios** | Complete end-to-end student & teacher workflows on Unit 1C (Page 11): Ex 4 Listening with Track 1.28, Ex 5a Prepositions with Word Bank chips, Two-Page Spread navigation, and Classroom Clean Mode presentation. | 4 | **55** |
| **TOTAL** | **Comprehensive Suite** | **All 44 Features across R1 – R6** | **88** | **489** |

---

## 5. Authoritative Expected Output Oracles

### 5.1 Unit 1C Page 11 Exercise 4 (Vermeer Listening)
- **Track**: `1.28` (or `ef3e_p-int_pe1_1-28.mp3`)
- **Hotspot Location**: `x: 28.0%`, `y: 4.8%`
- **Audio Hotspot Location**: `x: 6.5%`, `y: 36.8%`
- **Question Keys**:
  - Q1: `b` (17th century)
  - Q2: `a` (Holland)
  - Q3: `a` (everyday scenes)
  - Q4: `c` (a pudding)
  - Q5: `b` (34)
  - Q6: `b` (Because some of the paints were very expensive)

### 5.2 Unit 1C Page 11 Exercise 5a (Prepositions of Place)
- **Track**: `1.29`
- **Hotspot Location**: `x: 88.0%`, `y: 4.8%`
- **Audio Hotspot Location**: `x: 54.0%`, `y: 38.0%`
- **Word Bank Chips**: `above`, `behind`, `between`, `in`, `in front of`, `in the corner`, `in the middle of`, `next to`, `on`, `on the left of`, `under`
- **Blank Keys & Accepted Alternates**:
  - Blank 2: `["in front of"]`
  - Blank 3: `["On", "on"]`
  - Blank 4a: `["in the middle of", "in the center of"]`
  - Blank 4b: `["between"]`
  - Blank 5: `["under", "underneath", "beneath"]`
  - Blank 6: `["Behind", "behind"]`
  - Blank 7: `["on the left of", "on the left"]`
  - Blank 8: `["In the corner", "in the corner"]`
  - Blank 9a: `["on"]`
  - Blank 9b: `["above", "over"]`
  - Blank 10: `["next to", "beside"]`

---

## 6. Client Storage Schema Specification

- **Primary Storage Key**: `oxford_activity_progress_v1` in browser `localStorage`.
- **Item Scoping Pattern**: `${unitId}_page${pageId}_${exerciseId}` (e.g. `1C_11_ex4`, `1C_11_ex5a`).
- **Record Schema**:
  ```typescript
  interface ScopedActivityState {
    answers: Record<string, string>;
    score?: number;                  // percentage (0 - 100)
    isCompleted: boolean;            // true if answered/checked
    lastUpdated: number;             // epoch millisecond timestamp
  }
  ```
- **Fallback Behavior**: Corrupt or missing localStorage data automatically defaults to an empty object without crashing the React application.

---

## 7. CI/CD Integration & Automation

The E2E test suite integrates directly into standard CI/CD workflows (such as `.github/workflows/deploy.yml`):
```yaml
- name: Run E2E Test Suite
  run: python tests/e2e/run_all_e2e.py
```
- Exits with returncode `0` on 100% pass.
- Returns code `1` on any failure or unhandled exception.
- Generates `tests/e2e/e2e_test_report.json` with execution metrics for CI dashboards.
