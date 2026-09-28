import "dotenv/config";
import {PGlite} from "@electric-sql/pglite";
import {PGLiteSocketServer} from "@electric-sql/pglite-socket";
import {mkdir} from "node:fs/promises";
await mkdir(".local",{recursive:true});
const port=Number(process.env.LOCAL_DB_PORT??54329);
const database=await PGlite.create(process.env.LOCAL_DB_PATH??".local/pglite");
const server=new PGLiteSocketServer({db:database,host:"127.0.0.1",port,maxConnections:20});
await server.start();
console.log(`Development-only PGlite ready on 127.0.0.1:${port}. Not a production database server.`);
let stopping=false;
async function stop(){if(stopping)return;stopping=true;await server.stop();await database.close();process.exit(0);}
process.on("SIGINT",stop);process.on("SIGTERM",stop);
