import { fitWithin } from './images';

describe('fitWithin', () => {
    it('leaves an image that already fits untouched', () => {
        expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    });

    it('scales the long edge down and keeps the ratio', () => {
        expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
        expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
    });

    it('never returns a zero-sized edge', () => {
        expect(fitWithin(10000, 1, 100)).toEqual({ width: 100, height: 1 });
    });
});
