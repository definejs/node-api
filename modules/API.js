
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
    * 
    * @param {Object}} [data] 可选，要发送的数据主体。
    * @param {Object} [headers] 可选，要发送的请求头部字段。
    */
    post(data, headers) {
        let meta = mapper.get(this);

        data = Object.assign({}, meta.data, data);
        data = JSON.stringify(data);
        headers = Object.assign({}, meta.headers, headers);

        let opts = {
            'method': 'POST',
            'hostname': meta.hostname,
            'port': meta.port,
            'path': meta.path,
            'headers': headers,
        };

        let chunks = [];

        let req = https.request(opts, function (res) {
            let info = { req, res, };

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
            meta.emitter.fire('error', [error, { req, }]);
        });

        req.write(data);
        req.end();
    }

    on(...args) {
        let meta = mapper.get(this);
        meta.emitter.on(...args);
    }
}

API.defaults = require('./API.defaults');
module.exports = exports = API;