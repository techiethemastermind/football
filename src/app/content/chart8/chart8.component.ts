import { Component, ElementRef, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart8',
  templateUrl: './chart8.component.html',
  styleUrls: ['./chart8.component.css']
})
export class Chart8Component implements AfterViewInit {

  private d3: D3;                   // D3 Object
  private parentNativeElement: any; // Selector parent for D3
  private timer: Observable<any>;   // Timer for Live mode (Real time)
  private sub: any;                 // Timer subscription

  data: any = {};                   // Data from server
  displayType = false;
  displayTime = 0;            // Time frame: 0min - 90 min
  teams: any = [];

  playControl = 1;  // 0 stop, 1 start, 2 back;
  ctrlImageUrl = './assets/images/play_stop-50.png';

  // Initial values
  selected_team = {
    'left': 1,
    'right': 2
  };

  temp = {
    'current': 0, // recoded second - realtime
    'livetime': '00 : 00 : 00',
    'gamepos': 'First Half',
    'current_t': 0  // temp t
  };

  goals = {
    'left': 0,
    'right': 0
  };

  sliderWidth = 360;

  sliderStart = 0;  // 0: not slider, 1: first slider started, 2: second slider started

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
  secondsliderRatio = this.sliderWidth / (45 + this.sliderFirstExtra);

  mobWidth: any;
  mobdevice: boolean = false;  // false = desktop, true = mobile

  constructor(
    element: ElementRef,
    d3Service: D3Service,
    private getDataService: GetdataService,
    private activatedRoute: ActivatedRoute) {
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

  doOrientationChange(e: any) {
    if (e) {
      this.mobWidth = e.target.innerWidth;
      if (window.orientation === -90 || window.orientation === 90) {
        this.mobWidth = e.target.innerWidth + 25;
      }
      this.changeViewPort(this.mobWidth - 27);
    }
  }

  reSize(e: any) {
    if (e) {
      if (this.mobdevice) {
        this.mobWidth = window.screen.width;
      } else {
        this.mobWidth = e.target.innerWidth;
      }

      this.changeViewPort(this.mobWidth - 27);
    }
  }

  changeViewPort(screen_width: any) {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    d3parentElement = d3.select(this.parentNativeElement);

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

  ngAfterViewInit() {

    this.activatedRoute.params.subscribe((params: Params) => {
      let mode = params['mode'];
      if (mode === 'normal') {
        this.displayType = false;
      } else if (mode === 'live') {
        this.displayType = true;
      }
    });

    this.getDataService.getJSON('team')
      .subscribe(
      data_team => {

        // set teams array
        this.teams = data_team.team.values;

        // Set Initial Match team
        this.getDataService.getJSON_Param('chart8', 'chart8', this.selected_team)
          .subscribe(
          data => {
            this.data = data;
            if (this.displayType) {
              this.playControl = 0;
              this.ctrlRealTime();
            } else {
              this.displayChart();
            }
          },
          error => {
            console.log(error);
          }
          );
      },
      error => {
        console.log(error);
      });
    this.timer = Observable.interval(1000);
  }

  displayChart() {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;

    if (this.parentNativeElement !== null) {

      d3parentElement = d3.select(this.parentNativeElement);
      let displayData = this.getDisplayData();
      let pk_l = this.teams[this.selected_team.left - 1].key;
      let pk_r = this.teams[this.selected_team.right - 1].key;
      let left_data = displayData[pk_l];
      let right_data = displayData[pk_r];
      this.goals.left = left_data[0];
      this.goals.right = right_data[0];

      d3.selectAll('.l-val')
        .data(left_data)
        .text(function (d: any, i: any) {
          if (i === 3 || i === 7 || i === 8) {
            return d + '%';
          } else {
            return d;
          }
        });
      d3.selectAll('.r-val')
        .data(right_data)
        .text(function (d: any, i: any) {
          if (i === 3 || i === 7 || i === 8) {
            return d + '%';
          } else {
            return d;
          }
        });

      this.changeViewPort(this.mobWidth - 27);
    }
  }

  getDisplayData() {
    let data = this.data.values;
    let pk_l = this.teams[this.selected_team.left - 1].key;
    let pk_r = this.teams[this.selected_team.right - 1].key;
    let d1: any;
    let d2: any;
    let d3: any;
    let chk = 0;
    for (let d of data) {
      if (this.displayTime % 5 === 0) {
        if (Number(d.time) === Number(this.displayTime)) {
          return d.values;
        }
      } else {
        let time = Math.floor(this.displayTime / 5) * 5;
        if (Number(d.time) === time || Number(d.time) === (time + 5)) {

          if (Number(d.time) === time) {
            d1 = d.values;
            d3 = d1;
          } else if (Number(d.time) === (time + 5)) {
            d2 = d.values;
            chk = 1;
          }

          if (chk === 1) {
            for (let i = 0; i <= 8; i++) {
              d3[pk_l][i] = d1[pk_l][i] + Math.round(Math.random() * Math.sqrt((d2[pk_l][i] - d1[pk_l][i]) * (d2[pk_l][i] - d1[pk_l][i])));
              d3[pk_r][i] = d1[pk_r][i] + Math.round(Math.random() * Math.sqrt((d2[pk_r][i] - d1[pk_r][i]) * (d2[pk_r][i] - d1[pk_r][i])));
            }
            return d3;
          }
        }
      }
    }
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

  getRealTime(tick: any) {
    let t = this.temp.current + tick;
    this.makeTimeStr(t);
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
    if ((t % 15) === 0) {
      this.displayTime = (Math.round(t / 15) * 5) % 90;
      this.displayChart();
    }
  }

  onChangeTeam(opt: any) {
    this.sliderFirstValue = 0;
    this.sliderFirstLeft = 0;
    this.sliderSecondValue = 0;
    this.sliderSecondLeft = 0;
  }

  onClick(ev: any, opt: any) {
    let startpoint = 35;

    if (opt === 'first') {
      if (this.mobWidth > 800) {
        startpoint = (this.mobWidth - 800) / 2 + 12;
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
      this.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    } else {
      if (this.mobWidth > 800) {
        startpoint = (this.mobWidth - 800) / 2 + 12 + 400;
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
      this.displayTime = this.sliderSecondValue + this.sliderFirstValue;
      if (this.displayTime > 90) {
        this.displayTime = 90;
      }
      this.sliderFirstLeft = this.sliderWidth;
      this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
    }

    this.displayChart();
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
      this.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    } else {
      this.displayTime = this.sliderSecondValue + 45;
      if (this.displayTime > 90) {
        this.displayTime = 90;
      }
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.sliderFirstLeft = this.sliderWidth;
      this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
    }

    this.displayChart();
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
}
