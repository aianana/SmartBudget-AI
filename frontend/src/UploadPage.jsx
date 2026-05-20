import React from 'react';
import {UploadCloud} from 'lucide-react';
import './UploadPage.css';

export default function UploadPage() {
  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>SmartBudget AI</h1>
        <p>Загрузите банковскую выписку для аналитики</p>
      </div>
      <div className="dropzone">
        <UploadCloud size={64} color="#94a3b8" />
        <div className="dropzone-text">Перетащите файл сюда</div>
        <button className="upload-btn">Выбрать файл</button>
        <input type="file" className="file-input" accept=".csv, .xlsx" />
      </div>
    </div>
  );
}     