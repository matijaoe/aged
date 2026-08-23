import type { ReactElement } from "react";

import { PassphraseContent, PickContent, ResultContent, type FlowStep } from "./flow-parts";
import { GridLines } from "./grid-lines";
import { Lattice, LatticeRow } from "./lattice";
import { ModeType } from "./mode-type";
import { CliLine, ModeSwitchLg, Wordmark } from "./parts";

export interface Variant {
  id: string;
  name: string;
  note: string;
  render: (step: FlowStep) => ReactElement;
}

/** Row heights are fixed, so no rule moves when the step changes. */
const rows = {
  top: "h-36",
  body: "h-[27rem]",
  bottom: "h-28",
} as const;

function Body({ step, surface }: { step: FlowStep; surface: "card" | "bare" }) {
  if (step === "pick") {
    return <PickContent dropSurface={surface} />;
  }
  if (step === "passphrase") {
    return <PassphraseContent surface={surface} />;
  }
  return <ResultContent surface={surface} />;
}

/** O — title in the left cell, mode alone in the top-centre cell. */
function ThreeColumn(step: FlowStep) {
  return (
    <Lattice>
      <LatticeRow
        center={
          <div className="flex w-full items-end justify-center px-8 pb-7">
            <ModeType />
          </div>
        }
        height={rows.top}
        left={
          <div className="flex w-full items-end justify-end px-8 pb-8">
            <Wordmark align="end" />
          </div>
        }
      />
      <LatticeRow
        center={
          <div className="flex w-full items-center px-8">
            <div className="w-full">
              <Body step={step} surface="bare" />
            </div>
          </div>
        }
        height={rows.body}
        rule
      />
      <LatticeRow
        center={
          <div className="flex w-full items-start px-8 pt-7">
            <CliLine />
          </div>
        }
        height={rows.bottom}
        rule
      />
    </Lattice>
  );
}

/** P — same lattice, title left-aligned in its cell instead of against the rule. */
function ThreeColumnLeftAligned(step: FlowStep) {
  return (
    <Lattice>
      <LatticeRow
        center={
          <div className="flex w-full items-end justify-center px-8 pb-7">
            <ModeType />
          </div>
        }
        height={rows.top}
        left={
          <div className="flex w-full items-end px-8 pb-8">
            <Wordmark />
          </div>
        }
      />
      <LatticeRow
        center={
          <div className="flex w-full items-center px-8">
            <div className="w-full">
              <Body step={step} surface="bare" />
            </div>
          </div>
        }
        height={rows.body}
        rule
      />
      <LatticeRow
        center={
          <div className="flex w-full items-start px-8 pt-7">
            <CliLine />
          </div>
        }
        height={rows.bottom}
        rule
      />
    </Lattice>
  );
}

/** A — the earlier single-cell version, for reference. */
function GridIsTheCard(step: FlowStep) {
  return (
    <div className="w-full max-w-lg">
      <GridLines className="px-8 py-9">
        <div className="flex flex-col gap-6">
          <Wordmark />
          <ModeSwitchLg />
          <Body step={step} surface="bare" />
        </div>
      </GridLines>
      <CliLine className="px-8 pt-4" />
    </div>
  );
}

export const variants: Variant[] = [
  {
    id: "three-column",
    name: "O · Left title, mode centre",
    note: "Four rules, three columns. Identity in the left cell against the rule, mode alone in the top-centre cell, work in the centre, command bottom-centre.",
    render: ThreeColumn,
  },
  {
    id: "three-column-left",
    name: "P · Same, title left-aligned",
    note: "Identical lattice with the identity aligned to its cell's leading edge instead of against the rule.",
    render: ThreeColumnLeftAligned,
  },
  {
    id: "grid",
    name: "A · Everything inside",
    note: "Where we started, for reference.",
    render: GridIsTheCard,
  },
];
