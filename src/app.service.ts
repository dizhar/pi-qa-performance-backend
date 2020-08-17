import { Injectable } from '@nestjs/common';
import * as shell from "shelljs";
import { request } from 'express';

import * as pagexray from 'pagexray';
import { stringify } from 'querystring';
import { timeStamp } from 'console';
import { async } from 'rxjs';

import * as fs from 'fs';



@Injectable()
export class AppService {
   
  constructor(){}


  async start(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object> {

    console.log("data.goal:", data.goal) 

     switch (data.goal) {
       case "test production": return testProduction(data)
         break;
         case "test qa": return testQA(data);
         break; 
     
       default: null;
         break;
     }
  }
}

async function  testQA(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }) {
  let outPut = new Object();
  
   await createAProxyConfigFile(data);
   await createConfigFile(data)
 
    outPut['agent'] = await getPageXrayWithoutPIM('./speedtest.sh local config/temp-proxy.json', data);
    outPut['noAgent'] = await getPageXrayWithoutPIM('./speedtest.sh local config/temp-config.json', data)
    return outPut;

}





async function testProduction(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object> {
  let outPut = new Object();


console.log("9999999")
await createConfigFile(data) 
 

outPut['agent'] = await getPageXrayWithPIMAgent('./speedtest.sh local config/temp-config.json', data);
 outPut['noAgent'] = await getPageXrayWithoutPIM('./speedtest.sh local config/temp-config.json', data)
  return outPut;
}



async function getPageXrayWithPIMAgent(execute: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object>{

  let lastword: string;
  let parse: any;
  let agentLog = shell.exec(`${execute} ${data.webpageWithPIM}`, { silent: true }).stdout;


  new Promise(() => {
    lastword = getLastword(agentLog);
  });

  // let har = getHARFile(agentLog, data);

  let  folderWPathWebsite = getfolderWPathWebsite(agentLog, data)
  let har = getHARFile(agentLog, data, lastword, folderWPathWebsite);


  let link = `${lastword}/index.html`;
  let harPath = `${lastword}${har}`
  let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${lastword}${har}`, { silent: true }).stdout;

  new Promise(() => {
    parse = JSON.parse(pageXray)
  })


  let obj = {
    link: link,
    harPath: harPath,
    pageXray: parse
  };

  return  Promise.resolve(obj);
}



async function getPageXrayWithoutPIM(execute: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): Promise<object>{

  let lastword: string;
  let parse: any;
  let agentLog = shell.exec(`${execute} ${data.webpageWithoutPIM}`, { silent: true }).stdout;

  new Promise(() => {
    lastword = getLastword(agentLog);
  });

    
  let folderWPathWebsite = getfolderWPathWebsite(agentLog, data)
  let har = getHARFile(agentLog, data, lastword, folderWPathWebsite);

  let link = `${lastword}/index.html`;
  let harPath = `${lastword}${har}`
  let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${lastword}${har}`, { silent: true }).stdout;


  new Promise(() => {
    parse = JSON.parse(pageXray)
  })


  let obj = {
    link: link,
    harPath: harPath,
    pageXray: parse
  };

  return  Promise.resolve(obj);

}


function getfolderWPathWebsite(outPut: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }): string {
  let lastword = getLastword(outPut);
  let folder = getFolder(lastword);
  let website = getWithoutHttp(data.webpageWithoutPIM);
  return `${folder}/pages/${website}/`;
}


function getHARFile(outPut: string, data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }, lastWord: string, folderWPathWebsite: string): string {
  let lastword = getLastword(outPut);
  let folder = getFolder(lastword);
  let website = getWithoutHttp(data.webpageWithoutPIM);

  let childDirectory =  shell.exec(`cd ${__dirname}/../data/piqaautomationstorage/${lastword}${folderWPathWebsite} && ls -1d */`, { silent: true }).stdout;

   if(childDirectory.trim() === 'data/'){ 
     return `${folder}/pages/${website}/data/browsertime.har`;
   }else{
    return `${folder}/pages/${website}/${childDirectory}data/browsertime.har`;
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

async function createAProxyConfigFile(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }) {

 let config = {
    "browsertime": {
      "browser": data.browser,
      "iterations": data.iterations,
      "spa": true,
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
    "proxy.https": "127.0.0.1:22",
    "proxy.http": "127.0.0.1:22",
    "html":{
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
    "axe":{
      "enable": true
    },
    "metrics":{
      "list": true,
      "filterList": true 
    },
    "gzipHAR": false,
    "video": true,
    "logToFile": true,
    "script_tag": data.script_tag
  }
  

fs.writeFileSync('./config/temp-proxy.json', JSON.stringify(config));
console.log("File created!");         
}

async function createConfigFile(data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean }) {
let config =  {
    "browsertime": {
      "browser": data.browser,
      "iterations": data.iterations,
      "spa": data.spa,
      "summary": true,
      "chrome:": {
        "ignoreCertificateErrors": true
      }
    },
    "html":{
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
    "axe":{
      "enable": true
    },
    "metrics":{
      "list": true,
      "filterList": true 
    },
    "gzipHAR": false,
    "video": true
  } 

fs.writeFileSync('./config/temp-config.json', JSON.stringify(config));
console.log("File created!");  
}


