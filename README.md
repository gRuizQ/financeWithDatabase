# Sistema de Gerenciamento Financeiro

Este é um sistema completo de gerenciamento de saldo bancário com visualização de dados, desenvolvido com Python (Flask), JavaScript e PostgreSQL (Neon).

## Arquitetura e Tecnologias

- **Backend**: Flask (Python)
- **Banco de Dados**: PostgreSQL (Neon Serverless) com acesso via SQLAlchemy ORM
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Persistência**: Camada de dados robusta com Connection Pooling e SSL
- **Testes**: Suíte de testes automatizados (Unitários e Integração)

## Pré-requisitos

- Python 3.x instalado

## Instalação e Configuração

1. Clone ou baixe este repositório.
2. Navegue até a pasta do projeto.
3. Crie um arquivo `.env` na raiz do projeto e configure a string de conexão do banco de dados e a chave secreta:
   ```env
   DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
   SECRET_KEY=sua_chave_secreta_aqui
   ```
4. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

## Execução

Para iniciar o servidor:

```bash
python app.py
```

O sistema estará acessível em: http://127.0.0.1:5000

## Testes

O projeto inclui testes automatizados para garantir a integridade das operações.

Para rodar os testes:
```bash
# Windows (PowerShell)
$env:PYTHONPATH="C:\Caminho\Para\O\Projeto"; python tests/test_api.py

# Linux/Mac
export PYTHONPATH=$PYTHONPATH:$(pwd); python tests/test_api.py
```

## Funcionalidades

- **Autenticação**: Cadastro e Login de usuários seguros.
- **Dashboard Interativo**:
    - Visualização do saldo total.
    - Gráfico de **Distribuição de Investimentos** (Rosca).
    - Gráfico de **Evolução** (Barras Empilhadas) com histórico temporal.
- **Gerenciamento Completo (CRUD)**:
    - Adicionar, Editar, Duplicar e Remover investimentos.
    - Suporte a múltiplas datas e tipos de investimento.
- **Filtros e Ordenação**:
    - Filtragem por data específica.
    - Ordenação cronológica inteligente nos menus.
- **Auditoria**: Logs detalhados de todas as operações críticas (criação de usuários, login, movimentações financeiras).

## Estrutura do Projeto

- `app.py`: Ponto de entrada da aplicação Flask.
- `database.py`: Configuração da conexão com o banco de dados.
- `models.py`: Modelos ORM (User, BankEntry) e lógica de negócios.
- `static/`: Arquivos CSS e JavaScript do frontend.
- `templates/`: Templates HTML.
- `tests/`: Testes automatizados.
- `sql/`: Scripts de referência para o esquema do banco de dados.

## Documentação da API

### Autenticação
- `POST /api/register`: Cria novo usuário.
- `POST /api/login`: Autentica usuário.
- `POST /api/logout`: Encerra sessão.

### Dados Bancários
- `GET /api/bank-data`: Lista registros.
- `POST /api/bank-data`: Cria registro.
- `PUT /api/bank-data/<id>`: Atualiza registro.
- `DELETE /api/bank-data/<id>`: Remove registro.
