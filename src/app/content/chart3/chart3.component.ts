import { Component, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart3',
  templateUrl: './chart3.component.html',
  styleUrls: ['./chart3.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart3Component implements AfterViewInit {
  private d3: D3;                   // D3 Object
  private parentNativeElement: any; // Selector parent for D3
  context: CanvasRenderingContext2D;
  @ViewChild('myCanvas') myCanvas: any;

  private timer: Observable<any>;   // Timer for Live mode (Real time)
  private sub: any;                 // Timer subscription

  option = {
    'displayType': false,  // Live mode: true, Normal Mode: false;
    'displayTime': 0
  };
  ratioX: any = 800 / 100;         // Field ratio: width - 8
  ratioY: any = 500 / 64;

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

  playControl = 1;  // 0 stop, 1 start, 2 back;
  ctrlImageUrl = './assets/images/play_stop-50.png';

  teams: any = [];
  data: any = {};                   // Data from server

  selected_team = {
    'left': 1,
    'right': 2,
    'logo_l': './assets/icons/1.png',
    'logo_r': './assets/icons/2.png'
  };

  temp = {
    'current': 0, // recoded second - realtime
    'livetime': '00 : 00 : 00',
    'gamepos': 'First Half',
    'current_t': 0  // temp t
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

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)){
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

  changeViewPort(screen_width: any) {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    d3parentElement = d3.select(this.parentNativeElement);

    if (screen_width < 800) {
      let screen_ratio = screen_width / 800;

      d3parentElement.select('#myCanvas')
        .style('transform', 'scale(' + screen_ratio + ')')
        .style('left', '-' + (800 - 800 * screen_ratio) / 2 + 'px')
        .style('top', '-' + (500 - 500 * screen_ratio) / 2 + 'px');
      d3parentElement.select('svg')
        .style('transform', 'scale(' + screen_ratio + ')')
        .style('left', '-' + (800 - 800 * screen_ratio) / 2 + 'px')
        .style('top', '-' + (500 - 500 * screen_ratio) / 2 + 'px');

      d3parentElement.select('#canvas-wrap')
        .style('height', 505 * screen_ratio + 'px');

      d3parentElement.select('.team-logo img')
        .style('width', 65 * screen_ratio + 'px');
    } else {
      d3parentElement.select('#myCanvas')
        .style('transform', 'scale(1)')
        .style('left', '0')
        .style('top', '0');
      d3parentElement.select('svg')
        .style('transform', 'scale(1)')
        .style('left', '0')
        .style('top', '0');

      d3parentElement.select('#canvas-wrap')
        .style('height', '505px');

      d3parentElement.select('.team-logo img')
        .style('width', '65px');
    }

    if (screen_width < 420) {
      let mobSlider_width = screen_width - 30;
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

  doOrientationChange(e: any) {
    if (e) {
      this.mobWidth = e.target.innerWidth;
      if (window.orientation === -90 || window.orientation === 90) {
          this.mobWidth = e.target.innerWidth + 25;
      }
      this.changeViewPort(this.mobWidth - 20);
    }
  }

  reSize(e: any) {
    if (e) {
      if (this.mobdevice) {
        this.mobWidth = window.screen.width;
      } else {
        this.mobWidth = e.target.innerWidth;
      }

      this.changeViewPort(this.mobWidth - 20);
    }
  }

  ngAfterViewInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      let mode = params['mode'];
      if (mode === 'normal') {
        this.option.displayType = false;
      } else if (mode === 'live') {
        this.option.displayType = true;
      }
    });
    this.getDataService.getJSON('team')
      .subscribe(
      data_team => {

        // set teams array
        this.teams = data_team.team.values;

        // Set Initial Match team
        this.getDataService.getJSON_Param('chart3', 'chart3', this.selected_team)
          .subscribe(
          data => {
            this.data = data;
            if (this.option.displayType) {
              this.playControl = 0;
              this.ctrlRealTime();
            } else {
              this.displayHeatMap();
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

  displayHeatMap() {
    let brushCanvas = document.createElement('canvas');
    let brushSize = 50;
    let brushBlurSize = 50;

    // set brush size

    let r = brushSize + brushBlurSize;
    let d = r * 2;
    brushCanvas.width = d;
    brushCanvas.height = d;

    let ctx_b = brushCanvas.getContext('2d');
    ctx_b.clearRect(0, 0, brushCanvas.width, brushCanvas.height);
    ctx_b.shadowOffsetX = d;
    ctx_b.shadowBlur = brushBlurSize;
    ctx_b.shadowColor = 'red';

    // draw circle in the left to the canvas

    ctx_b.beginPath();
    ctx_b.arc(-r, r, brushSize, 0, Math.PI * 2, true);
    ctx_b.closePath();
    ctx_b.fill();

    let canvas = this.myCanvas.nativeElement;
    this.context = canvas.getContext('2d');
    let ctx = this.context;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let data = this.getHeatMapPos();

    let l = data.length;
    for (let i = 0; i < l; ++i) {
      let p = data[i];
      let x = p[0];
      let y = p[1];
      let alpha = p[2]; // using value as alpha

      // draw with the circle brush with alpha

      ctx.globalAlpha = alpha;
      ctx.drawImage(brushCanvas, x - r, y - r);
    }

    let gradientLevels = 256;
    let gradient = ctx.createLinearGradient(0, 0, 0, gradientLevels);

    // add color to gradient stops
    gradient.addColorStop(0.2, 'blue');
    gradient.addColorStop(0.4, 'cyan');
    gradient.addColorStop(0.6, 'lime');
    gradient.addColorStop(0.8, 'yellow');
    gradient.addColorStop(1.0, 'red');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, gradientLevels);

    let gradientPixels = ctx.getImageData(0, 0, 1, gradientLevels).data;

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    let len = pixels.length / 4;
    while (len--) {
      let id = len * 4 + 3;
      let alpha = pixels[id] / 256; // why not `gradientLevels`?
      let colorOffset = Math.floor(alpha * (gradientLevels - 1));
      pixels[id - 3] = gradientPixels[colorOffset * 4];     // red
      pixels[id - 2] = gradientPixels[colorOffset * 4 + 1]; // green
      pixels[id - 1] = gradientPixels[colorOffset * 4 + 2]; // blue
    }
    ctx.putImageData(imageData, 0, 0);

    this.changeViewPort(this.mobWidth - 20);
  }

  getHeatMapPos() {

    let data = this.data.values;
    let time = this.option.displayTime;
    let dt_points: any = [];

    for (let d of data) {
      if (Number(d.time) < Number(time)) {
        let point = this.makeHeatData(d);
        dt_points = dt_points.concat(point);
      }
    }
    return dt_points;
  }

  makeHeatData(data: any) {

    /* ----- scales ----- */
    let d3 = this.d3;
    let scale_x = d3.scaleLinear().domain([-10, 110]).range([0, 780]);
    let scale_y = d3.scaleLinear().domain([-10, 74]).range([0, 480]);

    /* let val = data.value; // count of players position */

    let points: any = [];
    let cond = this.option.displayTime % 5;
    let i = 0;

    for (let d of data.values) {
      i++;
      let mx = 0;
      let my = 0;
      if (i % 7 === 1) {
        mx = 0;
        my = 1;
      } else if (i % 7 === 2) {
        mx = 0;
        my = -1;
      } else if (i % 7 === 3) {
        mx = 1;
        my = 0;
      } else if (i % 7 === 4) {
        mx = 1;
        my = 1;
      } else if (i % 7 === 5) {
        mx = 1;
        my = -1;
      } else if (i % 7 === 6) {
        mx = -1;
        my = 0;
      }
      let dx = mx * (5 + cond) + d.x;
      let dy = my * (5 + cond) + d.y;
      if (cond === 0) {
        dx = mx * 10 + d.x;
        dy = my * 10 + d.y;
      }
      points.push([scale_x(dx), scale_y(dy), 0.5]);
    }

    /*
    let drx = 800;
    let dry = 500;
    let l = 100;
    if (this.option.displayTime === 0) {
      l = 0;
    }
    let data_points = [];
    for (let i = 0; i < l; i++) {
      let dx = Math.random() * drx + 10;
      if (dx < 0 || dx > 780) { dx = x; }
      let dy = Math.random() * dry + 10;
      if (dy < 0 || dy > 480) { dy = y; }
      let dv = Math.random();
      let data_point = [dx, dy, dv];
      data_points.push(data_point);
    }
    */
    return points;
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
      this.option.displayTime = (Math.floor(tick / 15) * 5) % 90;
      this.displayHeatMap();
    }
  }

  onChangeTeam(opt: any) {
    this.sliderFirstValue = 0;
    this.sliderFirstLeft = 0;
    this.sliderSecondValue = 0;
    this.sliderSecondLeft = 0;
    this.selected_team.logo_r = './assets/icons/' + this.selected_team.right + '.png';
    this.option.displayTime = 0;
    this.temp.current = 0;
    this.temp.livetime = '00 : 00 : 00';
    if (this.option.displayType) {
      this.sub.unsubscribe();
      this.sub = this.timer.subscribe(t => this.getRealTime(t));
    } else {
      this.displayHeatMap();
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

  onClick(ev: any, opt: any) {
    let startpoint = 20;

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
      this.option.displayTime = this.sliderFirstValue;
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
      this.option.displayTime = this.sliderSecondValue + this.sliderFirstValue;
      if (this.option.displayTime > 90) {
        this.option.displayTime = 90;
      }
      this.sliderFirstLeft = this.sliderWidth;
      this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
    }

    this.displayHeatMap();
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
    this.displayHeatMap();
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
