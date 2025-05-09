import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import UserPage from '../pages/UserPage';
import SignUpPage from '../pages/SignUpPage';
import AdminPage from '../pages/AdminPage';
import CreatePrPage from '../pages/CreatePrPage';

function AppRoutes(){
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/user" element={<UserPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/create-pr" element={<CreatePrPage />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;