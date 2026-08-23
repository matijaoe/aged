import {
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FileUpIcon,
  PenLineIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";

/**
 * The three steps as static markup. Secondary pieces are separable so a
 * layout can either stack them in the centre column or offload them to the
 * margin cells the lattice already provides.
 */

export type FlowStep = "pick" | "passphrase" | "result";

export interface StepOptions {
  /** Render the secondary pieces inline; false when a margin cell has them. */
  inline: boolean;
}

/* ---------- pick ---------- */

export function DropZone() {
  return (
    <button
      className="flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border border-dashed px-6 py-14 transition-colors hover:bg-accent/40"
      type="button"
    >
      <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
      <span className="font-medium text-base">Drop a file anywhere, or browse</span>
      <span className="text-muted-foreground text-sm">Up to 100 MB</span>
    </button>
  );
}

export function WriteInstead({ align = "center" }: { align?: "center" | "end" }) {
  return (
    <Button className={align === "center" ? "self-center" : "-me-2"} variant="ghost">
      <PenLineIcon aria-hidden="true" />
      Write a message instead
    </Button>
  );
}

export function PrivacyNote() {
  return (
    <p className="text-balance text-muted-foreground/72 text-sm leading-relaxed">
      Nothing leaves your browser.
    </p>
  );
}

function PickCenter({ inline }: StepOptions) {
  return (
    <div className="flex w-full flex-col gap-5">
      <DropZone />
      {inline && <WriteInstead />}
    </div>
  );
}

/* ---------- passphrase ---------- */

export function StrengthAside({ align = "end" }: { align?: "start" | "end" }) {
  return (
    <div
      className={`flex w-full flex-col gap-2 ${align === "end" ? "items-end text-right" : "items-start"}`}
    >
      <Meter aria-label="Passphrase strength" className="w-full max-w-48" max={128} value={98}>
        <MeterTrack className="h-1 rounded-full bg-border">
          <MeterIndicator className="rounded-full bg-success" />
        </MeterTrack>
      </Meter>
      <span className="text-muted-foreground text-xs tabular-nums">≈98 bits</span>
    </div>
  );
}

export function OptionsButton({ inline }: { inline: boolean }) {
  return (
    <Button
      aria-label="Passphrase options"
      className={inline ? undefined : "-ms-2"}
      size={inline ? "icon-lg" : "sm"}
      variant={inline ? "outline" : "ghost"}
    >
      <SlidersHorizontalIcon aria-hidden="true" />
      {!inline && "Options"}
    </Button>
  );
}

function PassphraseCenter({ inline }: StepOptions) {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 py-2.5 pe-2 ps-3.5">
        <FileIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-base">report.pdf</span>
        <span className="shrink-0 text-muted-foreground text-sm tabular-nums">2.4 MB</span>
        <Button aria-label="Remove" size="icon-xs" variant="ghost">
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      <Field className="flex w-full flex-col gap-2.5">
        <FieldLabel className="text-base">Passphrase</FieldLabel>
        <div className="flex w-full gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput defaultValue="tiger mountain sunset" size="lg" type="password" />
            <InputGroupAddon align="inline-end">
              <Button aria-label="Show passphrase" size="icon-xs" variant="ghost">
                <EyeIcon aria-hidden="true" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
          {inline && <OptionsButton inline />}
        </div>
      </Field>

      {inline && <StrengthAside align="start" />}

      <Field className="flex w-full flex-col gap-2.5">
        <FieldLabel className="text-base">Confirm passphrase</FieldLabel>
        <InputGroup>
          <InputGroupInput size="lg" type="password" />
        </InputGroup>
      </Field>

      <Button className="w-full" size="lg">
        Encrypt
      </Button>
    </div>
  );
}

/* ---------- result ---------- */

const generated = "barrel stand wear curious dilemma brand alien brass recycle oyster";

export function ResetLink({ align = "center" }: { align?: "center" | "end" }) {
  return (
    <Button className={align === "center" ? "self-center" : "-me-2"} variant="ghost">
      Encrypt something else
    </Button>
  );
}

export function SaveWarning({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex w-full flex-col items-end gap-1.5 text-right">
        <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
        <p className="text-balance text-muted-foreground text-sm leading-relaxed">
          Save this now — it's the only key to this file and it can't be recovered.
        </p>
      </div>
    );
  }
  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Save this passphrase now</AlertTitle>
      <AlertDescription>
        It's the only key to this file and it can't be recovered — not by you, not by anyone.
      </AlertDescription>
    </Alert>
  );
}

function ResultCenter({ inline }: StepOptions) {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4">
        <p className="min-w-0 flex-1 select-all break-words font-mono text-base leading-relaxed">
          {generated}
        </p>
        <Button aria-label="Copy passphrase" size="icon-sm" variant="ghost">
          <CopyIcon aria-hidden="true" />
        </Button>
      </div>

      {inline && <SaveWarning />}

      <Field className="flex w-full flex-col gap-2.5">
        <FieldLabel className="text-base">Save as</FieldLabel>
        <div className="flex w-full gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput defaultValue="report.pdf.age" size="lg" />
          </InputGroup>
          <Button size="lg">
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
        </div>
      </Field>

      {inline && <ResetLink />}
    </div>
  );
}

export function StepCenter({ step, inline }: { step: FlowStep } & StepOptions) {
  if (step === "pick") {
    return <PickCenter inline={inline} />;
  }
  if (step === "passphrase") {
    return <PassphraseCenter inline={inline} />;
  }
  return <ResultCenter inline={inline} />;
}
