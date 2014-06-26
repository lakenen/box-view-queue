var BoxViewQueue = require('./lib/client');

// require('colors');
module.exports = {
    createClient: function (options) {
        return new BoxViewQueue(options);
    }
};
/*
var client = module.exports.createClient({
    token: process.env.BOX_VIEW_API_TOKEN,
    queue: 'redis'
});

// client.viewURL('http://10.0.2.2:9990/article-typography.pdf', function (err, res) {
//     console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
// });
// client.viewURL('https://cloud.box.com/shared/static/t8h3ith36mdnssywr0zo.pdf', function (err, res) {
//     console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
// });
// client.viewURL('https://cloud.box.com/shared/static/t8h3ith36mdnssywr0zo.pdf', function (err, res) {
//     console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
// });
var sessionRequest = client.viewURL('http://nms.sagepub.com/content/early/2011/09/27/1461444811412160.full.pdf');
sessionRequest.on('error', function (err) {
    console.error('error'.red, err);
});
sessionRequest.on('document.done', function (doc) {
    console.error('document done'.yellow, doc);
});
sessionRequest.on('done', function (sess) {
    console.log('session!'.green, sess);
});


function parseJSONBody(body) {
    try {
        return JSON.parse(body);
    } catch (e) {
        return body;
    }
}

function readStream(stream, callback) {
    var body = '';
    stream.on('data', function (d) {
        body += d.toString();
    });
    stream.on('end', function () {
        callback(parseJSONBody(body));
    });
    stream.on('error', callback);
}

require('http').createServer(function (req, res) {
    readStream(req, function (body) {
        client.webhooks(body);
        res.writeHeader(200);
        res.end();
    });
}).listen(9999);
*/
