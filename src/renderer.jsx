import { createRoot } from 'react-dom/client';
import Profile from './components/Profile';
const App = () =>{
  return (
  <>
    <Profile />
  </>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);