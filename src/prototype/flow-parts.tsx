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

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";

/**
 * The three steps as static markup at one size larger, so a layout can be
 * judged with real content rather than an empty drop zone.
 */

export type FlowStep = "pick" | "passphrase" | "result";

export function PickContent({ dropSurface }: { dropSurface: "card" | "bare" }) {
  const inner = (
    <>
      <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
      <span className="font-medium text-base">Drop a file anywhere, or browse</span>
      <span className="text-muted-foreground text-sm">
        Up to 100 MB · nothing leaves your browser
      </span>
    </>
  );
  return (
    <div className="flex flex-col gap-5">
      {dropSurface === "card" ? (
        <Card
          className="cursor-pointer border-dashed transition-colors hover:bg-accent/40"
          render={<button type="button" />}
        >
          <CardPanel className="flex flex-col items-center gap-2.5 py-14">{inner}</CardPanel>
        </Card>
      ) : (
        <button
          className="flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border border-dashed px-6 py-14 transition-colors hover:bg-accent/40"
          type="button"
        >
          {inner}
        </button>
      )}
      <Button className="self-center" variant="ghost">
        <PenLineIcon aria-hidden="true" />
        Write a message instead
      </Button>
    </div>
  );
}

export function PassphraseContent({ surface }: { surface: "card" | "bare" }) {
  const body = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 py-2.5 pe-2 ps-3.5">
        <FileIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-base">report.pdf</span>
        <span className="shrink-0 text-muted-foreground text-sm tabular-nums">2.4 MB</span>
        <Button aria-label="Remove" size="icon-xs" variant="ghost">
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      <Field className="flex flex-col gap-2.5">
        <FieldLabel className="text-base">Passphrase</FieldLabel>
        <div className="flex gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput defaultValue="tiger mountain sunset" size="lg" type="password" />
            <InputGroupAddon align="inline-end">
              <Button aria-label="Show passphrase" size="icon-xs" variant="ghost">
                <EyeIcon aria-hidden="true" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
          <Button aria-label="Passphrase options" size="icon-lg" variant="outline">
            <SlidersHorizontalIcon aria-hidden="true" />
          </Button>
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Meter aria-label="Strength" className="flex-1" max={128} value={98}>
          <MeterTrack className="h-1 rounded-full bg-border">
            <MeterIndicator className="rounded-full bg-success" />
          </MeterTrack>
        </Meter>
        <span className="text-muted-foreground text-xs tabular-nums">≈98 bits</span>
      </div>

      <Field className="flex flex-col gap-2.5">
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
  return surface === "card" ? (
    <Card>
      <CardPanel className="py-6">{body}</CardPanel>
    </Card>
  ) : (
    body
  );
}

export function ResultContent({ surface }: { surface: "card" | "bare" }) {
  const passphrase = "barrel stand wear curious dilemma brand alien brass recycle oyster";
  return (
    <div className="flex flex-col gap-5">
      <div className={cn("flex flex-col gap-3", surface === "bare" && "gap-4")}>
        {surface === "card" ? (
          <Card>
            <CardPanel className="flex items-start gap-2 py-4">
              <p className="min-w-0 flex-1 select-all break-words font-mono text-base leading-relaxed">
                {passphrase}
              </p>
              <Button aria-label="Copy passphrase" size="icon-sm" variant="ghost">
                <CopyIcon aria-hidden="true" />
              </Button>
            </CardPanel>
          </Card>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4">
            <p className="min-w-0 flex-1 select-all break-words font-mono text-base leading-relaxed">
              {passphrase}
            </p>
            <Button aria-label="Copy passphrase" size="icon-sm" variant="ghost">
              <CopyIcon aria-hidden="true" />
            </Button>
          </div>
        )}
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Save this passphrase now</AlertTitle>
          <AlertDescription>
            It's the only key to this file and it can't be recovered — not by you, not by
            anyone.
          </AlertDescription>
        </Alert>
      </div>

      <Field className="flex flex-col gap-2.5">
        <FieldLabel className="text-base">Save as</FieldLabel>
        <div className="flex gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput defaultValue="report.pdf.age" size="lg" />
          </InputGroup>
          <Button size="lg">
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
        </div>
      </Field>

      <Button className="self-center" variant="ghost">
        Encrypt something else
      </Button>
    </div>
  );
}
