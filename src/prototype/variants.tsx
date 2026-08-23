import { useState } from "react";

import { StepCenter, type FlowStep } from "./flow-parts";
import { Lattice, LatticeRow } from "./lattice";
import { ModeCell, type ModeTreatment } from "./mode-type";
import { CliLine, Wordmark } from "./parts";

/**
 * Every band is a fixed height — the body sized for the tallest step — and
 * the whole composition is centred, so the slack lives outside the rules
 * rather than as a void inside a cell.
 */
const rows = {
  top: "h-32",
  body: "h-[28rem]",
  bottom: "h-24",
} as const;

/**
 * One gutter for every cell. Content anchors to the rules of the centre
 * rectangle rather than floating: cells above a rule sit on it, cells below
 * a rule hang from it. The flow itself stays in the centre column; the
 * margins carry identity only.
 */
const gutter = "px-4";
const sitsOnRule = "items-end pb-4";
const hangsFromRule = "items-start pt-4";

export function App({ step, treatment }: { step: FlowStep; treatment: ModeTreatment }) {
  const [mode, setMode] = useState("encrypt");
  return (
    <Lattice>
      <LatticeRow
        center={<ModeCell mode={mode} onChange={setMode} treatment={treatment} />}
        height={rows.top}
        left={
          <div className={`flex w-full justify-end ${gutter} ${sitsOnRule}`}>
            <Wordmark align="end" />
          </div>
        }
      />
      <LatticeRow
        center={
          <div className={`flex w-full ${gutter} ${hangsFromRule}`}>
            <StepCenter inline step={step} />
          </div>
        }
        height={rows.body}
        rule
      />
      <LatticeRow
        center={
          <div className={`flex w-full ${gutter} ${hangsFromRule}`}>
            <CliLine />
          </div>
        }
        height={rows.bottom}
        rule
      />
    </Lattice>
  );
}
