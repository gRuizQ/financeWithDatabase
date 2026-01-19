import json
import os
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
BANK_DATA_FILE = os.path.join(DATA_DIR, 'bank_data.json')

def _ensure_files_exist():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump([], f)
    if not os.path.exists(BANK_DATA_FILE):
        with open(BANK_DATA_FILE, 'w') as f:
            json.dump([], f)

_ensure_files_exist()

class UserManager:
    @staticmethod
    def get_all_users():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)

    @staticmethod
    def save_users(users):
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=4)

    @staticmethod
    def create_user(email, password):
        users = UserManager.get_all_users()
        if any(u['email'] == email for u in users):
            return None  # User already exists
        
        new_user = {
            'id': str(uuid.uuid4()),
            'email': email,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.now().isoformat()
        }
        users.append(new_user)
        UserManager.save_users(users)
        return new_user

    @staticmethod
    def authenticate(email, password):
        users = UserManager.get_all_users()
        user = next((u for u in users if u['email'] == email), None)
        if user and check_password_hash(user['password_hash'], password):
            return user
        return None

class BankDataManager:
    @staticmethod
    def get_all_data():
        with open(BANK_DATA_FILE, 'r') as f:
            return json.load(f)

    @staticmethod
    def save_data(data):
        with open(BANK_DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)

    @staticmethod
    def add_entry(user_id, bank_name, investment_type, value, transaction_date):
        data = BankDataManager.get_all_data()
        new_entry = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'bank_name': bank_name,
            'investment_type': investment_type,
            'value': float(value),
            'transaction_date': transaction_date,
            'created_at': datetime.now().isoformat()
        }
        data.append(new_entry)
        BankDataManager.save_data(data)
        return new_entry

    @staticmethod
    def get_user_entries(user_id):
        data = BankDataManager.get_all_data()
        user_entries = [entry for entry in data if entry['user_id'] == user_id]
        # Ensure transaction_date exists for legacy records
        for entry in user_entries:
            if 'transaction_date' not in entry:
                entry['transaction_date'] = entry.get('created_at', datetime.now().isoformat()).split('T')[0]
        return user_entries

    @staticmethod
    def delete_entry(user_id, entry_id):
        data = BankDataManager.get_all_data()
        initial_len = len(data)
        # Filter out the entry that matches ID and User ID (security check)
        data = [d for d in data if not (d['id'] == entry_id and d['user_id'] == user_id)]
        
        if len(data) < initial_len:
            BankDataManager.save_data(data)
            return True
        return False

    @staticmethod
    def update_entry(user_id, entry_id, new_value):
        data = BankDataManager.get_all_data()
        for entry in data:
            if entry['id'] == entry_id and entry['user_id'] == user_id:
                entry['value'] = float(new_value)
                BankDataManager.save_data(data)
                return True
        return False
