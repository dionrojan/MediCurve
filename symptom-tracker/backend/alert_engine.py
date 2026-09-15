from typing import List, Optional

try:
    from .models import CheckIn, Alert, SeverityLevel
    from .baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
        get_baseline_for_day,
    )
except (ImportError, ValueError):
    from models import CheckIn, Alert, SeverityLevel
    from baseline import (
        BASELINE_TRAJECTORY,
        EXPECTED_SIDE_EFFECTS,
        CRITICAL_CHECKPOINT_DAY,
        get_baseline_for_day,
    )


def evaluate_side_effects(checkin: CheckIn) -> List[Alert]:
    """
    Checks for unexpected medication side effects and adverse allergic reactions.
    - Rash: CRITICAL (potential allergic reaction / hypersensitivity)
    - Gastrointestinal (diarrhea / nausea): WARNING (tolerability issue)
    """
    alerts: List[Alert] = []
    side_effects = checkin.side_effects

    if side_effects.rash:
        alerts.append(
            Alert(
                severity="CRITICAL",
                category="ADVERSE_REACTION",
                message=(
                    "Allergic reaction warning: Rash/hives reported. "
                    "Potential hypersensitivity reaction. Immediate clinical review required."
                ),
            )
        )

    if side_effects.diarrhea:
        alerts.append(
            Alert(
                severity="WARNING",
                category="SIDE_EFFECT",
                message=(
                    "Gastrointestinal side effect: Diarrhea reported. "
                    "Monitor hydration and stool frequency. Assess tolerance if worsening."
                ),
            )
        )

    if side_effects.nausea:
        alerts.append(
            Alert(
                severity="WARNING",
                category="SIDE_EFFECT",
                message=(
                    "Medication side effect: Nausea reported. "
                    "Advise patient to take medication with meals if clinically appropriate."
                ),
            )
        )

    return alerts


def evaluate_checkpoint(checkin: CheckIn, history: Optional[List[CheckIn]] = None) -> List[Alert]:
    """
    Evaluates the treatment at CRITICAL_CHECKPOINT_DAY (Day 5) and Course Completion (Day 9+).
    Differentiates between true treatment failure (adherent but unresponsive) and
    non-adherence (unresponsive due to missed doses).
    """
    alerts: List[Alert] = []

    # 1. Day 5+ Efficacy Checkpoint
    if checkin.day >= CRITICAL_CHECKPOINT_DAY:
        symptoms = checkin.symptoms
        has_high_pain = symptoms.facial_pain >= 3
        has_high_congestion = symptoms.congestion >= 3
        has_fever = symptoms.fever

        is_stagnant = (has_high_pain and has_high_congestion) or (has_fever and symptoms.facial_pain >= 2)

        if is_stagnant:
            if checkin.adherence:
                # Patient took medication reliably, but didn't improve -> Antibiotic Resistance / Treatment Ineffective
                alerts.append(
                    Alert(
                        severity="CRITICAL",
                        category="TREATMENT_INEFFECTIVE",
                        message=(
                            f"Day {checkin.day} checkpoint reached with insufficient clinical improvement "
                            f"(Facial Pain: {symptoms.facial_pain}/5, Congestion: {symptoms.congestion}/5, "
                            f"Fever: {'Present' if symptoms.fever else 'Resolved'}). "
                            "Patient reported taking doses as prescribed. High suspicion of antibiotic resistance "
                            "or resistant pathogen. Consider switching to second-line therapy."
                        ),
                    )
                )
            else:
                # Patient missed doses -> Non-adherence risk
                alerts.append(
                    Alert(
                        severity="WARNING",
                        category="NON_ADHERENCE_RISK",
                        message=(
                            f"Day {checkin.day} symptoms remain elevated, but patient reports missed doses. "
                            "Lack of improvement is likely due to medication non-compliance rather than true drug failure. "
                            "Re-educate on strict adherence before making antibiotic changes."
                        ),
                    )
                )

    # 2. Day 9 Course Completion Adherence Check
    if checkin.day >= 9 and not checkin.adherence:
        alerts.append(
            Alert(
                severity="WARNING",
                category="INCOMPLETE_COURSE",
                message=(
                    "Incomplete antibiotic course reported on Day 9. Discontinuing antibiotics prematurely "
                    "significantly increases risk of bacterial recurrence and antimicrobial resistance. "
                    "Reinforce completing all 10 prescribed days."
                ),
            )
        )

    return alerts


