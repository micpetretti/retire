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
  it("renders all eight sliders with default values", () => {
    render(<Calculator />);
    expect(screen.getAllByRole("slider")).toHaveLength(8);
    expect(screen.getByTestId("value-monthlyGap")).toHaveTextContent("2.000 €");
    expect(screen.getByTestId("value-currentAge")).toHaveTextContent("35");
    expect(screen.getByTestId("value-retirementAge")).toHaveTextContent("67");
    expect(screen.getByTestId("value-payoutEndAge")).toHaveTextContent("84");
    expect(screen.getByTestId("value-monthlySavings")).toHaveTextContent("500 €");
    expect(screen.getByTestId("value-annualRate")).toHaveTextContent("4,0 %");
  });

  it("shows the default verdict at 4 %", () => {
    render(<Calculator />);
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
    expect(screen.getByTestId("verdict-sub")).toHaveTextContent("20.138 €");
  });

  it("recomputes live when the real-return slider moves", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const rate = screen.getByRole("slider", {
      name: "Expected yearly return of your ETFs after inflation",
    });
    rate.focus();
    await user.keyboard("{Home}");
    expect(screen.getByTestId("value-annualRate")).toHaveTextContent("0,0 %");
    // 10.000 cash + 10.000 ETF + 384 × 500 € − 408.000 € needed = −196.000 €
    expect(screen.getByTestId("verdict")).toHaveTextContent("Runs out at");
    expect(screen.getByTestId("verdict-sub")).toHaveTextContent("196.000 € short");
    await user.keyboard("{End}");
    expect(screen.getByTestId("value-annualRate")).toHaveTextContent("10,0 %");
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
  });

  it("steps the real-return slider in 0,1 % increments without float noise", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const rate = screen.getByRole("slider", {
      name: "Expected yearly return of your ETFs after inflation",
    });
    rate.focus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(screen.getByTestId("value-annualRate")).toHaveTextContent("3,7 %");
    expect(rate).toHaveAttribute("aria-valuenow", "0.037");
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
    expect(card).toHaveTextContent("Spend 99 € more");
    await user.click(within(card).getByRole("button", { name: /Apply/ }));
    expect(screen.getByTestId("value-monthlyGap")).toHaveTextContent("2.050 €");
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
  });

  it("disables Apply when the solved retirement age rounds up to the current year", () => {
    render(<Calculator />);
    const card = screen.getByTestId("change-retirement");
    expect(card).toHaveTextContent("Retire 5 months earlier");
    expect(within(card).getByRole("button", { name: /Apply \(67\)/ })).toBeDisabled();
    expect(card).toHaveTextContent("Already the closest whole year.");
  });

  it("applies the solved retirement age rounded up to a whole year", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    // Push the return to 10 % so retiring earlier becomes possible.
    const rate = screen.getByRole("slider", {
      name: "Expected yearly return of your ETFs after inflation",
    });
    rate.focus();
    await user.keyboard("{End}");
    const card = screen.getByTestId("change-retirement");
    expect(card).toHaveTextContent(/Retire .* earlier/);
    await user.click(within(card).getByRole("button", { name: /Apply/ }));
    const applied = Number(
      screen.getByTestId("value-retirementAge").textContent?.replace(/\D/g, ""),
    );
    expect(applied).toBeLessThan(67);
    expect(screen.getByTestId("verdict")).toHaveTextContent("Lasts until 84");
  });

  it("shows the Expert toggle as disabled coming soon", () => {
    render(<Calculator />);
    const toggles = screen.getAllByRole("button", { name: /Expert — coming soon/ });
    expect(toggles).toHaveLength(3);
    toggles.forEach((toggle) => expect(toggle).toBeDisabled());
  });
});
