/** How Windguru identifies a spot */
export interface WindguruSpot {
    /** Windguru's spot id */
    id: number;
    /** Model grid point as "lat x lon x altitude" */
    cachefix: string;
    /** GFS-Wave grid point; omitted for spots without ocean waves */
    waveCachefix?: string;
}

export interface WindguruModel {
    id: number;
    name: string;
    /** The run to ask for when Windguru's latest-run lookup fails, worked out from the publishing schedule */
    scheduledRun: () => string;
}
