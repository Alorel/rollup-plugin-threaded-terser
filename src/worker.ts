import {ExistingRawSourceMap} from 'rollup';
import {minify, MinifyOptions, MinifyOutput} from 'terser';
import {isMainThread, parentPort, workerData} from 'worker_threads';

interface ExtendedMinifyOutput extends MinifyOutput {
  error?: any;

  warnings?: any[];
}

/** @internal */
export interface WorkerInput {
  code: string;

  config?: MinifyOptions;
}

/** @internal */
export interface WorkerOutput {
  code: string;

  map?: ExistingRawSourceMap;
}

if (isMainThread) {
  process.emitWarning(new Error('rollup threaded terser plugin worker included on main thread'));
} else {
  /** @internal */
  function isPromise<T = any>(input: any): input is Promise<T> {
    return !!input && typeof input['then'] === 'function' && typeof input['catch'] === 'function';
  }

  /** @internal */
  async function run(): Promise<WorkerOutput> {
    const wd = workerData as WorkerInput;
    // 5.x returns a promise, 4.x is synchronous
    const rawResult: ExtendedMinifyOutput | Promise<ExtendedMinifyOutput> = minify(wd.code, wd.config);
    const terserResult = isPromise<ExtendedMinifyOutput>(rawResult) ? (await rawResult) : rawResult;
    const {warnings, code, error, map} = terserResult;

    // Terser 4.x-only
    if (warnings?.length) {
      for (const warning of warnings) {
        parentPort!.postMessage({warning});
      }
    }

    // Also 4.x-only
    if (error) {
      return Promise.reject(error);
    }

    const out: WorkerOutput = {code: code || ''};
    if (map) {
      out.map = typeof map === 'string' ? JSON.parse(map) : map as any;
    }

    return out;
  }

  run()
    .then(
      out => {
        parentPort!.postMessage(out);
      },
      error => {
        parentPort!.postMessage({error});
      }
    );
}
