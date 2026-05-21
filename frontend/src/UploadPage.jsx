import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {UploadCloud} from 'lucide-react';
import './UploadPage.css';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      navigate('/login', { state: { uploadedFile: file } });
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      navigate('/login', { state: { uploadedFile: file } });
    }
  };

  return (
    <div className="upload-container">
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