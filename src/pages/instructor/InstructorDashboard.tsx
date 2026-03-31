import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchInstructorLevels, fetchInstructorDashboardStats } from '../../services/instructorService';
import type { Level } from '../../services/studentService';
import { Grid, Users, FileText, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ levels: 0, students: 0, assignments: 0, avgPerformance: 0 });

  useEffect(() => {
    if (user) {
      loadInstructorData();
    }
  }, [user]);

  async function loadInstructorData() {
    if (!user) return;
    try {
      const [lData, sData] = await Promise.all([
        fetchInstructorLevels(user.id),
        fetchInstructorDashboardStats(user.id)
      ]);
      setLevels(lData);
      setStats(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="min-h-screen bg-[#F5F5F0] lg:ml-80 p-6 md:p-10 lg:p-16 xl:p-20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#D4A373]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <motion.header variants={itemVariants} className="mb-12 relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
          Instructor<br /><span className="text-[#D4A373]">Lounge.</span>
        </h1>
        <p className="text-[#1A1A1A]/40 font-black uppercase text-[10px] tracking-[0.5em] italic flex items-center gap-2">
          Welcome back, {user?.name} 
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" />
          <span className="text-[#D4A373] tracking-widest uppercase">Status: Active • Authorized Instructor</span>
        </p>
      </motion.header>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-6">
            <Grid className="w-6 h-6 text-[#D4A373]" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-1">Assigned Areas</p>
          <h4 className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{levels.length}</h4>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-6 h-6 text-[#D4A373]" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-1">Total Students</p>
          <h4 className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{stats.students}</h4>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-[#D4A373]" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-1">Assignments</p>
          <h4 className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{stats.assignments}</h4>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-6">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-1">Avg. Performance</p>
          <h4 className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{stats.avgPerformance}%</h4>
        </div>
      </motion.div>

      {/* Groups List */}
      <motion.div variants={itemVariants} className="space-y-6 relative z-10">
        <div className="flex items-center justify-between px-4">
           <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tighter">My Cohorts</h3>
           <Link to="/instructor/groups" className="text-[9px] font-black uppercase tracking-widest text-[#D4A373] hover:text-[#D4A373] transition-colors flex items-center gap-2">
             Manage All <ArrowRight className="w-3 h-3" />
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="p-8 bg-white rounded-[2rem] border border-[#1A1A1A]/5 animate-pulse h-48" />
          ) : levels.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-[2rem] border border-[#1A1A1A]/5 text-center">
              <p className="font-black text-[#1A1A1A]/20 uppercase tracking-widest text-[10px]">No curriculum levels assigned.</p>
            </div>
          ) : (
            levels.map(level => (
              <div key={level.id} className="group bg-white p-8 rounded-[3rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A373]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                <div className="flex items-center justify-between mb-8">
                  <div className="px-4 py-1.5 bg-[#F5F5F0] rounded-full text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/60 group-hover:bg-[#D4A373] group-hover:text-white transition-all">
                    {(level as any).group?.name ? `Group ${(level as any).group.name} — ` : ''}Level {level.name}
                  </div>
                  <div className="flex items-center gap-2">
                     <Users className="w-3 h-3 text-[#D4A373]" />
                     <span className="text-[10px] font-black">{level.student_count || 0} Students</span>
                  </div>
                </div>
                <h4 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase mb-2">{level.name}</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/30 italic truncate">
                   {level.description || 'Instructional Curriculum Node'}
                </p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
