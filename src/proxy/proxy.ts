'use strict';

const HttpMitmProxy = require('http-mitm-proxy');


String.prototype['proxyReplace'] = function(replaceValue, port) {
    const mitm = new  HttpMitmProxy();

    port = port || 8080;
    let searchValue = this;

    let isBrackets = /\[([^\]]+)]/.test(searchValue);

    if(!isBrackets)
        searchValue = searchValue.concat('[0]');

    let occurrence = parseInt(searchValue.match(/\[([0-9]+)\]/)[1], 10);
    let value = searchValue.replace(/ *\[[^)]*\] */g, "").replace(/[\[\]']+/g,'');

     mitm.onError(function (ctx, err, errorKind) {
        // ctx may be null
        let url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
        console.error(errorKind + ' on ' + url + ':', err);
    });


     mitm.use(HttpMitmProxy.gunzip);

     mitm.onRequest(function (ctx, callback) {
        let chunks = [];

        ctx.onResponseData(function (ctx, chunk, callback) {
            chunks.push(chunk);
            return callback(null, null); // don't write chunks to client response
        });
        ctx.onResponseEnd(function (ctx, callback) {
            let body = Buffer.concat(chunks);
            if (ctx.serverToProxyResponse.headers['content-type'] && ctx.serverToProxyResponse.headers['content-type'].indexOf('text/html') === 0) {
                let t=0;

                (body as any)= body.toString().replace(new RegExp(value, 'g'), function (match) {
                    t++;
                    return (t === occurrence+1) ? replaceValue : match;
                });
            }
            ctx.proxyToClientResponse.write(body);
            return callback();
        });
        callback();
    });


     mitm.listen({port: port});
    return mitm;
}



