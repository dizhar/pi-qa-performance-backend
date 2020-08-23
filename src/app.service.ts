import { Injectable, Session } from '@nestjs/common';
import * as shell from "shelljs";
import { request } from 'express';

import * as pagexray from 'pagexray';
import { stringify } from 'querystring';
import { timeStamp, count } from 'console';
import { async } from 'rxjs';

import * as fs from 'fs';
import { AbstractHttpAdapter } from '@nestjs/core';
import { RegExr } from "./support/RegExr";
import {Create  } from './support/create';

var tcpPortUsed = require('tcp-port-used');



const _RegExr = new RegExr();
const _create = new Create();


@Injectable()
export class AppService {


  constructor() { }

  async removeConfigFile(list: {}[]): Promise<void>{
      list.forEach((item)=>{
       fs.unlinkSync(`./config/${item}`)
      })
  }

  async start(list: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }[]): Promise<Object[]> {
    let results = new Array();
    let uniqid: string = _RegExr.getUniquId();
     _create.setSessionConfigFile(uniqid);


    list.forEach(data => {
      // let uniqid: string = _RegExr.getUniquId();
      // new Promise(() => {
      //   _create.setSessionConfigFile(uniqid);
      // });

      let obj = Object.assign(data, { session: uniqid });   
      switch (data.goal) {
        case "test production": results.push(testProduction(obj))
          break;
        case "test qa": results.push(testQA(obj));
          break;
        default: null;
          break;
      }
    });

    return  await Promise.all(results);
  }
}

async function testQA(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, session: string }) {
  let outPut = new Object();
  
  Object.assign(data, {configFile: `temp-proxy_${data.session}.json`});
  let obj = Object.assign(data, { port: await getAvilablePort() });


  await createAProxyConfigFileWithPIM(obj);
  outPut['agent'] = await  getPageXrayWithoutPIM(`./speedtest.sh local config/temp-proxy_${data.session}.json`, data);
  outPut['agent'].session = data;


  await createAProxyConfigFileWithoutPIM(obj)
  outPut['noAgent'] =  await getPageXrayWithoutPIM(`./speedtest.sh local config/temp-proxy_${data.session}.json`, data);
  outPut['noAgent'].session = data;

  return Promise.resolve(outPut);
}


async function testProduction(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, session: string}): Promise<object> {
  let outPut = new Object();

  Object.assign(data, {configFile: `temp-config_${data.session}.json`});

  await createConfigFile(data)

  outPut['agent'] = await getPageXrayWithPIMAgent(`./speedtest.sh local config/temp-config_${data.session}.json`, data);
  outPut['agent'].session = data;

  outPut['noAgent'] = await getPageXrayWithoutPIM(`./speedtest.sh local config/temp-config_${data.session}.json`, data);
  outPut['noAgent'].sesssion = data;

  return Promise.resolve(outPut);
}



async function getAvilablePort(): Promise<number> {
  let port: number = 4200;
  let inUse: boolean = await tcpPortUsed.check(port, '127.0.0.1');

  while (inUse === true) {
    port++;
    inUse = await tcpPortUsed.check(port, '127.0.0.1');
  }
  return port;
}



async function getPageXrayWithPIMAgent(execute: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object> {

  let lastword: string;
  let parse: any;  
  let agentLog: string = shell.exec(`${execute} ${data.webpageWithPIM}`, { silent: true }).stdout;


  new Promise(() => {
    lastword = getLastword(agentLog);
  });


  let folderWPathWebsite: string = getfolderWPathWebsite(agentLog, data)
  let har: string = getHARFile(agentLog, data, lastword, folderWPathWebsite);


  let link: string = `${lastword}/index.html`.trim();
  let harPath: string = `${lastword}${har}`.trim();
  let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${harPath}`.trim(), { silent: true }).stdout;

  new Promise(() => {
    parse = JSON.parse(pageXray)
  })


  let obj = {
    link: link,
    harPath: harPath,
    pageXray: parse
  };

  return Promise.resolve(obj);
}



async function getPageXrayWithoutPIM(execute: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object> {
try {
  

  let lastword: string;
  let parse: any;
  let agentLog = shell.exec(`${execute} ${data.webpageWithoutPIM}`, { silent: true }).stdout;

  new Promise(() => {
    lastword = getLastword(agentLog);
  });


  let folderWPathWebsite = getfolderWPathWebsite(agentLog, data)
  let har: string  = getHARFile(agentLog, data, lastword, folderWPathWebsite);

  let link: string = `${lastword}/index.html`.trim();
  let harPath: string = `${lastword}${har}`.trim();
  let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${harPath}`.trim(), { silent: true }).stdout;


  new Promise(() => {
    parse = JSON.parse(pageXray)
  })


  let obj: Object = {
    link: link,
    harPath: harPath,
    pageXray: parse
  };

  return Promise.resolve(obj);
} catch (error) {
     throw error;
}

}


