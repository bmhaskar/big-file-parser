"use strict"

const assert = require("assert");
//const sinon = require("sinon");
const fs = require("fs");

const bigFileParser = require("../lib/bigFileParser");
const filePath = __dirname + "/dummy.txt";



describe("bigFileParserTest", function() {
	// const content = fs.readFileSync(filePath,{"encoding":"utf-8"});

	it("it should emit line event", function() {
		// const readLine = sinon.spy();
		const filePathWithName = __dirname+'/dummy.txt';


let myParser = new bigFileParser(filePathWithName);

myParser.parse();
myParser.on('line', (line) => console.log("Line received :"+ line));
myParser.on('error', (e) => console.log(e));

		// assert.equal(6, true);
		// done();

	})
});