import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Desktop from './os/Desktop';
import Login from './components/Login';
import PublicShare from './pages/PublicShare';
import useAuth from './store/useAuth';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/s/:token" element={<PublicShare />} />
            <Route path="/*" element={<App />} />
        </Routes>
    );
}

export default AppRoutes;

function App() {
    const { token } = useAuth();

    if (!token) return <Login />;

    return <Desktop />;
}
