export interface LocationConfig {
    id_spot: number;
    cachefix: string;
}

export const LOCATION_CONFIG: Record<string, LocationConfig> = {
    blouberg: { id_spot: 208276, cachefix: '-33.82x18.47x0' },
    langebaan: { id_spot: 21691, cachefix: '-33.08x18.03x0' },
    witsand: { id_spot: 131707, cachefix: '-34.404x20.854x0' },
    mistycliffs: { id_spot: 208280, cachefix: '-34.18x18.36x75' },
};