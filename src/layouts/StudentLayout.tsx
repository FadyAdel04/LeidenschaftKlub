import { Outlet } from 'react-router-dom';
import PortalNotifications from '../components/shared/PortalNotifications';
import WhatsAppButton from '../components/shared/WhatsAppButton';

export default function StudentLayout() {
  return (
    <>
      <PortalNotifications />
      <WhatsAppButton label="Contact us" message="Hello, I have a problem with my portal..." />
      <Outlet />
    </>
  );
}
