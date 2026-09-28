import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { connect } from "node:net";
import { config } from "dotenv";
if (!existsSync(".env")) {
  await writeFile(
    ".env",
    `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres\nAUTH_SECRET=${randomBytes(48).toString("base64url")}\nAUTH_URL=http://localhost:3000\nAUTH_TRUST_HOST=true\nDEMO_MODE=true\nDEMO_PASSWORD=PulseOps-Demo-2026!\nLOCAL_DB_PORT=54329\n`,
    { mode: 0o600 },
  );
}
config({ quiet: true });
if (process.env.DEMO_MODE !== "true")
  throw new Error("The demo command requires DEMO_MODE=true and a dedicated synthetic database.");
const children = new Set();
let stopping = false;
function start(args) {
  const child = spawn("npm", args, { stdio: "inherit", env: process.env });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}
function run(args) {
  return new Promise((resolve, reject) => {
    const child = start(args);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Command failed: npm ${args.join(" ")}`)),
    );
  });
}
function listening(port) {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  if (await listening(3000))
    throw new Error(
      "Port 3000 is already in use. Stop the existing application before running npm run demo.",
    );
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname === "127.0.0.1" && url.port === "54329" && !(await listening(54329))) {
    start(["run", "db:local"]);
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (await listening(54329)) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error("The local demo database could not start.");
  }
  await run(["run", "db:generate"]);
  await run(["run", "db:migrate"]);
  await run(["run", "db:seed"]);
  await run(["run", "build"]);
  console.log("PulseOps demo: http://localhost:3000 — choose Try demo account.");
  await run(["run", "start"]);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Demo startup failed.");
  process.exitCode = 1;
} finally {
  stop();
}
