import { Component, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params} from '@angular/router';

@Component({
  selector: 'app-chart2-club',
  templateUrl: './chart2-club.component.html',
  styleUrls: ['./chart2-club.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart2ClubComponent implements AfterViewInit {
  private d3: D3;                   // D3 Object
  private parentNativeElement: any; // Selector parent
  context: CanvasRenderingContext2D;
  @ViewChild('myCanvas') myCanvas: any;

  data: any = {};                   // Data from server
  displayType: any;
  displayTime: any = 0;            // Time frame: 0min - 90 min

  players: any = {
    'left': [],
    'right': []
  };
  selected_players_left = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0];
  selected_players_right = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0];
  selected_all_left: boolean = true;
  selected_all_right: boolean = true;

  selected_player_left_ids: any = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  selected_player_right_ids: any = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  playersData: any;

  ratioX: any = 700 / 100;         // Field ratio: width - 8
  ratioY: any = 500 / 64;
  private timer: Observable<any>;   // Timer for Live mode (Real time)
  private sub: any;                 // Timer subscription

  sliderWidth = 360;
  sliderStart = 0;  // 0: not slider, 1: first slider started, 2: second slider started

  sliderFirstLeft = 0;
  sliderStart_fpos: any;
  sliderFirstDiff: any;
  sliderFirstValue = 0;
  sliderFirstExtra = 3;
  firstSliderRatio = 360 / (45 + this.sliderFirstExtra);

  sliderSecondLeft = 0;
  sliderStart_spos: any;
  sliderSecondDiff: any;
  sliderSecondValue = 0;
  sliderSecondExtra = 6;
  secondsliderRatio = 360 / (45 + this.sliderFirstExtra);

  playControl = 1;  // 0 stop, 1 start, 2 back;
  ctrlImageUrl = './assets/images/play_stop-50.png';

  temp = {
    'current': 0, // recoded second - realtime
    'livetime': '00 : 00 : 00',
    'gamepos': 'First Half',
    'current_t': 0  // temp t
  };

  tip = {
    'src': './assets/images/players/1/1.jpg',
    'name': 'name',
    'number': 1,
    'position': 'Gool Keeper',
    'sub': 0,
    'x': 100,
    'y': 100,
    'class': 'hidden'
  };

  clsshow = {
    'left': '',
    'right': '',
    'leftsel': 0,
    'rightsel': 0,
    'lefticon': '=',
    'righticon': '='
  };

  canvas = {
    'width': 500,
    'height': 700,
    'brushSize': 30,
    'brushBlurSize': 40
  };

  mobWidth: any;
  mobdevice: boolean = false;  // false = desktop, true = mobile

  constructor (
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

  ngAfterViewInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      let mode = params['mode'];
      if (mode === 'normal') {
        this.displayType = false;
      }else if (mode === 'live') {
        this.displayType = true;
      }
    });

    this.getDataService.getClubJSON_Data('players_club')
        .subscribe(
            data => {
              this.playersData = data;
              this.players.left = this.playersData.team_a;
              this.players.right = this.playersData.team_b;
            },
            err => {
              console.log(err);
            }
        );

    // Set Initial Match team
    this.getDataService.getClubJSON_Data('chart2_club')
        .subscribe(
            data => {
              this.data = data;
              if (this.displayType) {
                this.playControl = 0;
                this.ctrlRealTime();
              } else {
                this.displayTime = 90;
                this.sliderFirstValue = 45 + this.sliderFirstExtra;
                this.sliderSecondValue = 45 + this.sliderSecondExtra;
                this.sliderFirstLeft = 360;
                this.sliderSecondLeft = 360;
                this.displayHeatMap();
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
    }else if (this.playControl === 0) {
      this.ctrlImageUrl = './assets/images/play_stop-50.png';
      this.sub = this.timer.subscribe(t => this.getRealTime(t));
      this.playControl = 1;
    }
  }
  /* --- Real Time Part  --- */
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
      this.displayTime = (t / 15) % 90;
      this.displayHeatMap();
    }
  }

  changeViewPort(viewWidth: any) {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    d3parentElement = d3.select(this.parentNativeElement);

    if (viewWidth > 992) {
      d3parentElement.select('svg')
        .style('top', 20);
    } else {
      d3parentElement.select('svg')
        .style('top', 0);
    }

    if (viewWidth < 500) {
      let screen_ratio = viewWidth / 500;

      d3parentElement.selectAll('svg')
        .attr('width', 500 * screen_ratio)
        .attr('height', 700 * screen_ratio);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'scale(' + screen_ratio + ')');

      d3parentElement.select('#myCanvas')
        .style('transform', 'scale(' + screen_ratio + ')');

      d3parentElement.select('#canvas-wrap')
        .style('left', '-' + (500 - 500 * screen_ratio) / 2 + 'px')
        .style('top', '-' + (700 - 700 * screen_ratio) / 2 + 'px');

      d3parentElement.select('.widget.chart2')
        .style('height', (700 * screen_ratio + 30) + 'px')
        .style('width', (500 * screen_ratio) + 'px');
    } else {

      d3parentElement.selectAll('svg')
        .attr('width', 500)
        .attr('height', 700);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'scale(1)');

      d3parentElement.select('#canvas-wrap')
        .style('left', '0')
        .style('top', '0');

      d3parentElement.select('#myCanvas')
        .style('transform', 'scale(1)');
      d3parentElement.select('.widget.chart2')
        .style('width', '500px')
        .style('height', '710px');
    }

    if (viewWidth < 400) {
      let mobSlider_width = viewWidth - 20;
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
      this.changeViewPort(this.mobWidth - 30);
    }
  }

  reSize(e: any) {
    if (e) {
      if (this.mobdevice) {
        this.mobWidth = window.screen.width;
      } else {
        this.mobWidth = e.target.innerWidth;
      }

      this.changeViewPort(this.mobWidth - 30);
    }
  }

  displayHeatMap() {
    let brushCanvas = document.createElement('canvas');
    let brushSize = 30;
    let brushBlurSize = 40;

    // set brush size

    let r = brushSize + brushBlurSize;
    let d = r * 2;
    brushCanvas.width = d;
    brushCanvas.height = d;

    let ctx_b = brushCanvas.getContext('2d');
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
    let data: any = [];
    let ids_l = this.selected_player_left_ids.length;
    for (let i = 0; i < ids_l; i++) {
      let id = this.selected_player_left_ids[i];
      let data_rlt = this.getHeatData(id, 'left');
      data = data.concat(data_rlt);
    }
    let ids_r = this.selected_player_right_ids.length;
    for (let i = 0; i < ids_r; i++) {
      let id = this.selected_player_right_ids[i];
      let data_rlt = this.getHeatData(id, 'right');
      data = data.concat(data_rlt);
    }

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

    this.changeViewPort(this.mobWidth - 30);
  }

  getHeatData(id: any, side: any) {
    let data = this.data.values;
    let dt_points: any = [];
    for (let d of data) {
      if (Number(this.displayTime) > 1 && Number(this.displayTime) < 6) {
        if (Number(d.time) === 5) {
          for (let p of d.values) {
            if (p.number === id) {
              let point: any = [];
              if (side === 'left') {
                point = this.makeHeatData(p, 'left');
              } else {
                point = this.makeHeatData(p, 'right');
              }
              dt_points.push(point);
            }
          }
        }
      }
      if (Number(d.time) < Number(this.displayTime)) {
        for (let p of d.values) {
          if (p.number === id) {
            let point: any = [];
            if (side === 'left') {
              point = this.makeHeatData(p, 'left');
            } else {
              point = this.makeHeatData(p, 'right');
            }
            dt_points.push(point);
          }
        }
      }
    }
    return dt_points;
  }

  getHeatPos(time: any, data: any, option: any, side: any) {
    for (let d of data) {
      if (d.time === Number(time)) {
        let old_d = d.values;
        let new_d = old_d;
        for ( let i = 0; i < 14; i++) {
          if (side === 'left') {
            new_d[i].x = old_d[i].x;
            new_d[i].y = old_d[i].y;
          } else {
            new_d[i].x = 100 - old_d[i].x;
            new_d[i].y = 64 - old_d[i].y;
          }
        }
        if (option !== 'all') {
          for (let p of new_d) {
            if ( p.number === option) {
              return p;
            }
          }
        } else {
          return new_d;
        }
      }
    }
  }

  makeHeatData(data: any, side: any) {
    /* ----- scales ----- */
    let d3 = this.d3;
    let scale_x = d3.scaleLinear().domain([0, 100]).range([0, 660]);
    let scale_y = d3.scaleLinear().domain([0, 64]).range([0, 460]);
    let data_point: any = [];
    let cond = this.displayTime % 5;
    if (cond === 0) {
      if (side === 'left') {
        data_point = [scale_y(data.y), scale_x(data.x), 0.5];
      } else {
        data_point = [(480 - scale_y(data.y)), (680 - scale_x(data.x)), 0.5];
      }
    } else if (cond === 1) {
      if (side === 'left') {
        data_point = [scale_y(data.y + 5), scale_x(data.x), 0.5];
      } else {
        data_point = [(480 - scale_y(data.y + 5)), (680 - scale_x(data.x)), 0.5];
      }
    } else if (cond === 2) {
      if (side === 'left') {
        data_point = [scale_y(data.y), scale_x(data.x + 5), 0.5];
      } else {
        data_point = [(480 - scale_y(data.y)), (680 - scale_x(data.x + 5)), 0.5];
      }
    } else if (cond === 3) {
      if (side === 'left') {
        data_point = [scale_y(data.y - 5), scale_x(data.x), 0.5];
      } else {
        data_point = [(480 - scale_y(data.y - 5)), (680 - scale_x(data.x)), 0.5];
      }
    } else if (cond === 4) {
      if (side === 'left') {
        data_point = [scale_y(data.y), scale_x(data.x - 5), 0.5];
      } else {
        data_point = [(480 - scale_y(data.y)), (680 - scale_x(data.x - 5)), 0.5];
      }
    }
    return data_point;
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

  trackPlayer(index: any, player: any) {}

  blackColor(i: any, opt: any) {
    if (opt === 'left') {
      if ( this.selected_players_left[i] === 1) {
        return '#337ab7';
      } else {
        return '';
      }
    } else {
      if ( this.selected_players_right[i] === 1) {
        return '#337ab7';
      } else {
        return '';
      }
    }
  }

  removeItem(val: any, opt: any) {
    let ary: any = [];
    if (opt === 'left') {
      let l = this.selected_player_left_ids.length;
      for (let i = 0; i < l; i++) {
        if ( this.selected_player_left_ids[i] !== val ) {
          ary.push(this.selected_player_left_ids[i]);
        }
      }
    } else {
      let l = this.selected_player_right_ids.length;
      for (let i = 0; i < l; i++) {
        if ( this.selected_player_right_ids[i] !== val ) {
          ary.push(this.selected_player_right_ids[i]);
        }
      }
    }

    return ary;
  }

  onChangeAll(opt: any) {
    if (opt === 'left') {
      if (!this.selected_all_left) {
        this.selected_players_left = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        this.selected_player_left_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      } else {
        this.selected_players_left = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.selected_player_left_ids = [];
      }
    } else if (opt === 'right') {
      if (!this.selected_all_right) {
        this.selected_players_right = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        this.selected_player_right_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      } else {
        this.selected_players_right = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.selected_player_right_ids = [];
      }
    }
    this.displayHeatMap();
  }

  onClickPlayer(p: any, i: any, opt: any) {
    if (opt === 'left') {
      if (this.selected_players_left[i] === 1) {
        this.selected_players_left[i] = 0;
        this.selected_player_left_ids = this.removeItem(p.player_id, 'left');
      } else {
        this.selected_players_left[i] = 1;
        this.selected_player_left_ids.push(p.player_id);
      }
    } else {
      if (this.selected_players_right[i] === 1) {
        this.selected_players_right[i] = 0;
        this.selected_player_right_ids = this.removeItem(p.player_id, 'right');
      } else {
        this.selected_players_right[i] = 1;
        this.selected_player_right_ids.push(p.player_id);
      }
    }

    this.displayHeatMap();
  }

  onMouseOver(ev: any, p: any, opt: any) {
    this.tip.name = p.name;
    this.tip.number = p.number;
    this.tip.position = p.position_type;
    this.tip.x = ev.screenX + 30;
    this.tip.y = ev.screenY - 80;
    this.tip.class = '';
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
      this.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    } else {
      if (this.mobWidth > 800) {
        startpoint = (this.mobWidth - 800) / 2 + 23 + 400;
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

    this.displayHeatMap();
  }

  onMouseLeave() {
    this.tip.class = 'hidden';
  }
  onMouseDown(ev: any, opt: any) {
    if (opt === 'first') {
      this.sliderStart = 1;
      this.sliderStart_fpos = ev.x;
      this.sliderFirstDiff = ev.x - this.sliderFirstLeft;
    }else {
      this.sliderStart = 2;
      this.sliderStart_spos = ev.x;
      this.sliderSecondDiff = ev.x - this.sliderSecondLeft;
    }
  }

  onMouseUp(ev: any, opt: any) {
    this.sliderStart = 0;
    if (opt === 'first') {
      this.displayTime = this.sliderFirstValue;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
      this.makeTimeStr(this.sliderFirstValue * 60);
    }else {
      this.displayTime = this.sliderSecondValue + 45;
      if (this.displayTime > 90) {
        this.displayTime = 90;
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

  quickSel(opt: any) {
    if (opt === 'Full') {
      this.displayTime = 90;
      this.sliderFirstLeft = 360;
      this.sliderFirstValue = 45;
      this.sliderSecondLeft = 360;
      this.sliderSecondValue = 45;
    }else if (opt === 'First') {
      this.displayTime = 45;
      this.sliderFirstLeft = 360;
      this.sliderFirstValue = 45;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
    }else {
      this.displayTime = 45;
      this.sliderFirstLeft = 0;
      this.sliderFirstValue = 0;
      this.sliderSecondLeft = 360;
      this.sliderSecondValue = 45;
    }

    this.displayHeatMap();
  }

  show_team(opt: any) {
    if (opt === 'left') {
      if (this.clsshow.leftsel === 0) {
        this.clsshow.left = 'mob-left-team';
        this.clsshow.leftsel = 1;
        this.clsshow.lefticon = 'X';
      } else {
        this.clsshow.left = '';
        this.clsshow.leftsel = 0;
        this.clsshow.lefticon = '=';
      }
    }
    if (opt === 'right') {
      if (this.clsshow.rightsel === 0) {
        this.clsshow.right = 'mob-right-team';
        this.clsshow.rightsel = 1;
        this.clsshow.righticon = 'X';
      } else {
        this.clsshow.right = '';
        this.clsshow.rightsel = 0;
        this.clsshow.righticon = '=';
      }
    }
  }

}
