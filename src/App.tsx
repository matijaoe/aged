import { ArrowLeftIcon, PenLineIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import { useAged, type Step } from "@/hooks/use-aged";
import { usePaste } from "@/hooks/use-paste";
import { useTypeToWrite } from "@/hooks/use-type-to-write";
import { cliCommand } from "@/lib/cli";
import { textFileName } from "@/lib/crypto/filename";
import { cn } from "@/lib/utils";
import { CliHint } from "@/components/cli-hint";
import { Button } from "@/components/ui/button";
import { DoneStep } from "@/components/done-step";
import { cell, Lattice, LatticeRow } from "@/components/lattice";
import { MessageWriter } from "@/components/message-writer";
import { ModeStatement } from "@/components/mode-statement";
import { PassphraseStep } from "@/components/passphrase-step";
import { PickStep } from "@/components/pick-step";
import { ReplaceResultDialog } from "@/components/replace-result-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

/** Something dropped or pasted, held back while the result step asks. */
type PendingInput =
  | { kind: "files"; files: readonly File[] }
  | { kind: "text"; text: string };

/** Shared by the header's action and the writer's way out of it. */
const marginAction = "gap-1.5 text-muted-foreground/64 hover:text-foreground";

/** Shared by the footer's outbound links, in the margin and below it. */
const footerLink = "underline underline-offset-2 hover:text-muted-foreground";

/**
 * Where each step sits in the flow, which is all the step swap needs in order
 * to tell a move forward from a move back. `working` shares a rank with
 * `passphrase` because it shares a screen — it is that step with its button
 * spinning, and submitting must not transition it into itself.
 */
const stepRank: Record<Step, number> = {
  pick: 0,
  compose: 1,
  passphrase: 2,
  working: 2,
  done: 3,
};

/**
 * A step leaves the way the next one arrives: forward exits left and enters
 * from the right, Back mirrors it. Eight pixels — the shift is a hint about
 * which way the flow went, not a journey; the crossfade does the work.
 *
 * The exit is shorter than the entrance. `mode="wait"` plays them in
 * sequence, so the two durations add up, and by the time a step is leaving
 * the decision is already made.
 */
const stepMotion: Variants = {
  enter: (back: boolean) => ({ opacity: 0, x: back ? -8 : 8 }),
  settled: { opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.19, 1, 0.22, 1] } },
  leave: (back: boolean) => ({
    opacity: 0,
    x: back ? 8 : -8,
    transition: { duration: 0.1, ease: [0.19, 1, 0.22, 1] },
  }),
};

