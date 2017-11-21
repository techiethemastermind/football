import { Component, ElementRef, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart7-club',
  templateUrl: './chart7-club.component.html',
  styleUrls: ['./chart7-club.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart7ClubComponent implements AfterViewInit {

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

  selected_player = {
    'left': 0,
    'lchk': true,
    'right': 1,
    'rchk': false
  };
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
    'class': 'hidden',
    'arrow': 'arrow-right'
  };

  control = {
    color: {
      'completed': '#ff0',
      'failed': '#f00',
      'key_passes': '#0f0',
      'long_ball': '#00f',
      'headed': '#0ff',
      'through': '#8a2be2',
      'other': '#000'
    },
    selected: {
      'completed': 'active',
      'failed': 'active',
      'key_passes': '',
      'long_ball': '',
      'headed': '',
      'through': '',
      'other': ''
    }
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
      d3parentElement.select('svg > g')
        .attr('transform', 'scale(' + screen_ratio + ')');

      d3parentElement.select('.chart7')
        .style('height', 700 * screen_ratio + 10 + 'px');
    } else {
      d3parentElement.selectAll('svg')
        .attr('width', 500)
        .attr('height', 700);

      d3parentElement.selectAll('svg > g')
        .attr('transform', 'scale(1)');

      d3parentElement.select('.chart7')
        .style('height', '710px');
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

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
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
    this.getDataService.getClubJSON_Data('chart7_club')
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
    this.timer = Observable.interval(1000);
  }

  displayChart() {
    let d3 = this.d3;
    let d3parentElement: Selection<any, any, any, any>;

    if (this.parentNativeElement !== null) {

      d3parentElement = d3.select(this.parentNativeElement);
      let scale_x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 680]);

      let scale_y = d3.scaleLinear()
        .domain([0, 64])
        .range([0, 470]);

      let showData_left = this.makeDisplayData('left');
      let pos_left = d3parentElement.select('.chart7-left');

      /*--- Enter --- */
      let group_left = pos_left.selectAll('g')
        .data(showData_left)
        .enter()
        .append('g')
        .attr('class', 'touch-item');
      group_left
        .append('line')
        .attrs({
          'x1': 0,
          'y1': 0,
          'x2': function (d: any) {
            return d.x2;
          },
          'y2': function (d: any) {
            return d.y2;
          },
          'stroke': function (d: any) {
            return d.line_color;
          }
        })
        .style('marker-end', function (d: any) {
          return 'url(#' + d.arrow + ')';
        });
      group_left
        .append('circle')
        .attr('r', 10)
        .attr('stroke-width', 2)
        .attr('fill', 'red');
      group_left
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('stroke', 'none')
        .attr('fill', '#fff')
        .attr('font-size', '14px')
        .style('dominant-baseline', 'central')
        .style('font-weight', 400)
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
      pos_left.selectAll('line').data(showData_left)
        .attr('x2', function (d: any) {
          return d.x2;
        })
        .attr('y2', function (d: any) {
          return d.y2;
        })
        .attr('stroke', function (d: any) {
          return d.line_color;
        })
        .style('marker-end', function (d: any) {
          return 'url(#' + d.arrow + ')';
        });
      pos_left.selectAll('text').data(showData_left)
        .text(function (d: any) {
          return d.id;
        });

      let showData_right = this.makeDisplayData('right');
      let pos_right = d3parentElement.select('.chart7-right');

      /*--- Enter --- */
      let group_right = pos_right.selectAll('g')
        .data(showData_right)
        .enter()
        .append('g')
        .attr('class', 'touch-item');
      group_right
        .append('line')
        .attrs({
          'x1': 0,
          'y1': 0,
          'x2': function (d: any) {
            return d.x2;
          },
          'y2': function (d: any) {
            return d.y2;
          },
          'stroke': function (d: any) {
            return d.line_color;
          }
        })
        .style('marker-end', function (d: any) {
          return 'url(#' + d.arrow + ')';
        });
      group_right
        .append('circle')
        .attr('r', 10)
        .attr('stroke-width', 2)
        .attr('fill', 'blue');
      group_right
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('stroke', 'none')
        .attr('fill', '#fff')
        .attr('font-size', '14px')
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
      pos_right.selectAll('line').data(showData_right)
        .attr('x2', function (d: any) {
          return d.x2;
        })
        .attr('y2', function (d: any) {
          return d.y2;
        })
        .attr('stroke', function (d: any) {
          return d.line_color;
        })
        .style('marker-end', function (d: any) {
          return 'url(#' + d.arrow + ')';
        });
      pos_right.selectAll('text').data(showData_right)
        .text(function (d: any) {
          return d.id;
        });

      this.changeViewPort(this.mobWidth - 24);
    }
  }

  makeDisplayData(side: any) {
    let rlt: any = [];
    if (side === 'left' && this.selected_player.lchk) {
      let data_rlt = this.makePosData(this.selected_player.left, 'left');
      rlt = rlt.concat(data_rlt);
    } else if (side === 'right' && this.selected_player.rchk) {
      let data_rlt = this.makePosData(this.selected_player.right, 'right');
      rlt = rlt.concat(data_rlt);
    }
    return rlt;
  }

  makePosData(id: any, side: string) {
    /* let val = data.value; // count of players position */
    let data = this.data.values;
    let data_points: any = [];
    let d3 = this.d3;
    let scale_x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, 680]);

    let scale_y = d3.scaleLinear()
      .domain([0, 64])
      .range([0, 470]);

    for (let d of data) {
      if (Number(d.time) <= Number(this.displayTime) && Number(this.displayTime) !== 0) {
        let ds = d.values[id].values;
        let player_id = d.values[id].player_id;
        for (let dv of ds) {
          /*let x2 = Math.random() * 100;
          let xd = scale_x(x2) - scale_x(dv.x);
          if (side === 'right') {
            xd = scale_x(x2) - (700 - scale_x(dv.x));
          }
          let y2 = Math.random() * 64;
          let yd = scale_y(y2) - scale_y(dv.y);
          if (side === 'right') {
            yd = scale_y(y2) - (500 - scale_x(dv.y));
          }
          let rand_cl = Math.floor(Math.random() * cl);
          let rand_color = ac[rand_cl];
          let arrow = arc[rand_cl];
          let point = { 'id': player_id, 'x': dv.x, 'y': dv.y, 'x2': yd, 'y2': xd, 'line_color': rand_color, 'arrow': arrow };
          data_points.push(point);*/
          let line_color = '';
          let arrow = '';
          let xd = scale_x(dv.x2) - scale_x(dv.x);
          let yd = scale_y(dv.y2) - scale_y(dv.y);
          let point: any;
          if (side === 'right') {
            xd = scale_x(dv.x2) - (660 - scale_x(dv.x));
            yd = scale_y(dv.y2) - (460 - scale_x(dv.y));
          }
          if (dv.rlt === 0 && this.control.selected.completed === 'active') {
            line_color = '#ff0';
            arrow = 'markerArrow_completed';
            point = { 'id': player_id, 'x': dv.x, 'y': dv.y, 'x2': yd, 'y2': xd, 'line_color': line_color, 'arrow': arrow };
            data_points.push(point);
          } else if (dv.rlt === 1 && this.control.selected.failed === 'active') {
            line_color = '#f00';
            arrow = 'markerArrow_failed';
            point = { 'id': player_id, 'x': dv.x, 'y': dv.y, 'x2': yd, 'y2': xd, 'line_color': line_color, 'arrow': arrow };
            data_points.push(point);
          }
        }
      }
    }

    return data_points;
  }

  onClickControl(opt: any) {

    if (opt === 'completed') {
      this.control.selected.completed === 'active' ? this.control.selected.completed = '' : this.control.selected.completed = 'active';
    } else if (opt === 'failed') {
      this.control.selected.failed === 'active' ? this.control.selected.failed = '' : this.control.selected.failed = 'active';
    } else if (opt === 'key_passes') {
      this.control.selected.key_passes === 'active' ? this.control.selected.key_passes = '' : this.control.selected.key_passes = 'active';
    } else if (opt === 'long_ball') {
      this.control.selected.long_ball === 'active' ? this.control.selected.long_ball = '' : this.control.selected.long_ball = 'active';
    } else if (opt === 'headed') {
      this.control.selected.headed === 'active' ? this.control.selected.headed = '' : this.control.selected.headed = 'active';
    } else if (opt === 'through') {
      this.control.selected.through === 'active' ? this.control.selected.through = '' : this.control.selected.through = 'active';
    } else if (opt === 'other') {
      this.control.selected.other === 'active' ? this.control.selected.other = '' : this.control.selected.other = 'active';
    }
    this.displayChart();
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
      this.displayTime = (Math.round(t / 15) * 5) % 90;
      this.displayChart();
    }
  }

  blackColor(i: any, opt: any) {
    if (opt === 'left') {
      if (this.selected_player.left === i && this.selected_player.lchk) {
        return '#00547e';
      } else {
        return '';
      }
    } else {
      if (this.selected_player.right === i && this.selected_player.rchk) {
        return '#00547e';
      } else {
        return '';
      }
    }
  }

  onClickPlayer(p: any, i: any, opt: any) {

    if (opt === 'left') {
      this.selected_player.left = i;
      this.selected_player.lchk = true;
      this.selected_player.rchk = false;
    } else {
      this.selected_player.right = i;
      this.selected_player.rchk = true;
      this.selected_player.lchk = false;
    }

    this.displayChart();
  }

  onMouseOver(ev: any, p: any, opt: any) {
    this.tip.name = p.name;
    this.tip.number = p.number;
    this.tip.position = p.position_type;
    if (opt === 'left') {
      this.tip.arrow = 'arrow-right';
      this.tip.x = -160;
    } else {
      this.tip.x = 920;
      this.tip.arrow = 'arrow-left';
    }
    this.tip.y = ev.target.offsetTop - 15;
    this.tip.class = '';
  }

  onMouseLeave() {
    this.tip.class = 'hidden';
  }

  onChangeTeam(opt: any) {
    this.sliderFirstValue = 0;
    this.sliderFirstLeft = 0;
    this.sliderSecondValue = 0;
    this.sliderSecondLeft = 0;
    let pk_l = this.teams[this.selected_team.left - 1].key;
    let pk_r = this.teams[this.selected_team.right - 1].key;
    this.players.left = this.playersData[pk_l];
    this.players.right = this.playersData[pk_r];
  }

  onClick(ev: any, opt: any) {
    let startpoint = 40;

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
      this.displayTime = Math.round(this.sliderFirstValue / 5) * 5;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
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
      this.displayTime = Math.round(this.sliderSecondValue / 5) * 5 + 45;
      if (this.displayTime > 90) {
        this.displayTime = 90;
      }
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.sliderFirstLeft = this.sliderWidth;
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

  onMouseUp(ev: any, opt: any) {
    this.sliderStart = 0;
    if (opt === 'first') {
      this.displayTime = Math.round(this.sliderFirstValue / 5) * 5;
      this.sliderSecondLeft = 0;
      this.sliderSecondValue = 0;
    } else {
      this.displayTime = Math.round(this.sliderSecondValue / 5) * 5 + 45;
      if (this.displayTime > 90) {
        this.displayTime = 90;
      }
      this.sliderFirstValue = 45 + this.sliderFirstExtra;
      this.sliderFirstLeft = 360;
    }

    this.displayChart();
  }

  onMouseMove(ev: any) {
    if (this.sliderStart === 1) {
      this.sliderFirstLeft = ev.x - this.sliderFirstDiff;
      this.sliderFirstValue = Math.round(this.sliderFirstLeft / this.firstSliderRatio);
      if (this.sliderFirstLeft < 0) {
        this.sliderFirstLeft = 0;
        this.sliderStart = 0;
        this.sliderFirstValue = 0;
      } else if (this.sliderFirstLeft > 360) {
        this.sliderFirstLeft = 360;
        this.sliderStart = 0;
        this.sliderFirstValue = 360 / this.firstSliderRatio;
      }
    } else if (this.sliderStart === 2) {
      this.sliderSecondLeft = ev.x - this.sliderSecondDiff;
      this.sliderSecondValue = Math.round(this.sliderSecondLeft / this.secondsliderRatio);
      if (this.sliderSecondLeft < 0) {
        this.sliderSecondLeft = 0;
        this.sliderStart = 0;
        this.sliderSecondValue = 0;
      } else if (this.sliderSecondLeft > 360) {
        this.sliderSecondLeft = 360;
        this.sliderStart = 0;
        this.sliderSecondValue = 360 / this.secondsliderRatio;
      }
    }
  }
}
