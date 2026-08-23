import { ArrowLeftIcon, PenLineIcon } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { useAged } from "@/hooks/use-aged";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

/** Shared by the header's action and the writer's way out of it. */
const marginAction = "gap-1.5 text-muted-foreground/64 hover:text-foreground";

export function App() {
  const aged = useAged();
  const { result, step } = aged;

  const picking = step === "pick";
  // The two steps where nothing has been derived yet, so the header has no
  // mode to state.
  const pending = picking || step === "compose";

  // Loading from the clipboard belongs to the step where there is nothing
  // loaded yet. Past that point a stray paste is a passphrase, and treating
  // it as new input silently swaps it in as the thing to encrypt — or throws
  // away a result whose generated passphrase has not been saved.
  usePaste({
    onFiles: aged.loadFiles,
    onText: aged.loadText,
    disabled: !picking,
  });

  useTypeToWrite({ onType: aged.compose, disabled: !picking });

  // A file dropped on the passphrase step is a passphrase, not a new input.
  // Nothing may replace what is already loaded from inside the step that is
  // about to encrypt it — that is how someone encrypts the wrong file and
  // does not find out until the original is gone.
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const clearDroppedFile = useCallback(() => setDroppedFile(null), []);
  const { loadFiles } = aged;
  const onDrop = useCallback(
    (files: readonly File[]) => {
      const [file] = files;
      if (step === "pick") {
        loadFiles(files);
      } else if (step === "passphrase" && file !== undefined) {
        setDroppedFile(file);
      }
      // Every other step swallows the drop and does nothing with it. The
      // dropzone stays mounted rather than disabled so it still claims the
      // event: without that the browser navigates to the dropped file and
      // the result on screen is gone.
    },
    [loadFiles, step],
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
    aged.armored,
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
                <div className="pt-6 md:hidden">
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
                  overridable={aged.detectedAge && aged.input !== null}
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
                    droppedFile={droppedFile}
                    onBack={aged.back}
                    onDroppedFileHandled={clearDroppedFile}
                    onSubmit={aged.submit}
                    submitError={aged.submitError}
                    working={aged.working}
                  />
                )}
                {step === "done" && result !== null && (
                  <DoneStep
                    armored={aged.armored}
                    downloadName={downloadName}
                    onArmoredChange={aged.setArmored}
                    onOutputNameChange={aged.setOutputName}
                    onReset={aged.startOver}
                    outputName={outputName}
                    result={result}
                  />
                )}
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
              <footer className={cn("flex w-full pb-4", cell.gutter, cell.hangsFromRule)}>
                {/* Nothing is loaded on the pick step, so a command there
                    could only name an invented file in a mode that has not
                    been derived yet — the same claim the header cell
                    deliberately declines to make. */}
                {!picking && <CliHint command={command} />}
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
                    className="underline underline-offset-2 hover:text-muted-foreground"
                    href="https://age-encryption.org"
                    rel="noreferrer"
                    target="_blank"
                  >
                    age
                  </a>{" "}
                  compatible
                  <br />
                  <a
                    className="underline underline-offset-2 hover:text-muted-foreground"
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
      </div>
    </MotionConfig>
  );
}
