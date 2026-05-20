import {BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage';
import DashboardPage from './DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;