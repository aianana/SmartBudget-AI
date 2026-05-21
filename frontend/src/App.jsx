import {BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage';
import DashboardPage from './DashboardPage';
import LoginPage from './LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;