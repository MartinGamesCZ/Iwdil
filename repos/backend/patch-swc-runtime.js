const Module = require('module');
const path = require('path');
const fs = require('fs');

console.log('SWC Preload Hook Initialized.');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const exports = originalRequire.apply(this, arguments);

  if (id === '@swc/core' || id.endsWith('@swc/core/index.js')) {
    console.log(`SWC Preload: intercepted require for id: "${id}"`);
    try {
      const transformerPath = path.resolve(process.cwd(), 'swc-transformer.js');
      if (fs.existsSync(transformerPath)) {
        console.log('SWC Preload: swc-transformer.js found! Applying patch...');
        const transformer = require(transformerPath);

        const patchMethod = (name, originalMethod) => {
          if (!originalMethod) return originalMethod;
          const patched = function (src, options) {
            options = options || {};
            // Only inject the plugin if the input is a string (source code or file path)
            // to prevent infinite recursion when transformSync is called recursively with the parsed AST object
            if (typeof src === 'string' && !options.plugin) {
              console.log(`SWC Preload: Injected transformer into ${name}`);
              options.plugin = transformer;
            }
            return originalMethod.call(this, src, options);
          };
          patched.__patched = true;
          return patched;
        };

        if (exports.transform && !exports.transform.__patched) {
          exports.transform = patchMethod('transform', exports.transform);
        }
        if (exports.transformSync && !exports.transformSync.__patched) {
          exports.transformSync = patchMethod('transformSync', exports.transformSync);
        }
        if (exports.transformFile && !exports.transformFile.__patched) {
          exports.transformFile = patchMethod('transformFile', exports.transformFile);
        }
        if (exports.transformFileSync && !exports.transformFileSync.__patched) {
          exports.transformFileSync = patchMethod('transformFileSync', exports.transformFileSync);
        }
        console.log('SWC Preload: Successfully patched SWC methods.');
      } else {
        console.warn(`SWC Preload: swc-transformer.js not found at "${transformerPath}"`);
      }
    } catch (err) {
      console.error('Failed to apply in-memory SWC transformer patch:', err);
    }
  }

  return exports;
};
