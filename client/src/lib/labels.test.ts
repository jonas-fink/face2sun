import { presenceLabel, safeNextPath, signInPath, spotsLabel } from './labels';

describe('labels', () => {
    it('shows Quiet for zero and a count otherwise', () => {
        expect(presenceLabel(0)).toBe('Quiet');
        expect(presenceLabel(2)).toBe('2 here');
    });

    it('formats spots as taken of cap', () => {
        expect(spotsLabel({ spotsTaken: 2, cap: 4 })).toBe('2 of 4');
    });

    it('only follows same-site next paths', () => {
        expect(safeNextPath('/places/abc')).toBe('/places/abc');
        expect(safeNextPath(null)).toBe('/');
        expect(safeNextPath('https://example.com')).toBe('/');
        expect(safeNextPath('//example.com')).toBe('/');
        expect(safeNextPath('/\\example.com')).toBe('/');
    });

    it('encodes the next path for sign-in', () => {
        expect(signInPath('/places/abc')).toBe('/sign-in?next=%2Fplaces%2Fabc');
    });
});
