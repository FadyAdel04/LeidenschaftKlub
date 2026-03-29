import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ScrollToTop from './components/shared/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
