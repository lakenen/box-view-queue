'use strict';

var queue = require('bull');

module.exports = function RedisQueue(name, options) {
    var queues = [];
    var concurrency = options.concurrency || 1;
    while (queues.length < concurrency) {
        queues.push(queue(name, options.port, options.host));
    }
    return {
        add: function (data, cb) {
            queues[0].add(data).then(cb);
        },
        on: queues[0].on,
        process: function (fn) {
            queues.forEach(function (q) {
                q.process(fn);
            });
        }
    };
};
