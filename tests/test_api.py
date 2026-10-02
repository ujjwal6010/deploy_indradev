from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_read_cycles():
    response = client.get("/api/cycles")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_read_forecast():
    response = client.get("/api/forecast/24?scale_km=50")
    assert response.status_code == 200
    data = response.json()
    assert "forecast_hour" in data
    assert "events" in data
    assert "tracks" in data
    assert "scenarios" in data

def test_read_scenarios():
    response = client.get("/api/scenarios?scale_km=50")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_scale_analysis():
    response = client.get("/api/scale-analysis")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "forecast_hour" in data[0]
        assert "scale_km" in data[0]
