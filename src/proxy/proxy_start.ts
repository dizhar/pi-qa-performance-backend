
require('./proxy');

// let obj: string = require('../../config/config-session.json')
// let config = require(`../../config/temp-proxy_${obj['sessionId']}.json`);

// proxy_start.js is in /root/script/proxy/proxy_start.js

let obj: string = require('../../config/config-session.json')

//let config = require(`../../config/temp-proxy_${obj['sessionId']}.json`);
let config = require(`../../config/temp-proxy_${process.env.DATA_ID}.json`);

module.exports = async function (context, commands) {
        // DATA_ID is passed in the docker run in sitespeed.sh script
        console.log(`DATA_ID = ${process.env.DATA_ID}`)
        context.proxy = await "<head>[0]"['proxyReplace'](`<head><link rel="dns-prefetch" href="${config['script_tag']}" ><script src="${config['script_tag']}"></script>`, config['port'])
};
