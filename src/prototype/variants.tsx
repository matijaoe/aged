import { useState, type ReactNode } from "react";

import {
  OptionsButton,
  PrivacyNote,
  ResetLink,
  SaveWarning,
  StepCenter,
  StrengthAside,
  WriteInstead,
  type FlowStep,
} from "./flow-parts";
import { Lattice, LatticeRow } from "./lattice";
import { ModeCell, type ModeTreatment } from "./mode-type";
import { CliLine, Wordmark } from "./parts";

export type Layout = "stacked" | "offloaded";

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
 * a rule hang from it. Margin content aligns toward the centre column.
 */
const gutter = "px-4";
const sitsOnRule = "items-end pb-4";
const hangsFromRule = "items-start pt-4";

/** Margin cells are only wide enough to be useful on a roomy viewport. */
const marginVisible = "hidden xl:flex";

function LeftCell({ children }: { children: ReactNode }) {
  return (
    <div className={`w-full justify-end ${marginVisible} ${gutter} ${hangsFromRule}`}>
      {children}
    </div>
  );
}

function RightCell({ children }: { children: ReactNode }) {
  return (
    <div className={`w-full justify-start ${marginVisible} ${gutter} ${hangsFromRule}`}>
      {children}
    </div>
  );
}

/**
 * What each step pushes out to the margins. Below the breakpoint these
 * return nothing and the centre renders them inline instead.
 */
function marginsFor(step: FlowStep): { left: ReactNode; right: ReactNode } {
  if (step === "pick") {
    return {
      left: (
        <LeftCell>
          <WriteInstead align="end" />
        </LeftCell>
      ),
      right: (
        <RightCell>
          <PrivacyNote />
        </RightCell>
      ),
    };
  }
  if (step === "passphrase") {
    return {
      left: (
        <LeftCell>
          <StrengthAside />
        </LeftCell>
      ),
      right: (
        <RightCell>
          <OptionsButton inline={false} />
        </RightCell>
      ),
    };
  }
  return {
    left: (
      <LeftCell>
        <ResetLink align="end" />
      </LeftCell>
    ),
    right: (
      <RightCell>
        <SaveWarning compact />
      </RightCell>
    ),
  };
}

export function App({
  step,
  treatment,
  layout,
}: {
  step: FlowStep;
  treatment: ModeTreatment;
  layout: Layout;
}) {
  const [mode, setMode] = useState("encrypt");
  const offloaded = layout === "offloaded";
  const margins = offloaded ? marginsFor(step) : { left: null, right: null };
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
            {/* Below xl the margins are too narrow, so the centre takes the
                secondary pieces back. */}
            <div className="w-full">
              <div className={offloaded ? "xl:hidden" : "contents"}>
                <StepCenter inline step={step} />
              </div>
              {offloaded && (
                <div className="hidden xl:block">
                  <StepCenter inline={false} step={step} />
                </div>
              )}
            </div>
          </div>
        }
        height={rows.body}
        left={margins.left}
        right={margins.right}
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
