var EE = require('eemitter'),
    extend = require('extend');


require('colors');

var id = 0;

function Job(data, done, progress) {
    this.data = data;
    this.jobId = ++id;
    this.doneFn = done;
    this.progressFn = progress;
}

Job.prototype.done = function (err) {
    if (typeof this.doneFn === 'function') {
        this.doneFn(this, err);
    }
};
Job.prototype.progress = function (p) {
    if (typeof this.progressFn === 'function') {
        this.progressFn(this, p);
    }
};

function SimpleQueue(name, options) {
    var concurrency = options.concurrency || 1;
    if (!(this instanceof SimpleQueue)) {
        return new SimpleQueue(name, concurrency);
    }
    this.name = name;
    this.queue = [];
    this.processing = [];
    this.concurrency = concurrency || 1;
    extend(this, new EE());
    return this;
}

function handleDone(job, err) {
    this.processing = this.processing.filter(function (j) {
        return j.jobId !== job.jobId;
    });
    if (err) {
        this.emit('failed', job, err);
    } else {
        this.emit('completed', job);
    }
    this.run();
}
function handleProgress(job, p) {
    this.emit('progress', job, p);
}

SimpleQueue.prototype.run = function () {
    var job;
    if (!this.processFn) {
        return;
    }
    // console.log('running queue:' + this.name);
    // console.log('items:' + this.queue.length);
    while (this.queue.length > 0 && this.processing.length < this.concurrency) {
        job = this.queue.shift();
        this.processing.push(job);
        // console.log('processing job in queue ', this.name.green, job.data);
        this.processFn.call(null, job, job.done.bind(job));
    }
};

SimpleQueue.prototype.add = function (data, cb) {
    var job = new Job(data, handleDone.bind(this), handleProgress.bind(this));
    this.queue.push(job);
    if (typeof cb === 'function') {
        cb(job);
    }
    this.run();
};

SimpleQueue.prototype.process = function (fn) {
    this.processFn = fn;
    this.run();
};

module.exports = SimpleQueue;
