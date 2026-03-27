import { Outlet } from 'react-router-dom';
import PortalNotifications from '../components/shared/PortalNotifications';

export default function AdminLayout() {
  return (
    <>
      <PortalNotifications />
      <Outlet />
    </>
  );
}
