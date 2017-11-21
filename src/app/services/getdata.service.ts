import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class GetdataService {

  constructor( private http: Http) {  }

  public getJSON(data: any) {
    return this.http.get('/assets/data/' + data + '.json')
        .map((res: any) => res.json());
  }

  public getJSON_Param(data: any, option: any, param: any) {
    if (option === 'team') {
      return this.http.get('/assets/data/' + data + '_' + param.left + '_' + param.right + '.json')
          .map((res: any) => res.json());
    } else if (option === 'time') {
      return this.http.get('/assets/data/' + data + '_' + param.left + '_' + param.right + '.json')
          .map((res: any) => res.json());
    } else {
      return this.http.get('/assets/data/' + data + '.json')
          .map((res: any) => res.json());
    }
  }

  public getClubJSON_Data(data: any) {
    return this.http.get('/assets/data/' + data + '.json')
        .map((res: any) => res.json());
  }


  // public getJSON(data: any) {
  //   return this.http.get('/football/assets/data/' + data + '.json')
  //       .map((res: any) => res.json());
  // }

  // public getJSON_Param(data: any, option: any, param: any) {
  //   if (option === 'team') {
  //     return this.http.get('/football/assets/data/' + data + '_' + param.left + '_' + param.right + '.json')
  //         .map((res: any) => res.json());
  //   } else if (option === 'time') {
  //     return this.http.get('/football/assets/data/' + data + '_' + param.left + '_' + param.right + '.json')
  //         .map((res: any) => res.json());
  //   } else {
  //     return this.http.get('/football/assets/data/' + data + '.json')
  //         .map((res: any) => res.json());
  //   }
  // }

  // public getClubJSON_Data(data: any) {
  //   return this.http.get('/football/assets/data/' + data + '.json')
  //       .map((res: any) => res.json());
  // }
}
