const now = new Date();
let year = now.getUTCFullYear();
let month = now.getUTCMonth() + 1;
let day = now.getUTCDate();
const hour = now.getUTCHours();

// Postpone Date update untill next rundef refresh
const userUtcOffset = new Date().getTimezoneOffset() / -60;
const localHour = (hour + userUtcOffset + 24) % 24;

// Check if local time is between 00:00 and 08:00
if (localHour >= 0 && localHour < 8) {
    const prevDate = new Date(now);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    year = prevDate.getUTCFullYear();
    month = prevDate.getUTCMonth() + 1;
    day = prevDate.getUTCDate();
}

const formattedYear = year;
const formattedMonth = String(month).padStart(2, '0');
const formattedDay = String(day).padStart(2, '0');

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

export const generateWRFRundef = (): string => {
    return `${formattedYear}${formattedMonth}${formattedDay}${wrfRundefSuffix[hour]}`;
};

export const generateGFSRundef = (): string => {
    return `${formattedYear}${formattedMonth}${formattedDay}${gfsRundefSuffix[hour][0]}-${formattedYear}${formattedMonth}${formattedDay}${gfsRundefSuffix[hour][1]}`;
};