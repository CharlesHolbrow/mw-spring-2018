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
    },
  },
  plugins: [
    resolve({customResolveOptions: {
      moduleDirectory: 'node_modules'
    }}),
    commonjs(),
    copy({
        './node_modules/tone/build/Tone.js': 'public/js/tone.js',
        './node_modules/svg.js/dist/svg.js': 'public/js/svg.js'
    })
  ],
  external: ['tone', 'svg.js']
};
