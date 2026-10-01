import { Outlet } from 'react-router';

const AppLayout = () => {
    return (
        <div className="flex min-h-screen font-sans justify-center items-center">
            <Outlet />
        </div>
    );
};

export default AppLayout;
