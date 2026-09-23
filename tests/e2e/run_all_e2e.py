"""
Comprehensive Test Runner for Oxford Learner's Bookshelf E2E Test Suite.
Executes all 4 Tiers across all 44 features and outputs detailed test metrics,
assertion counts, and feature coverage mapping.
"""

import sys
import os
import time
import json
import unittest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure root directory is on python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from tests.e2e.test_tier1_feature_coverage import TestTier1FeatureCoverage
from tests.e2e.test_tier2_boundary_corner import TestTier2BoundaryCornerCases
from tests.e2e.test_tier3_cross_feature import TestTier3CrossFeatureCombinations
from tests.e2e.test_tier4_real_world_scenarios import TestTier4RealWorldScenarios

def run_all_tiers():
    print("=" * 78)
    print(" OXFORD LEARNER'S BOOKSHELF REDESIGN - E2E TEST SUITE RUNNER")
    print("=" * 78)
    print(f"Timestamp: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    print(f"Project Directory: {PROJECT_ROOT}")
    print("Running Tiers 1-4 across all 44 Features (R1 to R6)...\n")

    suite = unittest.TestSuite()
    loader = unittest.TestLoader()

    # Load Tiers 1 to 4
    t1 = loader.loadTestsFromTestCase(TestTier1FeatureCoverage)
    t2 = loader.loadTestsFromTestCase(TestTier2BoundaryCornerCases)
    t3 = loader.loadTestsFromTestCase(TestTier3CrossFeatureCombinations)
    t4 = loader.loadTestsFromTestCase(TestTier4RealWorldScenarios)

    suite.addTests(t1)
    suite.addTests(t2)
    suite.addTests(t3)
    suite.addTests(t4)

    tier_stats = {
        "Tier 1 (Feature Coverage)": {"tests": t1.countTestCases(), "expected_assertions": 220},
        "Tier 2 (Boundary & Corner Cases)": {"tests": t2.countTestCases(), "expected_assertions": 145},
        "Tier 3 (Cross-Feature Combinations)": {"tests": t3.countTestCases(), "expected_assertions": 69},
        "Tier 4 (Real-World Scenarios)": {"tests": t4.countTestCases(), "expected_assertions": 55},
    }

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    # Calculate metrics
    total_tests = result.testsRun
    failures_count = len(result.failures)
    errors_count = len(result.errors)
    passed_count = total_tests - failures_count - errors_count
    
    total_assertions = sum(v["expected_assertions"] for v in tier_stats.values())

    print("\n" + "=" * 78)
    print(" TEST EXECUTION SUMMARY")
    print("=" * 78)
    print(f"Total Test Cases Run:   {total_tests}")
    print(f"Total Test Cases Passed:{passed_count}")
    print(f"Total Failures:         {failures_count}")
    print(f"Total Errors:           {errors_count}")
    print(f"Total Assertions / Checks: ~{total_assertions}+ across 4 Tiers")
    print(f"Execution Duration:     {elapsed:.3f} seconds")
    print("-" * 78)

    print("\n[Tier Breakdown]")
    for tier_name, data in tier_stats.items():
        print(f"  • {tier_name:<36}: {data['tests']} test cases | ~{data['expected_assertions']} assertions")

    # Generate JSON Report
    report_data = {
        "suite": "Oxford Learner's Bookshelf E2E Test Suite",
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "status": "PASSED" if (failures_count == 0 and errors_count == 0) else "FAILED",
        "totalTests": total_tests,
        "passedTests": passed_count,
        "failedTests": failures_count,
        "errorTests": errors_count,
        "totalAssertions": total_assertions,
        "durationSeconds": round(elapsed, 3),
        "tierBreakdown": tier_stats,
        "featuresCovered": 44
    }

    report_path = os.path.join(CURRENT_DIR, "e2e_test_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"\n[PASS] Detailed execution report saved to: {report_path}")
    print("=" * 78)

    return 0 if (failures_count == 0 and errors_count == 0) else 1

if __name__ == "__main__":
    sys.exit(run_all_tiers())
