import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calculator, reducer } from "@/components/calculator/Calculator";
import { DEFAULT_INPUTS } from "@/lib/defaults";

// jsdom lacks these browser APIs used by Radix Slider and the mobile bar.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
Element.prototype.scrollIntoView = vi.fn();

const initial = {
  inputs: DEFAULT_INPUTS,
  flashes: { currentAge: 0, retirementAge: 0, payoutEndAge: 0 },
};

describe("Calculator reducer", () => {
  it("updates a money slider without touching anything else", () => {
    const next = reducer(initial, { type: "set", field: "cash", value: 50_000 });
    expect(next.inputs.cash).toBe(50_000);
    expect(next.inputs.retirementAge).toBe(67);
    expect(next.flashes).toEqual(initial.flashes);
  });

  it("pushes retirement age and flashes it when current age catches up", () => {
    const next = reducer(initial, { type: "set", field: "currentAge", value: 67 });
    expect(next.inputs.currentAge).toBe(67);
    expect(next.inputs.retirementAge).toBe(68);
    expect(next.flashes.retirementAge).toBe(1);
    expect(next.flashes.payoutEndAge).toBe(0);
  });

  it("increments the flash counter on every push", () => {
    const once = reducer(initial, { type: "set", field: "currentAge", value: 67 });
    const twice = reducer(once, { type: "set", field: "currentAge", value: 68 });
    expect(twice.flashes.retirementAge).toBe(2);
  });

  it("does not flash when nothing was pushed", () => {
    const next = reducer(initial, { type: "set", field: "currentAge", value: 20 });
    expect(next.flashes.retirementAge).toBe(0);
  });
});

describe("Calculator UI", () => {
  it("renders all seven sliders with default values", () => {
    render(<Calculator />);
    expect(screen.getAllByRole("slider")).toHaveLength(7);
    expect(screen.getByTestId("value-monthlyGap")).toHaveTextContent("2.000 €");
    expect(screen.getByTestId("value-currentAge")).toHaveTextContent("35");
    expect(screen.getByTestId("value-retirementAge")).toHaveTextContent("67");
    expect(screen.getByTestId("value-payoutEndAge")).toHaveTextContent("84");
    expect(screen.getByTestId("value-monthlySavings")).toHaveTextContent("500 €");
  });

  it("shows the default verdict", () => {
    render(<Calculator />);
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
    expect(screen.getByTestId("verdict-sub")).toHaveTextContent("111.705 €");
  });

  it("pushes retirement age with the keyboard when current age reaches it", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const currentAge = screen.getByRole("slider", { name: "Your current age" });
    currentAge.focus();
    await user.keyboard("{End}");
    expect(screen.getByTestId("value-currentAge")).toHaveTextContent("98");
    expect(screen.getByTestId("value-retirementAge")).toHaveTextContent("99");
    expect(screen.getByTestId("value-payoutEndAge")).toHaveTextContent("100");
    expect(screen.getByTestId("flash-retirementAge")).toBeInTheDocument();
  });

  it("pulls retirement age down when payout end drops below it", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const payoutEnd = screen.getByRole("slider", {
      name: "Age until which your savings must last",
    });
    payoutEnd.focus();
    await user.keyboard("{Home}");
    expect(screen.getByTestId("value-payoutEndAge")).toHaveTextContent("2");
    expect(screen.getByTestId("value-retirementAge")).toHaveTextContent("1");
    expect(screen.getByTestId("value-currentAge")).toHaveTextContent("0");
  });

  it("opens the help popover with the long description", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await user.click(screen.getByRole("button", { name: "Explain paid until" }));
    expect(
      await screen.findByText(/average life expectancy of women in Germany/),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByText(/average life expectancy of women in Germany/),
    ).not.toBeInTheDocument();
  });

  it("applies the solved monthly gap and lands on a plan that still lasts", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const card = screen.getByTestId("change-spending");
    expect(card).toHaveTextContent("Spend 548 € more");
    await user.click(within(card).getByRole("button", { name: /Apply/ }));
    expect(screen.getByTestId("value-monthlyGap")).toHaveTextContent("2.500 €");
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
  });

  it("applies the solved retirement age rounded up to a whole year", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const card = screen.getByTestId("change-retirement");
    expect(card).toHaveTextContent("Retire 2 years 1 month earlier");
    await user.click(within(card).getByRole("button", { name: /Apply/ }));
    expect(screen.getByTestId("value-retirementAge")).toHaveTextContent("65");
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
  });

  it("shows the Expert toggle as disabled coming soon", () => {
    render(<Calculator />);
    const toggles = screen.getAllByRole("button", { name: /Expert — coming soon/ });
    expect(toggles).toHaveLength(3);
    toggles.forEach((toggle) => expect(toggle).toBeDisabled());
  });
});
