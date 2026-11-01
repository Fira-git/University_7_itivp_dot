import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Автоматическая подстановка JWT токена в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка просроченных / невалидных токенов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если бэкенд отклонил запрос из-за авторизации (401 или 403 с сообщением о токене)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const errorMsg = error.response.data?.error || '';
      if (
        errorMsg.includes('токен') || 
        errorMsg.includes('Токен') || 
        errorMsg.includes('доступа')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;