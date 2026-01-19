from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from models import UserManager, BankDataManager
from functools import wraps
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'dev_secret_key_change_in_production'  # In a real app, use environment variable

# Decorator for login required
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# --- UI Routes ---

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

# --- API Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    user = UserManager.create_user(data['email'], data['password'])
    if not user:
        return jsonify({'error': 'Usuário já existe'}), 409
    
    return jsonify({'message': 'Usuário criado com sucesso'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    user = UserManager.authenticate(data['email'], data['password'])
    if user:
        session['user_id'] = user['id']
        session['email'] = user['email']
        return jsonify({'message': 'Login realizado com sucesso', 'redirect': url_for('dashboard')}), 200
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout realizado com sucesso', 'redirect': url_for('index')}), 200

@app.route('/api/bank-data', methods=['GET'])
@login_required
def get_bank_data():
    entries = BankDataManager.get_user_entries(session['user_id'])
    return jsonify(entries), 200

@app.route('/api/bank-data', methods=['POST'])
@login_required
def add_bank_data():
    data = request.json
    required_fields = ['bank_name', 'investment_type', 'value', 'transaction_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Dados incompletos'}), 400
    
    try:
        value = float(data['value'])
    except ValueError:
        return jsonify({'error': 'Valor inválido'}), 400

    try:
        # Validate format YYYY-MM-DD
        datetime.strptime(data['transaction_date'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Data inválida (formato esperado: YYYY-MM-DD)'}), 400

    entry = BankDataManager.add_entry(
        session['user_id'],
        data['bank_name'],
        data['investment_type'],
        value,
        data['transaction_date']
    )
    return jsonify(entry), 201

@app.route('/api/bank-data/<entry_id>', methods=['DELETE'])
@login_required
def delete_bank_data(entry_id):
    success = BankDataManager.delete_entry(session['user_id'], entry_id)
    if success:
        return jsonify({'message': 'Registro removido'}), 200
    return jsonify({'error': 'Registro não encontrado ou não autorizado'}), 404

@app.route('/api/bank-data/<entry_id>', methods=['PUT'])
@login_required
def update_bank_data(entry_id):
    data = request.json
    if not data or 'value' not in data:
        return jsonify({'error': 'Valor é obrigatório'}), 400
    
    try:
        new_value = float(data['value'])
    except ValueError:
        return jsonify({'error': 'Valor inválido'}), 400

    success = BankDataManager.update_entry(session['user_id'], entry_id, new_value)
    if success:
        return jsonify({'message': 'Registro atualizado'}), 200
    return jsonify({'error': 'Registro não encontrado ou não autorizado'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
