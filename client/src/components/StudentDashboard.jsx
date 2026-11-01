import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  Search, 
  Filter, 
  Award, 
  ArrowRight,
  Send
} from 'lucide-react';
import api from '../api';
import AssignmentDetail from './AssignmentDetail';

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAssignment, setActiveAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data);
      if (activeAssignment) {
        const updated = res.data.find(a => a.id === activeAssignment.id);
        if (updated) setActiveAssignment(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (activeAssignment) {
    return (
      <AssignmentDetail
        assignment={activeAssignment}
        userRole="user"
        onBack={() => setActiveAssignment(null)}
        onRefresh={fetchAssignments}
      />
    );
  }

  const filteredAssignments = assignments.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderStatusBadge = (status) => {
    if (status === 'Оценено') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Оценено
        </span>
      );
    }
    if (status === 'Отправлено на оценку') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Send className="w-3 h-3 text-sky-600" />
          Отправлено на оценку
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Выдано
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Мои учебные задания</h2>
        <p className="text-sm text-slate-500 mt-1">
          Выберите задание для подробного описания, скачивания методичек и сдачи решений
        </p>
      </div>

      {/* Поиск и фильтры по всем 3 статусам */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по теме задания..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
          {['ALL', 'Выдано', 'Отправлено на оценку', 'Оценено'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Все' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Сетка заданий */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Загрузка заданий...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">Заданий не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => {
            const hasGrade = assignment.grade !== null && assignment.grade !== undefined;

            return (
              <div 
                key={assignment.id} 
                onClick={() => setActiveAssignment(assignment)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {renderStatusBadge(assignment.status)}

                    {hasGrade ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        {assignment.grade} / 100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Без оценки</span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-emerald-700 transition-colors">
                    {assignment.title}
                  </h3>

                  {assignment.materials && assignment.materials.length > 0 && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Материалов: <b>{assignment.materials.length}</b></span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Открыть задание</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}