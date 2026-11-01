import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  LogOut, 
  CheckCircle2, 
  XCircle,
  UserCheck
} from 'lucide-react';
import api, { API_BASE_URL } from '../api';

export default function Navbar({ user, onLogout }) {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [metrics, setMetrics] = useState(null);
  const [showDevOpsModal, setShowDevOpsModal] = useState(false);

  // Опрос состояния сервера
  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      if (res.data.status === 'OK') {
        setHealthStatus('online');
      } else {
        setHealthStatus('error');
      }
    } catch {
      setHealthStatus('offline');
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Ошибка загрузки метрик:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerSentryError = async () => {
    try {
      await api.get('/test-error');
    } catch (err) {
      alert('Тестовое исключение успешно вызвано на бэкенде и отправлено в Sentry!');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Бренд */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Campus <span className="text-emerald-600">Emerald</span>
            </h1>
            <p className="text-xs text-slate-500">Система сдачи и контроля заданий</p>
          </div>
        </div>

        {/* Правая часть: DevOps статус и аккаунт */}
        <div className="flex items-center gap-4">
          {/* Индикатор здоровья API */}
          <button
            onClick={() => {
              fetchMetrics();
              setShowDevOpsModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            title="Открыть мониторинг DevOps"
          >
            {healthStatus === 'online' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-emerald-700">API Online</span>
              </>
            )}
            {healthStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-semibold text-rose-700">API Offline</span>
              </>
            )}
            {healthStatus === 'checking' && (
              <span className="text-slate-400">Проверка связи...</span>
            )}
          </button>

          {/* Инфо профиля */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">{user.email}</div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-rose-100 text-rose-800' 
                    : user.role === 'moderator' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {user.role === 'moderator' ? 'Преподаватель' : user.role === 'admin' ? 'Администратор' : 'Студент'}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно DevOps мониторинга */}
      {showDevOpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Служебный мониторинг (DevOps)</h3>
              </div>
              <button
                onClick={() => setShowDevOpsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Статус бэкенда:</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Доступен (/health)
                </span>
              </div>

              {metrics ? (
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Время работы (Uptime):</span>
                    <span className="font-semibold text-slate-800">{metrics.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Всего запросов:</span>
                    <span className="font-semibold text-slate-800">{metrics.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Node.js версия:</span>
                    <span className="font-semibold text-slate-800">{metrics.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500">Память (Heap Used):</span>
                    <span className="font-semibold text-emerald-700">{metrics.memory?.heapUsed}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Загрузка метрик сервера...</p>
              )}

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Проверка трекинга ошибок Sentry:
                </label>
                <button
                  onClick={triggerSentryError}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Спровоцировать ошибку 500 (GET /test-error)
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  Отправляет необработанное исключение в дашборд Sentry.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDevOpsModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </header>
  );
}