import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import VehicleTracking from './pages/VehicleTracking';
import GISMap from './pages/Map';
import Alerts from './pages/Alerts';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/track" element={<VehicleTracking />} />
        <Route path="/map" element={<GISMap />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </Router>
  );
}