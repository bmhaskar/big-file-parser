'use strict';
const cluster = require('cluster');
const fs = require('fs'); 
const events = require("events");


class bigFileParser extends events.EventEmitter {
	constructor(filePathWithName, options) {
		super({value: bigFileParser});
		
		options = Object.assign({skipEmptyLines: false}, options);
		
		this.fileName= filePathWithName; 		
		this.skipEmptyLines = options.skipEmptyLines;

		this.lines = [];
		this.lineFragment = '';

		this.end = false;
		this.delimeterFound =  false;


		this.lineRecordingStarted = false;
	}

	parse() {
		if(cluster.isMaster) {
			fs.stat(this.fileName, (err, stat) => {
				if(err) throw new Error("Clould not read file "+ this.fileName);
				this.createCluster(stat.size);
			})
		} else {
			this.createStream(parseInt(process.env.start), parseInt(process.env.end));			
		}
	}

	createStream(start, end) {				
		const readStream = fs.createReadStream(this.fileName,
			{start: start,end: end});

		readStream.on('error', (err) => {
			this.emit('error', err);
		});


		readStream.on('data',  (data)  => {					
			this.onData(data);
		});

		readStream.on('end', () => {
			this.end = true;
			setImmediate( ()  => {
				this.lastLine();
			});
		});

		this.readStream = readStream;		
	}

	onData(data) {
		this.readStream.pause();
		data = data.toString();			

		const delimeterFound = new RegExp(/(?:\n|\r\n|\r)/g).test(data);
		if(delimeterFound ) {			
			this.lines =  data.split(/(?:\n|\r\n|\r)/g);			
			this.lines[0] = this.lineFragment + this.lines[0];

			if(!this.lineRecordingStarted && process.env.isNotAFirstProcess) {
				process.send({startLine: this.lines.shift(), id: cluster.worker.id});			 
				this.lineRecordingStarted = true;
			}
			this.lineFragment = this.lines.pop() || '';	
		} else {

			this.lineFragment += data;
		}
		
		
		setImmediate( () =>  {
			this.nextLine();
		});
	}

	lastLine() {				
		let msg = {id: cluster.worker.id};
		if(this.lineRecordingStarted)  {
			msg.endLine  =  this.lineFragment;
		} else {
			msg.startLine  =  this.lineFragment;
		}
		process.send(msg);
		this.readStream.destroy();
		cluster.worker.disconnect();
	}
 

	createCluster(fileSize) {	
		const numCPUs = require('os').cpus().length;		

		let fileSizeStart = 0;
		let fileSizeIncrement = Math.ceil(fileSize/numCPUs);
		

		for(let i =0; i<numCPUs && fileSizeStart <= fileSizeStart+fileSizeIncrement ; i++) {			
			cluster.fork({start: fileSizeStart, end: fileSizeStart+fileSizeIncrement, isNotAFirstProcess: (i==0) });
			fileSizeStart += fileSizeIncrement+1;
		}		
			

		let lines = {};
		const messageHandler = (msg) =>  {
			lines[msg.id] = lines[msg.id] || {} ;
			lines[msg.id].startLine =  msg.startLine || lines[msg.id].startLine;
			lines[msg.id].endLine =  msg.endLine || lines[msg.id].endLine;

		};

		Object.keys(cluster.workers).forEach(id => {
			cluster.workers[id].on('message', messageHandler);
		});

		cluster.on('exit', (worker, code, signal) => {

			if(Object.keys(cluster.workers).length == 0) {

				 	let line = '';
					Object.keys(lines).forEach(id => {
						let startLine = lines[id].startLine;
						let endLine = lines[id].endLine;

						if(startLine) {
							line += startLine;
						}

						if(endLine) {
							this.emit('line', line);
							line = endLine;
						}
					});
					if(line) {
						this.emit('line', line);
					}

				}
			}
		);
	  
	}


	nextLine() {		
		const line = this.lines.shift();

		if (line !== undefined && (!this.skipEmptyLines || line.length > 0)) {
			this.emit('line', line);
		}

		if (this.lines.length === 0) {
			this.readStream.resume();
		} else {
			setImmediate( () => {
				this.nextLine();
			})
		}		
	}
}



module.exports = bigFileParser;