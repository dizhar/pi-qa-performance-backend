
require('./proxy');

 let conf = require(`../../config/temp-proxy_${process.env.DATA_ID}.json`);

module.exports = async function (context, commands) {
        console.log("====================================")
        console.log("Executing code inside proxy_start.js")
        // DATA_ID is passed in the docker run in sitespeed.sh script
        console.log(`DATA_ID = ${process.env.DATA_ID}`)
        console.log("====================================")

        context.proxy = await "<head>[0]"['proxyReplace'](`<head>`, conf['port'])
};
