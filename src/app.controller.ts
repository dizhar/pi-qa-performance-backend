import { Controller, Get, HttpCode, Header, Param, Req, Request, Query, Res, HttpStatus, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Observable } from 'rxjs';




@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Post()
  async post(@Body() body,  @Res() res: Response){
console.log("body:", body);


    await this.appService.start(body).then((data)=>{
   return res.status(HttpStatus.OK).send({data});
  }) 
 }




  }


  

  



  
  
  


  