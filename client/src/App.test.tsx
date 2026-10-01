import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );

describe('App', () => {
    it('renders the nearby page at / and explains a missing location', () => {
        renderAt('/');
        expect(screen.getByRole('heading', { name: 'Within a walk' })).toBeInTheDocument();
        expect(screen.getByText('Nearby needs a location.')).toBeInTheDocument();
    });

    it('renders the sign-in page at /sign-in', () => {
        renderAt('/sign-in');
        expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders the add-place form at /places/new, not as a place id', () => {
        renderAt('/places/new');
        expect(screen.getByRole('heading', { name: 'Add a place' })).toBeInTheDocument();
    });

    it('renders the place page at /places/:placeId', () => {
        renderAt('/places/abc');
        expect(screen.getByText('Loading this place.')).toBeInTheDocument();
    });

    it('keeps every page inside a max-w-md column', () => {
        const { container } = renderAt('/sign-in');
        expect(container.querySelector('.max-w-md')).not.toBeNull();
    });
});
