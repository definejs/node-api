# API.js

node 中用于请求后台接口 API 的类。 

``` js

let headers = {
    'Content-Length': '288',
};

let api = new API('xxx');

api.on({
    'end': function (json, { res, }) {
        
    },

    'error': function (err, { res, }) {
        
    },
});

api.post(form, headers);

```