import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

describe('App', () => {
    it('renders the landing page at /', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        );
        expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });
});
