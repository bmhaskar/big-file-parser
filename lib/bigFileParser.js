'use strict';
const cluster = require('cluster');
const fs = require('fs'); 
const events = require("events");


class bigFileParser extends events.EventEmitter {
	constructor(filePathWithName) {
		super({value: bigFileParser});
		this.fileName= filePathWithName; 		
		this.lines = [];
		//events.EventEmitter.call(this);
	}

	parse() {
		if(cluster.isMaster) {
			fs.stat(this.fileName, (err, stat) => {
				if(err) throw new Error("Clould not read file "+ this.fileName);
				this.createCluster(stat.size);
			})
		} else {
			this.createStream();			
		}
	}

	createStream() {				

		const readStream = fs.createReadStream(this.fileName,
			{start: parseInt(process.env.start),end: parseInt(process.env.end)});


		readStream.on('error', (err) => {
			this.emit('error', err);
		});

		readStream.on('open', (props) => {
			this.emit('open', props);
		});

		readStream.on('data',  (data)  => {		
			console.log(data.toString().split(/(?:\n|\r\n|\r)/g));	
			this.readStream.pause();
			this.lines = this.lines.concat(data.toString().split(/(?:\n|\r\n|\r)/g));


			this.lines[0] = this.lineFragment + this.lines[0];
			this.lineFragment = this.lines.pop() || '';

			setImmediate( () =>  {
				this.nextLine();
			});
		});

		readStream.on('end', () => {
			if( this.lineFragment) {
				this.emit('line', this.lineFragment);
			}
			cluster.worker.disconnect();
		});
		this.readStream = readStream;		
	}
 

	createCluster(fileSize) {	
		const numCPUs = require('os').cpus().length;

		let fileSizeStart = 0;
		let fileSizeIncrement = Math.ceil(fileSize/numCPUs);
		

		for(let i =0; i<numCPUs && fileSizeStart <= fileSizeStart+fileSizeIncrement ; i++) {
			cluster.fork({start: fileSizeStart, end: fileSizeStart+fileSizeIncrement});
			fileSizeStart += fileSizeIncrement+1;
		}		

		const messageHandler = (msg) =>  {
			console.log(msg)
		};

		Object.keys(cluster.workers).forEach(id => {
			cluster.workers[id].on('message', messageHandler);
		});


		cluster.on('exit', (worker, code, signal) => {
			console.log("Test : "+cluster.workers.length);			
			    console.log(`worker ${worker.process.pid} died`);
			}	
		);
	  
	}


	nextLine() {
		console.log(this.lines);
		 let line = this.lines.shift();

		if (!this.skipEmptyLines || line.length > 0) {
			this.emit('line', line);
		}

		this.readStream.resume();
		// console.log(this.lines);
		// console.log("next line called");
		// var self = this,
		// 	line;

		// if (this.end && this.lineFragment) {
		// 	this.emit('line', this.lineFragment);
		// 	this.lineFragment = '';

		// 	if (!this.paused) {
		// 		setImmediate( () => {
		// 			this.end();
		// 		});
		// 	}
		// 	return;
		// }

		// if (this._paused) {
		// 	return;
		// }

		// if (this._lines.length === 0) {
		// 	if (this._end) {
		// 		this.end();
		// 	} else {
		// 		this._readStream.resume();
		// 	}
		// 	return;
		// }

		// line = this._lines.shift();

		// if (!this._skipEmptyLines || line.length > 0) {
		// 	this.emit('line', line);
		// }

		// if (!this._paused) {
		// 	setImmediate(function () {
		// 		self._nextLine();
		// 	});
	}
}



module.exports = bigFileParser;