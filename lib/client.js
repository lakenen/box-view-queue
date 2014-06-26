'use strict';

var EE = require('eemitter'),
    extend = require('extend');

// require('colors');

function createUploader(bvq) {
    return function (job, done) {
        var tid;

        function updateStatus(message) {
            bvq.messageQueue.add({
                type: 'uploads-' + job.jobId,
                message: message
            });
        }

        function handleUploadResponse(err, response) {
            if (err) {
                err.status = 'error';
                updateStatus(err);
                done(err);
                return;
            }
            var docId = response.id;

            // console.log(response);

            if (response.status === 'done' || response.status === 'error') {
                // console.log('upload done (statuscheck)'.red, job.jobId);
                updateStatus(response);
                bvq.hooks.off(docId);
                done();
                return;
            }

            // wait for webhooks
            // console.log('waiting for hooks for '+docId)
            bvq.hooks.on(docId, function handleWebhook(message) {
                clearTimeout(tid);
                // console.log(('got webhook for ' + docId).blue, message.type);
                switch (message.type) {
                    case 'document.viewable':
                        response.status = 'viewable';
                        updateStatus(response);
                        break;
                    case 'document.done':
                        // console.log('upload done'.red, job.jobId);
                        response.status = 'done';
                        updateStatus(response);
                        bvq.hooks.off(docId);
                        done();
                        break;
                    case 'document.error':
                        response.status = 'error';
                        updateStatus(response);
                        bvq.hooks.off(docId);
                        done(message);
                        break;
                }
            });
            function checkStatus() {
                bvq.hooks.off(docId);
                bvq.client.documents.get(docId, handleUploadResponse);
            }
            tid = setTimeout(checkStatus, 5000);
        }
        if (job.data.url) {
            // console.log('about to upload'.red, job.jobId);
            bvq.client.documents.uploadURL(job.data.url, job.data.options, handleUploadResponse);
        } else if (job.data.file) {
            bvq.client.documents.uploadFile(job.data.file, job.data.options, handleUploadResponse);
        } else {
            throw new Error('invalid upload job:' + JSON.stringify(job));
        }
    };
}


function createSessionCreator(bvq) {
    return function (job, done) {

        function updateStatus(message) {
            bvq.messageQueue.add({
                type: 'sessions-' + job.jobId,
                message: message
            });
        }

        function handleSessionResponse(err, response) {
            if (err) {
                err.status = 'error';
                updateStatus(err);
                done(err);
                return;
            }

            response.status = 'done';
            updateStatus(response);
            done();
        }

        bvq.client.sessions.create(job.data.docId, job.data.options, handleSessionResponse);
    };
}

function BoxViewQueue(options) {
    var bvq = this;
    this.options = extend({}, BoxViewQueue.defaults, options);
    this.Queue = require('./queue-' + this.options.queue);
    if (!this.options.token) {
        throw new Error('"token" option is required');
    }
    this.client = require('box-view').createClient(this.options.token);
    this.client.documentsURL = process.env.BOX_VIEW_DOCUMENTS_URL || this.client.documentsURL;
    this.client.sessionsURL = process.env.BOX_VIEW_SESSIONS_URL || this.client.sessionsURL;
    this.uploadQueue = new this.Queue('uploads', 2);
    this.uploadQueue.process(createUploader(this));
    this.sessionQueue = new this.Queue('sessions', 10);
    this.sessionQueue.process(createSessionCreator(this));
    this.messageQueue = new this.Queue('messages');
    this.messageQueue.process(function (job, done) {
        // console.log('emitting message ', job.data);
        bvq.messages.emit(job.data.type, job.data.message);
        done();
    });
    this.messages = new EE();
    this.hooks = new EE();
}

BoxViewQueue.defaults = {
    queue: 'simple'
};

BoxViewQueue.prototype.webhooks = function (notifications) {
    var hooks = this.hooks;
    if (typeof notifications === 'string') {
        notifications = JSON.parse(notifications);
    }
    // console.log('got webhooks', notifications);
    (notifications || []).forEach(function (n) {
        // console.log(('emitting webhook for ' + n.data.id).yellow, n.type);
        hooks.emit(n.data.id, n);
    });
};

BoxViewQueue.prototype._upload = function (data) {
    var messages = this.messages;
    var ee = new EE();
    this.uploadQueue.add(data, function (job) {
        var channel = 'uploads-' + job.jobId;
        messages.on(channel, function (message) {
            ee.emit(message.status, message);
            if (message.status === 'error' || message.status === 'done') {
                messages.off(channel);
            }
        });
    });
    return ee;
};

BoxViewQueue.prototype._session = function (data) {
    var messages = this.messages;
    var ee = new EE();
    this.sessionQueue.add(data, function (job) {
        messages.one('sessions-' + job.jobId, function (message) {
            ee.emit(message.status, message);
        });
    });
    return ee;
};

BoxViewQueue.prototype.uploadURL = function (url, options) {
    return this._upload({
        url: url,
        options: options || {}
    });
};

BoxViewQueue.prototype.uploadFile = function (file, options) {
    return this._upload({
        file: file,
        options: options || {}
    });
};

BoxViewQueue.prototype.createSession = function (docId, options) {
    return this._session({
        docId: docId,
        options: options || {}
    });
};

BoxViewQueue.prototype.viewURL = function (url, uploadOptions, sessionOptions) {
    var bvq = this;
    var ee = new EE();
    var uploadEE = this.uploadURL(url, uploadOptions || {});

    function handleViewable(doc) {
        uploadEE.off('viewable');
        ee.emit('document.viewable', doc);
        var sessionEE = bvq.createSession(doc.id, sessionOptions);
        sessionEE.one('error', function (msg) {
            ee.emit('error', msg);
        });
        sessionEE.one('done', function (session) {
            ee.emit('done', session);
        });
    }
    uploadEE.one('error', function (msg) {
        ee.emit('error', msg);
    });
    uploadEE.one('done', function (doc) {
        handleViewable(doc);
        ee.emit('document.done', doc);
    });
    uploadEE.one('viewable', handleViewable);
    return ee;
};

module.exports = BoxViewQueue;
