'use strict';
delete  process.env['DEBUG_FD'];

const co = require('co');
const config = require('./config');
const Server = require('./core/Server');

let port;
if ( process.env.NODE_ENV !== 'production' ) {
    port = config.developPort;
} else {
    port = config.port;
}

const temp = new Server(config.name, port);


temp.prepareData = function () {

    try {
        fs.statSync(config.uploadPath)
    } catch (err) {
        fs.mkdirSync(config.uploadPath);
        console.log('make folder uploads.')
    }
    try {
        fs.statSync(config.tempPath)
    } catch (err) {
        fs.mkdirSync(config.tempPath);
        console.log('make folder temp.')
    }
};

temp.init = function () {
    this.useRequestLogger();
    this.handleError();
    this.loadStatic();
    this.useCompress();

    this.useBodyParser();
    this.usePGSession();
    this.loadRouters();
};

if (!module.parent) {
    co(temp.run());
}





