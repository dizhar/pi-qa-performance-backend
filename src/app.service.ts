import { Injectable, Session } from '@nestjs/common';
import * as shell from "shelljs";
import { request } from 'express';

import * as pagexray from 'pagexray';
import { stringify } from 'querystring';
import { timeStamp, count } from 'console';
import { async } from 'rxjs';

import * as fs from 'fs';
import { AbstractHttpAdapter } from '@nestjs/core';
import { RegExr } from "./support/regexr";

import { Create } from './support/create';

var tcpPortUsed = require('tcp-port-used');

const _RegExr = new RegExr();
const _create = new Create();

interface Data{
	webpageWithoutPIM: string;
	webpageWithPIM: string; 
	script_tag: string;
	goal: string;
	iterations: number;
	browser: string;
	spa: boolean;
	session: string;
	configFile: string;
	configFileProxy: string;
	port: number;
  }

@Injectable()
export class AppService {

	constructor() { }

	async removeConfigFile(list: {}[]): Promise<void> {
		try {
			list.forEach((item) => {
				fs.unlinkSync(`./config/${item}`)
			})
		} catch (error) { }
	}

	async start(
		list: { 
			webpageWithoutPIM: string, 
			webpageWithPIM: string, 
			script_tag: string, 
			goal: string, 
			iterations: number, 
			browser: string, 
			spa: boolean }[]): Promise<Object[]> {
		try {
			let results = new Array();
			let unique_id: string = _RegExr.getUniquId();
			await _create.setSessionConfigFile(unique_id);


			list.forEach(source_data => {
				// let uniqid: string = _RegExr.getUniquId();
				// new Promise(() => {
				//   _create.setSessionConfigFile(uniqid);
				// });

				let data: Data = {} as any;
				Object.assign(data, source_data)

				// let obj = Object.assign(data, { session: uniqid });
				Object.assign(data, { session: unique_id });
				
				Object.assign(data, { configFile: `temp-config_${data.session}.json` });
				Object.assign(data, { configFileProxy: `temp-proxy_${data.session}.json` });

				switch (data.goal) {
					case "test production":
						results.push(testProduction(data))
						break;
					case "test qa":
						results.push(testQA(data));
						break;
					default: null;
						break;
				}
			});

			return await Promise.all(results);
		} catch (error) {
			throw error
		}
	}
}
// data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, session: string }
async function testQA(data: Data) {
	try {
		let outPut = new Object();

		Object.assign(data, { port: await getAvilablePort() });

		await createAProxyConfigFileWithPIM(data);

		let use_proxy: boolean = true;
		let use_page_integrity: boolean = false;

		outPut['agent'] = await execute_sitespeed(data, use_proxy, use_page_integrity);
		outPut['agent'].session = data;

		await createAProxyConfigFileWithoutPIM(data)
		outPut['noAgent'] = await execute_sitespeed(data, use_proxy, use_page_integrity);
		outPut['noAgent'].session = data;

		return Promise.resolve(outPut);
	} catch (error) {
		throw error
	}
}

async function testProduction(data: Data): Promise<object> {
			
	try {
		let outPut = new Object();

		await createConfigFile(data)

		let use_proxy: boolean = false;

		// outPut['agent'] = await getPageXrayWithPIMAgent(data, use_proxy);
		outPut['agent'] = await execute_sitespeed(data, use_proxy, true);
		outPut['agent'].session = data;

		outPut['noAgent'] = await execute_sitespeed(data, use_proxy, false);
		outPut['noAgent'].sesssion = data;

		return Promise.resolve(outPut);
	} catch (error) {
		throw error;
	}
}

async function getAvilablePort(): Promise<number> {
	try {

		let port: number = 4200;
		let inUse: boolean = await tcpPortUsed.check(port, '127.0.0.1');

		while (inUse === true) {
			port++;
			inUse = await tcpPortUsed.check(port, '127.0.0.1');
		}
		return port;

	} catch (error) {

	}
}
/*
async function getPageXrayWithPIMAgent(data: Data, use_proxy: boolean): Promise<object> {

	try {

		let path: string;
		let parse: any;

		let script: string = use_proxy ? `./sitespeed.sh config/${data.configFileProxy}`:  `./sitespeed.sh config/${data.configFile}`;
		let agentLog: string = shell.exec(`${script} ${data.webpageWithPIM}`, { silent: false }).stdout;

		new Promise(() => {
			path = getLastword(agentLog);
		});

		let folderWPathWebsite: string = getfolderWPathWebsite(agentLog, data)
		let har_file: string = get_har_file(agentLog, data, path, folderWPathWebsite);

		// let harPath: string = `./${path}${har}`.trim();
		let har_path: string = get_har_local_path(path, har_file)

		// let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${harPath}`.trim(), { silent: true }).stdout;
		let pageXray = shell.exec(`pagexray --pretty ${har_path}`.trim(), { silent: false }).stdout;

		new Promise(() => {
			parse = JSON.parse(pageXray)
		})

		let client_path = get_client_path(path)

		// let link: string = `${path}/index.html`.trim();
		let client_link: string = `${client_path}/index.html`.trim();
		let client_har_path: string = `${client_path}${har_file}`.trim();

		let obj = {
			link: client_link,
			harPath: client_har_path,
			pageXray: parse
		};

		return Promise.resolve(obj);

	} catch (error) {
		throw error
	}
}
*/

function get_har_local_path(full_path, har_file){
	return `./${full_path}${har_file}`.trim();
}

