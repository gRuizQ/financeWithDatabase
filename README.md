# Sistema de Gerenciamento Financeiro

Este é um sistema completo de gerenciamento de saldo bancário com visualização de dados, desenvolvido com Python (Flask) e JavaScript.

## Pré-requisitos

- Python 3.x instalado
  - **Windows**: Baixe e instale do [site oficial do Python](https://www.python.org/downloads/).
  - **Importante**: Durante a instalação, marque a opção **"Add Python to PATH"**.
- Pip (gerenciador de pacotes do Python)

## Instalação

1. Clone ou baixe este repositório.
2. Navegue até a pasta do projeto.
3. Instale as dependências:

```bash
# Se o comando 'pip' não for reconhecido, tente 'python -m pip'
pip install -r requirements.txt
```

## Execução

Para iniciar o servidor:

```bash
python app.py
```

O sistema estará acessível em: http://127.0.0.1:5000

## Funcionalidades

- **Autenticação**: Cadastro e Login de usuários.
- **Dashboard**: Visualização do saldo total e gráfico de distribuição.
- **Gerenciamento Completo**: 
    - Adicionar novos investimentos com data personalizada.
    - **Editar** valores de registros existentes.
    - Remover registros.
- **Filtros Avançados**: Filtragem de dados por data específica tanto no gráfico quanto na tabela de registros.
- **Persistência**: Dados salvos automaticamente em arquivos JSON na pasta `data/`.

## Documentação da API

### Autenticação

#### `POST /api/register`
Cria um novo usuário.
- **Body**: `{ "email": "user@example.com", "password": "123" }`
- **Retorno**: `201 Created` ou `409 Conflict`

#### `POST /api/login`
Autentica um usuário e inicia a sessão.
- **Body**: `{ "email": "user@example.com", "password": "123" }`
- **Retorno**: `200 OK` (com cookie de sessão) ou `401 Unauthorized`

#### `POST /api/logout`
Encerra a sessão.
- **Retorno**: `200 OK`

### Dados Bancários

#### `GET /api/bank-data`
Retorna todos os registros do usuário logado.
- **Retorno**: `200 OK` (Lista de objetos JSON)

#### `POST /api/bank-data`
Adiciona um novo registro.
- **Body**: 
  ```json
  {
    "bank_name": "Nubank",
    "investment_type": "Conta Corrente",
    "transaction_date": "2024-03-20",
    "value": 1500.50
  }
  ```
- **Retorno**: `201 Created`

#### `PUT /api/bank-data/<id>`
Atualiza o valor de um registro existente.
- **Body**: `{ "value": 2000.00 }`
- **Retorno**: `200 OK` ou `404 Not Found`

#### `DELETE /api/bank-data/<id>`
Remove um registro específico pelo ID.
- **Retorno**: `200 OK` ou `404 Not Found`
