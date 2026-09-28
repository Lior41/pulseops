import "dotenv/config";
import { tick } from "../src/server/simulation/tick";
import { db } from "../src/server/db";
if (process.env.DEMO_MODE !== "true") throw new Error("Simulator requires DEMO_MODE=true.");
let active = true;
process.on("SIGINT", () => {
  active = false;
});
process.on("SIGTERM", () => {
  active = false;
});
console.log("PulseOps simulator: synthetic events only.");
while (active) {
  try {
    await tick();
  } catch (error) {
    console.error("Simulation tick failed", error instanceof Error ? error.message : "unknown");
  }
  await new Promise((r) => setTimeout(r, 4000));
}
await db.$disconnect();
