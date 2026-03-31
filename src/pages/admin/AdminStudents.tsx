import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Save, X, AlertCircle, CheckCircle, Loader, ShieldCheck, Filter } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { 
  fetchAllStudents, 
  fetchAllLevels, 
  fetchAllGroups, 
  updateStudentLevel, 
  assignStudentToGroup,
  deleteStudent,
  type Profile, 
  type Level, 
  type Group 
} from '../../services/adminService';
import { Trash2 } from 'lucide-react';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminStudents() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [editGroup, setEditGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([fetchAllStudents(true), fetchAllLevels(), fetchAllGroups()])
      .then(([usersData, levelsData, groupsData]) => {
        setUsers(usersData);
        setFiltered(usersData);
        setLevels(levelsData);
        setGroups(groupsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (levelFilter) list = list.filter(u => u.current_level === levelFilter);
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    
    setFiltered(list);
  }, [search, levelFilter, roleFilter, users]);

  const handleSaveLevel = async (userId: string) => {
    setSaving(true);
    setSaveMsg('');
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (editLevel !== user.current_level) {
        await updateStudentLevel(userId, editLevel);
      }
      if (editGroup !== user.group_id) {
        await assignStudentToGroup(userId, editGroup);
      }
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, current_level: editLevel, group_id: editGroup } : u));
      setSaveMsg('Permissions updated.');
      setEditingId(null);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action is permanent.`)) return;
    try {
      await deleteStudent(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSaveMsg('Member purged from registry.');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Purge failed');
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex font-body">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
             <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-4 py-1.5 rounded-full w-fit">
                <Users className="w-3 h-3 text-[#D4A373]" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">Identity Hub</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
                Member<br /><span className="text-[#DE0002]">Registry.</span>
              </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
            <button 
              onClick={() => setRoleFilter('all')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === 'all' ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#F5F5F0]'}`}
            >
              All
            </button>
            <button 
              onClick={() => setRoleFilter('student')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === 'student' ? 'bg-[#DE0002] text-white' : 'hover:bg-[#F5F5F0]'}`}
            >
              Students
            </button>
            <button 
              onClick={() => setRoleFilter('instructor')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === 'instructor' ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#F5F5F0]'}`}
            >
              Instructors
            </button>
          </div>
        </motion.header>

        {/* Status Messages */}
        {saveMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-5 relative z-10">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-green-700">{saveMsg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div variants={ci} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 relative z-10">
            <AlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">{error}</p>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={ci} className="flex flex-col sm:flex-row gap-4 mb-8 relative z-10">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4 group-focus-within:text-[#F97316] transition-colors" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, email or reference…"
              className="w-full pl-12 pr-6 py-4 bg-white border border-[#1A1A1A]/5 rounded-[1.25rem] font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#F97316]/5 shadow-sm transition-all"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-3 h-3" />
            <select
              value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
              className="pl-12 pr-10 py-4 bg-white border border-[#1A1A1A]/5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/5 shadow-sm appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">Functional Levels</option>
              {levels.map(lv => <option key={lv.id} value={lv.name}>{lv.name}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Data Grid */}
        <motion.div variants={ci} className="bg-white rounded-[3rem] border border-[#1A1A1A]/5 shadow-xl overflow-hidden relative z-10">
          {loading
            ? <div className="p-10 space-y-6">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-[#F5F5F0] rounded-[1.5rem] animate-pulse" />)}</div>
            : filtered.length === 0
              ? <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-[#1A1A1A]/10" />
                  </div>
                  <p className="font-black text-[#1A1A1A] uppercase tracking-tighter text-2xl">Isolated Registry Node</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-2">No members match your criteria</p>
                </div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/30">
                        {['Identity', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#D4A373] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/20 transition-all group">
                          {/* Name & Email */}
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-500">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(u.name || u.email)
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="font-black text-sm text-[#1A1A1A] uppercase tracking-tight">{u.name || 'Anonymous Entity'}</p>
                                <p className="text-[10px] font-black text-[#1A1A1A]/30 tracking-wider truncate max-w-[180px]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          {/* Role Badge */}
                          <td className="px-10 py-6">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                               u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                               u.role === 'instructor' ? 'bg-[#1A1A1A] text-white border-transparent' :
                               'bg-blue-50 text-blue-700 border-blue-100'
                             }`}>
                               {u.role === 'instructor' && <ShieldCheck className="w-3 h-3" />}
                               {u.role}
                             </div>
                          </td>
                          {/* Status/Level - editable Inline */}
                          <td className="px-10 py-6">
                            {editingId === u.id ? (
                               <div className="flex flex-col gap-2">
                                  <select
                                    value={editLevel}
                                    onChange={e => setEditLevel(e.target.value)}
                                    className="px-4 py-2 bg-[#F5F5F0] rounded-xl font-black text-[10px] uppercase tracking-widest text-[#F97316] outline-none border-none focus:ring-2 focus:ring-[#F97316]/20"
                                  >
                                    <option value="">No Level</option>
                                    {levels.map(lv => <option key={lv.id} value={lv.name}>{lv.name}</option>)}
                                  </select>
                                  <select
                                    value={editGroup || ''}
                                    onChange={e => setEditGroup(e.target.value || null)}
                                    className="px-4 py-2 bg-[#F5F5F0] rounded-xl font-black text-[10px] uppercase tracking-widest text-[#1A1A1A] outline-none border-none focus:ring-2 focus:ring-[#1A1A1A]/20"
                                  >
                                    <option value="">No Group</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                  </select>
                               </div>
                            ) : (
                               <div className="space-y-1">
                                  <div className="px-4 py-1.5 bg-[#F97316]/5 text-[#F97316] text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-[#F97316]/10 w-fit">
                                    Grade: {u.current_level || 'Open'}
                                  </div>
                                  <p className="text-[10px] font-black text-[#1A1A1A]/20 uppercase tracking-[0.1em] ml-2">
                                     {groups.find(g => g.id === u.group_id)?.name || 'Direct Entry'}
                                  </p>
                               </div>
                            )}
                          </td>
                          {/* Joined */}
                          <td className="px-10 py-6">
                            <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-[0.2em] whitespace-nowrap">{formatDate(u.created_at)}</p>
                          </td>
                          {/* Actions */}
                          <td className="px-10 py-6">
                            {editingId === u.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveLevel(u.id)}
                                  disabled={saving}
                                  className="w-10 h-10 bg-[#F97316] text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                                >
                                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="w-10 h-10 bg-[#F5F5F0] rounded-xl text-[#1A1A1A]/40 hover:text-[#1A1A1A] flex items-center justify-center transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => { setEditingId(u.id); setEditLevel(u.current_level); setEditGroup(u.group_id || null); }}
                                  className="w-12 h-12 bg-[#F5F5F0] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A]/30 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-[#1A1A1A]/5 shadow-sm"
                                  title="Edit Permissions"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(u.id, u.name || u.email)}
                                  className="w-12 h-12 bg-red-50 hover:bg-red-500 hover:text-white text-red-400 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-red-100 shadow-sm"
                                  title="Purge Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
          {/* Footer Metadata */}
          <div className="px-10 py-6 bg-[#F5F5F0]/30 border-t border-[#1A1A1A]/5 flex justify-between items-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/20 italic">
              Registry Node Overflow: {filtered.length} Objects Loaded
            </p>
            <div className="flex items-center gap-2 opacity-50">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]">Encrypted Sync</span>
            </div>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
