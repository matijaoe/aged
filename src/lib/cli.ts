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
export function cliCommand(
  mode: Mode,
  inputName: string | null,
  outputName: string | null = null,
  armored = false,
): string {
  if (mode === "encrypt") {
    const input = inputName ?? "file";
    const flags = armored ? "-p -a" : "-p";
    return `age ${flags} -o ${shellName(outputName ?? encryptedName(input))} ${shellName(input)}`;
  }
  const input = inputName ?? "file.age";
  const output = outputName ?? (inputName === null ? "file" : decryptedName(inputName).name);
  return `age -d -o ${shellName(output)} ${shellName(input)}`;
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
