import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {LogIn, UserPlus, Lock, Mail, User} from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const uploadedFile = location.state?.uploadedFile;

  const handleSubmit = (e) => {
    e.preventDefault();

    // backend

    if (uploadedFile) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
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
          {!isLogin && (
            <div className="input-group">
              <label>Ваше имя</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="Иван" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

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