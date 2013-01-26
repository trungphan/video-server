var crypto = require('crypto');
var fs = require('fs');

module.exports = function(app) {

    var nextUploadId = 1;

    app.post('/uploads', function(req, res) {

        var meta = req.body;
        console.log(meta);

        var length = meta.length;
        var filename = meta.filename;
        if (!length || !filename) {
            res.send(404);
            return;
        }

        var uploadId = nextUploadId ++;
        crypto.randomBytes(48, function(ex, buf) {
            var sessionId = buf.toString('hex');
            console.log(uploadId);


            var upload = {
                uploadId: uploadId,
                filename: filename,
                length: length,
                chunkLength: 524288,
                status: 'Incomplete',
                chunks: []
            };

            fs.writeFile('uploads/' + uploadId + '.txt', JSON.stringify(upload, null, 4), function(err) {

                if (err) {
                    res.send(300, err);
                }
                else {
                    res.setHeader('Set-Cookie', 'sessionId=' + sessionId);
                    res.send(201, upload);
                }
            });

        });


    });

    app.post('/file-upload', function(req, res) {
        console.log(req);
        // get the temporary location of the file
        var tmp_path = req.files.thumbnail.path;
        // set where the file should actually exists - in this case it is in the "images" directory
        var target_path = './uploads/' + req.files.thumbnail.name;
        // move the file from the temporary location to the intended location
        fs.rename(tmp_path, target_path, function(err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(tmp_path, function() {
                if (err) throw err;
                res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
            });
        });
    });

    app.get('/upload-form', function(req, res) {

        res.send(200, '<form method="post" enctype="multipart/form-data" action="/file-upload">' +
'            <input type="text" name="username">' +
'                <input type="password" name="password">' +
'                    <input type="file" name="thumbnail">' +
'                        <input type="submit">' +
'                        </form>');

    });

};
