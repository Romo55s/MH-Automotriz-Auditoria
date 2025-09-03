declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement | null;
      constraints: {
        width: number;
        height: number;
        facingMode: string;
        aspectRatio: { min: number; max: number };
      };
      singleChannel: boolean;
    };
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers: number;
    frequency: number;
    decoder: {
      readers: string[];
    };
    locate: boolean;
    src: null;
  }

  interface CodeResult {
    code: string;
    format: string;
    start: number;
    end: number;
    codeset: number;
    startInfo: any;
    decodedCodes: any[];
    endInfo: any;
    direction: number;
    error: number;
  }

  interface DetectionResult {
    codeResult: CodeResult;
    line: { x: number; y: number }[];
    angle: number;
    pattern: { x: number; y: number }[];
    box: { x: number; y: number }[];
    boxes: { x: number; y: number }[][];
  }

  export function init(config: QuaggaConfig, callback: (err?: any) => void): void;
  export function start(): void;
  export function stop(): void;
  export function onDetected(callback: (result: DetectionResult) => void): void;
  export function offDetected(callback: (result: DetectionResult) => void): void;
}
