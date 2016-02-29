# big-file-parser
This is a nodejs library for parsing large files line by line without crashing your system. 


## Use case

In case when you want to parse larger file, like a large log file which you parse, and insert log lines into elastic search for analysing data, or while parsing itself you use your algorithm to analyse the data line by line. 

The library also can be used to do data-imports from large feed files. 


## How to use

As specified in [example](https://github.com/bmhaskar/big-file-parser/blob/master/example/parse.js). 

* Include library 

```javascript
const bigFileParser = require('../lib/bigFileParser');
```
* Create a new instance for file, with full file path includeing filename that you wish to parse.

```javascript
let myParser = new bigFileParser(filePathWithName);
```
* Start parsing by calling `parse` function on parser instance. 
```javascript
myParser.parse();
```
* You can listen to `line` event which will be emitted as soon as a line is read from file.Its emmitted with the data that is been read from the file. 
```javscript 
myParser.on('line', (line) => console.log("Line received :"+ line));
```

### How it works 
---
For every instance, when you start parsing by calling a `parse` function it checks the number of CPU cores available on the machine, and size of the file to be parsed.

Then it forks node processes, same as number of CPU core's, each with start and end markers, indicating where to start and end reading the file per process.

Each process creates a separate read stream then starts reading the file as per the pointers/markers provided. On every line read it emits event named `line`, with the data which was read. We need to assign a listener to the library instance for `line` event to receive the data read from file.

It internally joins the lines if the end pointer passed to the process does not match with ending of line. 

We do not need to know the legth of the lines in file, it currently assumes `\n` or `\r\n` or `\r` as line breaks. 


## ToDo
1. Package the library and publish it over NPM. 
2. Do profiling of library and add statistics to README.md
3. Make end of line which is currently assumed as  `\n` or `\r\n` or `\r`, configurable. 


> Please suggest features and raise a bug as you find(:smirk:) and I love pull requests. 
