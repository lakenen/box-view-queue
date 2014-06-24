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
client.viewURL('https://cloud.box.com/shared/static/t8h3ith36mdnssywr0zo.pdf', function (err, res) {
    console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
});
client.viewURL('https://cloud.box.com/shared/static/t8h3ith36mdnssywr0zo.pdf', function (err, res) {
    console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
});
client.viewURL('https://cloud.box.com/shared/static/t8h3ith36mdnssywr0zo.pdf', function (err, res) {
    console.log(err && (err.message && err.message.red || err) || res.urls.view.green);
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
}).listen(9999);*/
