export const geography:Record<string,{name:string;coordinates:[number,number]}>={
  US:{name:"United States",coordinates:[-98,38]},GB:{name:"United Kingdom",coordinates:[-2,54]},DE:{name:"Germany",coordinates:[10,51]},FR:{name:"France",coordinates:[2,47]},IL:{name:"Israel",coordinates:[35,31]},NL:{name:"Netherlands",coordinates:[5,52]},JP:{name:"Japan",coordinates:[138,36]},SG:{name:"Singapore",coordinates:[104,1]},CA:{name:"Canada",coordinates:[-105,56]},AU:{name:"Australia",coordinates:[134,-25]},BR:{name:"Brazil",coordinates:[-52,-14]},IN:{name:"India",coordinates:[79,22]},RU:{name:"Russia",coordinates:[96,61]},ZA:{name:"South Africa",coordinates:[25,-29]},
};
export function countryName(code:string|null){return code?geography[code]?.name??code:"Unknown";}
