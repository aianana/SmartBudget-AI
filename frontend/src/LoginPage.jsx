import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {LogIn, UserPlus, Lock, Mail} from 'lucide-react';
import './LoginPage.css';

const API_URL = import.meta.env.PROD 
  ? 'https://smartbudget-ai-production-d837.up.railway.app' 
  : '';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const uploadedFile = location.state?.uploadedFile;

 const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const bodyData = { email, password };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации. Проверьте данные.');
      }

      console.log("ОТВЕТ СЕРВЕРА:", data);

      if (!isLogin) {
        alert("Успешно! Теперь войдите с вашими данными.");
        setIsLogin(true);
        return;
      }

      localStorage.setItem('token', data.token);
      
      if (data.user && data.user.id) {
        localStorage.setItem('userId', data.user.id); 
      }

      if (uploadedFile) {
        navigate('/dashboard', { state: { uploadedFile } });
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="upload-header login-logo">
        <h1>SmartBudget AI</h1>
      </div>
      <div className="login-card">
        <h2 className="login-title">
          {isLogin ? 'Войти в аккаунт' : 'Создать профиль'}
        </h2>
        <p className="login-subtitle">
          {uploadedFile 
            ? 'Зарегистрируйтесь или войдите, чтобы ИИ начал анализ файла' 
            : 'Управляйте своими финансами с помощью ИИ'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                placeholder="example@mail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="login-toggle-text">
          {isLogin ? 'Впервые у нас?' : 'Уже есть аккаунт?'}
          <button
            type="button"
            className="login-toggle-btn" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Создать аккаунт' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
}