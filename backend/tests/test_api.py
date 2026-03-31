"""
Backend API Tests for SA-MP Admin Panel
Tests all API endpoints including:
- Health check
- Server status and control
- Admins CRUD
- Territories, Rankings, Stats, Logs
- File browser
- Download endpoints
"""

import pytest
import requests
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_check(self):
        """Test /api/health returns ok status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")


class TestServerStatusEndpoints:
    """Server status and control endpoint tests"""
    
    def test_server_status_post(self):
        """Test /api/server/status POST endpoint"""
        payload = {
            "host": "127.0.0.1",
            "port": 7777,
            "rcon_password": "changeme123"
        }
        response = requests.post(f"{BASE_URL}/api/server/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Server may be offline, but endpoint should work
        assert "online" in data
        print(f"✓ Server status: online={data.get('online')}")
    
    def test_server_control_status(self):
        """Test /api/server/control POST with action: status"""
        payload = {"action": "status"}
        response = requests.post(f"{BASE_URL}/api/server/control", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "running" in data or "status" in data
        print(f"✓ Server control status: {data}")
    
    def test_server_control_invalid_action(self):
        """Test /api/server/control with invalid action"""
        payload = {"action": "invalid_action"}
        response = requests.post(f"{BASE_URL}/api/server/control", json=payload)
        # Should return 400 or 500 for invalid action
        assert response.status_code in [400, 500]
        print(f"✓ Invalid action correctly rejected: {response.status_code}")
    
    def test_server_logs(self):
        """Test /api/server/logs GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/server/logs")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        print(f"✓ Server logs endpoint works")


class TestAdminsEndpoints:
    """Admins CRUD endpoint tests"""
    
    def test_get_admins(self):
        """Test /api/admins GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/admins")
        assert response.status_code == 200
        data = response.json()
        assert "admins" in data
        assert isinstance(data["admins"], list)
        print(f"✓ Get admins: {len(data['admins'])} admins found")
    
    def test_add_admin(self):
        """Test /api/admins POST endpoint"""
        payload = {
            "name": "TEST_Admin_User",
            "level": 3
        }
        response = requests.post(f"{BASE_URL}/api/admins", json=payload)
        # May return 200 or 400 if admin already exists
        assert response.status_code in [200, 400]
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == True
            print(f"✓ Admin added successfully")
        else:
            print(f"✓ Admin already exists (expected): {data}")
    
    def test_add_admin_invalid_level(self):
        """Test /api/admins POST with invalid level"""
        payload = {
            "name": "TEST_Invalid_Admin",
            "level": 10  # Invalid level (should be 1-5)
        }
        response = requests.post(f"{BASE_URL}/api/admins", json=payload)
        # Should return 422 for validation error
        assert response.status_code == 422
        print(f"✓ Invalid admin level correctly rejected")
    
    def test_delete_admin(self):
        """Test /api/admins/{name} DELETE endpoint"""
        # First add an admin to delete
        payload = {"name": "TEST_Delete_Admin", "level": 1}
        requests.post(f"{BASE_URL}/api/admins", json=payload)
        
        # Now delete
        response = requests.delete(f"{BASE_URL}/api/admins/TEST_Delete_Admin")
        assert response.status_code in [200, 404]
        print(f"✓ Delete admin endpoint works: {response.status_code}")


class TestTerritoriesEndpoint:
    """Territories endpoint tests"""
    
    def test_get_territories(self):
        """Test /api/territories GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/territories")
        assert response.status_code == 200
        data = response.json()
        assert "territories" in data
        assert isinstance(data["territories"], list)
        print(f"✓ Get territories: {len(data['territories'])} territories found")


class TestRankingsEndpoint:
    """Rankings endpoint tests"""
    
    def test_get_rankings(self):
        """Test /api/rankings GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/rankings")
        assert response.status_code == 200
        data = response.json()
        assert "rankings" in data
        assert isinstance(data["rankings"], list)
        print(f"✓ Get rankings: {len(data['rankings'])} rankings found")


class TestStatsEndpoint:
    """Stats endpoint tests"""
    
    def test_get_stats(self):
        """Test /api/stats GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_admins" in data
        assert "total_logs" in data
        assert "total_rankings" in data
        print(f"✓ Get stats: admins={data['total_admins']}, logs={data['total_logs']}")


class TestLogsEndpoint:
    """Activity logs endpoint tests"""
    
    def test_get_logs(self):
        """Test /api/logs GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/logs")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert isinstance(data["logs"], list)
        print(f"✓ Get logs: {len(data['logs'])} logs found")


class TestServerConfigEndpoints:
    """Server config endpoint tests"""
    
    def test_get_server_config(self):
        """Test /api/server/config GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/server/config")
        assert response.status_code == 200
        data = response.json()
        assert "host" in data
        assert "port" in data
        print(f"✓ Get server config: {data}")
    
    def test_save_server_config(self):
        """Test /api/server/config POST endpoint"""
        payload = {
            "host": "127.0.0.1",
            "port": 7777,
            "rcon_password": "test_password"
        }
        response = requests.post(f"{BASE_URL}/api/server/config", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Save server config: {data}")


class TestFileBrowserEndpoints:
    """File browser endpoint tests"""
    
    def test_browse_files(self):
        """Test /api/files/browse POST endpoint"""
        payload = {"path": ""}
        response = requests.post(f"{BASE_URL}/api/files/browse", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "directories" in data
        assert "current_path" in data
        print(f"✓ Browse files: {len(data['files'])} files, {len(data['directories'])} dirs")
    
    def test_read_file_not_found(self):
        """Test /api/files/read POST with non-existent file"""
        payload = {"path": "nonexistent_file.txt"}
        response = requests.post(f"{BASE_URL}/api/files/read", json=payload)
        # Should return 404 or 500 for non-existent file
        assert response.status_code in [404, 500]
        print(f"✓ Read non-existent file correctly returns error: {response.status_code}")


class TestDownloadEndpoints:
    """Download endpoint tests"""
    
    def test_download_install_script(self):
        """Test /api/download/install-script GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/download/install-script")
        assert response.status_code == 200
        # Should return text/plain content
        assert "text/plain" in response.headers.get("content-type", "")
        # Should have content-disposition header for download
        assert "attachment" in response.headers.get("content-disposition", "")
        # Content should be a bash script
        content = response.text
        assert "#!/bin/bash" in content
        print(f"✓ Download install script: {len(content)} bytes")
    
    def test_download_full_package(self):
        """Test /api/download/full-package GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/download/full-package", stream=True)
        assert response.status_code == 200
        # Should return gzip content
        content_type = response.headers.get("content-type", "")
        assert "gzip" in content_type or "application/octet-stream" in content_type
        # Should have content-disposition header
        assert "attachment" in response.headers.get("content-disposition", "")
        print(f"✓ Download full package endpoint works")
    
    def test_download_server_package(self):
        """Test /api/download/server-package GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/download/server-package", stream=True)
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "gzip" in content_type or "application/octet-stream" in content_type
        print(f"✓ Download server package endpoint works")
    
    def test_download_admin_package(self):
        """Test /api/download/admin-package GET endpoint"""
        response = requests.get(f"{BASE_URL}/api/download/admin-package", stream=True)
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "gzip" in content_type or "application/octet-stream" in content_type
        print(f"✓ Download admin package endpoint works")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests complete"""
    yield
    # Cleanup test admins
    try:
        requests.delete(f"{BASE_URL}/api/admins/TEST_Admin_User")
        requests.delete(f"{BASE_URL}/api/admins/TEST_Delete_Admin")
        print("✓ Test data cleaned up")
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
