import { HttpError } from '../lib/http';
import type { WindguruSpot } from '../providers/windguru/types';

/** Providers choose their regional high-resolution model by this */
export type Region = 'south-africa' | 'netherlands';

export interface Spot {
    slug: string;
    region: Region;
    /** Lakes like the IJsselmeer have no tide, even where a provider reports harmonics */
    tides: boolean;
    /** How Windguru identifies this spot. A new provider adds its own block next to it */
    windguru: WindguruSpot;
}

type SpotConfig = Omit<Spot, 'slug' | 'tides'> & { tides?: boolean };

const SPOTS: Record<string, SpotConfig> = {
    blouberg: { region: 'south-africa', windguru: { id: 208276, cachefix: '-33.82x18.47x0', waveCachefix: '-33.854x18.147x0' } },
    hermanus: { region: 'south-africa', windguru: { id: 80216, cachefix: '-34.431x19.231x1', waveCachefix: '-34.674x19.07x1' } },
    langebaan: { region: 'south-africa', windguru: { id: 21691, cachefix: '-33.08x18.03x0' } },
    mistycliffs: { region: 'south-africa', windguru: { id: 208280, cachefix: '-34.18x18.36x75', waveCachefix: '-34.279x18.174x75' } },
    witsand: { region: 'south-africa', windguru: { id: 131707, cachefix: '-34.404x20.854x0', waveCachefix: '-34.709x21.015x0' } },

    wijkaanzee: { region: 'netherlands', windguru: { id: 1120682, cachefix: '52.494x4.584x0', waveCachefix: '52.532x4.288x0' } },
    ijmuiden: { region: 'netherlands', windguru: { id: 48299, cachefix: '52.455x4.555x0', waveCachefix: '52.495x4.32x0' } },
    zandvoort: { region: 'netherlands', windguru: { id: 19439, cachefix: '52.386x4.531x0', waveCachefix: '52.452x4.259x0' } },
    noordwijk: { region: 'netherlands', windguru: { id: 575, cachefix: '52.248x4.43x0', waveCachefix: '52.335x4.184x0' } },
    scheveningen: { region: 'netherlands', windguru: { id: 572, cachefix: '52.107x4.265x0', waveCachefix: '52.217x4.006x0' } },
    brouwersdam: { region: 'netherlands', windguru: { id: 97, cachefix: '51.766x3.847x0', waveCachefix: '51.779x3.822x0' } },
    domburg: { region: 'netherlands', windguru: { id: 48324, cachefix: '51.557x3.476x9', waveCachefix: '51.661x3.341x9' } },
    workum: { region: 'netherlands', tides: false, windguru: { id: 48267, cachefix: '52.967x5.413x1' } },
    mirns: { region: 'netherlands', tides: false, windguru: { id: 3642, cachefix: '52.854x5.451x1' } },
    makkum: { region: 'netherlands', tides: false, windguru: { id: 48265, cachefix: '53.053x5.38x1' } },
};

/** Looks a spot up by its URL name ("Misty Cliffs", "mistycliffs") */
export const findSpot = (name: string): Spot => {
    const slug = name.replace(/\s+/g, '').toLowerCase();
    // hasOwn, so names like "constructor" don't match Object's prototype
    if (!Object.hasOwn(SPOTS, slug)) {
        throw new HttpError(404, `Unknown spot: ${name}`);
    }

    const config = SPOTS[slug];
    return { slug, ...config, tides: config.tides ?? true };
};
