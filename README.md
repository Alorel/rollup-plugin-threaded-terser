# rollup-plugin-threaded-terser

Runs Terser on your output chunks in worker threads. **REQUIRES NODE 12.8+**.

-----

# Installation

[Configure npm for GitHub packages](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages)
then install `terser@^4.6.0` & `@alorel/rollup-plugin-threaded-terser`

# Example

```javascript
import {threadedTerserPlugin} from '@alorel/rollup-plugin-threaded-terser';

export default {
  // ... your default options
  output: {
    // It can function as an output plugin
    plugins: [
      threadedTerserPlugin()
    ]
  },
  // Or as a regular plugin
  plugins: [
    threadedTerserPlugin({
      // Options to pass to Terser
      terserOpts: {/*...*/},
      // If provided, Terser will also run on chunks that match this predicate
      includeAssets(asset) {
        return asset.fileName === 'service-worker.js';
      }
    })
  ]
}
```

# API

```typescript
import { OutputAsset, OutputPlugin } from 'rollup';
import { MinifyOptions } from 'terser';

/** Plugin options */
export interface ThreadedTerserOpts {
    /** Options to pass to Terser */
    terserOpts?: MinifyOptions;
    /** Also run on assets this function returns true for. */
    includeAssets?(asset: OutputAsset): boolean;
}

/**
 * Create a plugin instance
 * @param pluginOpts Plugin options
 */
export function threadedTerserPlugin(pluginOpts?: ThreadedTerserOpts): OutputPlugin;
```
