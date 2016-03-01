"use strict";

const assert = require("assert");
const sinon = require("sinon");
const fs = require("fs");

const bigFileParser = require("../lib/bigFileParser");
const filePath = __dirname + "/dummy.txt";



describe("bigFileParserTest", () =>  {

    let myParser = new bigFileParser(filePath);
    const content = fs.readFileSync(filePath,{"encoding":"utf-8"});
    const readLine = sinon.spy();

    before(function () {
        this.timeout(1000);
    })
    
    it("it should emit line event", (done) =>  {         
        
        setTimeout(() => {
            assert.equal(readLine.callCount, 6);
            done();
        },3000);
        myParser.on("line",readLine);
        myParser.parse();
    }); 


    it("it should emit line event with the line-content as argument", (done) =>  {              

        setTimeout(() => {
            assert.deepStrictEqual(readLine.args[0][0], content.split("\r\n")[0]);
            done();
        },3000);
        
    }); 

    it("it should emit line event with the line-content as argument for all lines in file.", (done) =>  {
        setTimeout(() => {
            readLine.args.forEach((arg, i) => {
                assert.deepStrictEqual(arg[0], content.split("\r\n")[i]);
            });  
            done();
        },3000);
    }); 
});