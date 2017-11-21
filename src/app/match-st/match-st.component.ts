import { Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../services/getdata.service';

@Component({
  selector: 'app-match-st',
  templateUrl: './match-st.component.html',
  styleUrls: ['./match-st.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class MatchStComponent implements OnInit {
  private d3: D3;
  private parentNativeElement: any;
  data: any = {};

  constructor( element: ElementRef, d3Service: D3Service, private getDataService: GetdataService) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    getDataService.getJSON('matchst')
        .subscribe(
            data => {
                this.data = data;
            },
            error => {
                console.log(error);
            });
  }

  ngOnInit() { }

  attack_graph() {

    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    let left_data =  this.data.attack_data[0].values;
    let right_data = this.data.attack_data[1].values;
    if (this.parentNativeElement !== null) {
      d3parentElement = d3.select(this.parentNativeElement);
      d3parentElement.select('.chart')
          .selectAll('.left')
          .data(left_data)
          .style('width', function(d: any){
            return d.value * 10 + 'px';
          })
          .attr('class', 'bar left')
          .text( function(d: any){
            return d.value;
          });
      d3parentElement.selectAll('.right')
          .data(right_data)
          .style('width', function(d: any){
            return d.value * 10 + 'px';
          })
          .attr('class', 'bar right')
          .text( function(d: any){
            return d.value;
          });
      d3parentElement.selectAll('.title')
          .data(left_data)
          .text( function(d: any) {
            return d.label;
          });
    }
  }

  play_graph() {
      let d3 = this.d3;
      let d3parentElement: Selection<any, any, any, any>;
      let left_data =  this.data.play_data[0].values;
      let right_data = this.data.play_data[1].values;
      if (this.parentNativeElement !== null) {
          d3parentElement = d3.select(this.parentNativeElement);
          d3parentElement.select('.chart')
              .selectAll('.left')
              .data(left_data)
              .style('width', function(d: any){
                  return d.value * 10 + 'px';
              })
              .attr('class', 'bar left')
              .text( function(d: any){
                  return d.value;
              });
          d3parentElement.selectAll('.right')
              .data(right_data)
              .style('width', function(d: any){
                  return d.value * 10 + 'px';
              })
              .attr('class', 'bar right')
              .text( function(d: any){
                  return d.value;
              });
          d3parentElement.selectAll('.title')
              .data(left_data)
              .text( function(d: any) {
                  return d.label;
              });
        }
    }
    distribution_graph() {
        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;
        let left_data =  this.data.distribution_data[0].values;
        let right_data = this.data.distribution_data[1].values;
        if (this.parentNativeElement !== null) {
            d3parentElement = d3.select(this.parentNativeElement);
            d3parentElement.select('.chart')
                .selectAll('.left')
                .data(left_data)
                .style('width', function(d: any){
                    return d.value * 10 + 'px';
                })
                .attr('class', 'bar left')
                .text( function(d: any){
                    return d.value;
                });
            d3parentElement.selectAll('.right')
                .data(right_data)
                .style('width', function(d: any){
                    return d.value * 10 + 'px';
                })
                .attr('class', 'bar right')
                .text( function(d: any){
                    return d.value;
                });
            d3parentElement.selectAll('.title')
                .data(left_data)
                .text( function(d: any) {
                    return d.label;
                });
        }
    }

    defence_graph() {
        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;
        let left_data =  this.data.defence_data[0].values;
        let right_data = this.data.defence_data[1].values;
        if (this.parentNativeElement !== null) {
            d3parentElement = d3.select(this.parentNativeElement);
            d3parentElement.select('.chart')
                .selectAll('.left')
                .data(left_data)
                .style('width', function(d: any){
                    return d.value * 10 + 'px';
                })
                .attr('class', 'bar left')
                .text( function(d: any){
                    return d.value;
                });
            d3parentElement.selectAll('.right')
                .data(right_data)
                .style('width', function(d: any){
                    return d.value * 10 + 'px';
                })
                .attr('class', 'bar right')
                .text( function(d: any){
                    return d.value;
                });
            d3parentElement.selectAll('.title')
                .data(left_data)
                .text( function(d: any) {
                    return d.label;
                });
        }
    }
}
