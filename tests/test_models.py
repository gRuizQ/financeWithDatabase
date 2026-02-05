import unittest
import uuid
from models import UserManager, BankDataManager, User, BankEntry
from database import SessionLocal, init_db, engine, Base

class TestModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure tables exist
        init_db()
        
    def setUp(self):
        self.test_email = f"test_{uuid.uuid4()}@example.com"
        self.test_password = "password123"
        self.user_id = None
        
    def tearDown(self):
        # Cleanup
        session = SessionLocal()
        if self.user_id:
            # Delete user and cascade delete entries
            user = session.query(User).filter(User.id == self.user_id).first()
            if user:
                session.delete(user)
                session.commit()
        session.close()

    def test_create_user_and_authenticate(self):
        # Test Creation
        user = UserManager.create_user(self.test_email, self.test_password)
        self.assertIsNotNone(user)
        self.assertEqual(user['email'], self.test_email)
        self.user_id = user['id']
        
        # Test Authentication Success
        auth_user = UserManager.authenticate(self.test_email, self.test_password)
        self.assertIsNotNone(auth_user)
        self.assertEqual(auth_user['id'], self.user_id)
        
        # Test Authentication Failure
        fail_user = UserManager.authenticate(self.test_email, "wrongpassword")
        self.assertIsNone(fail_user)

    def test_bank_operations(self):
        # Create user first
        user = UserManager.create_user(self.test_email, self.test_password)
        self.user_id = user['id']
        
        # Add Entry
        entry = BankDataManager.add_entry(
            self.user_id,
            "Test Bank",
            "Stocks",
            1000.50,
            "2023-10-27"
        )
        self.assertIsNotNone(entry)
        entry_id = entry['id']
        
        # Get Entries
        entries = BankDataManager.get_user_entries(self.user_id)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['id'], entry_id)
        
        # Update Entry
        success = BankDataManager.update_entry(self.user_id, entry_id, 2000.00)
        self.assertTrue(success)
        
        # Verify Update
        entries = BankDataManager.get_user_entries(self.user_id)
        self.assertEqual(entries[0]['value'], 2000.00)
        
        # Delete Entry
        success = BankDataManager.delete_entry(self.user_id, entry_id)
        self.assertTrue(success)
        
        # Verify Delete
        entries = BankDataManager.get_user_entries(self.user_id)
        self.assertEqual(len(entries), 0)

if __name__ == '__main__':
    unittest.main()
