import { Outlet } from 'react-router-dom';
import WhatsAppButton from '../components/shared/WhatsAppButton';

export default function MainLayout() { 
  return (
    <>
      <WhatsAppButton />
      <Outlet />
    </>
  ); 
}
