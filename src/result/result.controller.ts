import { Controller, Get, Query, Res, Render, Param } from '@nestjs/common';
import { AppService } from '../app.service'

@Controller('result')
export class ResultController {

    constructor(private readonly appService: AppService) { }


    // @Get()
    // async get(@Res() res) {
    //   return res.sendFile('piqaautomationstorage/sitespeed-result/www.yahoo.com/2020-07-28-12-46-42/index.html', { root: 'data' });
    // }

    // @Get()
    // async get(@Query() params, @Res() res) {
    //   res.sendFile("/Users/dizhar/dev/agent-performance-backend/data/piqaautomationstorage/sitespeed-result/www.yahoo.com/2020-07-28-12-46-42/index.html");
    // }

    // @Get()
    // @Render('index')
    // root() {
    // }

    

}
