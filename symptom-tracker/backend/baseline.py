"""
Expected clinical recovery baseline trajectory over time (Day -> Expected Metrics).
Used to compare reported patient check-ins against expected recovery benchmarks.
"""

BASELINE_TRAJECTORY = {
    1: {"facial_pain": 4, "congestion": 4, "fever": True, "energy": 2},
    3: {"facial_pain": 3, "congestion": 3, "fever": True, "energy": 2},
    5: {"facial_pain": 2, "congestion": 2, "fever": False, "energy": 3},
    7: {"facial_pain": 1, "congestion": 2, "fever": False, "energy": 4},
    9: {"facial_pain": 0, "congestion": 1, "fever": False, "energy": 5},
}

# Side effects that should NOT appear at any point in the course.
# Any True value here is a deviation, regardless of day.
EXPECTED_SIDE_EFFECTS = {
    "rash": False,
    "diarrhea": False,
    "nausea": False,
}

# Day by which meaningful improvement is clinically expected.
# Used by alert_engine to trigger the "treatment not working" check.
CRITICAL_CHECKPOINT_DAY = 5


def get_baseline_for_day(day: int) -> dict:
    """
    Get the baseline metrics for a given treatment day.
    If the exact day is not recorded, returns the nearest previous recorded baseline day.
    """
    if day in BASELINE_TRAJECTORY:
        return BASELINE_TRAJECTORY[day]

    # Find the nearest prior recorded day (or the earliest if day < min_day)
    recorded_days = sorted(BASELINE_TRAJECTORY.keys())
    applicable_day = recorded_days[0]
    for d in recorded_days:
        if d <= day:
            applicable_day = d
        else:
            break
    return BASELINE_TRAJECTORY[applicable_day]