def evaluate_baseline_deviations(checkin: CheckIn) -> List[Alert]:
    """
    Compares current check-in metrics against the expected baseline for this treatment day.
    Surfaces worsening symptoms or delayed resolution.
    """
    alerts: List[Alert] = []
    expected = get_baseline_for_day(checkin.day)
    symptoms = checkin.symptoms

    # Fever deviation (e.g. fever present when expected to be cleared)
    if symptoms.fever and not expected.get("fever", False):
        alerts.append(
            Alert(
                severity="WARNING",
                category="SYMPTOM_DEVIATION",
                message=(
                    f"Fever persists or recurred on Day {checkin.day} "
                    "(fever resolution was expected by Day 5 baseline)."
                ),
            )
        )

    # Facial pain deviation: 2 or more points above expected baseline
    pain_delta = symptoms.facial_pain - expected["facial_pain"]
    if pain_delta >= 2:
        alerts.append(
            Alert(
                severity="WARNING",
                category="SYMPTOM_DEVIATION",
                message=(
                    f"Facial pain significantly higher than expected on Day {checkin.day} "
                    f"(Reported: {symptoms.facial_pain}/5 vs Expected: {expected['facial_pain']}/5)."
                ),
            )
        )

    # Congestion deviation: 2 or more points above expected baseline
    congestion_delta = symptoms.congestion - expected["congestion"]
    if congestion_delta >= 2:
        alerts.append(
            Alert(
                severity="WARNING",
                category="SYMPTOM_DEVIATION",
                message=(
                    f"Nasal congestion higher than expected on Day {checkin.day} "
                    f"(Reported: {symptoms.congestion}/5 vs Expected: {expected['congestion']}/5)."
                ),
            )
        )

    # Energy deviation: 2 or more points below expected baseline
    energy_deficit = expected["energy"] - symptoms.energy
    if energy_deficit >= 2:
        alerts.append(
            Alert(
                severity="WARNING",
                category="SYMPTOM_DEVIATION",
                message=(
                    f"Energy level remains depressed on Day {checkin.day} "
                    f"(Reported: {symptoms.energy}/5 vs Expected: {expected['energy']}/5)."
                ),
            )
        )

    return alerts


def evaluate_checkin(checkin: CheckIn, history: Optional[List[CheckIn]] = None) -> List[Alert]:
    """
    Primary entrypoint for signal detection.
    Evaluates:
      1. Medication side effects / adverse reactions
      2. Day 5 critical efficacy checkpoint
      3. Trajectory deviations against expected baseline

    If all indicators are normal, returns a single 'OK' alert confirming on-track recovery.
    """
    alerts: List[Alert] = []

    # 1. Adverse reactions & side effects
    alerts.extend(evaluate_side_effects(checkin))

    # 2. Critical treatment failure / checkpoint check
    alerts.extend(evaluate_checkpoint(checkin, history))

    # 3. Trajectory deviations against baseline
    alerts.extend(evaluate_baseline_deviations(checkin))

    # If no warnings or critical alerts triggered, recovery is on track
    if not alerts:
        alerts.append(
            Alert(
                severity="OK",
                category="ON_TRACK",
                message=f"Day {checkin.day} check-in aligns with expected clinical trajectory.",
            )
        )

    # Sort alerts so highest severity (CRITICAL > WARNING > OK) is first
    severity_order = {"CRITICAL": 0, "WARNING": 1, "OK": 2}
    alerts.sort(key=lambda a: severity_order.get(a.severity, 3))

    return alerts
