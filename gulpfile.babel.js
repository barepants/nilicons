'use strict';

import {execSync} from 'child_process';
import fs from 'fs';

import changed from 'gulp-changed';
import gulp from 'gulp';
import inline from 'gulp-inline';
import livereload from 'gulp-livereload';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import sass from 'gulp-sass';
import svgSprite from 'gulp-svg-sprite';
import svgmin from 'gulp-svgmin';
import through2 from 'through2';
import twig from 'gulp-twig';
import xml2js from 'xml2js';


const SVG_SPRITE_CONFIG = {
  shape: {
    transform: []
  },
  mode: {
    symbol : {
      dest: '.',
      sprite: 'sprite.svg'
    }
  }
};

function prettySvg() {
  return through2.obj((file, enc, cb) => {
    if (!file.path.endsWith('svg')) {
      cb(null, file);
      return;
    }
    let parser = new xml2js.Parser();
    let obj;
    parser.parseString(file.contents.toString(), (err, result) => {
      obj = result;
    });
    let builder = new xml2js.Builder({headless: true});
    let result = builder.buildObject(obj);
    file.contents = new Buffer(result + "\n");
    cb(null, file);
  });
};

function getIconNames() {
  return fs.readdirSync('svg')
           .filter((name) => name.endsWith('.svg'))
           .map((name) => name.replace('.svg', ''))
           .sort();
};

gulp.task('svg:min', () => {
  return gulp.src('svg-src/*.svg')
    .pipe(rename((path) => {
      path.basename = path.basename.replace('nilicons_', '');
      return path;
    }))
    .pipe(changed('svg'))
    .pipe(svgmin({
      js2svg: {
        pretty: true,
        indent: '  '
      },
      plugins: [
        {removeTitle: true}
      ]
    }))
    .pipe(gulp.dest('svg'));
});

gulp.task('svg:sprite', () => {
  return gulp.src('svg/*.svg')
    .pipe(rename({prefix: 'ni-'}))
    .pipe(svgSprite(SVG_SPRITE_CONFIG))
    .pipe(prettySvg())
    .pipe(gulp.dest('.'));
});

gulp.task('svg:watch', () => {
  gulp.watch('svg-src/*.svg', (event) => {
    if (event.type === 'deleted') return;
    gulp.start('svg');
  });
});

gulp.task('svg', ['svg:min'], () => gulp.start('svg:sprite'));


gulp.task('site:twig', () => {
  return gulp.src('assets/twig/*.twig')
    .pipe(changed('.', {extension: '.html'}))
    .pipe(twig({data: {icons: getIconNames()}}))
    .pipe(gulp.dest('.'))
    .pipe(livereload());
});

gulp.task('site:sass', () => {
  return gulp.src('assets/scss/*.scss')
    .pipe(changed('assets/css', {extension: '.css'}))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('assets/css'))
    .pipe(livereload());
});

gulp.task('site:watch', () => {
  livereload.listen();
  gulp.watch('assets/js/site.js', () => livereload.changed('assets/js/site.js'));
  gulp.watch('assets/scss/*.scss', ['site:sass']);
  gulp.watch('assets/twig/*.twig', ['site:twig']);
  gulp.watch('sprite.svg', () => livereload.changed('sprite.svg'));
  gulp.watch('svg/*.svg', (event) => {
    switch (event.type) {
      case 'added':
      case 'deleted':
        gulp.start('site:twig');
    }
  });
});

gulp.task('site:inline', ['site:twig', 'site:sass'], () => {
  return gulp.src('index.html')
    .pipe(replace('<body>', () => {
      let sprite = fs.readFileSync('sprite.svg');
      return `<body><div style="display:none;">${sprite}</div>`;
    }))
    .pipe(replace(/<!-- devOnly [\s\S]*? devOnlyEnd -->/, ''))
    .pipe(inline({base: '.', disabledTypes: ['svg', 'img']}))
    .pipe(gulp.dest('.'));
});

gulp.task('site', ['site:twig', 'site:sass']);


gulp.task('zip', (cb) => {
  try {
    execSync(`ln -s svg nilicons-svg &&
              zip -FS -x '**/.*' -r nilicons-svg.zip nilicons-svg`,
             {stdio: [0, 1, 2]});
  } finally {
    execSync('rm nilicons-svg');
  }
  cb();
});


gulp.task('build', ['svg', 'site']);
gulp.task('watch', ['svg:watch', 'site:watch']);
gulp.task('default', ['build', 'watch']);
