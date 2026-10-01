import { useContext } from 'react';
import { SessionContext, type SessionValue } from './SessionContext';

export const useSession = (): SessionValue => {
    const value = useContext(SessionContext);
    if (!value) throw new Error('useSession must be used inside SessionProvider');
    return value;
};
