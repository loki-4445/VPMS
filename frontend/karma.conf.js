module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Randomise test order each run to catch order-dependent bugs
        random: true
      },
      clearContext: false   // leave Jasmine Spec Runner visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true     // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },   // open coverage/frontend/index.html in browser
        { type: 'text-summary' }  // printed in terminal after test run
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,       // keeps browser open in watch mode; use ng test --watch=false for CI
    restartOnFileChange: true
  });
};
