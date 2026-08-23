import type { ReactElement, ReactNode } from "react";

import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control";
import { cn } from "@/lib/utils";
import { Card, CardFrame, CardFrameFooter, CardPanel } from "@/components/ui/card";
import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";
import { PassphraseContent, PickContent, ResultContent, type FlowStep } from "./flow-parts";
import { GridLines } from "./grid-lines";
import { CliLine, ModeSwitchLg, Wordmark } from "./parts";

export interface Variant {
  id: string;
  name: string;
  note: string;
  render: (step: FlowStep) => ReactElement;
}

function Body({ step, surface }: { step: FlowStep; surface: "card" | "bare" }) {
  if (step === "pick") {
    return <PickContent dropSurface={surface} />;
  }
  if (step === "passphrase") {
    return <PassphraseContent surface={surface} />;
  }
  return <ResultContent surface={surface} />;
}

/** Mode as two grid cells: the switch is drawn by the chassis, not a pill. */
function ModeCells() {
  const cell =
    "flex cursor-pointer select-none items-center border-l px-6 font-medium text-base text-muted-foreground/72 transition-colors hover:text-muted-foreground data-checked:bg-accent data-checked:text-foreground";
  return (
    <RadioGroupPrimitive aria-label="Mode" className="flex items-stretch" defaultValue="encrypt">
      <RadioPrimitive.Root className={cell} value="encrypt">
        Encrypt
      </RadioPrimitive.Root>
      <RadioPrimitive.Root className={cell} value="decrypt">
        Decrypt
      </RadioPrimitive.Root>
    </RadioGroupPrimitive>
  );
}

function Chassis({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full max-w-xl">
      <GridLines className="flex flex-col">
        {header}
        <div className="border-t px-7 py-7">{children}</div>
        <div className="border-t px-7 py-4">
          <CliLine />
        </div>
      </GridLines>
    </div>
  );
}

/** A — the original: one cell, everything stacked, CLI below the lines. */
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

/** F — header row split into cells: identity left, mode right. */
function ChassisSegmented(step: FlowStep) {
  return (
    <Chassis
      header={
        <div className="flex items-stretch">
          <div className="flex-1 px-7 py-5">
            <Wordmark />
          </div>
          <div className="flex items-center border-l px-5">
            <div className={cn(segmentedControlRootClassName)}>
              <RadioGroupPrimitive aria-label="Mode" className="flex gap-0.5" defaultValue="encrypt">
                <RadioPrimitive.Root
                  className={segmentedControlItemVariants({ size: "default", state: "checked" })}
                  value="encrypt"
                >
                  Encrypt
                </RadioPrimitive.Root>
                <RadioPrimitive.Root
                  className={segmentedControlItemVariants({ size: "default", state: "checked" })}
                  value="decrypt"
                >
                  Decrypt
                </RadioPrimitive.Root>
              </RadioGroupPrimitive>
            </div>
          </div>
        </div>
      }
    >
      <Body step={step} surface="card" />
    </Chassis>
  );
}

/** G — the mode switch is itself two cells of the grid. */
function ChassisModeCells(step: FlowStep) {
  return (
    <Chassis
      header={
        <div className="flex items-stretch">
          <div className="flex-1 px-7 py-5">
            <Wordmark />
          </div>
          <ModeCells />
        </div>
      }
    >
      <Body step={step} surface="card" />
    </Chassis>
  );
}

/** H — grid chassis, but content sits bare; only the grid draws structure. */
function ChassisBare(step: FlowStep) {
  return (
    <Chassis
      header={
        <div className="flex items-stretch">
          <div className="flex-1 px-7 py-5">
            <Wordmark />
          </div>
          <ModeCells />
        </div>
      }
    >
      <Body step={step} surface="bare" />
    </Chassis>
  );
}

/** D — page-level grid, card floating free (kept for comparison). */
function PageGrid(step: FlowStep) {
  return (
    <div className="relative w-full max-w-5xl">
      <GridLines className="px-10 py-16">
        <div className="mx-auto w-full max-w-md">
          <CardFrame>
            <Card>
              <CardPanel className="flex flex-col gap-6 py-6">
                <ModeSwitchLg />
                <Body step={step} surface="bare" />
              </CardPanel>
            </Card>
            <CardFrameFooter>
              <CliLine />
            </CardFrameFooter>
          </CardFrame>
        </div>
      </GridLines>
    </div>
  );
}

export const variants: Variant[] = [
  {
    id: "grid",
    name: "A · Grid is the card",
    note: "One cell, everything stacked, CLI outside the rectangle. Where we left off.",
    render: GridIsTheCard,
  },
  {
    id: "chassis-segmented",
    name: "F · Cells + segmented",
    note: "Identity cell left, segmented control in its own cell right, content in cards, CLI cell at the bottom.",
    render: ChassisSegmented,
  },
  {
    id: "chassis-cells",
    name: "G · Mode as cells",
    note: "The switch IS the grid: two header cells, the active one lit. Content in cards.",
    render: ChassisModeCells,
  },
  {
    id: "chassis-bare",
    name: "H · Cells, no cards",
    note: "Same chassis as G with the content bare — grid does all the structural work.",
    render: ChassisBare,
  },
  {
    id: "page-grid",
    name: "D · Page grid + card",
    note: "Lines as page furniture, CardFrame floating free. Kept for comparison.",
    render: PageGrid,
  },
];
