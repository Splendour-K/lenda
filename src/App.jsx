import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ItemDetails from './pages/ItemDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ListAnItem from './pages/ListAnItem';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/item/:id" element={<ItemDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/list-item" element={<ListAnItem />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
