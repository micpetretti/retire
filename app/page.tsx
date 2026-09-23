import { Calculator } from "@/components/calculator/Calculator";
import { ASSUMPTIONS, DISCLAIMER_LINE, DISCLAIMER_SHORT, TAGLINE } from "@/lib/copy";

export default function Page() {
  return (
    <>
      <a
        href="#main"
        className="border-brut sr-only bg-acid px-4 py-2 font-sans font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to calculator
      </a>

      <header className="mx-auto w-full max-w-[1200px] px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:pb-12 lg:pt-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-[2.5rem] uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Can I afford
              <br />
              to retire?
            </h1>
            <p className="mt-5 max-w-xl font-sans text-lg font-medium sm:text-xl">
              {TAGLINE}
            </p>
          </div>
          <span
            className="border-brut uppercase-label inline-block w-fit -rotate-3 bg-sun px-3 py-2 font-sans text-xs shadow-hard-sm sm:text-sm"
            aria-label={DISCLAIMER_SHORT}
          >
            {DISCLAIMER_SHORT}
          </span>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-32 sm:px-6 lg:pb-16"
      >
        <Calculator />
      </main>

      <footer className="border-brut-t bg-ink px-4 py-10 text-paper sm:px-6">
        <div className="mx-auto w-full max-w-[1200px]">
          <h2 className="uppercase-label font-sans text-sm">
            What this illustration assumes
          </h2>
          <ul className="mt-4 grid gap-x-10 gap-y-2 font-mono text-sm font-bold sm:grid-cols-2">
            {ASSUMPTIONS.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true">■</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl font-sans text-sm font-medium">
            {DISCLAIMER_LINE}
          </p>
        </div>
      </footer>
    </>
  );
}
