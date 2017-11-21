import { Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart1-club',
  templateUrl: './chart1-club.component.html',
  styleUrls: ['./chart1-club.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart1ClubComponent implements OnInit {

  private d3: D3;                   // D3 Object
  private parentNativeElement: any; // Selector parent for D3

  private timer: Observable<any>;   // Timer for Live mode (Real time)
  private sub: any;                 // Timer subscription
  data: any = {};                   // Data from server
  teams: any = [];                  // Teams from server
  selected_team = 1;

  players: any = [];
  playersData: any;

  option = {
    'displayType': false,  // Live mode: true, Normal Mode: false;
    'displayTime': 0,
    'prevTime': 0,
  };

  playControl = 1;  // 0 stop, 1 start, 2 back;
  ctrlImageUrl = './assets/images/play_stop-50.png';

  sliderStart = 0;  // 0: not slider, 1: first slider started, 2: second slider started

  sliderWidth = 360;

  sliderFirstLeft = 0;
  sliderStart_fpos: any;
  sliderFirstDiff: any;
  sliderFirstValue = 0;
  sliderFirstExtra = 3;
  firstSliderRatio = this.sliderWidth / (45 + this.sliderFirstExtra);

  sliderSecondLeft = 0;
  sliderStart_spos: any;
  sliderSecondDiff: any;
  sliderSecondValue = 0;
  sliderSecondExtra = 6;
  secondsliderRatio = this.sliderWidth / (45 + this.sliderSecondExtra);

  temp = {
    'current': 0, // recoded second - realtime
    'livetime': '00 : 00 : 00',
    'gamepos': 'First Half',
    'current_t': 0  // temp t
  };

  maxVal = {
    'total_dist': 0,
    'sprint_dist': 0,
    'top_speed': 0
  };

  mobWidth: any;
  mobdevice: boolean = false;  // false = desktop, true = mobile

  constructor(
    element: ElementRef,
    d3Service: D3Service,
    private getDataService: GetdataService,
    private activatedRoute: ActivatedRoute
  ) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;

    let ua = navigator.userAgent;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
      console.log('Mobile');
      this.mobdevice = true;
      this.mobWidth = window.screen.width;
    } else {
      this.mobdevice = false;
      this.mobWidth = window.innerWidth;
    }

    if (/iPhone/i.test(ua)) {
      window.onorientationchange = (e) => {
        this.doOrientationChange(e);
      };
    } else {
      window.onresize = (e) => {
        this.reSize(e);
      };
    }
  }

  ngOnInit() {

    this.activatedRoute.params.subscribe((params: Params) => {
      let mode = params['mode'];
      if (mode === 'normal') {
        this.option.displayType = false;
      } else if (mode === 'live') {
        this.option.displayType = true;
      }
    });

    this.getDataService.getClubJSON_Data('players_club')
      .subscribe(
      data => {
        this.playersData = data;
      },
      err => {
        console.log(err);
      }
      );

    // Set Initial Match team
    this.getDataService.getClubJSON_Data('chart1_club')
      .subscribe(
      data => {
        this.data = data;
        if (this.option.displayType) {
          this.playControl = 0;
          this.initialBarChart();
          this.ctrlRealTime();
        } else {
          this.initialBarChart();
        }
      },
      error => {
        console.log(error);
      }
      );
    this.timer = Observable.interval(1000);
  }

  ctrlRealTime() {
    if (this.playControl === 1) {
      this.ctrlImageUrl = './assets/images/play_forward-50.png';
      this.sub.unsubscribe();
      this.temp.current = this.temp.current_t;
      this.playControl = 0;
    } else if (this.playControl === 0) {
      this.ctrlImageUrl = './assets/images/play_stop-50.png';
      this.sub = this.timer.subscribe(t => this.getRealTime(t));
      this.playControl = 1;
    }
  }
  /* --- Real Time Part  --- */
  getRealTime(tick: any) {
    let t = this.temp.current + tick;
    if (t < 2700) {
      this.temp.gamepos = 'First Half';
    } else {
      this.sliderFirstExtra = 3;
      this.temp.gamepos = 'Second Half';
    }
    let time_str = Math.floor(t / 3600).toString();
    if (Math.floor(t / 3600) < 10) {
      time_str = '0' + Math.floor(t / 3600).toString();
    }
    let min_str = Math.floor((t % 3600) / 60).toString();
    if (Math.floor((t % 3600) / 60) < 10) {
      min_str = '0' + Math.floor((t % 3600) / 60).toString();
    }
    let sec_str = Math.floor((t % 3600) % 60).toString();
    if (Math.floor((t % 3600) % 60) < 10) {
      sec_str = '0' + Math.floor((t % 3600) % 60).toString();
    }
    let mk = ' : ';
    if ((t % 2) === 0) {
      mk = ' : ';
    } else {
      mk = ' : ';
    }
    if (this.temp.gamepos === 'First Half') {
      this.sliderFirstLeft = Math.floor((t % 3600) / 60) * this.firstSliderRatio;
      this.sliderFirstValue = Math.floor((t % 3600) / 60);
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
    } else {
      this.sliderFirstLeft = 360;
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.sliderSecondLeft = Math.floor(((t - 2700) % 3600) / 60) * this.secondsliderRatio;
      this.sliderSecondValue = Math.floor(((t - 2700) % 3600) / 60);
    }
    let st = time_str + mk + min_str + mk + sec_str;
    this.temp.livetime = st;
    this.temp.current_t = t;
    if ((t % 15) === 0) {
      this.option.displayTime = (Math.floor(t / 15) * 5) % 90;
      this.updateBarChart();
    }
  }

  doOrientationChange(e: any) {
    if (e) {
      this.mobWidth = e.target.innerWidth;
      if (window.orientation === -90 || window.orientation === 90) {
        this.mobWidth = e.target.innerWidth + 25;
      }
      this.changeViewPort(this.mobWidth);
    }
  }

  reSize(e: any) {
    if (e) {
      if (this.mobdevice) {
        this.mobWidth = window.screen.width;
      } else {
        this.mobWidth = e.target.innerWidth;
      }

      this.changeViewPort(this.mobWidth);
    }
  }

  changeViewPort(screen_width: any) {

    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    d3parentElement = d3.select(this.parentNativeElement);

    if (screen_width < 600) {
      let screen_ratio = screen_width / 600;
      let trans_x = 50 * screen_ratio;
      let ts_x = 45 * screen_ratio;
      let ts_y = 19 * screen_ratio;

      d3parentElement.selectAll('svg')
        .attr('width', screen_width - 10)
        .attr('height', 400 * screen_ratio);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'translate(' + ts_x + ', ' + ts_y + ') scale(' + screen_ratio + ')');

      d3parentElement.selectAll('.bar-group')
        .attr('transform', 'translate(' + trans_x + ', 0) scale(' + screen_ratio + ')');
    } else {
      d3parentElement.selectAll('svg')
        .attr('width', 600)
        .attr('height', 400);
      d3parentElement.selectAll('svg > g')
        .attr('transform', 'translate(45, 19) scale(1)');
      d3parentElement.selectAll('.bar-group')
        .attr('transform', 'translate(50, 0) scale(1)');
    }

    if (screen_width < 420) {
      let mobSlider_width = screen_width - 45;
      d3parentElement.selectAll('.time-slider')
        .style('width', mobSlider_width + 'px');
      this.sliderWidth = mobSlider_width;
      this.firstSliderRatio = this.sliderWidth / (45 + this.sliderFirstExtra);
      this.secondsliderRatio = this.sliderWidth / (45 + this.sliderSecondExtra);
      this.sliderFirstLeft = this.sliderFirstValue * this.firstSliderRatio;
      this.sliderSecondLeft = this.sliderSecondValue * this.secondsliderRatio;
    } else {
      this.sliderWidth = 360;
      d3parentElement.selectAll('.time-slider')
        .style('width', '360px');
      this.firstSliderRatio = this.sliderWidth / (45 + this.sliderFirstExtra);
      this.secondsliderRatio = this.sliderWidth / (45 + this.sliderSecondExtra);
      this.sliderFirstLeft = this.sliderFirstValue * this.firstSliderRatio;
      this.sliderSecondLeft = this.sliderSecondValue * this.secondsliderRatio;
    }
  }

  initialBarChart() {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    let data = this.data.values;

    if (this.parentNativeElement !== null) {
      d3parentElement = d3.select(this.parentNativeElement);

      /* --- Total Distance --- */

      let bar1_array = this.getAryForMax(data, 'total_distance');
      this.maxVal.total_dist = d3.max(bar1_array) * 1.5;

      let yaxisScale = d3.scaleLinear()
        .domain([0, this.maxVal.total_dist])
        .range([280, 0]);

      let yaxis_bar1 = d3.axisLeft(yaxisScale)
        .tickSizeInner(5)
        .tickSizeOuter(10);

      d3parentElement.select('.bar1 svg')
        .append('g')
        .attr('transform', 'translate(45, 19)')
        .call(yaxis_bar1);

      let bar1 = d3parentElement.select('.svg-bar1');
      let bar_group1 = bar1.selectAll('rect')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 299;
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar_group1
        .append('rect')
        .attr('fill', '#286090')
        .attr('width', 30)
        .attr('height', function (d: any) {
          return 1;
        });
      bar_group1
        .append('text')
        .attr('fill', '#000')
        .attr('text-anchor', 'end')
        .attr('y', function (d: any) {
          return 1;
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = 0;
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });
      bar_group1.on('mouseover', function (d: any, i: any) {
        let xPosition = i * (30 + 8);
        let yPosition = 100;
        let tooltip = d3parentElement.select('#tooltip');
        tooltip.style('left', xPosition + 'px')
          .style('top', yPosition + 'px')
          .select('#name')
          .text(d.name);
        tooltip.select('#number')
          .text(d.player_id);
        tooltip.select('img')
          .attr('src', './assets/images/players/1/' + d.player_id + '.jpg');
        tooltip.select('#pos').text(d.position_type);
        if (d.is_sub === 1) {
          tooltip.select('#sub').text('Substitutes: Yes');
        } else {
          tooltip.select('#sub').text('Substitutes: No');
        }
        tooltip.classed('hidden', false);
      });
      bar_group1.on('mouseout', function (d: any) {
        d3parentElement.select(('#tooltip'))
          .classed('hidden', true);
      });

      /* --- Sprint Distance --- */

      let bar2_array = this.getAryForMax(data, 'sprint_distance');
      this.maxVal.sprint_dist = d3.max(bar2_array) * 1.5;

      let yaxisScale2 = d3.scaleLinear()
        .domain([0, this.maxVal.sprint_dist])
        .range([280, 0]);

      let yaxis_bar2 = d3.axisLeft(yaxisScale2)
        .tickSizeInner(5)
        .tickSizeOuter(10);

      d3parentElement.select('.bar2 svg')
        .append('g')
        .attr('transform', 'translate(45, 19)')
        .call(yaxis_bar2);

      let bar2 = d3parentElement.select('.svg-bar2');
      let bar_group2 = bar2.selectAll('rect')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 299;
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar_group2
        .append('rect')
        .attr('fill', '#63ad65')
        .attr('width', 30)
        .attr('height', function (d: any) {
          return 1;
        });
      bar_group2
        .append('text')
        .attr('fill', '#000')
        .attr('text-anchor', 'end')
        .attr('y', function (d: any) {
          return 0;
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = 0;
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });
      bar_group2.on('mouseover', function (d: any, i: any) {
        let xPosition = i * (30 + 8);
        let yPosition = 500;
        let tooltip = d3parentElement.select('#tooltip');
        tooltip.style('left', xPosition + 'px')
          .style('top', yPosition + 'px')
          .select('#name')
          .text(d.name);
        tooltip.select('#number')
          .text(d.player_id);
        tooltip.select('img')
          .attr('src', './assets/images/players/1/' + d.player_id + '.jpg');
        tooltip.select('#pos').text(d.position_type);
        if (d.is_sub === 1) {
          tooltip.select('#sub').text('Substitutes: Yes');
        } else {
          tooltip.select('#sub').text('Substitutes: No');
        }
        tooltip.classed('hidden', false);
      });
      bar_group2.on('mouseout', function (d: any) {
        d3parentElement.select(('#tooltip'))
          .classed('hidden', true);
      });

      /* --- Top speed --- */

      let bar3_array = this.getAryForMax(data, 'top_speed');
      this.maxVal.top_speed = d3.max(bar3_array) * 1.5;

      let yaxisScale3 = d3.scaleLinear()
        .domain([0, this.maxVal.top_speed])
        .range([280, 0]);

      let yaxis_bar3 = d3.axisLeft(yaxisScale3)
        .tickSizeInner(5)
        .tickSizeOuter(10);

      d3parentElement.select('.bar3 svg')
        .append('g')
        .attr('transform', 'translate(45, 19)')
        .call(yaxis_bar3);

      let bar3 = d3parentElement.select('.svg-bar3');
      let bar_group3 = bar3.selectAll('rect')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 299;
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar_group3
        .append('rect')
        .attr('fill', '#f00')
        .attr('width', 30)
        .attr('height', function (d: any) {
          return 1;
        });
      bar_group3
        .append('text')
        .attr('fill', '#000')
        .attr('text-anchor', 'end')
        .attr('y', function (d: any) {
          return 0;
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = 0;
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });
      bar_group3.on('mouseover', function (d: any, i: any) {
        let xPosition = i * (30 + 8);
        let yPosition = 1000;
        let tooltip = d3parentElement.select('#tooltip');
        tooltip.style('left', xPosition + 'px')
          .style('top', yPosition + 'px')
          .select('#name')
          .text(d.name);
        tooltip.select('#number')
          .text(d.player_id);
        tooltip.select('img')
          .attr('src', './assets/images/players/1/' + d.player_id + '.jpg');
        tooltip.select('#pos').text(d.position_type);
        if (d.is_sub === 1) {
          tooltip.select('#sub').text('Substitutes: Yes');
        } else {
          tooltip.select('#sub').text('Substitutes: No');
        }
        tooltip.classed('hidden', false);
      });
      bar_group3.on('mouseout', function (d: any) {
        d3parentElement.select(('#tooltip'))
          .classed('hidden', true);
      });
    }

    this.changeViewPort(this.mobWidth);
  }

  updateBarChart() {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;

    if (this.parentNativeElement !== null) {
      d3parentElement = d3.select(this.parentNativeElement);

      /* --- Total Distance --- */

      let data_bars = this.makeData();

      let h = d3.scaleLinear()
        .domain([0, this.maxVal.total_dist])
        .range([0, 280]);

      let bar1 = d3parentElement.select('.svg-bar1');
      bar1.selectAll('rect')
        .data(data_bars)
        .transition()
        .duration(2000)
        .attr('height', function (d: any) {
          return h(d.total_distance);
        });
      bar1.selectAll('g')
        .transition()
        .duration(2000)
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 300 - h(d.total_distance);
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar1.selectAll('text')
        .transition()
        .duration(2000)
        .attr('y', function (d: any) {
          return h(d.total_distance);
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = h(d.total_distance);
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });

      /* --- Sprint Distance --- */

      let h2 = d3.scaleLinear()
        .domain([0, this.maxVal.sprint_dist])
        .range([0, 280]);

      let bar2 = d3parentElement.select('.svg-bar2');
      bar2.selectAll('rect')
        .data(data_bars)
        .transition()
        .duration(2000)
        .attr('height', function (d: any) {
          return h2(d.sprint_distance);
        });
      bar2.selectAll('g')
        .transition()
        .duration(2000)
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 300 - h2(d.sprint_distance);
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar2.selectAll('text')
        .transition()
        .duration(2000)
        .attr('y', function (d: any) {
          return h2(d.sprint_distance);
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = h2(d.sprint_distance);
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });

      /* --- Top Speed --- */

      let h3 = d3.scaleLinear()
        .domain([0, this.maxVal.top_speed])
        .range([0, 280]);

      let bar3 = d3parentElement.select('.svg-bar3');
      bar3.selectAll('rect')
        .data(data_bars)
        .transition()
        .duration(2000)
        .attr('height', function (d: any) {
          return h3(d.top_speed);
        });
      bar3.selectAll('g')
        .transition()
        .duration(2000)
        .attr('transform', function (d: any, i: any) {
          let xloc = i * (30 + 8);
          let yloc = 300 - h3(d.top_speed);
          return 'translate(' + xloc + ',' + yloc + ')';
        });
      bar3.selectAll('text')
        .transition()
        .duration(2000)
        .attr('y', function (d: any) {
          return h3(d.top_speed);
        })
        .attr('transform', 'translate(10, 10)')
        .attr('transform', function (d: any, i: any) {
          let x = 0;
          let y = h3(d.top_speed);
          return 'rotate( -45 ' + x + ', ' + y + ') translate(0, 20)';
        })
        .text(function (d: any) {
          return d.name;
        });
    }
  }

  getAryForMax(ds: any, opt: any) {
    let ary = [];
    if (opt === 'total_distance') {
      for (let d of ds) {
        ary.push(d.total_distance);
      }
    } else if (opt === 'sprint_distance') {
      for (let d of ds) {
        ary.push(d.sprint_distance);
      }
    } else if (opt === 'top_speed') {
      for (let d of ds) {
        ary.push(d.top_speed);
      }
    }
    return ary;
  }

  makeData() {

    if (Number(this.selected_team) === 1) {
      this.players = this.playersData.team_a;
    } else {
      this.players = this.playersData.team_b;
    }

    let rlt = this.data.values;
    let len = rlt.length;
    let td_step = (this.maxVal.total_dist / 1200);
    let sd_step = (this.maxVal.sprint_dist / 1200);
    let ts_step = (this.maxVal.top_speed / 3000);
    let rnd_td = [1, 2, 3, 7, 4, 5, 6, 9, 11, 15, 14, 12, 11, 10];
    let rnd_sd = [1, 3, 2, 5, 4, 7, 6, 10, 9, 13, 16, 10, 13, 11];
    let rnd_ts = [10, 12, 13, 14, 15, 11, 16, 15, 17, 19, 21, 10, 13, 11];

    for (let i = 0; i < len; i++) {
      /*
      let dif_td = ( this.maxVal.total_dist  / 270 ) * (this.option.displayTime - this.option.prevTime);

      let new_tdVal = dif_td;
      rlt[i].total_distance = new_tdVal;

      let dif_sd = ( this.maxVal.sprint_dist / 270) * (this.option.displayTime - this.option.prevTime);
      let new_sdVal = dif_sd;
      rlt[i].sprint_distance = new_sdVal;
      */
      if (this.option.displayTime === 0) {
        rlt[i].total_distance = 20;
        rlt[i].sprint_distance = 10;
        rlt[i].top_speed = 0.03;
      } else {
        rlt[i].total_distance = td_step * this.option.displayTime * rnd_td[i];
        rlt[i].sprint_distance = sd_step * this.option.displayTime * rnd_sd[i];
        rlt[i].top_speed = ts_step * (18 + this.option.displayTime) * rnd_ts[i];
      }
    }
    for (let i = 0; i < 14; i++) {
      rlt[i].name = this.players[i].name;
    }
    this.option.prevTime = this.option.displayTime;
    return rlt;
  }

  onClick(ev: any, opt: any) {
    let startpoint = 20;

    if (opt === 'first') {
      if (this.mobWidth > 800) {
        startpoint = (this.mobWidth - 800) / 2 + 24;
      }
      this.sliderFirstDiff = startpoint;
      this.sliderFirstLeft = ev.x - this.sliderFirstDiff;
      this.sliderFirstValue = Math.round(this.sliderFirstLeft / this.firstSliderRatio);
      if (this.sliderFirstLeft < 0) {
        this.sliderFirstLeft = 0;
        this.sliderStart = 0;
        this.sliderFirstValue = 0;
      } else if (this.sliderFirstLeft > this.sliderWidth) {
        this.sliderFirstLeft = this.sliderWidth;
        this.sliderStart = 0;
        this.sliderFirstValue = this.sliderWidth / this.firstSliderRatio;
      }
      this.option.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    } else {
      if (this.mobWidth > 800) {
        startpoint = (this.mobWidth - 800) / 2 + 24 + 400;
      }
      this.sliderSecondDiff = startpoint;
      this.sliderSecondLeft = ev.x - this.sliderSecondDiff;
      this.sliderSecondValue = Math.round(this.sliderSecondLeft / this.secondsliderRatio);
      if (this.sliderSecondLeft < 0) {
        this.sliderSecondLeft = 0;
        this.sliderStart = 0;
        this.sliderSecondValue = 0;
      } else if (this.sliderSecondLeft > this.sliderWidth) {
        this.sliderSecondLeft = this.sliderWidth;
        this.sliderStart = 0;
        this.sliderSecondValue = this.sliderWidth / this.secondsliderRatio;
      }
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.option.displayTime = this.sliderSecondValue + this.sliderFirstValue;
      if (this.option.displayTime > 90) {
        this.option.displayTime = 90;
      }
      this.sliderFirstLeft = this.sliderWidth;
      this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
    }

    this.updateBarChart();
  }

  onMouseDown(ev: any, opt: any) {
    if (opt === 'first') {
      this.sliderStart = 1;
      this.sliderStart_fpos = ev.x;
      this.sliderFirstDiff = ev.x - this.sliderFirstLeft;
    } else {
      this.sliderStart = 2;
      this.sliderStart_spos = ev.x;
      this.sliderSecondDiff = ev.x - this.sliderSecondLeft;
    }
  }

  makeTimeStr(t: any) {
    if (t < 2700) {
      this.temp.gamepos = 'First Half';
    } else {
      this.sliderFirstExtra = 3;
      this.temp.gamepos = 'Second Half';
    }
    let time_str = Math.floor(t / 3600).toString();
    if (Math.floor(t / 3600) < 10) {
      time_str = '0' + Math.floor(t / 3600).toString();
    }
    let min_str = Math.floor((t % 3600) / 60).toString();
    if (Math.floor((t % 3600) / 60) < 10) {
      min_str = '0' + Math.floor((t % 3600) / 60).toString();
    }
    let sec_str = Math.floor((t % 3600) % 60).toString();
    if (Math.floor((t % 3600) % 60) < 10) {
      sec_str = '0' + Math.floor((t % 3600) % 60).toString();
    }
    let mk = ' : ';
    if ((t % 2) === 0) {
      mk = ' : ';
    } else {
      mk = ' : ';
    }
    let st = time_str + mk + min_str + mk + sec_str;
    this.temp.livetime = st;
    this.temp.current_t = t;
  }

  onMouseUp(ev: any, opt: any) {
    this.sliderStart = 0;
    if (opt === 'first') {
      this.option.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    } else {
      this.option.displayTime = this.sliderSecondValue + 45;
      if (this.option.displayTime > 90) {
        this.option.displayTime = 90;
      }
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.sliderFirstLeft = this.sliderWidth;
      this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
    }
    this.updateBarChart();
  }

  onMouseMove(ev: any) {
    if (this.sliderStart === 1) {
      let step = ev.x - this.sliderFirstDiff;
      let val = Math.round(step / this.firstSliderRatio);
      if (val % 1 === 0) {
        this.sliderFirstValue = val;
        this.sliderFirstLeft = Math.round(val * this.firstSliderRatio);
        if (this.sliderFirstLeft < 0) {
          this.sliderFirstLeft = 0;
          this.sliderStart = 0;
          this.sliderFirstValue = 0;
        } else if (this.sliderFirstLeft > this.sliderWidth) {
          this.sliderFirstLeft = this.sliderWidth;
          this.sliderStart = 0;
          this.sliderFirstValue = this.sliderWidth / this.firstSliderRatio;
        }
      }
    } else if (this.sliderStart === 2) {
      let step = ev.x - this.sliderSecondDiff;
      let val = Math.round(step / this.secondsliderRatio);
      if (val % 1 === 0) {
        this.sliderSecondValue = val;
        this.sliderSecondLeft = Math.round(val * this.secondsliderRatio);
        if (this.sliderSecondLeft < 0) {
          this.sliderSecondLeft = 0;
          this.sliderStart = 0;
          this.sliderSecondValue = 0;
        } else if (this.sliderSecondLeft > this.sliderWidth) {
          this.sliderSecondLeft = this.sliderWidth;
          this.sliderStart = 0;
          this.sliderSecondValue = this.sliderWidth / this.secondsliderRatio;
        }
      }
    }
  }

  onChangeTeam() {
    this.updateBarChart();
  }
}
