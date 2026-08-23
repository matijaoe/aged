import {
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileLockIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  FileVideoIcon,
  PenLineIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";

/**
 * The three steps as static markup. Secondary pieces are separable so a
 * layout can either stack them in the centre column or offload them to the
 * margin cells the lattice already provides.
 */

export type FlowStep = "pick" | "passphrase" | "result";

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

export function WriteInstead({ mode }: { mode: string }) {
  return (
    <Button className="self-center" variant="ghost">
      <PenLineIcon aria-hidden="true" />
      {mode === "decrypt" ? "Paste a message instead" : "Encrypt a message instead"}
    </Button>
  );
}

/**
 * The extension is the only signal available before the bytes are read, so
 * the icon is a hint rather than a claim about the file's contents.
 */
const iconsByExtension: Record<string, typeof FileIcon> = {
  age: FileLockIcon,
  csv: FileSpreadsheetIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  flac: FileAudioIcon,
  gif: FileImageIcon,
  gz: FileArchiveIcon,
  jpeg: FileImageIcon,
  jpg: FileImageIcon,
  json: FileCodeIcon,
  md: FileTextIcon,
  mov: FileVideoIcon,
  mp3: FileAudioIcon,
  mp4: FileVideoIcon,
  pdf: FileTextIcon,
  png: FileImageIcon,
  svg: FileImageIcon,
  ts: FileCodeIcon,
  txt: FileTextIcon,
  wav: FileAudioIcon,
  webp: FileImageIcon,
  xlsx: FileSpreadsheetIcon,
  zip: FileArchiveIcon,
};

export function fileIcon(name: string): typeof FileIcon {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return iconsByExtension[extension] ?? FileIcon;
}

function PickCenter({ mode }: { mode: string }) {
  return (
    <div className="flex w-full flex-col gap-5">
      <DropZone />
      <WriteInstead mode={mode} />
    </div>
  );
}

/* ---------- passphrase ---------- */

/**
 * Strength as a full-width meter with the estimate read out underneath: a
 * word for what it means, the bit count for what it is. The count is an
 * upper bound, hence the approximation sign.
 */
export function StrengthAside() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Meter aria-label="Passphrase strength" className="w-full" max={128} value={98}>
        <MeterTrack className="h-1 rounded-full bg-border">
          <MeterIndicator className="rounded-full bg-success" />
        </MeterTrack>
      </Meter>
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="font-medium text-success-foreground text-sm">Strong</span>
        <span className="text-muted-foreground text-xs tabular-nums">≈98 bits of entropy</span>
      </div>
    </div>
  );
}

function OptionsButton() {
  return (
    <Button aria-label="Passphrase options" size="icon-lg" variant="outline">
      <SlidersHorizontalIcon aria-hidden="true" />
    </Button>
  );
}

function PassphraseCenter() {
  const name = "report.pdf";
  const Icon = fileIcon(name);
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 py-2.5 pe-2 ps-3.5">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-base">{name}</span>
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
          <OptionsButton />
        </div>
      </Field>

      <StrengthAside />

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

function ResetLink() {
  return (
    <Button className="self-center" variant="ghost">
      Encrypt something else
    </Button>
  );
}

function SaveWarning() {
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

function ResultCenter() {
  return (
    <div className="flex w-full flex-col gap-5">
      {/* Above the artefact: the caveat should frame the passphrase, not
          trail after the part people copy and move on from. */}
      <SaveWarning />

      {/* The library's own textarea-with-actions pattern rather than a
          hand-rolled panel, so the type scale comes from the design system.
          field-sizing lets the box be exactly as tall as the passphrase,
          overriding the group's default textarea minimum. */}
      <InputGroup className="**:[textarea]:min-h-0 **:[textarea]:max-sm:min-h-0">
        <InputGroupTextarea
          aria-label="Generated passphrase"
          className="font-mono leading-relaxed"
          readOnly
          rows={1}
          value={generated}
        />
        <InputGroupAddon align="block-end">
          <Button size="xs" variant="ghost">
            <CopyIcon aria-hidden="true" />
            Copy
          </Button>
          <Button size="xs" variant="ghost">
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
        </InputGroupAddon>
      </InputGroup>

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

      <ResetLink />
    </div>
  );
}

export function StepCenter({ step, mode }: { step: FlowStep; mode: string }) {
  if (step === "pick") {
    return <PickCenter mode={mode} />;
  }
  if (step === "passphrase") {
    return <PassphraseCenter />;
  }
  return <ResultCenter />;
}
