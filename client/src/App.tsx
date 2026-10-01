import { Routes, Route } from 'react-router';
import AppLayout from './layout/AppLayout';
import LandingPage from './pages/LandingPage';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<LandingPage />} />
            </Route>
        </Routes>
    );
};

export default App;
