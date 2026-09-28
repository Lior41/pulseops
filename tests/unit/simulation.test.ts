import { it, expect } from "vitest";
import { generateEvent } from "@/server/simulation/generator";
import { eventTypes } from "@/lib/domain";
it("generates varied, deterministic synthetic events with common logins and rare malware", () => {
  const events = Array.from({ length: 1000 }, (_, i) =>
    generateEvent(i, { id: "identity", homeCountry: "FR" }, null, new Date(0)),
  );
  expect(new Set(events.map((e) => e.type)).size).toBe(eventTypes.length);
  expect(events.filter((e) => e.type === "NORMAL_LOGIN").length).toBeGreaterThan(550);
  expect(events.filter((e) => e.type === "MALWARE_DETECTED").length).toBeLessThan(25);
  expect(events[0]).toEqual(
    generateEvent(0, { id: "identity", homeCountry: "FR" }, null, new Date(0)),
  );
  expect(events.every((e) => e.source === "pulseops-simulator")).toBe(true);
});