export function App() {
  const aged = useAged();
  const { result, step } = aged;

  const picking = step === "pick";
  // The two steps where nothing has been derived yet, so the header has no
  // mode to state.
  const pending = picking || step === "compose";

  // Which way the flow just went. Read from a ref during render so the value
  // is right on the very render that swaps the step — an effect would set it
  // a beat too late, after the animation had already chosen a direction — and
  // written back only after commit, which is the half that must not happen
  // mid-render.
  const rank = stepRank[step];
  const previousRank = useRef(rank);
  const back = rank < previousRank.current;
  useEffect(() => {
    previousRank.current = rank;
  }, [rank]);
  // `working` is the passphrase step still on screen, so it keys the same.
  const view = step === "working" ? "passphrase" : step;

  // Something arriving is new input almost everywhere — the exception is the
  // passphrase step, where the input is already chosen and a paste or a drop
  // can only be a passphrase. The result step takes it too, but asks first:
  // it is the one screen holding something that cannot be got back.
  const [pendingInput, setPendingInput] = useState<PendingInput | null>(null);
  const { loadFiles, loadText, step: currentStep } = aged;

  const takeInput = useCallback(
    (next: PendingInput) => {
      if (currentStep === "done") {
        setPendingInput(next);
        return;
      }
      if (next.kind === "files") {
        loadFiles(next.files);
        return;
      }
      loadText(next.text);
    },
    [currentStep, loadFiles, loadText],
  );

  usePaste({
    onFiles: (files) => takeInput({ kind: "files", files }),
    onText: (text) => takeInput({ kind: "text", text }),
    disabled: step === "passphrase" || step === "working",
  });

  useTypeToWrite({ onType: aged.compose, disabled: !picking });

  // A file dropped on the passphrase step is a passphrase, not a new input.
  // Nothing may replace what is already loaded from inside the step that is
  // about to encrypt it — that is how someone encrypts the wrong file and
  // does not find out until the original is gone.
  const [droppedFiles, setDroppedFiles] = useState<readonly File[] | null>(null);
  const clearDroppedFiles = useCallback(() => setDroppedFiles(null), []);
  const onDrop = useCallback(
    (files: readonly File[]) => {
      if (files.length === 0) {
        return;
      }
      if (step === "passphrase") {
        setDroppedFiles(files);
        return;
      }
      // Mid-operation there is nothing sensible to do with it, but the
      // dropzone stays mounted rather than disabled so it still claims the
      // event: without that the browser navigates to the dropped file and
      // whatever is on screen is gone.
      if (step !== "working") {
        takeInput({ kind: "files", files });
      }
    },
    [step, takeInput],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: aged.working,
  });

  const inputName =
    aged.input === null
      ? null
      : aged.input.kind === "file"
        ? aged.input.name
        : aged.mode === "encrypt"
          ? textFileName
          : null;

  const outputName = aged.outputNameOverride ?? result?.suggestedName ?? "";
  const downloadName = outputName.trim() === "" ? (result?.suggestedName ?? "") : outputName;

  const command = cliCommand(
    result === null ? aged.mode : result.mode,
    inputName,
    result === null ? null : downloadName,
  );

  return (
    <MotionConfig reducedMotion="user">
      <div {...getRootProps({ className: "isolate" })}>
        <input {...getInputProps()} />
        <Lattice>
          <LatticeRow
            band="top"
            center={
              <header
                className={cn(
                  "flex w-full flex-col justify-end gap-4",
                  cell.gutter,
                  cell.sitsOnRule,
                )}
              >
                {/* The margins are too narrow below md, so identity joins the
                    mode in the centre cell and the band grows to fit both. */}
                {/* w-full because the header is a column flex taking `items-end`
                    from `sitsOnRule`, which on that axis means right-aligned. */}
                <div className="w-full pt-6 md:hidden">
                  <Wordmark disabled={aged.working} onHome={aged.startOver} />
                </div>
                <ModeStatement
                  action={
                    picking ? (
                      <Button
                        className={marginAction}
                        onClick={() => aged.compose("")}
                        size="xs"
                        variant="ghost"
                      >
                        <PenLineIcon aria-hidden="true" />
                        Encrypt a message
                      </Button>
                    ) : null
                  }
                  disabled={aged.working}
                  mode={aged.mode}
                  onModeChange={aged.setMode}
                  // Only the passphrase step can still act on a flipped mode.
                  // On the result it would discard a generated passphrase, and
                  // on compose the sniff overwrites it again at Continue.
                  overridable={step === "passphrase" && aged.detectedAge}
                  pending={pending}
                />
              </header>
            }
            left={
              <div className={cn("hidden w-full justify-end md:flex", cell.sitsOnRule)}>
                <Wordmark align="end" disabled={aged.working} onHome={aged.startOver} />
              </div>
            }
            right={
              <div className={cn("hidden w-full md:flex", cell.sitsOnRule)}>
                <ThemeToggle />
              </div>
            }
          />
          <LatticeRow
            band="body"
            center={
              <main
                className={cn("flex min-h-0 w-full flex-col pb-6", cell.gutter, cell.hangsFromRule)}
              >
                {/* `initial={false}` so the first step of a visit is simply
                    there — a page that animates itself in on load is making
                    the user wait to read it. `custom` is what carries the
                    direction to the leaving step, which by then is rendering
                    from a snapshot and cannot read it from props. */}
                <AnimatePresence custom={back} initial={false} mode="wait">
                  <motion.div
                    animate="settled"
                    // Carries the sizing the steps expect of their parent, so
                    // wrapping them changes nothing about the layout: the band
                    // is fixed, the step absorbs its own overflow, and the page
                    // still never scrolls.
                    className="flex min-h-0 w-full flex-1 flex-col"
                    custom={back}
                    exit="leave"
                    initial="enter"
                    key={view}
                    variants={stepMotion}
                  >
                    {picking && (
                      <PickStep
                        isDragActive={isDragActive}
                        mode={aged.mode}
                        notice={aged.notice}
                        onBrowse={open}
                      />
                    )}
                    {step === "compose" && (
                      <MessageWriter
                        draft={aged.draft}
                        onBack={aged.back}
                        onDraftChange={aged.setDraft}
                        onSubmit={aged.commitDraft}
                      />
                    )}
                    {(step === "passphrase" || step === "working") && aged.input !== null && (
                      <PassphraseStep
                        input={aged.input}
                        mode={aged.mode}
                        droppedFiles={droppedFiles}
                        onBack={aged.back}
                        onDroppedFilesHandled={clearDroppedFiles}
                        onSubmit={aged.submit}
                        submitError={aged.submitError}
                        working={aged.working}
                      />
                    )}
                    {step === "done" && result !== null && (
                      <DoneStep
                        downloadName={downloadName}
                        onOutputNameChange={aged.setOutputName}
                        onReset={aged.startOver}
                        outputName={outputName}
                        result={result}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            }
            left={
              // The way out sits outside the work rather than beside the way
              // forward. Below md there is no margin to put it in, so each
              // step keeps its own.
              aged.backStep === null ? null : (
                <div className={cn("hidden w-full justify-end md:flex", cell.hangsFromRule)}>
                  <Button
                    // Pulled onto the two axes it reads against: the button's
                    // own inset would otherwise push its label off the edge
                    // the wordmark above it sits on, and its taller box would
                    // drop the label below the first line of the step across
                    // the rule.
                    className={cn(marginAction, "-mt-1 -mr-2")}
                    onClick={aged.back}
                    size="xs"
                    variant="ghost"
                  >
                    <ArrowLeftIcon aria-hidden="true" />
                    Back
                  </Button>
                </div>
              )
            }
            rule
          />
          <LatticeRow
            band="bottom"
            center={
              <footer
                className={cn("flex w-full flex-col gap-2 pb-4", cell.gutter, cell.hangsFromRule)}
              >
                {/* Nothing is loaded on the pick step, so a command there
                    could only name an invented file in a mode that has not
                    been derived yet — the same claim the header cell
                    deliberately declines to make. */}
                {!picking && <CliHint command={command} />}
                {/* The margin cell that carries this collapses below md, so
                    the source link — the one thing there with no substitute
                    elsewhere — joins the centre cell. Only the link comes
                    along: the wordmark's tagline, which shows below md and
                    not above it, already makes the claims beside it. The band
                    is fixed at 96px and half empty, so this costs the body
                    band nothing. The padding is pulled back by the amount it
                    adds: a bare line of xs text is a 16px tap target at the
                    one width where this is only ever tapped. */}
                <a
                  className={cn(
                    footerLink,
                    "-my-1 py-1 text-muted-foreground/72 text-xs md:hidden",
                  )}
                  href="https://github.com/matijaoe/aged"
                  rel="noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              </footer>
            }
            right={
              <div
                className={cn(
                  "hidden w-full items-start pt-4 md:flex",
                  "text-muted-foreground/72 text-xs",
                )}
              >
                <p className="text-balance leading-relaxed">
                  Stays on your device
                  <br />
                  Works offline ·{" "}
                  <a
                    className={footerLink}
                    href="https://age-encryption.org"
                    rel="noreferrer"
                    target="_blank"
                  >
                    age
                  </a>{" "}
                  compatible
                  <br />
                  <a
                    className={footerLink}
                    href="https://github.com/matijaoe/aged"
                    rel="noreferrer"
                    target="_blank"
                  >
                    GitHub
                  </a>
                </p>
              </div>
            }
            rule
          />
        </Lattice>
        <div className="fixed top-3 right-3 z-30 md:hidden">
          <ThemeToggle />
        </div>
        <ReplaceResultDialog
          losesGeneratedPassphrase={result?.generatedPassphrase != null}
          onCancel={() => setPendingInput(null)}
          // Loaded directly rather than back through `takeInput`: the step is
          // still "done" until this lands, so routing would ask again.
          onConfirm={() => {
            if (pendingInput === null) {
              return;
            }
            setPendingInput(null);
            if (pendingInput.kind === "files") {
              loadFiles(pendingInput.files);
              return;
            }
            loadText(pendingInput.text);
          }}
          open={pendingInput !== null}
        />
      </div>
    </MotionConfig>
  );
}
