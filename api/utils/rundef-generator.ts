const wrfRundefSuffix: string[] = [
    '12x0x78x0x78', //00
    '18x0x78x0x78', //01
    '18x0x78x0x78', //02
    '18x0x78x0x78', //03
    '18x0x78x0x78', //04
    '18x0x78x0x78', //05
    '18x0x78x0x78', //06
    '00x0x78x0x78', //07
    '00x0x78x0x78', //08
    '00x0x78x0x78', //09
    '00x0x78x0x78', //10
    '00x0x78x0x78', //11
    '00x0x78x0x78', //12
    '06x0x78x0x78', //13
    '06x0x78x0x78', //14
    '06x0x78x0x78', //15
    '06x0x78x0x78', //16
    '06x0x78x0x78', //17
    '06x0x78x0x78', //18
    '12x0x78x0x78', //19
    '12x0x78x0x78', //20
    '12x0x78x0x78', //21
    '12x0x78x0x78', //22
    '12x0x78x0x78'  //23
];

const gfsRundefSuffix: string[][] = [
    ['18x0x240x0x240','12x243x384x249x384'], //00
    ['18x0x240x0x240','12x243x384x249x384'], //01
    ['18x0x240x0x240','12x243x384x249x384'], //02
    ['18x0x240x0x240','12x243x384x249x384'], //03
    ['18x0x240x0x240','12x243x384x249x384'], //04
    ['00x0x240x0x240','00x243x384x243x384'], //05
    ['00x0x240x0x240','00x243x384x243x384'], //06
    ['00x0x240x0x240','00x243x384x243x384'], //07
    ['00x0x240x0x240','00x243x384x243x384'], //08
    ['00x0x240x0x240','00x243x384x243x384'], //09
    ['00x0x240x0x240','00x243x384x243x384'], //10
    ['06x0x240x0x240','00x243x384x249x384'], //11
    ['06x0x240x0x240','00x243x384x249x384'], //12
    ['06x0x240x0x240','00x243x384x249x384'], //13
    ['06x0x240x0x240','00x243x384x249x384'], //14
    ['06x0x240x0x240','00x243x384x249x384'], //15
    ['06x0x240x0x240','00x243x384x249x384'], //16
    ['12x0x240x0x240','00x243x384x255x384'], //17
    ['12x0x240x0x240','12x243x384x243x384'], //18
    ['12x0x240x0x240','12x243x384x243x384'], //19
    ['12x0x240x0x240','12x243x384x243x384'], //20
    ['12x0x240x0x240','12x243x384x243x384'], //21
    ['12x0x240x0x240','12x243x384x243x384'], //22
    ['18x0x240x0x240','12x243x384x249x384']  //23
];

function getDate(updateDay: number): {year: number; month: string; day: string; hour: number} {
    const now = new Date();
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth() + 1;
    let day = now.getUTCDate();
    const hour = now.getUTCHours();

    if (hour < updateDay) {
        const prevDay = new Date(now);
        prevDay.setUTCDate(now.getUTCDate() - 1);
        year = prevDay.getUTCFullYear();
        month = prevDay.getUTCMonth() + 1;
        day = prevDay.getUTCDate();
    }

    return {
        year,
        month: String(month).padStart(2, '0'),
        day: String(day).padStart(2, '0'),
        hour: hour
    };
}

export const generateWRFRundef = (): string => {
    const date = getDate(8);
    return `${date.year}${date.month}${date.day}${wrfRundefSuffix[date.hour]}`;
};

export const generateGFSRundef = (): string => {
    const date = getDate(6);
    return `${date.year}${date.month}${date.day}${gfsRundefSuffix[date.hour][0]}-${date.year}${date.month}${date.day}${gfsRundefSuffix[date.hour][1]}`;
};