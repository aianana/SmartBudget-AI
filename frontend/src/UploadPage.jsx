import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {UploadCloud, User} from 'lucide-react';
import './UploadPage.css';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');

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
    <div className="upload-container" style={{ position: 'relative', paddingTop: '60px' }}>
      <header style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', 
        display: 'flex', justifyContent: 'flex-end', 
        padding: '20px', boxSizing: 'border-box' 
      }}>
        <button 
          onClick={handleProfileClick}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            cursor: 'pointer', padding: '10px 16px', 
            borderRadius: '8px', border: 'none', 
            backgroundColor: '#6366f1', color: 'white', 
            fontWeight: '600', transition: '0.2s'
          }}
        >
          <User size={18} />
          {isAuthenticated ? 'Дашборд' : 'Войти'}
        </button>
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
    </div>
  );
}