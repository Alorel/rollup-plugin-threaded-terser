import {ExistingRawSourceMap} from 'rollup';
import {minify, MinifyOptions} from 'terser';
import {isMainThread, parentPort, workerData} from 'worker_threads';

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
  setImmediate(() => {
    const wd = workerData as WorkerInput;

    try {
      const terserResult = minify(wd.code, wd.config);
      const {warnings, code, error, map} = terserResult;

      if (warnings?.length) {
        for (const warning of warnings) {
          parentPort!.postMessage({warning});
        }
      }
      if (error) {
        parentPort!.postMessage({error});
      } else {
        const out: WorkerOutput = {code: code || ''};
        if (map) {
          out.map = typeof map === 'string' ? JSON.parse(map) : map as any;
        }
        parentPort!.postMessage(out);
      }
    } catch (error) {
      parentPort!.postMessage({error});
    }
  });
}
