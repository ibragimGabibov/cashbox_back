import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://cashbox-backend.onrender.com/api/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError('Ошибка входа: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Вход в кассу зоомагазина</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 mb-4 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        className="w-full p-2 mb-4 border rounded"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Войти
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

const CashierDashboard = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold">Касса</h1>
    <p>Оформление заказов, список товаров</p>
  </div>
);

const ManagerDashboard = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold">Панель менеджера</h1>
    <p>Просмотр отчётов</p>
  </div>
);

const AdminDashboard = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold">Панель администратора</h1>
    <p>Управление товарами и пользователями</p>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('https://cashbox-backend.onrender.com/api/verify', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setUser(res.data.user)).catch(() => localStorage.removeItem('token'));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/" element={
            user ? (
              user.role === 'cashier' ? <CashierDashboard /> :
              user.role === 'manager' ? <ManagerDashboard /> :
              user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;