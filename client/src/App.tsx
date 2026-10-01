import { Routes, Route } from 'react-router';
import AppLayout from './layout/AppLayout';
import NearbyPage from './pages/NearbyPage';
import NewPlacePage from './pages/NewPlacePage';
import PlacePage from './pages/PlacePage';
import SignInPage from './pages/SignInPage';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<NearbyPage />} />
                <Route path="places/new" element={<NewPlacePage />} />
                <Route path="places/:placeId" element={<PlacePage />} />
                <Route path="sign-in" element={<SignInPage />} />
            </Route>
        </Routes>
    );
};

export default App;
