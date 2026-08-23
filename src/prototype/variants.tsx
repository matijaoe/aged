import { useState } from "react";

import { PassphraseContent, PickContent, ResultContent, type FlowStep } from "./flow-parts";
import { Lattice, LatticeRow } from "./lattice";
import { ModeCell, type ModeTreatment } from "./mode-type";
import { CliLine, Wordmark } from "./parts";

/** Fixed bands: the body absorbs the viewport, so no rule ever moves. */
const rows = {
  top: "h-36",
  bottom: "h-28",
} as const;

/** One padding scale for every cell, so content lines up across rows. */
const cellPadding = "px-6";

function Body({ step }: { step: FlowStep }) {
  if (step === "pick") {
    return <PickContent dropSurface="bare" />;
  }
  if (step === "passphrase") {
    return <PassphraseContent surface="bare" />;
  }
  return <ResultContent surface="bare" />;
}

export function App({ step, treatment }: { step: FlowStep; treatment: ModeTreatment }) {
  const [mode, setMode] = useState("encrypt");
  return (
    <Lattice>
      <LatticeRow
        center={<ModeCell mode={mode} onChange={setMode} treatment={treatment} />}
        height={rows.top}
        left={
          <div className={`flex w-full items-end justify-end pb-8 ${cellPadding}`}>
            <Wordmark align="end" />
          </div>
        }
      />
      <LatticeRow
        center={
          <div className={`flex w-full items-center ${cellPadding}`}>
            <div className="w-full">
              <Body step={step} />
            </div>
          </div>
        }
        grow
        rule
      />
      <LatticeRow
        center={
          <div className={`flex w-full items-center ${cellPadding}`}>
            <CliLine />
          </div>
        }
        height={rows.bottom}
        rule
      />
    </Lattice>
  );
}
