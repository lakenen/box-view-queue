'use strict';

var queue = require('bull');
var EventEmitter = require('eemitter');

module.exports = function RedisQueue(name, options) {
    var queues = [];
    var q;
    var ee = new EventEmitter();
    var concurrency = options.concurrency || 1;

    function remove(job) {
        job.remove();
    }

    function completed(job) {
        remove(job);
        ee.emit('completed', job);
    }

    function failed(job) {
        remove(job);
        ee.emit('failed', job);
    }

    function getQueue() {
        return queues[Math.floor(Math.random() * queues.length)];
    }

    while (queues.length < concurrency) {
        q = queue(name, options.port, options.host);
        q.on('completed', completed);
        q.on('failed', failed);
        queues.push(q);
    }

    return {
        add: function (data, cb) {
            getQueue().add(data).then(cb);
        },
        on: ee.on,
        process: function (fn) {
            queues.forEach(function (q) {
                q.process(fn);
            });
        }
    };
};
