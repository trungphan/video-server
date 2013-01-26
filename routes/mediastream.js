var sys = require('sys');
var fs = require('fs');
var util = require('util');


module.exports = function(app) {

    app.get('/media/:videoFilename', function(req, res) {

        sys.puts(util.inspect(req.headers, showHidden=false, depth=0));

        var filename = req.params.videoFilename;
        var pathName = 'media/' + filename;
        var index = filename.lastIndexOf('.');
        if (index == -1) {
            res.send(400);
            return;
        }

        var stat = fs.statSync(pathName);
        if (!stat.isFile()) {
            res.send(404);
            return;
        }

        var ext = filename.substring(index + 1, filename.length).toLowerCase();
        var contentType = ext === 'webm' ? 'video/webm' :
                          ext === 'mp4' ? 'video/mp4' :
                          ext === 'ogv' ? 'video/ogg' : '';

        if (contentType === '') {
            res.send(406);
            return;
        }

        var start = 0;
        var end = 0;
        var range = req.header('Range');
        if (range != null) {
            start = parseInt(range.slice(range.indexOf('bytes=')+6,
                range.indexOf('-')));
            end = parseInt(range.slice(range.indexOf('-')+1,
                range.length));
        }
        if (isNaN(end) || end == 0) end = stat.size-1;

        if (start > end) return;

        res.writeHead(206, {
            'Date': new Date().toUTCString(),
            'Connection':'close',
            // 'Cache-Control':'private',
            'Content-Type': contentType,
            'Content-Length':end - start,
            'Content-Range':'bytes '+start+'-'+end+'/'+stat.size,
            // 'Accept-Ranges':'bytes',
            'Server':'Video-Stream',
            'Transfer-Encoding':'chunked'
        });

        var stream = fs.createReadStream(pathName, { flags: 'r', start: start, end: end});
        stream.pipe(res);

    });



};


