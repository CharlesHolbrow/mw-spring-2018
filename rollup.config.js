// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/index.js',
  output: {
    file: 'public/js/bundle.js',
    format: 'umd',
    name: 'mw-spring-2018',
    globals: {
      'tone': 'Tone',
      'svg.js': 'SVG',
      'eventemitter3': 'EventEmitter',
      'kefir': 'Kefir',
    },
  },
  plugins: [
    resolve({customResolveOptions: {
      moduleDirectory: 'node_modules',
      extensions: [ '.js', '.es6.js' ],
    }}),
    commonjs(),
    copy({
        './node_modules/tone/build/Tone.js': 'public/js/tone.js',
        './node_modules/svg.js/dist/svg.js': 'public/js/svg.js',
        './node_modules/svg.filter.js/dist/svg.filter.js': 'public/js/svg.filter.js',
        './node_modules/eventemitter3/index.js': 'public/js/eventemitter3.js',
        './node_modules/kefir/dist/kefir.js': 'public/js/kefir.js',
    })
  ],
  external: ['tone', 'svg.js', 'kefir', 'eventemitter3']
};
