'use strict';
const bigFileParser = require('../lib/bigFileParser');
const dataProcessor = require('./processData');
const filePathWithName = process.argv[2];


let myParser = new bigFileParser(filePathWithName);

myParser.parse();
myParser.on('line', (line) => console.log("Line received :"+ line));