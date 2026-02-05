import unittest
import json
from app import app
from database import init_db, SessionLocal
from models import User

class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        app.config['TESTING'] = True
        cls.client = app.test_client()

    def setUp(self):
        self.test_email = "apitest@example.com"
        self.test_password = "password123"
        
        # Cleanup before test
        self.cleanup_user()

    def tearDown(self):
        self.cleanup_user()
        
    def cleanup_user(self):
        session = SessionLocal()
        user = session.query(User).filter(User.email == self.test_email).first()
        if user:
            session.delete(user)
            session.commit()
        session.close()

    def test_auth_flow(self):
        # Register
        resp = self.client.post('/api/register', json={
            'email': self.test_email,
            'password': self.test_password
        })
        self.assertEqual(resp.status_code, 201)

        # Login
        resp = self.client.post('/api/login', json={
            'email': self.test_email,
            'password': self.test_password
        })
        self.assertEqual(resp.status_code, 200)
        
        # Logout
        resp = self.client.post('/api/logout')
        self.assertEqual(resp.status_code, 200)

    def test_bank_data_flow(self):
        # Register & Login
        self.client.post('/api/register', json={
            'email': self.test_email,
            'password': self.test_password
        })
        self.client.post('/api/login', json={
            'email': self.test_email,
            'password': self.test_password
        })

        # Add Entry
        entry_data = {
            'bank_name': 'API Bank',
            'investment_type': 'CDB',
            'value': 5000.0,
            'transaction_date': '2023-11-01'
        }
        resp = self.client.post('/api/bank-data', json=entry_data)
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        entry_id = data['id']

        # Get Entries
        resp = self.client.get('/api/bank-data')
        self.assertEqual(resp.status_code, 200)
        entries = resp.get_json()
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['bank_name'], 'API Bank')

        # Update Entry
        resp = self.client.put(f'/api/bank-data/{entry_id}', json={'value': 6000.0})
        self.assertEqual(resp.status_code, 200)

        # Verify Update
        resp = self.client.get('/api/bank-data')
        entries = resp.get_json()
        self.assertEqual(entries[0]['value'], 6000.0)

        # Delete Entry
        resp = self.client.delete(f'/api/bank-data/{entry_id}')
        self.assertEqual(resp.status_code, 200)

        # Verify Delete
        resp = self.client.get('/api/bank-data')
        entries = resp.get_json()
        self.assertEqual(len(entries), 0)

if __name__ == '__main__':
    unittest.main()
