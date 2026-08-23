import { MotionConfig } from "motion/react";
import { useDropzone } from "react-dropzone";

import { useAged } from "@/hooks/use-aged";
import { usePaste } from "@/hooks/use-paste";
import { cliCommand } from "@/lib/cli";
import { textFileName } from "@/lib/crypto/filename";
import { cn } from "@/lib/utils";
import { CliHint } from "@/components/cli-hint";
import { DoneStep } from "@/components/done-step";
import { cell, Lattice, LatticeRow } from "@/components/lattice";
import { ModeStatement } from "@/components/mode-statement";
import { PassphraseStep } from "@/components/passphrase-step";
import { PickStep } from "@/components/pick-step";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

export function App() {
  const aged = useAged();
  const { result } = aged;

  usePaste({
    onFiles: aged.loadFiles,
    onText: aged.loadText,
    disabled: aged.working,
  });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: aged.loadFiles,
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
  const downloadName =
    outputName.trim() === "" ? (result?.suggestedName ?? "") : outputName;

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
              <header className={cn("flex w-full flex-col justify-end gap-4", cell.gutter, cell.sitsOnRule)}>
                {/* The margins are too narrow below md, so identity joins the
                    mode in the centre cell and the band grows to fit both. */}
                <div className="pt-6 md:hidden">
                  <Wordmark />
                </div>
                <ModeStatement
                  disabled={aged.working}
                  mode={aged.mode}
                  onModeChange={aged.setMode}
                  overridable={aged.detectedAge && aged.input !== null}
                  pending={aged.input === null && result === null}
                />
              </header>
            }
            left={
              <div className={cn("hidden w-full justify-end md:flex", cell.sitsOnRule)}>
                <Wordmark align="end" />
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
                className={cn(
                  "flex min-h-0 w-full flex-col pb-6",
                  cell.gutter,
                  cell.hangsFromRule,
                )}
              >
                {aged.step === "pick" && (
                  <PickStep
                    isDragActive={isDragActive}
                    mode={aged.mode}
                    notice={aged.notice}
                    onBrowse={open}
                    onText={aged.loadText}
                  />
                )}
                {(aged.step === "passphrase" || aged.step === "working") &&
                  aged.input !== null && (
                    <PassphraseStep
                      input={aged.input}
                      mode={aged.mode}
                      onClearInput={aged.clearInput}
                      onSubmit={aged.submit}
                      submitError={aged.submitError}
                      working={aged.working}
                    />
                  )}
                {result !== null && (
                  <DoneStep
                    downloadName={downloadName}
                    onOutputNameChange={aged.setOutputName}
                    onReset={aged.reset}
                    outputName={outputName}
                    result={result}
                  />
                )}
              </main>
            }
            rule
          />
          <LatticeRow
            band="bottom"
            center={
              <footer
                className={cn("flex w-full pb-4", cell.gutter, cell.hangsFromRule)}
              >
                <CliHint command={command} />
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
