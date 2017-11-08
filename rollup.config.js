/**
 * @Author: PengJiyuan
 */

require('colors');
const rollup = require('rollup');
const bubble = require('rollup-plugin-buble');
const json = require('rollup-plugin-json');
const uglify = require('rollup-plugin-uglify');
const fs = require('fs-extra');
const version = require('./package.json').version;

const beauty = ~process.argv.indexOf('--beauty');
const minify = ~process.argv.indexOf('--minify');
const example = ~process.argv.indexOf('--example');
let num = 0;
const inputOptions = {
  input: 'src/index.js',
  plugins: [
    json(),
    bubble()
  ]
};
const outputOptions = {
  file: 'dist/lcl.js',
  name: 'lcl',
  format: 'umd',
  banner: '/*!\n' +
    '* LCL v' + version + '\n' +
    '* Author: PengJiyuan\n' +
    '*/'
};
const watchOptions = {
  ...inputOptions,
  output: [outputOptions],
  watch: {
    include: 'src/**',
    exclude: 'node_modules/**'
  }
};

const resetConsole = function () {
  return process.stdout.write('\033c');
}

function changeFilename() {
  inputOptions.plugins.push(uglify({
    output: {
      comments: '/^!/'
    }
  }));
  outputOptions.file = 'dist/lcl.min.js';
}

async function build(beauty) {
  !beauty && changeFilename();  
  const bundle = await rollup.rollup(inputOptions);
  console.log(`Entry: ${inputOptions.input}\n         ↓\nDest:  ${outputOptions.file}\n`.green);
  await bundle.write(outputOptions);
}

async function dev() {
  changeFilename();
  const watcher = rollup.watch(watchOptions);
  watcher.on('event', event => {
    switch(event.code) {
      case 'START':
        resetConsole();
        console.log('\n[Task] '.grey, 'Starting '.green + ++num + 'th' + ' bundle\n'.green);
        break;
      case 'END':
        const src = 'dist/lcl.min.js';
        const dest = 'examples/lcl.min.js';
        console.log('[Status] '.grey, 'All done!\n'.green);
        console.log('[Task] '.grey, 'Copy file to examples\n'.green);
        fs.copy(src, dest)
          .then(() => {
            console.log('[Status] '.grey, (src + ' -> ' + dest).green);
          })
          .catch(err => console.error(err));
        break;
      case 'ERROR':
      case 'FATAL':
        throw new Error('error');
        break;
      default:
        break;
    }
  });
}

beauty && build(beauty);
minify && build();
example && dev();
