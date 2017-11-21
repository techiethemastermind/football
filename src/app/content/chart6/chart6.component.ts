import { Component, ElementRef, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-chart6',
  templateUrl: './chart6.component.html',
  styleUrls: ['./chart6.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class Chart6Component implements AfterViewInit {

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
    'lname': 'Preston Edwards',
    'right': 1,
    'rname': 'Dumebi Dumaka'
  };

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

  radarChartLabels = ['INTERCEPTIONS', '', 'GOALS', '', 'ASSISTS', '', 'PASS COMPLETION', '', 'TACKELS WON', ''];

  radarChartData: any = [
    { data: [65, 59, 90, 81, 56, 55, 40, 39, 57, 82], label: 'Preston Edwards' },
    { data: [28, 48, 40, 19, 96, 27, 48, 62, 36, 100], label: 'Dumebi Dumaka' }
  ];

  radarChartOptions = {
    legend: {
      labels: {
        fontColor: 'black',
        fontSize: 16
      }
    },
    scale: {
      display: true
    }
  };

  radarChartType: string = 'radar';

  constructor(
    element: ElementRef,
    d3Service: D3Service,
    private getDataService: GetdataService,
    private activatedRoute: ActivatedRoute) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
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
    this.getDataService.getJSON('team')
      .subscribe(
      data_team => {

        // set teams array
        this.teams = data_team.team.values;

        // set players
        this.getDataService.getJSON_Param('players', 'player', this.selected_team)
          .subscribe(
          data => {
            this.playersData = data;
            let pk_l = this.teams[this.selected_team.left - 1].key;
            let pk_r = this.teams[this.selected_team.right - 1].key;
            this.players.left = this.playersData[pk_l];
            this.players.right = this.playersData[pk_r];
          },
          err => {
            console.log(err);
          }
          );

        // Set Initial Match team
        this.getDataService.getJSON_Param('chart6', 'chart6', this.selected_team)
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
    let data = this.data.values;
    let rada = this.radarChartData;
    for (let ds of data) {
      if (ds.time === (this.displayTime % 45)) {
        let dt = ds.values;
        for (let d of dt) {
          let lp_num = this.selected_player.left + 1;
          let rp_num = this.selected_player.right + 1;
          if (Number(d.player_id) === Number(lp_num) || Number(d.player_id) === Number(rp_num)) {
            let lt_randar: any;
            let rt_randar: any;
            let max = d3.max(d.values);
            let scaleY = d3.scaleLinear().domain([0, Number(max)]).range([10, 100]);
            if (Number(d.player_id) === Number(lp_num)) {
              let lt_dt = d.values;
              let lt_data = [
                scaleY(lt_dt[0]),
                scaleY((lt_dt[0] + lt_dt[1]) / 2),
                scaleY(lt_dt[1]),
                scaleY((lt_dt[1] + lt_dt[2]) / 2),
                scaleY(lt_dt[2]),
                scaleY((lt_dt[2] + lt_dt[3]) / 2),
                scaleY(lt_dt[3]),
                scaleY((lt_dt[3] + lt_dt[4]) / 2),
                scaleY(lt_dt[4]),
                scaleY((lt_dt[4] + lt_dt[0]) / 2)
              ];
              lt_randar = { data: lt_data, label: this.selected_player.lname };
              rada[0] = lt_randar;
            }
            if (Number(d.player_id) === Number(rp_num)) {
              let rt_dt = d.values;
              let rt_data = [
                scaleY(rt_dt[1]),
                scaleY((rt_dt[1] + rt_dt[2]) / 2),
                scaleY(rt_dt[2]),
                scaleY((rt_dt[2] + rt_dt[3]) / 2),
                scaleY(rt_dt[3]),
                scaleY((rt_dt[3] + rt_dt[4]) / 2),
                scaleY(rt_dt[4]),
                scaleY((rt_dt[4] + rt_dt[5]) / 2),
                scaleY(rt_dt[5]),
                scaleY((rt_dt[5] + rt_dt[0]) / 2)
              ];
              rt_randar = { data: rt_data, label: this.selected_player.rname };
              rada[1] = rt_randar;
            }
          }
        }
        this.radarChartData = [
          rada[0],
          rada[1]
        ];
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
      if (this.selected_player.left === i) {
        return '#00547e';
      } else {
        return '';
      }
    } else {
      if (this.selected_player.right === i) {
        return '#00547e';
      } else {
        return '';
      }
    }
  }

  onClickPlayer(p: any, i: any, opt: any) {

    if (opt === 'left') {
      this.selected_player.left = i;
      this.selected_player.lname = p.name;
    } else {
      this.selected_player.right = i;
      this.selected_player.rname = p.name;
    }

    this.displayChart();
    /*
    let old = this.radarChartData;
    
    if (opt === 'left') {
      old[0].label = p.name;
      for (let j = 0; j < 10; j++) {
        old[0].data[j] = Math.floor(Math.random() * 100);
      }
      this.selected_player.left = i;
    } else {
      old[1].label = p.name;
      for (let j = 0; j < 10; j++) {
        old[1].data[j] = Math.floor(Math.random() * 100);
      }
      this.selected_player.right = i;
    }

    this.radarChartData = [
      old[0],
      old[1]
    ];*/
  }

  onMouseOver(ev: any, p: any, opt: any) {
    this.tip.name = p.name;
    this.tip.number = p.number;
    this.tip.position = p.position_type;
    if (opt === 'left') {
      this.tip.src = './assets/images/players/1/' + p.player_id + '.jpg';
      this.tip.arrow = 'arrow-right';
      this.tip.x = -160;
    } else {
      this.tip.src = './assets/images/players/2/' + p.player_id + '.jpg';
      this.tip.x = 1020;
      this.tip.arrow = 'arrow-left';
    }
    this.tip.sub = p.is_sub;
    this.tip.y = ev.target.offsetTop - 30;
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
