const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, '0');
const day = String(now.getUTCDate()).padStart(2, '0');
const hour = now.getUTCHours();

const gfsRundefSuffix: string[][] = [
    ['12x0x240x0x240','12x243x384x243x384'], //00
    ['18x0x240x0x240','12x243x384x249x384'], //01
    ['18x0x240x0x240','12x243x384x249x384'], //02
    ['18x0x240x0x240','12x243x384x249x384'], //03 ?
    ['18x0x240x0x240','12x243x384x249x384'], //04 ?
    ['18x0x240x0x240','12x243x384x249x384'], //05 ?
    ['18x0x240x0x240','12x243x384x249x384'], //06 ?
    ['00x0x240x0x240','00x243x384x243x384'], //07
    ['00x0x240x0x240','00x243x384x243x384'], //08
    ['00x0x240x0x240','00x243x384x243x384'], //09
    ['00x0x240x0x240','00x243x384x243x384'], //10
    ['00x0x240x0x240','00x243x384x243x384'], //11
    ['00x0x240x0x240','00x243x384x243x384'], //12
    ['06x0x240x0x240','00x243x384x249x384'], //13
    ['06x0x240x0x240','00x243x384x249x384'], //14
    ['06x0x240x0x240','00x243x384x249x384'], //15
    ['06x0x240x0x240','00x243x384x249x384'], //16
    ['12x0x240x0x240','00x243x384x249x384'], //17
    ['12x0x240x0x240','00x243x384x249x384'], //18
    ['12x0x240x0x240','00x243x384x255x384'], //19
    ['12x0x240x0x240','12x243x384x243x384'], //20
    ['12x0x240x0x240','12x243x384x243x384'], //21
    ['12x0x240x0x240','12x243x384x243x384'], //22
    ['12x0x240x0x240','12x243x384x243x384']  //23
];

export const generateGFSRundef = (): string => {
    const rundef = `${year}${month}${day}${gfsRundefSuffix[hour][0]}-${year}${month}${day}${gfsRundefSuffix[hour][1]}`
    console.log(rundef);

    return rundef;
};