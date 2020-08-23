import { Controller, Get, HttpCode, Header, Param, Req, Request, Query, Res, HttpStatus, Post, Body, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Observable } from 'rxjs';




@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Post()
  async post(@Body() body,  @Res() res: Response){
    await this.appService.start(body).then((data)=>{
   return res.status(HttpStatus.OK).send({data});
  }) 
 }




//  @Get(':name')
//  async remove(@Param('name') res: Response) {
//    console.log(`${name}`);
//    return res.status(HttpStatus.OK).send({name});
//  }

// @Get(':configFile')
// remove(@Param('configFile') configFile: string,  @Res() res: Response) {
//   return `This action returns a ${configFile} cat`;
// }


@Post("/remove")
async remove(@Body() body, @Res() res: Response): Promise<void> {
  return this.appService.removeConfigFile(body)
}


}







  

  



  
  
  


  