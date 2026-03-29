import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ScrollToTop from './components/shared/ScrollToTop';

function App() {
  useEffect(() => {
    // 1. Prevent unintentional full page reloads by warning the user
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Chrome's Memory Saver often triggers a reload if the page is discarded.
      // A beforeunload handler can sometimes prevent this or at least warn the user.
      const isDirty = Object.keys(localStorage).some(k => 
        k.startsWith('admin_') || k.startsWith('exam_') || k.startsWith('assignment_')
      );
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
