import { Outlet } from 'react-router-dom';
import PortalNotifications from '../components/shared/PortalNotifications';

export default function StudentLayout() {
  return (
    <>
      <PortalNotifications />
      <Outlet />
    </>
  );
}