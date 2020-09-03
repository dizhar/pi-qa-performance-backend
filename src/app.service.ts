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
	id: string;
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
	website: string;
	sitespeed_result_path: string;
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
			let session_unique_id: string = _RegExr.getUniquId();

			// No need for this file anymore
			//await _create.setSessionConfigFile(session_unique_id);

			console.log ("")
			console.log ("================================================")
			console.log ("STARTING A NEW SESSION")
			console.log ("================================================")

			list.forEach(source_data => {
				// let uniqid: string = _RegExr.getUniquId();
				// new Promise(() => {
				//   _create.setSessionConfigFile(uniqid);
				// });

				let data: Data = {} as any;
				let unique_id: string = _RegExr.getUniquId();

				Object.assign(data, source_data)

				Object.assign(data, { id: unique_id });

				Object.assign(data, { session: session_unique_id });
				
				Object.assign(data, { configFile: `temp-config_${data.id}.json` });
				Object.assign(data, { configFileProxy: `temp-proxy_${data.id}.json` });

				Object.assign(data, { website: remove_http_prefix(data.webpageWithoutPIM) });

				console.log ("")
				console.log ("================================================")
				console.log (`Data Id                  : '${data.id}'`)
				console.log (`Goal                     : '${data.goal}'`)
				console.log (`Webpage without PI agent : '${data.webpageWithoutPIM}'`)
				console.log (`webpage with PI agent    : '${data.webpageWithPIM}'`)				
				console.log ("================================================")

				switch (data.goal) {
					case "test production":
						//results.push(testProduction(data))
						results.push(run_tests(data, "prod"));
						break;
					case "test qa":
						//results.push(testQA(data));
						results.push(run_tests(data, "qa"));
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

async function delete_config_file(file_name: string): Promise<void> {
	try {
		let file_path: string = `./config/${file_name}`;
		
		console.log(`Deleting config file '${file_path}'`)
		fs.unlinkSync(file_path);
		console.log(`Config file '${file_path}' deleted successfully`)
	} catch (error) { 
		console.log("Error in delete_config_file")
	}
}

async function run_tests(data: Data, env: string): Promise<object> {
			
	try {
		let output = new Object();
		let use_proxy: boolean;

		switch (env) {
			case "prod":
				await create_config_file(data);
				use_proxy = false;
	
				output['agent'] = await execute_sitespeed(data, use_proxy, true);
				output['agent'].session = data;
	
				output['noAgent'] = await execute_sitespeed(data, use_proxy, false);
				output['noAgent'].session = data;

				await delete_config_file(data.configFile);

				break;

			case "qa":

				Object.assign(data, { port: await getAvilablePort() });
				use_proxy = true;

				// Note that we don't use Page Integrity agent on both calls to execute_sitespeed!

				await create_proxy_config_file_with_pim(data);
				output['agent'] = await execute_sitespeed(data, use_proxy, false);
				output['agent'].session = data;
				await delete_config_file(data.configFileProxy);
		
				await create_proxy_config_file_without_pim(data)
				output['noAgent'] = await execute_sitespeed(data, use_proxy, false);
				output['noAgent'].session = data;
				await delete_config_file(data.configFileProxy);
				
				break;
			
			// default: null;
			//	break;
		}
		
		// delete config files
		// fs.unlinkSync(`./config/${data.configFile}`)
		// fs.unlinkSync(`./config/${data.configFileProxy}`)

		// fs.unlink(`./config/${data.configFile}`, (err) => {
		// 	if (err) throw err;
		// 	console.log(`./config/${data.configFile} was deleted.`);
		// });

		// fs.unlink(`./config/${data.configFileProxy}`, (err) => {
		// 	if (err) throw err;
		// 	console.log(`./config/${data.configFileProxy} was deleted.`);
		// });


		return Promise.resolve(output);
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

function get_har_local_path(full_path, har_file){
	return `./${full_path}${har_file}`.trim();
}

// getPageXrayWithoutPIM
async function execute_sitespeed(data: Data, use_proxy: boolean, use_page_integrity: boolean): Promise<object> {
	try {

		let config_file: string = use_proxy ? `${data.configFileProxy}`: `${data.configFile}`;
		let webpage: string = use_page_integrity ? `${data.webpageWithPIM}` : `${data.webpageWithoutPIM}`;
		let script: string = `./sitespeed.sh config/${config_file} ${webpage} ${data.id}`
		
		//if ( webpage == ){
		//	throw "webpage "
		//}

		console.log("================================================")
		console.log (`use_page_integrity = ${use_page_integrity}`)
		console.log (`config_file        = ${config_file}`)
		console.log (`webpage            = ${webpage}`)
		console.log (`script             = ${script}`)
		console.log("================================================")

		let agentLog: string = shell.exec(`${script}`, { silent: false }).stdout;

		// new Promise(() => {
		//	path = getLastword(agentLog);
		// });
		
		Object.assign(data, { sitespeed_result_path: getLastword(agentLog) });

		let folderWPathWebsite = getfolderWPathWebsite(data)
		let har_file: string = get_har_file(data, folderWPathWebsite);

		// let harPath: string = `${path}${har_file}`.trim();
		let har_path: string = get_har_local_path(data.sitespeed_result_path, har_file)

		let json = shell.exec(`pagexray --pretty ./${har_path}`.trim(), { silent: false }).stdout;

		// new Promise(() => {
		//	parse = JSON.parse(pageXray)
		// })
		let pageXray_obj: any = JSON.parse(json)

		let client_path = get_client_path(data.sitespeed_result_path)

		// let link: string = `${path}/index.html`.trim();
		let client_link: string = `${client_path}/index.html`.trim();
		let client_har_path: string = `${client_path}${har_file}`.trim();

		let result = {
			link: client_link,
			harPath: client_har_path,
			pageXray: pageXray_obj
		};
		return Promise.resolve(result);

	} catch (error) {
		throw error;
	}
}

function getfolderWPathWebsite(data: Data): string {
	try {
		// let path: string = getLastword(outPut);
		let folder: string = getFolder(data.sitespeed_result_path);
		//let website: string = remove_http_prefix(data.webpageWithoutPIM);
		return `${folder}/pages/${data.website}/`;
	} catch (error) {
		throw error;
	}
}

function get_har_file(data: Data,folderWPathWebsite: string): string {
	try {
		// let path: string = getLastword(outPut);
		let path: string = data.sitespeed_result_path;
		let folder: string = getFolder(path);

		// let website: string = remove_http_prefix(data.webpageWithoutPIM);

		// let sub_folder: string = shell.exec(`cd ${__dirname}/../data/piqaautomationstorage/${lastword}${folderWPathWebsite} && ls -1d */`, { silent: true }).stdout;
		let sub_folder: string = shell.exec(`cd ${path}${folderWPathWebsite} && ls -1d */`, { silent: false }).stdout;

		if (sub_folder.trim() === 'data/') {
			return `${folder}/pages/${data.website}/data/browsertime.har`;
		} else {
			return `${folder}/pages/${data.website}/${sub_folder.replace(/(\r\n|\n|\r)/gm, "")}/data/browsertime.har`;
		}
	} catch (error) {
		throw error;
	}
}

function getLastword(log: string): string {
	try {
		let lastline = log.split('\n')[log.split('\n').length - 2];
		let last_item_in_line = lastline.split(" ")[lastline.split(" ").length - 1];

		// remove '/' from the beginning of the string
		// example: '/sitespeed-result/cashier.piesec.com/2020-09-01-10-23-33'
		let path = last_item_in_line.substring(1)
		//let path = last_item_in_line.replace('/sitespeed-result/', '')

		if (! path.startsWith("sitespeed-result/")){
			throw `Could not parse path to sitespeed-result. Found '${path}'.`
		}

		return path;

	} catch (error) {
		throw error;
	}
}

function get_client_path(path) {
	return path.replace('sitespeed-result/', '')
}

function getFolder(path: string): string {
	try {
		let list = path.split('/');
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
	// get the domain name  without http or https (e.g. in the format 'www.mrporter.com')
	try {
		return url.replace(/^(?:https?:\/\/)?/i, "").split('/')[0];
	} catch (error) {
		throw error;
	}
}

async function getLink(data: Data): Promise<string> {
	try {
		let client_path: string = get_client_path(data.sitespeed_result_path)
		return `${client_path}/index.html`;
	} catch (error) {
		throw error;
	}
}

async function create_proxy_config_file_with_pim(data: Data) {
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

		//fs.writeFileSync(`./config/temp-proxy_${data.session}.json`, JSON.stringify(config));
		fs.writeFileSync(`./config/${data.configFileProxy}`, JSON.stringify(config));

	} catch (error) {
		throw error;
	}
}

async function create_proxy_config_file_without_pim(data: Data) {
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

		fs.writeFileSync(`./config/${data.configFileProxy}`, JSON.stringify(config));
	} catch (error) {
		throw error;
	}
}

async function create_config_file(data: Data) {
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

		fs.writeFileSync(`./config/${data.configFile}`, JSON.stringify(config));
	} catch (error) {
		throw error;
	}
}


