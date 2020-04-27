import {join} from 'path';
import {PluginContext} from 'rollup';
import {MinifyOptions} from 'terser';
import {Worker} from 'worker_threads';
import {WorkerInput, WorkerOutput} from '../worker';
import {noop} from './noop';

const workerPath = join(__dirname, '..', 'worker.js');

class RunOnce<T> {
  public ran: boolean;

  public constructor(
    private readonly _resolve: (v: T) => void,
    private readonly _reject: (v: any) => void,
    private readonly worker: Worker
  ) {
  }

  public reject(v: any): void {
    if (!this.ran) {
      this.kill();
      this._reject(v);
    }
  }

  public resolve(v: T): void {
    if (!this.ran) {
      this.kill();
      this._resolve(v);
    }
  }

  private kill(): void {
    this.ran = true;
    this.worker.terminate().catch(noop);
  }
}

/** @internal */
export function runAsyncTerser(ctx: PluginContext, code: string, config?: MinifyOptions): Promise<WorkerOutput> {
  return new Promise<WorkerOutput>((resolve, reject) => {
    const workerData: WorkerInput = {code, config};
    const worker = new Worker(workerPath, {
      workerData
    });
    worker.unref();
    const promise = new RunOnce(resolve, reject, worker);

    worker
      .once('error', e => {
        promise.reject(e);
      })
      .on('message', (msg: any) => {
        if (msg.warning) {
          ctx.warn(msg.warning);
        } else if (msg.error) {
          promise.reject(msg.error);
        } else if ('code' in msg) {
          promise.resolve(msg);
        }
      })
      .once('exit', () => {
        if (!promise.ran) {
          promise.reject(new Error('Worker exited without emitting code'));
        }
      });
  });
}
