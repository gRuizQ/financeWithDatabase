document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const toggleBtn = document.getElementById('toggle-auth');
    const formTitle = document.getElementById('form-title');
    const messageDiv = document.getElementById('message');

    let isLogin = true;

    toggleBtn.addEventListener('click', () => {
        isLogin = !isLogin;
        if (isLogin) {
            formTitle.textContent = 'Login';
            submitBtn.textContent = 'Entrar';
            toggleBtn.textContent = 'Não tem conta? Cadastre-se';
        } else {
            formTitle.textContent = 'Cadastro';
            submitBtn.textContent = 'Cadastrar';
            toggleBtn.textContent = 'Já tem conta? Faça login';
        }
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        const endpoint = isLogin ? '/api/login' : '/api/register';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'message success';
                
                if (isLogin && data.redirect) {
                    window.location.href = data.redirect;
                } else if (!isLogin) {
                    // Switch to login after successful registration
                    setTimeout(() => {
                        toggleBtn.click();
                        emailInput.value = email; // Pre-fill email
                        passwordInput.value = '';
                    }, 1500);
                }
            } else {
                messageDiv.textContent = data.error || 'Ocorreu um erro.';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'Erro de conexão com o servidor.';
            messageDiv.className = 'message error';
        }
    });
});
