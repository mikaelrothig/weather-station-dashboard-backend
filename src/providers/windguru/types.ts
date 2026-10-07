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
    /**
     * The run that should be out at a given time, from the publishing schedule. Decides when to ask Windguru for new
     * runs, and is what's asked for when that lookup fails
     */
    scheduledRun: (at: Date) => string;
}
