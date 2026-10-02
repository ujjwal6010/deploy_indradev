import pytest
import numpy as np
from backend.scientific.event_detection import compute_threshold, detect_events, ExtremeEvent
from backend.scientific.scenario_detection import detect_scenarios
from backend.scientific.persistence import compute_persistence, STATUS_PERSISTENT, STATUS_TRANSIENT

def test_compute_threshold():
    # 0 to 99, 95th percentile of non-zero should be ~94.05
    arr1 = np.arange(100).astype(float)
    thresh = compute_threshold([arr1], percentile=95.0)
    assert 93.0 < thresh < 96.0

def test_detect_events():
    # Create a 20x20 grid, put a 4x4 block of extreme rain (16 cells)
    precip = np.zeros((20, 20))
    precip[5:9, 5:9] = 100.0 
    
    lats = np.linspace(20, 10, 20)
    lons = np.linspace(70, 80, 20)
    
    events = detect_events(precip, member="gep01", forecast_hour=24, lats=lats, lons=lons, threshold=90.0, min_area_cells=10)
    
    assert len(events) == 1
    assert events[0].member == "gep01"
    assert events[0].area == 16
    assert events[0].max_intensity == 100.0

def test_scenario_detection():
    # gep01, gep02, gep03 are clustered tightly
    # gep04, gep05 are far away
    positions = {
        "gep01": (20.0, 80.0),
        "gep02": (20.1, 80.1),
        "gep03": (20.2, 80.0),
        "gep04": (25.0, 75.0),
        "gep05": (15.0, 85.0),
    }
    
    scenarios = detect_scenarios(positions, forecast_hour=24, scale_km=150.0)
    # Should group gep01, gep02, gep03 together
    assert len(scenarios) >= 1
    assert sorted(scenarios[0].members) == ["gep01", "gep02", "gep03"]

def test_persistence_logic():
    class MockGroup:
        def __init__(self, fh, members):
            self.forecast_hour = fh
            self.members = members
            self.scale_km = 50.0
            self.scenario_id = "test"
            
    # gep01+gep02 persists for 3 timesteps (T+24, T+30, T+36)
    groups = [
        MockGroup(24, ["gep01", "gep02"]),
        MockGroup(30, ["gep01", "gep02"]),
        MockGroup(36, ["gep01", "gep02"]),
        # A transient one at T+24
        MockGroup(24, ["gep04", "gep05"])
    ]
    
    results = compute_persistence(groups, scale_km=50.0, min_timesteps=1)
    
    persistent_scenario = next(s for s in results if "gep01" in s.members)
    transient_scenario = next(s for s in results if "gep04" in s.members)
    
    assert persistent_scenario.timesteps == 3
    assert persistent_scenario.longest_consecutive == 3
    assert persistent_scenario.status == STATUS_PERSISTENT
    
    assert transient_scenario.timesteps == 1
    assert transient_scenario.status == STATUS_TRANSIENT
