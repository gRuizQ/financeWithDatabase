-- Script SQL para criação de tabelas no Neon (PostgreSQL)
-- Execute este script no SQL Editor do Console Neon

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY, -- UUID gerado pela aplicação
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de Entradas Bancárias (Investimentos)
CREATE TABLE IF NOT EXISTS bank_entries (
    id VARCHAR(36) PRIMARY KEY, -- UUID gerado pela aplicação
    user_id VARCHAR(36) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    investment_type VARCHAR(50) NOT NULL,
    value DECIMAL(15, 2) NOT NULL, -- Precisão decimal para valores monetários
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint de Chave Estrangeira
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE -- Se usuário for deletado, apaga seus registros
);

-- Índice para buscar registros de um usuário específico
CREATE INDEX IF NOT EXISTS idx_bank_entries_user_id ON bank_entries(user_id);
