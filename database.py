import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Obtém URL do banco de dados
# Fallback para sqlite se não houver env (dev)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///local_dev.db')

# Configuração para PostgreSQL (Neon) vs SQLite
connect_args = {}
engine_kwargs = {
    'echo': False, # Logs SQL queries se True
}

if 'sqlite' in DATABASE_URL:
    connect_args = {'check_same_thread': False}
    engine_kwargs['connect_args'] = connect_args
else:
    # Para Postgres/Neon
    # O parametro sslmode=require já está na URL, o SQLAlchemy/psycopg2 vai respeitar
    # Configurações de Pool
    engine_kwargs['pool_size'] = 10
    engine_kwargs['max_overflow'] = 20
    engine_kwargs['pool_pre_ping'] = True
    # Opcional: timeouts
    engine_kwargs['pool_recycle'] = 1800 

engine = create_engine(DATABASE_URL, **engine_kwargs)

# Session Management
# scoped_session cria um registro de sessões thread-local, ideal para apps web Flask
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# Base para os Modelos
Base = declarative_base()
Base.query = SessionLocal.query_property()

def init_db():
    """Cria as tabelas no banco de dados (se não existirem)."""
    # Importa modelos para registrá-los no metadata
    import models
    Base.metadata.create_all(bind=engine)

def get_db():
    """Helper para obter sessão."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
