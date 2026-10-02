"""
__init__.py for scientific engine.
Exposes the main pipeline components.
"""
from .precipitation import build_rolling_24h_from_arrays
from .event_detection import detect_events, compute_threshold
from .tracking import MemberTracker
from .association import associate_cross_member
from .scenario_detection import detect_scenarios
from .persistence import compute_persistence
from .scale_analysis import run_multiscale_analysis, build_robustness_matrix
from .atmospheric import sample_atmospheric_state

__all__ = [
    "build_rolling_24h_from_arrays",
    "detect_events",
    "compute_threshold",
    "MemberTracker",
    "associate_cross_member",
    "detect_scenarios",
    "compute_persistence",
    "run_multiscale_analysis",
    "build_robustness_matrix",
    "sample_atmospheric_state",
]
