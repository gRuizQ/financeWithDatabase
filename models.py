from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base, SessionLocal
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Configuração de Logging para Auditoria
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bank_entries = relationship("BankEntry", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BankEntry(Base):
    __tablename__ = 'bank_entries'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    bank_name = Column(String(100), nullable=False)
    investment_type = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    transaction_date = Column(String(10), nullable=False) # YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bank_entries")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bank_name': self.bank_name,
            'investment_type': self.investment_type,
            'value': self.value,
            'transaction_date': self.transaction_date,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# --- Service/Manager Layer (Adapter to replace old JSON managers) ---

class UserManager:
    @staticmethod
    def create_user(email, password):
        session = SessionLocal()
        try:
            # Check existing
            existing = session.query(User).filter(User.email == email).first()
            if existing:
                return None
            
            new_user = User(
                email=email,
                password_hash=generate_password_hash(password)
            )
            session.add(new_user)
            session.commit()
            logger.info(f"AUDIT: User created successfully - Email: {email}")
            return new_user.to_dict()
        except Exception as e:
            session.rollback()
            logger.error(f"AUDIT: Error creating user {email}: {e}")
            return None
        finally:
            session.close()

    @staticmethod
    def authenticate(email, password):
        session = SessionLocal()
        try:
            user = session.query(User).filter(User.email == email).first()
            if user and check_password_hash(user['password_hash'] if isinstance(user, dict) else user.password_hash, password):
                logger.info(f"AUDIT: User authenticated successfully - Email: {email}")
                return user.to_dict()
            logger.warning(f"AUDIT: Failed authentication attempt - Email: {email}")
            return None
        finally:
            session.close()

class BankDataManager:
    @staticmethod
    def get_user_entries(user_id):
        session = SessionLocal()
        try:
            entries = session.query(BankEntry).filter(BankEntry.user_id == user_id).order_by(BankEntry.transaction_date.desc()).all()
            return [e.to_dict() for e in entries]
        finally:
            session.close()

    @staticmethod
    def add_entry(user_id, bank_name, investment_type, value, transaction_date):
        session = SessionLocal()
        try:
            new_entry = BankEntry(
                user_id=user_id,
                bank_name=bank_name,
                investment_type=investment_type,
                value=float(value),
                transaction_date=transaction_date
            )
            session.add(new_entry)
            session.commit()
            logger.info(f"AUDIT: Bank entry added - User: {user_id}, Bank: {bank_name}, Value: {value}")
            return new_entry.to_dict()
        except Exception as e:
            session.rollback()
            logger.error(f"AUDIT: Error adding entry for user {user_id}: {e}")
            return None
        finally:
            session.close()

    @staticmethod
    def delete_entry(user_id, entry_id):
        session = SessionLocal()
        try:
            entry = session.query(BankEntry).filter(BankEntry.id == entry_id, BankEntry.user_id == user_id).first()
            if entry:
                session.delete(entry)
                session.commit()
                logger.info(f"AUDIT: Bank entry deleted - User: {user_id}, Entry: {entry_id}")
                return True
            logger.warning(f"AUDIT: Failed delete attempt (not found) - User: {user_id}, Entry: {entry_id}")
            return False
        except Exception as e:
            session.rollback()
            logger.error(f"AUDIT: Error deleting entry {entry_id}: {e}")
            return False
        finally:
            session.close()

    @staticmethod
    def update_entry(user_id, entry_id, new_value):
        session = SessionLocal()
        try:
            entry = session.query(BankEntry).filter(BankEntry.id == entry_id, BankEntry.user_id == user_id).first()
            if entry:
                old_value = entry.value
                entry.value = float(new_value)
                session.commit()
                logger.info(f"AUDIT: Bank entry updated - User: {user_id}, Entry: {entry_id}, Old: {old_value}, New: {new_value}")
                return True
            logger.warning(f"AUDIT: Failed update attempt (not found) - User: {user_id}, Entry: {entry_id}")
            return False
        except Exception as e:
            session.rollback()
            logger.error(f"AUDIT: Error updating entry {entry_id}: {e}")
            return False
        finally:
            session.close()
