import { Controller, Get, HttpCode, Header, Param, Req, Request, Query, Res, HttpStatus, Post, Body, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) { }

	@Post()
	async post(@Body() body, @Res() res: Response) {
		await this.appService.start(body).then((data) => {
			return res.status(HttpStatus.OK).send({ data });
		})
	}

	@Post("/remove")
	@HttpCode(200)
	async remove(@Body() body, @Res() res: Response): Promise<void> {
		
		//this.appService.removeConfigFile(body).then(() => {
		//	return res.status(HttpStatus.OK);
		//})

		return res.status(HttpStatus.OK);
	}
}


















