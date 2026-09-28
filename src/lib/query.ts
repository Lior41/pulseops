export type SearchParams=Record<string,string|string[]|undefined>;
export function scalarParams(params:SearchParams){return Object.fromEntries(Object.entries(params).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));}
export function pageUrl(path:string,params:SearchParams,page:number){const search=new URLSearchParams();for(const [key,value]of Object.entries(scalarParams(params)))if(value)search.set(key,value);search.set("page",String(page));return `${path}?${search}`;}
