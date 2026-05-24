import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {UploadCloud, User} from 'lucide-react';
import './UploadPage.css';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId'); 
    navigate('/'); 
    window.location.reload();
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const processFile = (file) => {
    if (isAuthenticated) {
      navigate('/dashboard', { state: { uploadedFile: file } });
    } else {
      navigate('/login', { state: { uploadedFile: file } });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="upload-container">
      <header className="upload-top-bar">
        {isAuthenticated ? (
          <div className="auth-buttons-group">
            <button className="header-btn primary" onClick={() => navigate('/dashboard')}>
              <User size={18} />
              Дашборд
            </button>
            <button className="header-btn danger" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        ) : (
          <button className="header-btn primary" onClick={() => navigate('/login')}>
            <User size={18} />
            Войти
          </button>
        )}
      </header>

      <div className="upload-header">
        <h1>SmartBudget AI</h1>
        <p>Загрузите банковскую выписку (CSV, XLSX, PDF) для умной аналитики</p>
      </div>
      
      <div 
        className={`dropzone ${dragActive ? "active" : ""}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <UploadCloud className="dropzone-icon" size={64} color="#94a3b8" />
        <div className="dropzone-text">Перетащите файл сюда</div>
        <button className="upload-btn">Выбрать файл</button>
        <input ref={inputRef} type="file" className="file-input" onChange={handleChange} accept=".csv, .xlsx, .pdf" />
      </div>

      <div className="features-section">
        <div className="feature-block">
          <div className="feature-text">
            <h2>Забудьте о ручном учете расходов</h2>
            <p>
              Больше не нужно вбивать каждую покупку в таблицу. SmartBudget AI автоматически 
              распознает вашу банковскую выписку, классифицирует транзакции с помощью нейросетей 
              и показывает наглядные графики ваших трат.
            </p>
          </div>
          <div className="feature-image">
            <img src="/wallet.png" alt="Аналитика бюджета" />
          </div>
        </div>

        <div className="feature-block reverse">
          <div className="feature-text">
            <h2>Персональные инсайты от ИИ</h2>
            <p>
              Наш алгоритм не просто строит диаграммы. Он анализирует ваше финансовое поведение, 
              находит неочевидные утечки бюджета (например, слишком много подписок или чашек кофе) 
              и дает персональные советы, как накопить на вашу цель быстрее.
            </p>
          </div>
          <div className="feature-image">
            <img src="/brain.png" alt="ИИ Советы" />
          </div>
        </div>

        <div className="feature-block">
          <div className="feature-text">
            <h2>Абсолютная безопасность данных</h2>
            <p>
              Мы ценим вашу приватность. SmartBudget AI не подключается к вашим банковским аккаунтам 
              напрямую и не сохраняет файлы выписок. Данные анализируются в оперативной памяти 
              и мгновенно удаляются после генерации отчета.
            </p>
          </div>
          <div className="feature-image">
            <img src="/lock.png" alt="Безопасность" />
          </div>
        </div>
      </div>
    </div>
  );
}