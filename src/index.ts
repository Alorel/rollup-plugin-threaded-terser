import {OutputAsset, OutputChunk, OutputPlugin, PluginContext} from 'rollup';
import {MinifyOptions} from 'terser';
import {noop} from './lib/noop';
import {runAsyncTerser} from './lib/runAsyncTerser';

export interface ThreadedTerserOpts {
  terserOpts?: MinifyOptions;

  /** Also run on assets this function returns true for. */
  includeAssets?(chunk: OutputAsset): boolean;
}

export function threadedTerserPlugin(pluginOpts: ThreadedTerserOpts = {}): OutputPlugin {
  const {
    terserOpts,
    includeAssets
  } = pluginOpts;

  const returnPlugin: OutputPlugin = {
    name: 'threaded-terser-plugin',
    renderChunk(this: PluginContext, code) {
      return runAsyncTerser(this, code, terserOpts);
    }
  };

  if (includeAssets) {
    function filterChunks(c: OutputAsset | OutputChunk): c is OutputAsset {
      return c.type === 'asset' && includeAssets!(c);
    }

    returnPlugin.generateBundle = function (this: PluginContext, _o, bundle): void | Promise<void> {
      const promises: Promise<any>[] = Object.values(bundle)
        .filter(filterChunks)
        .map((asset): Promise<any> => {
          const assetString: string = typeof asset.source === 'string' ? asset.source : asset.source.toString('utf8');

          return runAsyncTerser(this, assetString, terserOpts)
            .then(minified => {
              asset.source = minified.code;
            });
        });

      if (promises.length) {
        return Promise.all(promises).then(noop);
      }
    };
  }

  return returnPlugin;
}
