import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { terser } from 'rollup-plugin-terser'
import { babel } from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default [
    {
        input: 'code/index.ts',
        plugins: [
            peerDepsExternal(),
            nodeResolve(
                {
                    preferBuiltins: false
                }),
            typescript({
            }),
            terser(),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env']
            }),
        ],
        output:
        {
            file: 'dist/pixi-cull.min.js',
            globals:
            {
                'pixi.js': 'PIXI'
            },
            format: 'umd',
            name: 'Cull',
            sourcemap: true
        }
    },
    {
        input: 'code/index.ts',
        plugins: [
            peerDepsExternal(),
            nodeResolve(
                {
                    preferBuiltins: false
                }),
            typescript()
        ],
        output:
        {
            file: 'dist/pixi-cull.es.js',
            format: 'esm',
            sourcemap: true
        }
    }]