function getfolderWPathWebsite(outPut: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): string {
  let lastword: string = getLastword(outPut);
  let folder: string = getFolder(lastword);
  let website: string = getWithoutHttp(data.webpageWithoutPIM);
  return `${folder}/pages/${website}/`;
}


function getHARFile(outPut: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }, lastWord: string, folderWPathWebsite: string): string {
  let lastword: string = getLastword(outPut);
  let folder: string = getFolder(lastword);
  let website: string = getWithoutHttp(data.webpageWithoutPIM);
  let childDirectory: string = shell.exec(`cd ${__dirname}/../data/piqaautomationstorage/${lastword}${folderWPathWebsite} && ls -1d */`, { silent: true }).stdout;

  if (childDirectory.trim() === 'data/') {
    return `${folder}/pages/${website}/data/browsertime.har`;
  } else {
    return `${folder}/pages/${website}/${childDirectory.replace(/(\r\n|\n|\r)/gm, "")}/data/browsertime.har`;
  }
}

function getLastword(outPut: string): string {
  let lastline = outPut.split('\n')[outPut.split('\n').length - 2];
  return lastline.split(" ")[lastline.split(" ").length - 1];
}


function getFolder(outPut: string): string {
  let list = outPut.split('/');
  let cutofPoint = false;
  let sentence: string = '';
  list.forEach(item => {
    if (cutofPoint) sentence = sentence + "/" + item;
    if (item === "sitespeed.io") cutofPoint = true;
  });
  return sentence;
}


function getWithoutHttp(url: string): string {
  return url.replace(/^(?:https?:\/\/)?/i, "").split('/')[0];
}


async function getLink(log: string, data: object): Promise<string> {
  let lastword = getLastword(log);
  return `.${lastword}/index.html`;
}

async function createAProxyConfigFileWithPIM(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, port: number, session: string}) {

  let config = {
    "browsertime": {
      "browser": data.browser,
      "iterations": data.iterations,
      "spa": data.spa,
      "preScript": "root/dist/proxy/proxy_start.js",
      "postScript": "root/dist/proxy/proxy_end.js",
      "summary": true,
      "firefox.disableSafeBrowsing": true,
      "firefox.acceptInsecureCerts": true,
      "chrome.ignoreCertificateErrors": true,
      "firefox.args": [],
      "firefox.preference": {},
      "chrome.args": []
    },
    "proxy.https": `127.0.0.1:${data.port}`,
    "proxy.http": `127.0.0.1:${data.port}`,
    "html": {
      "showAllWaterfallSummary": true,
      "compareUrl": true
    },
    "Text": {
      "summary": false
    },
    "Sustainable": {
      "enable": true,
      "pageViews": 7
    },
    "axe": {
      "enable": true
    },
    "metrics": {
      "list": true,
      "filterList": true
    },
    "gzipHAR": false,
    "video": true,
    "logToFile": true,
    "script_tag": data.script_tag,
    "port": data.port
  }

  fs.writeFileSync(`./config/temp-proxy_${data.session}.json`, JSON.stringify(config));
}


async function createAProxyConfigFileWithoutPIM(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, port: number,session:string }) {

  let config = {
    "browsertime": {
      "browser": data.browser,
      "iterations": data.iterations,
      "spa": data.spa,
      "preScript": "root/dist/proxy/proxy_start.js",
      "postScript": "root/dist/proxy/proxy_end.js",
      "summary": true,
      "firefox.disableSafeBrowsing": true,
      "firefox.acceptInsecureCerts": true,
      "chrome.ignoreCertificateErrors": true,
      "firefox.args": [],
      "firefox.preference": {},
      "chrome.args": []
    },
    "proxy.https": `127.0.0.1:${data.port}`,
    "proxy.http": `127.0.0.1:${data.port}`,
    "html": {
      "showAllWaterfallSummary": true,
      "compareUrl": true
    },
    "Text": {
      "summary": false
    },
    "Sustainable": {
      "enable": true,
      "pageViews": 7
    },
    "axe": {
      "enable": true
    },
    "metrics": {
      "list": true,
      "filterList": true
    },
    "gzipHAR": false,
    "video": true,
    "logToFile": true,
    "script_tag": "#",
    'port': data.port
  }

  fs.writeFileSync(`./config/temp-proxy_${data.session}.json`, JSON.stringify(config));
}



async function createConfigFile(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, session: string}) {
  let config = {
    "browsertime": {
      "browser": data.browser,
      "iterations": data.iterations,
      "spa": data.spa,
      "summary": true,
      "chrome:": {
        "ignoreCertificateErrors": true
      }
    },
    "html": {
      "showAllWaterfallSummary": true,
      "compareUrl": true
    },
    "Text": {
      "summary": false
    },
    "Sustainable": {
      "enable": true,
      "pageViews": 7
    },
    "axe": {
      "enable": true
    },
    "metrics": {
      "list": true,
      "filterList": true
    },
    "gzipHAR": false,
    "video": true
  }

  fs.writeFileSync(`./config/temp-config_${data.session}.json`, JSON.stringify(config));
}


