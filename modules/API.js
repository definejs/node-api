
const https = require('https');
const zlib = require('zlib');
const Emitter = require('@definejs/emitter');

const mapper = new Map();


class API {

    constructor(name, config) {
        config = Object.assign({}, exports.defaults, config);

        let path = `${config.url}${name}${config.ext}`;
        let emitter = new Emitter(this);

        let meta = {
            'path': path,
            'emitter': emitter,
            'hostname': config.hostname,
            'port': config.port,
            'headers': config.headers,
            'data': config.data,
        };


        mapper.set(this, meta);
    }

    /**
    * 发起请求。
    * @param {string} method 必选，请求的方法，只能是 `get` 或 `post`。
    * @param {Object}} [data] 可选，要发送的数据主体。
    * @param {Object} [headers] 可选，要发送的请求头部字段。
    */
    request(method, data, headers) {
        let meta = mapper.get(this);

        data = Object.assign({}, meta.data, data);
        data = JSON.stringify(data);
        headers = Object.assign({}, meta.headers, headers);

        let opts = {
            'method': method,
            'hostname': meta.hostname,
            'port': meta.port,
            'path': meta.path,
            'headers': headers,
        };

        let chunks = [];


        let req = https.request(opts, function (res) {
            let info = { req, res, opts, };

            res.on('data', function (chunk) {
                chunks.push(chunk);
                meta.emitter.fire('data', [chunk, info]);
            });

            res.on('end', function () {
                let buffers = Buffer.concat(chunks);

                //使用了 gzip 压缩。
                if (res.headers['content-encoding'] == 'gzip') {
                    buffers = zlib.gunzipSync(buffers);
                }

                let data = buffers.toString();

                //转成 json。
                if (res.headers['content-type'].includes('application/json;')) {
                    data = JSON.parse(data);
                }

                meta.emitter.fire('end', [data, info]);
            });

        });

        req.on('error', function (error) {
            meta.emitter.fire('error', [error, { req, opts, }]);
        });


        meta.emitter.fire('request', [{ req, opts, }]);
        req.write(data);
        req.end();
    }

    /**
    * 发起 GET 请求。
    * @param {Object}} [data] 可选，要发送的数据主体。
    * @param {Object} [headers] 可选，要发送的请求头部字段。
    */
    get(data, headers) {
        this.request('get', data, headers);
    }

    /**
    * 发起 POST 请求。
    * @param {Object}} [data] 可选，要发送的数据主体。
    * @param {Object} [headers] 可选，要发送的请求头部字段。
    */
    post(data, headers) {
        this.request('post', data, headers);
    }

    on(...args) {
        let meta = mapper.get(this);
        meta.emitter.on(...args);
    }
}




API.defaults = require('./API.defaults');
module.exports = exports = API;