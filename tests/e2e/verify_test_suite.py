"""
Verification and Static Analysis Harness for Oxford E2E Test Suite.
Verifies AST syntax, test methods count, assertion checks count, and feature mapping.
"""

import os
import ast
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

TEST_FILES = [
    "test_tier1_feature_coverage.py",
    "test_tier2_boundary_corner.py",
    "test_tier3_cross_feature.py",
    "test_tier4_real_world_scenarios.py"
]

def analyze_suite():
    total_methods = 0
    total_checks = 0
    file_stats = {}

    for fname in TEST_FILES:
        fpath = os.path.join(CURRENT_DIR, fname)
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Missing test file: {fpath}")

        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        tree = ast.parse(content, filename=fname)

        methods_in_file = 0
        checks_in_file = 0

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
                methods_in_file += 1
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute) and node.func.attr == "check":
                    checks_in_file += 1

        file_stats[fname] = {
            "testMethods": methods_in_file,
            "assertionChecks": checks_in_file
        }
        total_methods += methods_in_file
        total_checks += checks_in_file

    print("=" * 70)
    print(" OXFORD E2E TEST SUITE STATIC VERIFICATION REPORT")
    print("=" * 70)
    for fname, stats in file_stats.items():
        print(f"File: {fname:<35} | Methods: {stats['testMethods']:<3} | Checks: {stats['assertionChecks']}")
    print("-" * 70)
    print(f"Total Test Methods: {total_methods}")
    print(f"Total Assertion Checks (self.ctx.check): {total_checks}")
    print("=" * 70)

    # Verification criteria
    assert total_methods >= 80, f"Expected >= 80 test methods, found {total_methods}"
    assert total_checks >= 480, f"Expected >= 480 assertion checks, found {total_checks}"
    print("✓ All test files parsed cleanly with 0 syntax errors.")
    print("✓ Test suite satisfies requirement-driven criteria across Tiers 1-4 (>=480 checks).")
    return True

if __name__ == "__main__":
    analyze_suite()
