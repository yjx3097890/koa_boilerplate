'use strict';

const fs = require('fs');
const path_ = require('path');
const mime = require('mime');
const crypto = require('crypto');
const pathToRegexp = require('path-to-regexp');
const staticCache = require('koa-static-cache');

const ONE_DAY = 24 * 60 * 60;
const DEFAULTS = {
    routeBases: ['/'],
    stripSlash: false,
    indexes: ['/index.html'],
    static: {
        maxAge: 60 * ONE_DAY
    }
};

function isDebug() {
    return !process.env.NODE_ENV || process.env.NODE_ENV == 'development'
}

//合并对象
function defaults(a, b) {
    for (let k in b) {
        if (!a.hasOwnProperty(k)) {
            a[k] = b[k]
        }
    }
}

//将route变成正则
function transformRoutes(routes) {
    let k, v;
    for (k in routes) {
        v = routes[k];
        if (typeof v === 'string') {
            routes[k] = new RegExp('^' + v.replace(/\:[^\/]+/g, '([^\/]+)') + '$');
        }
    }
    return routes;
}

function cleanFileSizes(files) {
    for (let f in files) {
        delete files[f].length;
        delete files[f].etag;
    }
}

module.exports = function(directory, options) {

    options = options || {};
    defaults(options, DEFAULTS);
    let debug = 'debug' in options ? options.debug : isDebug();
    if (debug && !options.static.cacheControl) {
        options.static.cacheControl = 'no-cache'
    }

    const routes = options.routes;
    const files = {};
    const serve = staticCache(directory, options.static, files);
    const alias = options.static.alias || {};
    let indexes = options.indexes;
    let routeBases = options.routeBases.map(routeBase => routeBase.replace(/\/$/, ''));
    const stripSlash = options.stripSlash;

    indexes = indexes.map((i) => {
         if (i[0] !== '/') return '/' + i;
         return i;
    });
    const routeBasesPrefix = routeBases.map((routeBase) => new RegExp('^' + routeBase));

    if (routes) {
        transformRoutes(options.routes);
    }

    function getHeaders(filekey) {
        filekey = alias[filekey] || filekey;
        const filename = path_.join(directory, filekey);
        if (fs.existsSync(filename)) {
            let obj = {};
            let stats = fs.statSync(filename);
            let buffer = fs.readFileSync(filename);

            obj.path = filename;
            obj.cacheControl = options.static.cacheControl;
            obj.maxAge = options.static.maxAge || 0;
            obj.mtime = stats.mtime.toUTCString();
            obj.type = obj.mime = mime.lookup(filekey);
            obj.length = stats.size;
            obj.md5 = crypto.createHash('md5').update(buffer).digest('base64');
            return obj;
        }
    }

    return function* (next) {


        let path, key, length;

        path = this.path;
        length = routeBases.length;

        // when tail is slash,去掉 /
        if ( path.slice(-1) === '/') {
            // consider as no slash internally
            path = path.slice(0, -1);
            // if need strip slash, do redirect
            if (stripSlash) {
                this.status = 301;
                this.redirect(path);
                return
            }
        }

        for (let i = 0; i < length ; i++) {
            let routeBase = routeBases[i];
             let index = indexes[i];

            if (routeBase === path) {
                key = index;
                this.path = index;
                break;
            }
            if ( (i + 1) === length  ) {
                key = path;
            }
        }

        if (key) {
            if (debug) {
                // if debugging, always update file headers
                files[key] = getHeaders(key);
            }
            if (files[key]) {
                //文件夹中的静态文件
                return yield serve;
            }
        }

        let matched = false;
        if (!routes) {
            matched = true;
        } else {
            for (let r of routes) {
                if (r.test(key)) {
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) {
            this.status = 404
        } else {

            routeBasesPrefix.some((rp, i) => {
                if (rp.test(path)) {
                    this.path = indexes[i];
                    return true;
                }
                return false;
            });

            yield serve;
        }

        // run other middlewares
         yield next;
    }
};

module.exports.routeCollector = function(routes) {
    routes = routes || {};
    const ret = function(route, handler) {
        if (route[0] != '/') {
            route = '/' + route; // add head slash
        }
        routes[route] = pathToRegexp(route); // clean tail slash
    };
    ret.routes = routes;
    return ret;
};
