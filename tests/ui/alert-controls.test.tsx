import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertControls } from "@/features/alerts/alert-controls";
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));
vi.mock("@/app/actions", () => ({
  updateAlertAction: mocks.update,
  createIncidentAction: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const alert = {
  id: "id",
  version: 1,
  status: "OPEN" as const,
  title: "Suspicious sign in",
  description: "Multiple failures detected",
  severity: "HIGH" as const,
  incidentId: null,
};
describe("Alert workflow controls", () => {
  it("shows a read-only explanation for viewers", () => {
    render(<AlertControls alert={alert} allowed={false} />);
    expect(screen.queryByRole("button", { name: /mark investigating/i })).not.toBeInTheDocument();
    expect(screen.getByText(/read.only/i)).toBeInTheDocument();
  });
  it("keeps a failed mutation visible without pretending it succeeded", async () => {
    mocks.update.mockResolvedValue({
      ok: false,
      error: "This alert changed. Refresh before trying again.",
    });
    render(<AlertControls alert={alert} allowed />);
    await userEvent.click(screen.getByRole("button", { name: /mark investigating/i }));
    expect(mocks.error).toHaveBeenCalledWith("This alert changed. Refresh before trying again.");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
