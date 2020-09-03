

module.exports = async function (context, commands) {

    console.log("====================================")
    console.log("Executing code inside proxy_end.js")
    console.log("====================================")

    let proxy = context.proxy;
    proxy.close();

}
