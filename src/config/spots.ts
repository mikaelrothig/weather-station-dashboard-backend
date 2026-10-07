import { HttpError } from '../lib/http';
import type { WindguruSpot } from '../providers/windguru/types';

/** Every spot is in South Africa, so "today" for the home page summary starts at midnight here */
export const TIME_ZONE = 'Africa/Johannesburg';

export interface Spot {
    slug: string;
    /** How Windguru identifies this spot. A new provider adds its own block next to it */
    windguru: WindguruSpot;
}

const SPOTS: Record<string, Omit<Spot, 'slug'>> = {
    // First, so it's the spot Windguru's run listing is asked through (providers/windguru/runs.ts)
    blouberg: { windguru: { id: 208276, cachefix: '-33.82x18.47x0', waveCachefix: '-33.854x18.147x0' } },
    hermanus: { windguru: { id: 80216, cachefix: '-34.431x19.231x1', waveCachefix: '-34.674x19.07x1' } },
    langebaan: { windguru: { id: 21691, cachefix: '-33.08x18.03x0' } },
    melkbos: { windguru: { id: 208274, cachefix: '-33.7x18.44x0', waveCachefix: '-33.761x18.143x0' } },
    mistycliffs: { windguru: { id: 208280, cachefix: '-34.18x18.36x75', waveCachefix: '-34.279x18.174x75' } },
    witsand: { windguru: { id: 131707, cachefix: '-34.404x20.854x0', waveCachefix: '-34.709x21.015x0' } },
};

/** Looks a spot up by its URL name ("Misty Cliffs", "mistycliffs") */
export const findSpot = (name: string): Spot => {
    const slug = name.replace(/\s+/g, '').toLowerCase();
    // hasOwn, so names like "constructor" don't match Object's prototype
    if (!Object.hasOwn(SPOTS, slug)) {
        throw new HttpError(404, `Unknown spot: ${name}`);
    }
    return { slug, ...SPOTS[slug] };
};

/** Every configured spot, in the order above */
export const allSpots = (): Spot[] => Object.keys(SPOTS).map(findSpot);
