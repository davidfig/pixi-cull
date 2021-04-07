import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import serve from 'rollup-plugin-serve'

export default
    {
        input: 'docs/index.ts',
        plugins: [
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs({
                namedExports: { 'resource-loader': ['Resource'] }
            }),
            typescript({
                'esModuleInterop': true,
                'skipLibCheck': true,
            }),
            serve({ contentBase: 'docs' }),
        ],
        output: {
            file: 'docs/index.js',
            format: 'iife',
            sourcemap: true,
        }
    }