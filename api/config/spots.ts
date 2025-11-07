export interface SpotConfig {
    id_spot: number;
    cachefix: string;
    cachefixWave?: string;
}

export const SPOT_CONFIG: Record<string, SpotConfig> = {
    blouberg: { id_spot: 208276, cachefix: '-33.82x18.47x0', cachefixWave: '-33.854x18.147x0' },
    hermanus: { id_spot: 80216, cachefix: '-34.431x19.231x1', cachefixWave: '-34.674x19.07x1'},
    langebaan: { id_spot: 21691, cachefix: '-33.08x18.03x0' },
    mistycliffs: { id_spot: 208280, cachefix: '-34.18x18.36x75', cachefixWave: '-34.279x18.174x75' },
    witsand: { id_spot: 131707, cachefix: '-34.404x20.854x0', cachefixWave: '-34.709x21.015x0' },
};