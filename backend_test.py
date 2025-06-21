import requests
import json
import sys
from datetime import datetime

class Web3CertificateRegistryTester:
    def __init__(self, base_url="https://5d94bced-ccea-41b0-9490-ff2c66add888.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_create_status_check(self, client_name):
        """Test creating a status check"""
        return self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": client_name}
        )

    def test_get_status_checks(self):
        """Test getting all status checks"""
        return self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )

def main():
    # Setup
    tester = Web3CertificateRegistryTester()
    test_client = f"test_client_{datetime.now().strftime('%H%M%S')}"
    
    # Run tests
    root_success, root_response = tester.test_root_endpoint()
    if not root_success:
        print("❌ Root endpoint test failed, stopping tests")
        return 1
    
    create_success, create_response = tester.test_create_status_check(test_client)
    if not create_success:
        print("❌ Create status check failed, stopping tests")
        return 1
    
    get_success, get_response = tester.test_get_status_checks()
    if not get_success:
        print("❌ Get status checks failed")
        return 1
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Check if the created status check is in the list
    if get_success and create_success:
        found = False
        for status in get_response:
            if status.get("client_name") == test_client:
                found = True
                break
        
        if found:
            print(f"✅ Successfully verified created status check in the list")
        else:
            print(f"❌ Created status check not found in the list")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())