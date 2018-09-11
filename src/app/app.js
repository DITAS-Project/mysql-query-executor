var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();

var port = 8080;

var vdmAddr = "mysqlslave";

var localCon = undefined;

if (process.argv.length > 2) {
    //HTTP port can be specified as application parameter. Otherwise, port 8080 is used.
    var inputPort = process.argv[2];
    if (inputPort > 8000 && inputPort < 65536) {
        port = inputPort;
    }
    else {
        console.log("Invalid port value, default 8080 used instead.");
    }
}

if (process.argv.length > 3) {
    //VDM address.
    var vdmAddr = process.argv[3];
}

var remoteCon = mysql.createConnection({
    host: vdmAddr,
    user: "root",
    password: "password"
});

remoteCon.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

var server = app.listen(port, function () {
    console.log("Resolution Engine listening on port " + port);
})

app.get('/api/switchToReplica', function (req, res) {
    localCon = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "password"
    });

    localCon.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    res.end("switched to local replica");
});

app.get('/api/switchToVDM', function (req, res) {
    localCon = undefined;
    res.end("switched to VDM slave node");
});

app.get('/api/executeQuery', function (req, res) {
    console.log(req.param('queryString'));
    var query = req.param('queryString');
    if (query === undefined) {
        console.log('Query string not specified');
        res.status(500).send('Query string not specified');
        return;
    }
    if (query.split(' ')[0].toLowerCase() !== 'select') {
        res.status(500).send('Attempted to execute write operation with HTTP GET. Use HTTP POST instead');
        return;
    }
    if (localCon !== undefined) {
        console.log("local replica queried");
        localCon.query(query, function (err, result) {
            if (err) res.end(err.sqlMessage);
            console.log("Result: " + result);
            res.end(JSON.stringify(result));
        });
    } else {
        console.log("VDM slave node queried");
        remoteCon.query(query, function (err, result) {
            if (err) res.end(err.sqlMessage);
            console.log("Result: " + result);
            res.end(JSON.stringify(result));
        });
    }
})

app.post('/api/executeQuery', function (req, res) {
    console.log(req.param('queryString'));
    var query = req.param('queryString');
    if (query === undefined) {
        res.status(500).send('Query string not specified');
    }
    console.log("vdm slave node queried");
    remoteCon.query(query, function (err, result) {
        if (err) res.end(err.sqlMessage);
        console.log("Result: " + result);
        res.end(JSON.stringify(result));
    });
})