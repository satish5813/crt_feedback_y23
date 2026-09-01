import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FeedbackForm from './pages/FeedbackForm.jsx';
import AdminLogin, { isAdmin } from './pages/AdminLogin.jsx';
import AdminReport from './pages/AdminReport.jsx';

function AdminGate() {
  const [ok, setOk] = useState(isAdmin());
  return ok ? <AdminReport /> : <AdminLogin onOk={() => setOk(true)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedbackForm />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="*" element={<FeedbackForm />} />
      </Routes>
    </BrowserRouter>
  );
}