// getPageXrayWithoutPIM
async function execute_sitespeed(data: Data, use_proxy: boolean, use_page_integrity: boolean): Promise<object> {
	try {
		let path: string;
		let parse: any;

		let script: string = use_proxy ? `./sitespeed.sh config/${data.configFileProxy}`:  `./sitespeed.sh config/${data.configFile}`;
		let webpage: string = use_page_integrity ? `${data.webpageWithPIM}` : `${data.webpageWithoutPIM}`;
		let agentLog: string = shell.exec(`${script} ${webpage}`, { silent: false }).stdout;

		new Promise(() => {
			path = getLastword(agentLog);
		});

		let folderWPathWebsite = getfolderWPathWebsite(agentLog, data)
		let har_file: string = get_har_file(agentLog, data, path, folderWPathWebsite);

		// let harPath: string = `${path}${har_file}`.trim();
		let har_path: string = get_har_local_path(path, har_file)

		// let pageXray = shell.exec(`pagexray --pretty ${__dirname}/../data/piqaautomationstorage/${harPath}`.trim(), { silent: true }).stdout;
		let pageXray = shell.exec(`pagexray --pretty ./${har_path}`.trim(), { silent: false }).stdout;

		new Promise(() => {
			parse = JSON.parse(pageXray)
		})

		let client_path = get_client_path(path)

		// let link: string = `${path}/index.html`.trim();
		let client_link: string = `${client_path}/index.html`.trim();
		let client_har_path: string = `${client_path}${har_file}`.trim();

		let obj = {
			link: client_link,
			harPath: client_har_path,
			pageXray: parse
		};

		return Promise.resolve(obj);
	} catch (error) {
		throw error;
	}

}

function getfolderWPathWebsite(outPut: string, data: Data): string {
	try {
		let path: string = getLastword(outPut);
		let folder: string = getFolder(path);
		let website: string = remove_http_prefix(data.webpageWithoutPIM);
		return `${folder}/pages/${website}/`;
	} catch (error) {
		throw error;
	}
}

function get_har_file(outPut: string, data: Data, lastWord: string, folderWPathWebsite: string): string {
	try {
		let path: string = getLastword(outPut);
		let folder: string = getFolder(path);
		let website: string = remove_http_prefix(data.webpageWithoutPIM);

		// let sub_folder: string = shell.exec(`cd ${__dirname}/../data/piqaautomationstorage/${lastword}${folderWPathWebsite} && ls -1d */`, { silent: true }).stdout;
		let sub_folder: string = shell.exec(`cd ${path}${folderWPathWebsite} && ls -1d */`, { silent: false }).stdout;

		if (sub_folder.trim() === 'data/') {
			return `${folder}/pages/${website}/data/browsertime.har`;
		} else {
			return `${folder}/pages/${website}/${sub_folder.replace(/(\r\n|\n|\r)/gm, "")}/data/browsertime.har`;
		}
	} catch (error) {
		throw error;
	}
}

function getLastword(outPut: string): string {
	try {
		let lastline = outPut.split('\n')[outPut.split('\n').length - 2];
		let last_item_in_line = lastline.split(" ")[lastline.split(" ").length - 1];

		// remove '/' from the beginning of the string
		// example: '/sitespeed-result/cashier.piesec.com/2020-09-01-10-23-33'
		let path = last_item_in_line.substring(1)
		//let path = last_item_in_line.replace('/sitespeed-result/', '')

		return path;

	} catch (error) {
		throw error;
	}
}

function get_client_path(path) {
	return path.replace('sitespeed-result/', '')
}


function getFolder(outPut: string): string {
	try {
		let list = outPut.split('/');
		let cutofPoint = false;
		let sentence: string = '';
		list.forEach(item => {
			if (cutofPoint) sentence = sentence + "/" + item;
			if (item === "sitespeed.io") cutofPoint = true;
		});
		return sentence;
	} catch (error) {
		throw error;
	}
}

function remove_http_prefix(url: string): string {
	try {
		return url.replace(/^(?:https?:\/\/)?/i, "").split('/')[0];
	} catch (error) {
		throw error;
	}
}

async function getLink(log: string, data: object): Promise<string> {
	try {
		let path: string = getLastword(log);

		// path withour '/' in the beginning
		return `${path}/index.html`;
	} catch (error) {
		throw error;
	}
}

// data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, port: number, session: string }
async function createAProxyConfigFileWithPIM(data: Data) {
	try {
		let config = {
			"browsertime": {
				"browser": data.browser,
				"iterations": data.iterations,
				"spa": data.spa,
				"preScript": "root/script/proxy/proxy_start.js",
				"postScript": "root/script/proxy/proxy_end.js",
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

		await _create.craeteDir('./config');

		fs.writeFileSync(`./config/temp-proxy_${data.session}.json`, JSON.stringify(config));
	} catch (error) {
		throw error;
	}
}

// data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, port: number, session: string }
async function createAProxyConfigFileWithoutPIM(data: Data) {
	try {
		let config = {
			"browsertime": {
				"browser": data.browser,
				"iterations": data.iterations,
				"spa": data.spa,
				"preScript": "root/script/proxy/proxy_start.js",
				"postScript": "root/script/proxy/proxy_end.js",
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

		await _create.craeteDir('./config');

		fs.writeFileSync(`./config/temp-proxy_${data.session}.json`, JSON.stringify(config));
	} catch (error) {
		throw error;
	}
}


// data: { webpageWithoutPIM: string, webpageWithPIM: string, script_tag: string, goal: string, iterations: number, browser: string, spa: boolean, session: string }
async function createConfigFile(data: Data) {
	try {
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

		await _create.craeteDir('./config');

		fs.writeFileSync(`./config/temp-config_${data.session}.json`, JSON.stringify(config));
	} catch (error) {
		throw error;
	}
}


