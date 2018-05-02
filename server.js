var http = require('http'),
    path = require('path'),
    fs = require('fs');
 
function getFile(filePath,res,page404){
	fs.exists(filePath, (exists) => {
		if (exists) {
			fs.readFile(filePath, (err, contents) => {
				if (!err) {
					res.end(contents);
				} else {
					console.dir(err);
				}
			});
		} else {
			fs.readFile(page404, (err, contents) => {
				if (!err) {
					res.writeHead(404, {'Content-Type': 'text/html'});
					res.end(contents);
				} else {
					console.dir(err);
				};
			});
		};
	});
};
 
function requestHandler(req, res) {
	var	fileName = path.basename(req.url) || 'index.html',
	    localFolder = __dirname + '/public/',
	    page404 = localFolder + '404.html';
 
	getFile((localFolder + fileName), res, page404);
};
 
http.createServer(requestHandler).listen((process.env.PORT || 3000));
