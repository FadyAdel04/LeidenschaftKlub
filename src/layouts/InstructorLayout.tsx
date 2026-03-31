import { Outlet } from 'react-router-dom';
import InstructorSidebar from '../components/shared/InstructorSidebar';

export default function InstructorLayout() {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <InstructorSidebar />
      <Outlet />
    </div>
  );
}
