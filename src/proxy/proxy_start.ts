
require('./proxy');

// let obj: string = require('../../config/config-session.json')
// let config = require(`../../config/temp-proxy_${obj['sessionId']}.json`);

let obj: string = require('./config/config-session.json')
let config = require(`./config/temp-proxy_${obj['sessionId']}.json`);

module.exports = async function(context, commands) {
        context.proxy  =  await "<head>[0]"['proxyReplace'](`<head><link rel="dns-prefetch" href="${config['script_tag']}" ><script src="${config['script_tag']}"></script>`, config['port'])
};
