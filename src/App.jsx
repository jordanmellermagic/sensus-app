
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SpectatorDataPage from './pages/SpectatorDataPage.jsx';
import PhonePeekPage from './pages/PhonePeekPage.jsx';

export default function App(){
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/spectator' element={<SpectatorDataPage/>}/>
        <Route path='/peek' element={<PhonePeekPage/>}/>
      </Routes>
    </Router>
  );
}
