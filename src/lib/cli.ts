import type { Mode } from "@/hooks/use-aged";
import { decryptedName, encryptedName } from "@/lib/crypto/filename";

/**
 * The age CLI command equivalent to what the app is about to do. It teaches
 * the tool and is the escape hatch when anything here fails.
 *
 * Pass `outputName: null` to derive the default output from the input name,
 * the same way the app itself does. `armored` is the encrypt-only `-a`, and
 * is what names the app's own armored option: ticking the box grows the
 * flag here, which is the only place the two meet.
 */
/**
 * The two names a command puts on either side of `-o`, derived once so the
 * command and the collision check can never disagree about them.
 */
function commandNames(
  mode: Mode,
  inputName: string | null,
  outputName: string | null,
): { input: string; output: string } {
  if (mode === "encrypt") {
    const input = inputName ?? "file";
    return { input, output: outputName ?? encryptedName(input) };
  }
  const input = inputName ?? "file.age";
  return {
    input,
    output: outputName ?? (inputName === null ? "file" : decryptedName(inputName).name),
  };
}

export function cliCommand(
  mode: Mode,
  inputName: string | null,
  outputName: string | null = null,
  armored = false,
): string {
  const { input, output } = commandNames(mode, inputName, outputName);
  const flags = mode === "decrypt" ? "-d" : armored ? "-p -a" : "-p";
  return `age ${flags} -o ${shellName(output)} ${shellName(input)}`;
}

/**
 * Whether the command names one file on both sides of `-o`. The output name
 * is the user's to edit, so it can be made equal to the input's — most
 * easily by dropping the pinned `.age`, which lands exactly on it.
 *
 * age rejects this on the names alone, before it prompts or opens anything,
 * so nothing is at stake but the command, which cannot run. The hint still
 * shows it verbatim, because it is what the app is about to save; the step
 * that owns the name is where the reason belongs.
 *
 * Compared on the rendered tokens rather than the raw names: the token is
 * what a paste actually runs, and two names differing only in a control
 * character render as the same "?".
 */
export function namesOneFile(
  mode: Mode,
  inputName: string | null,
  outputName: string | null = null,
): boolean {
  const { input, output } = commandNames(mode, inputName, outputName);
  return shellName(input) === shellName(output);
}

/**
 * Quote a filename for a POSIX shell only when it needs it. Control
 * characters can't be quoted portably, so they become "?"; names starting
 * with "-" get a "./" prefix so age never parses them as flags.
 */
function shellName(name: string): string {
  const printable = name.replaceAll(/\p{Cc}/gu, "?");
  const quoted = /^[\w.,/@%+=:-]+$/.test(printable)
    ? printable
    : `'${printable.replaceAll("'", "'\\''")}'`;
  return printable.startsWith("-") ? `./${quoted}` : quoted;
}
