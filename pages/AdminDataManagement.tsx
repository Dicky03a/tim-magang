
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Semester, Course, Class } from '../types';
import { Plus, Trash2, Edit, Save, X, BookOpen, Calendar, Users } from 'lucide-react';

const AdminDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'semesters' | 'courses' | 'classes'>('semesters');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState(''); // Only for courses

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'semesters') {
      const { data } = await supabase.from('semesters').select('*').order('name');
      if (data) setSemesters(data);
    } else if (activeTab === 'courses') {
      const { data } = await supabase.from('courses').select('*').order('name');
      if (data) setCourses(data);
    } else {
      const { data } = await supabase.from('classes').select('*').order('name');
      if (data) setClasses(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newItemName) return;
    setLoading(true);
    
    let error;
    if (activeTab === 'semesters') {
      ({ error } = await supabase.from('semesters').insert({ name: newItemName }));
    } else if (activeTab === 'courses') {
      ({ error } = await supabase.from('courses').insert({ name: newItemName, code: newItemCode }));
    } else {
      ({ error } = await supabase.from('classes').insert({ name: newItemName }));
    }

    if (error) alert(error.message);
    else {
      setNewItemName('');
      setNewItemCode('');
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data ini?')) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Data Master</h1>
          <p className="text-slate-500 text-sm">Kelola data dasar akademik untuk sistem EduTask.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('semesters')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'semesters' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar size={18} /> Semester
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'courses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen size={18} /> Mata Kuliah
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'classes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-4">Tambah Data Baru</h3>
          <div className="space-y-4">
            {activeTab === 'courses' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kode MK</label>
                <input 
                  type="text" 
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: IF101"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama {activeTab.slice(0, -1)}</label>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Nama ${activeTab}...`}
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Simpan Data
            </button>
          </div>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama</th>
                {activeTab === 'courses' && <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Kode</th>}
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'semesters' ? semesters : activeTab === 'courses' ? courses : classes).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                  {activeTab === 'courses' && <td className="px-6 py-4 text-slate-500">{(item as Course).code}</td>}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDataManagement;
