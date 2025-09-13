import { readFile, resolvePath } from "./file-handling.ts";
import { Eta as EtaCore } from "./internal.ts";

export type { EtaConfig, Options } from "./config.ts";
export {
  EtaError,
  EtaFileResolutionError,
  EtaNameResolutionError,
  EtaParseError,
  EtaRuntimeError,
} from "./err.ts";

export class Eta extends EtaCore {
  readFile = readFile;

  resolvePath = resolvePath;
}
