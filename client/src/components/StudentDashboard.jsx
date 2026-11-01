import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  Search, 
  Filter, 
  Award, 
  ArrowRight
} from 'lucide-react';
import api from '../api';
import { useDebounce } from '../utils/useDebounce';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Приём оптимизации 1: Debounce поиска (400мс)
  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Ошибка загрузки заданий:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Приём оптимизации 3: useMemo для вычисления отфильтрованного списка
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchesSearch = item.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assignments, filterStatus, debouncedSearch]);

  const renderStatusBadge = (status) => {
    if (status === 'Оценено') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Оценено
        </span>
      );
    }
    if (status === 'Отправлено на оценку' || status === 'Сдано') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          На проверке
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Ожидает решения
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Заголовок кабинета студента */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Личный кабинет студента</h1>
          <p className="text-sm text-slate-500 mt-1">Отслеживайте статус учебных заданий и сдавайте решения</p>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-64 transition-all"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 py-1 pr-3 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Все статусы</option>
              <option value="Выдано">Ожидает решения</option>
              <option value="Отправлено на оценку">На проверке</option>
              <option value="Оценено">Оценено</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список заданий */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm animate-pulse h-48" />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto my-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">Задания не найдены</h3>
          <p className="text-sm text-slate-500">
            {searchQuery || filterStatus !== 'ALL' 
              ? 'Попробуйте изменить параметры поиска или фильтрации.' 
              : 'У вас пока нет активных назначенных заданий.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => {
            const hasGrade = assignment.grade !== null && assignment.grade !== undefined;

            return (
              <div 
                key={assignment.id} 
                onClick={() => navigate(`/assignments/${assignment.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {renderStatusBadge(assignment.status)}
                    {hasGrade && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {assignment.grade} / 100
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                    {assignment.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {assignment.materials && assignment.materials.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Paperclip className="w-3.5 h-3.5" />
                        {assignment.materials.length} влож.
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    Подробнее
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}