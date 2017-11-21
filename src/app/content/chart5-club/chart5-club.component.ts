import { Component, ElementRef, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart5-club',
  templateUrl: './chart5-club.component.html',
  styleUrls: ['./chart5-club.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart5ClubComponent implements AfterViewInit {

  private d3: D3;                   // D3 Object
  private parentNativeElement: any; // Selector parent for D3

  data: any = {};                   // Data from server
  displayType = false;
  displayTime = 0;            // Time frame: 0min - 90 min
  teams: any = [];
  players: any = {
    'left': [],
    'right': []
  };
  playersData: any;

  ratioX: any = 700 / 100;         // Field ratio: width - 8
  ratioY: any = 500 / 64;
  private timer: Observable<any>;   // Timer for Live mode (Real time)
  private sub: any;                 // Timer subscription

  // Initial values
  selected_team = {
    'left': 1,
    'right': 2
  };
  selected_players_left = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  selected_players_right = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  selected_all_left: boolean = false;
  selected_all_right: boolean = false;

  selected_player_left_ids: any = [];
  selected_player_right_ids: any = [];
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

  doOrientationChange(e: any) {
    if (e) {
      this.mobWidth = e.target.innerWidth;
      if (window.orientation === -90 || window.orientation === 90) {
        this.mobWidth = e.target.innerWidth + 25;
      }
      this.changeViewPort(this.mobWidth - 24);
    }
  }

  reSize(e: any) {
    if (e) {
      if (this.mobdevice) {
        this.mobWidth = window.screen.width;
      } else {
        this.mobWidth = e.target.innerWidth;
      }

      this.changeViewPort(this.mobWidth - 24);
    }
  }

  changeViewPort(screen_width: any) {

    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;
    d3parentElement = d3.select(this.parentNativeElement);

    if (screen_width < 500) {
      let screen_ratio = screen_width / 500;
      d3parentElement.selectAll('svg')
        .attr('width', 500 * screen_ratio)
        .attr('height', 700 * screen_ratio);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'scale(' + screen_ratio + ')');

      d3parentElement.select('.chart5')
        .style('height', 700 * screen_ratio + 10 + 'px');
    } else {
      d3parentElement.selectAll('svg')
        .attr('width', 500)
        .attr('height', 700);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'scale(1)');

      d3parentElement.selectAll('.time-slider')
        .style('transform', 'scale(1)')
        .style('left', '0');
      d3parentElement.select('.chart5')
        .style('height', '710px');
    }
    if (screen_width < 420) {
      let mobSlider_width = screen_width - 40;
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

  ngAfterViewInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      let mode = params['mode'];
      if (mode === 'normal') {
        this.displayType = false;
      } else if (mode === 'live') {
        this.displayType = true;
      }
    });
    // set players
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
    this.getDataService.getClubJSON_Data('chart5_club')
      .subscribe(
      data => {
        this.data = data;
        if (this.displayType) {
          this.playControl = 0;
          this.ctrlRealTime();
        } else {
          this.displayTouchMap();
        }
      },
      error => {
        console.log(error);
      }
      );
    this.timer = Observable.interval(1000);
  }

  displayTouchMap() {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;

    if (this.parentNativeElement !== null) {

      d3parentElement = d3.select(this.parentNativeElement);
      let scale_x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 680]);

      let scale_y = d3.scaleLinear()
        .domain([0, 64])
        .range([0, 460]);

      let showData_left = this.makeDisplayData('left');
      let pos_left = d3parentElement.select('.touch-left');

      /*--- Enter --- */
      let group_left = pos_left.selectAll('g')
        .data(showData_left)
        .enter()
        .append('g')
        .attr('class', 'touch-item');
      group_left
        .append('circle')
        .attr('r', 12.5)
        .attr('stroke-width', 3)
        .attr('fill', 'red');
      group_left
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('stroke', 'none')
        .attr('fill', '#fff')
        .attr('font-size', '16px')
        .style('dominant-baseline', 'central')
        .style('font-weight', 600)
        .text(function (d: any) {
          return d.id;
        });

      group_left
        .attr('transform', function (d: any, i: any) {
          let x = scale_x(d.x);
          let y = scale_y(d.y);
          return 'translate(' + y + ',' + x + ')';
        });

      /* --- Update -- */
      let update_left = pos_left.selectAll('g').data(showData_left);
      update_left.exit().remove();
      update_left
        .attr('transform', function (d: any, i: any) {
          let x = scale_x(d.x);
          let y = scale_y(d.y);
          return 'translate(' + y + ',' + x + ')';
        });
      pos_left.selectAll('text').data(showData_left)
        .text(function (d: any) {
          return d.id;
        });

      let showData_right = this.makeDisplayData('right');
      let pos_right = d3parentElement.select('.touch-right');

      /*--- Enter --- */
      let group_right = pos_right.selectAll('g')
        .data(showData_right)
        .enter()
        .append('g')
        .attr('class', 'touch-item');
      group_right
        .append('circle')
        .attr('r', 12.5)
        .attr('stroke-width', 3)
        .attr('fill', 'blue');
      group_right
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('stroke', 'none')
        .attr('fill', '#fff')
        .attr('font-size', '16px')
        .style('dominant-baseline', 'central')
        .style('font-weight', 600)
        .text(function (d: any) {
          return d.id;
        });

      group_right
        .attr('transform', function (d: any, i: any) {
          let x = 680 - scale_x(d.x);
          let y = 480 - scale_y(d.y);
          return 'translate(' + y + ',' + x + ')';
        });

      /* --- Update -- */
      let update_right = pos_right.selectAll('g').data(showData_right);
      update_right.exit().remove();
      update_right
        .attr('transform', function (d: any, i: any) {
          let x = 680 - scale_x(d.x);
          let y = 480 - scale_y(d.y);
          return 'translate(' + y + ',' + x + ')';
        });
      pos_right.selectAll('text').data(showData_left)
        .text(function (d: any) {
          return d.id;
        });

      this.changeViewPort(this.mobWidth - 24);
    }
  }

  makeDisplayData(side: any) {
    let rlt: any = [];
    if (side === 'left') {
      let ids_l = this.selected_player_left_ids.length;
      for (let i = 0; i < ids_l; i++) {
        let id = this.selected_player_left_ids[i];
        let data_rlt = this.makePosData(id);
        rlt = rlt.concat(data_rlt);
      }
    } else {
      let ids_r = this.selected_player_right_ids.length;
      for (let i = 0; i < ids_r; i++) {
        let id = this.selected_player_right_ids[i];
        let data_rlt = this.makePosData(id);
        rlt = rlt.concat(data_rlt);
      }
    }
    return rlt;
  }

  makePosData(id: any) {
    /* let val = data.value; // count of players position */
    let data = this.data.values;
    let data_points: any = [];
    let chk = 0;
    for (let d of data) {
      if (Number(d.time) <= Number(this.displayTime)) {
        let ds = d.values[id - 1].values;
        let player_id = d.values[id - 1].player_id;
        for (let dv of ds) {
          let point = { 'id': player_id, 'x': dv.x, 'y': dv.y };
          data_points.push(point);
        }
        if (chk === 0) {
          let cond = this.displayTime % 5;
          if (this.displayTime !== 0) {
            let ix = ds[0].x;
            let iy = ds[0].y;
            let x = ix;
            let y = iy;
            for (let i = 1; i <= cond; i++) {
              if (i === 1) {
                x = ix;
                y = iy + 5;
              } else if (i === 2) {
                x = ix + 2;
                y = iy + 5;
              } else if (i === 3) {
                x = ix + 5;
                y = iy - 3;
              } else if (i === 4) {
                x = ix - 5;
                y = iy + 3;
              }
              let point = { 'id': player_id, 'x': x, 'y': y };
              data_points.push(point);
            }
          }
        }
        chk = 1;
      }
      chk = 1;
    }
    return data_points;
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
      this.displayTouchMap();
    }
  }

  blackColor(i: any, opt: any) {
    if (opt === 'left') {
      if (this.selected_players_left[i] === 1) {
        return '#337ab7';
      } else {
        return '';
      }
    } else {
      if (this.selected_players_right[i] === 1) {
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
        if (this.selected_player_left_ids[i] !== val) {
          ary.push(this.selected_player_left_ids[i]);
        }
      }
    } else {
      let l = this.selected_player_right_ids.length;
      for (let i = 0; i < l; i++) {
        if (this.selected_player_right_ids[i] !== val) {
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
    this.displayTouchMap();
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

    this.displayTouchMap();
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

    this.displayTouchMap();
  }

  onMouseOver(ev: any, p: any, opt: any) {
    this.tip.name = p.name;
    this.tip.number = p.number;
    this.tip.position = p.position_type;
    if (opt === 'left') {
      this.tip.src = './assets/images/players/1/' + p.player_id + '.jpg';
    } else {
      this.tip.src = './assets/images/players/2/' + p.player_id + '.jpg';
    }
    this.tip.sub = p.is_sub;
    this.tip.x = ev.screenX + 30;
    this.tip.y = ev.screenY - 80;
    this.tip.class = '';
  }

  onMouseLeave() {
    this.tip.class = 'hidden';
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
    this.displayTouchMap();
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
