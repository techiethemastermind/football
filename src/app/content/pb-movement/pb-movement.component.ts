import { Component, ElementRef, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { GetdataService } from '../../services/getdata.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
    selector: 'app-pb-movement',
    templateUrl: './pb-movement.component.html',
    styleUrls: ['./pb-movement.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class PbMovementComponent implements AfterViewInit {
    private d3: D3;                   // D3 Object
    private parentNativeElement: any; // Selector parent for D3
    private timer: Observable<any>;   // Timer for Live mode (Real time)
    private sub: any;                 // Timer subscription
    data: any = {};                   // Data from server
    rData: any = {};                  // Data for Real Time Mode
    teams: any = [];                  // Teams from server
    players: any = {
        'left': [],
        'right': []
    };
    playersData: any;
    displayType: any;                 // Chart Mode: true - real time, false - normal
    displayTime: any = 0;            // Time frame: 0min - 90 min
    ratio_w: any = 800 / 100;         // Field ratio: width - 8
    ratio_h: any = 500 / 64;          // Field ratio; height - 7.81

    // Initial values
    selected_team = {
        'left': 1,
        'right': 2
    };
    send_data = {
        'time': '',
        'left': 0,
        'right': 1
    };
    textData1 = {
        'left': 50,
        'right': 50
    };
    textData2 = {
        'left': 30,
        'mid': 40,
        'right': 30
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

    temp = {
        'current': 0, // recoded second - realtime
        'livetime': '00 : 00 : 00',
        'gamepos': 'First Half',
        'current_t': 0  // temp t
    };

    playControl = 1;  // 0 stop, 1 start, 2 back;
    ctrlImageUrl = './assets/images/play_stop-50.png';

    colors = [
        { 'name': 'Red', 'value': '#f00' },
        { 'name': 'Blue', 'value': '#00f' },
        { 'name': 'Green', 'value': '#0f0' },
        { 'name': 'Black', 'value': '#000' },
        { 'name': 'White', 'value': '#fff' },
    ];

    selected_color = {
        'left': 'Red',
        'leftVal': '#f00',
        'right': 'Blue',
        'rightVal': '#00f',
        'left_font': 'White',
        'leftVal_font': '#fff',
        'right_font': 'White',
        'rightVal_font': '#fff'
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
            this.mobdevice = true;
            this.mobWidth = window.screen.width;
        } else {
            this.mobWidth = window.innerWidth;
            this.mobdevice = false;
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
        /* --- Get Mode --- */

        this.activatedRoute.params.subscribe((params: Params) => {
            let mode = params['mode'];
            if (mode === 'normal') {
                this.displayType = false;
            } else if (mode === 'live') {
                this.displayType = true;
            }
        });

        /* --- Get Initial Json Data From Service --- */

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
                this.send_data.time = this.displayTime;
                this.send_data.left = this.selected_team.left;
                this.send_data.right = this.selected_team.right;
                this.getDataService.getJSON_Param('graph1', 'team', this.selected_team)
                    .subscribe(
                    data => {
                        this.data = data;
                        if (this.displayType) {
                            this.playControl = 0;
                            this.ctrlRealTime();
                        } else {
                            this.displayGraph();
                            this.displayTextChart();
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

    /*--- Display Normal Graph -- */
    displayGraph() {
        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;

        if (this.parentNativeElement !== null) {
            d3parentElement = d3.select(this.parentNativeElement);

            /* ----- Team ------ */
            let vs_txt = this.teams[this.selected_team.left - 1].name + '  VS  ' + this.teams[this.selected_team.right - 1].name;
            d3parentElement.select('.vs-text')
                .text(function (vs_text: any = vs_txt) {
                    return vs_text;
                });
            let team_left = './assets/icons/' + this.selected_team.left + '.png';
            let team_right = './assets/icons/' + this.selected_team.right + '.png';
            d3parentElement.select('.team-left')
                .attr('xlink:href', function (img: any = team_left) {
                    return img;
                });
            d3parentElement.select('.team-right')
                .attr('xlink:href', function (img: any = team_right) {
                    return img;
                });

            /* ----- Scales ----- */

            let scale_x = d3.scaleLinear().domain([0, 100]).range([0, 780]);
            let scale_y = d3.scaleLinear().domain([0, 64]).range([0, 480]);

            /* ----- Ball postion ------ */

            let ball_pos = this.getBallPos(this.displayTime, this.data.ball[2].values);

            d3parentElement.select('.ball')
                .transition()
                .ease(d3.easeLinear)
                .duration(5000)
                .attr('x', function (d: any = ball_pos) {
                    return scale_x(d.x);
                })
                .attr('y', function (d: any = ball_pos) {
                    return scale_y(d.y);
                });


            /* ----- Player position displaying ------ */

            let playerPosData_left = this.data.player[0].values;
            let posData_1 = this.getPlayerPosition(this.displayTime, playerPosData_left, 'left');
            let pos = d3parentElement.select('.players_left');
            /*--- Enter --- */
            let player_group = pos.selectAll('g')
                .data(posData_1)
                .enter()
                .append('g')
                .attr('class', 'player');
            player_group
                .append('circle')
                .attr('r', 15)
                .attr('stroke', 'black')
                .attr('fill', this.selected_color.leftVal);
            player_group
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('stroke', 'none')
                .attr('font-size', '18px')
                .style('dominant-baseline', 'central')
                .text(function (d: any) {
                    return d.player_id;
                });
            player_group
                .attr('transform', function (d: any, i: any) {
                    let x = scale_x(d.x);
                    let y = scale_y(d.y);
                    if (d.is_sub === 1) {
                        x = -35;
                        y = i * 30;
                    }
                    let rlt = 'translate(' + x + ',' + y + ')';
                    return rlt;
                });

            /* --- Update -- */
            pos.selectAll('g')
                .data(posData_1)
                .transition()
                .ease(d3.easeLinear)
                .duration(5000)
                .attr('transform', function (d: any, i: any) {
                    let x = scale_x(d.x);
                    let y = scale_y(d.y);
                    if (d.is_sub === 1) {
                        x = -35;
                        y = i * 30;
                    }
                    let rlt = 'translate(' + x + ',' + y + ')';
                    return rlt;
                });

            player_group.exit().remove();
            player_group.on('mouseover', function (d: any, i: any) {
                let xPosition = scale_x(d.x) + 50;
                let yPosition = scale_y(d.y) - 10;
                if (d.is_sub === 1) {
                    xPosition = 0;
                    yPosition = i * 30;
                }
                let tooltip = d3parentElement.select('#tooltip');
                tooltip
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px')
                    .select('#name')
                    .text(d.name);
                tooltip.select('#number').text(d.player_id);
                tooltip.select('img')
                    .attr('src', './assets/images/players/1/' + d.player_id + '.jpg');
                tooltip.select('#pos').text(d.position_type);
                tooltip.select('#posx').text(Math.round(d.x));
                tooltip.select('#posy').text(Math.round(d.y));
                if (d.is_sub === 1) {
                    tooltip.select('#sub').text('Substitutes: Yes');
                } else {
                    tooltip.select('#sub').text('Substitutes: No');
                }
                tooltip
                    .classed('hidden', false);
            });
            player_group.on('mouseout', function (d: any) {
                d3parentElement.select(('#tooltip'))
                    .classed('hidden', true);
            });

            let playerPosData_right = this.data.player[1].values;
            let posData_2 = this.getPlayerPosition(this.displayTime, playerPosData_right, 'right');
            let pos_2 = d3parentElement.select('.players_right');

            let player_group_2 = pos_2.selectAll('g')
                .data(posData_2)
                .enter()
                .append('g');
            player_group_2
                .append('circle')
                .attr('r', 15)
                .attr('stroke', 'black')
                .attr('fill', this.selected_color.rightVal);
            player_group_2
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('stroke', 'none')
                .attr('font-size', '18px')
                .style('dominant-baseline', 'central')
                .text(function (d: any) {
                    return d.player_id;
                });
            player_group_2
                .attr('transform', function (d: any, i: any) {
                    let x = 760 - scale_x(d.x);
                    let y = scale_y(d.y);
                    if (d.is_sub === 1) {
                        x = 815;
                        y = i * 30;
                    }
                    let rlt = 'translate(' + x + ',' + y + ')';
                    return rlt;
                });
            /* --- Update -- */
            pos_2.selectAll('g')
                .data(posData_2)
                .transition()
                .ease(d3.easeLinear)
                .duration(5000)
                .attr('fill', this.selected_color.rightVal)
                .attr('transform', function (d: any, i: any) {
                    let x = 760 - scale_x(d.x);
                    let y = scale_y(d.y);
                    if (d.is_sub === 1) {
                        x = 815;
                        y = i * 30;
                    }
                    let rlt = 'translate(' + x + ',' + y + ')';
                    return rlt;
                });
            player_group.exit().remove();
            player_group_2.on('mouseover', function (d: any, i: any) {
                let xPosition = 760 - scale_x(d.x) + 50;
                let yPosition = scale_y(d.y) - 10;
                if (d.is_sub === 1) {
                    xPosition = 870;
                    yPosition = i * 30;
                }
                let tooltip = d3parentElement.select('#tooltip');
                tooltip.style('left', xPosition + 'px')
                    .style('top', yPosition + 'px')
                    .select('#name')
                    .text(d.name);
                tooltip.select('#number')
                    .text(d.player_id);
                tooltip.select('img')
                    .attr('src', './assets/images/players/2/' + d.player_id + '.jpg');
                tooltip.select('#pos').text(d.position_type);
                tooltip.select('#posx').text(Math.round(d.x));
                tooltip.select('#posy').text(Math.round(d.y));
                if (d.is_sub === 1) {
                    tooltip.select('#sub').text('Substitutes: Yes');
                } else {
                    tooltip.select('#sub').text('Substitutes: No');
                }
                tooltip.classed('hidden', false);
            });
            player_group_2.on('mouseout', function (d: any) {
                d3parentElement.select(('#tooltip'))
                    .classed('hidden', true);
            });
        }
        this.changeViewPort(this.mobWidth);
    }

    changeViewPort(viewWidth: any) {

        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;
        d3parentElement = d3.select(this.parentNativeElement);

        let screen_width = viewWidth;

        if (screen_width < 900) {
            let screen_ratio = screen_width / 900;
            let trans_x = 50 * screen_ratio;
            let trans_y = 25 * screen_ratio;

            d3parentElement.select('#football-yard')
                .attr('width', screen_width)
                .attr('height', 550 * screen_ratio);

            d3parentElement.select('.yard')
                .attr('transform', 'translate(' + trans_x + ', ' + trans_y + ') scale(' + screen_ratio + ')');

            d3parentElement.select('#football-bar')
                .attr('width', screen_width);

            d3parentElement.select('.bar-1')
                .attr('transform', 'translate(' + trans_x + ', ' + 0 + ') scale(' + screen_ratio + ')');

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
        } else {
            d3parentElement.select('#football-yard')
                .attr('width', 900)
                .attr('height', 500);

            d3parentElement.select('.yard')
                .attr('transform', 'translate(50, 0) scale(1)');

            d3parentElement.select('#football-bar')
                .attr('width', 900);

            d3parentElement.select('.bar-1')
                .attr('transform', 'translate(50, 0) scale(1)');
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

    displayTextChart() {
        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;

        if (this.parentNativeElement !== null) {
            d3parentElement = d3.select(this.parentNativeElement);

            /* ----- bottom bar graph displaying ------ */

            let displayBarData = this.data.ball[0].values;

            let bar = d3parentElement.select('.bar-1');

            /* ----- updating text-bar ----- */
            bar.select('.left-bar')
                .transition()
                .duration(3000)
                .attr('width', this.getBarData(this.displayTime, displayBarData, 0));
            bar.select('.right-bar')
                .transition()
                .duration(3000)
                .attr('width', this.getBarData(this.displayTime, displayBarData, 1))
                .attr('x', this.getBarData(this.displayTime, displayBarData, 0));
            bar.select('.left-txt')
                .transition()
                .duration(3000)
                .attr('x', this.getBarData(this.displayTime, displayBarData, 0) / 2)
                .text(this.getBarData(this.displayTime, displayBarData, 2) + '%');
            bar.select('.right-txt')
                .transition()
                .duration(3000)
                .attr('x', this.getBarData(this.displayTime, displayBarData, 0) +
                this.getBarData(this.displayTime, displayBarData, 1) / 2)
                .text(this.getBarData(this.displayTime, displayBarData, 3) + '%');

            /* ----- ball position text displaying ------ */

            let displayTxtdata = this.data.ball[1].values;
            let txt = d3parentElement.select('.txt-1');
            txt.select('.f1-txt')
                .text(this.getTxtData(this.displayTime, displayTxtdata, 0) + '%');
            txt.select('.f2-txt')
                .text(this.getTxtData(this.displayTime, displayTxtdata, 1) + '%');
            txt.select('.fm-txt')
                .text(this.getTxtData(this.displayTime, displayTxtdata, 2) + '%');
        }
    }

    /* --- Get Normal Player Position  --- */

    getPlayerPosition(time: any, data: any, opt: any) {
        for (let d of data) {
            if (d.time === Number(time)) {
                let old_d = d.values;
                let new_d = old_d;
                for (let i = 0; i < 14; i++) {
                    let old_x = old_d[i].x;
                    let old_y = old_d[i].y;
                    let rand_x = Math.random() * 20 - 10 + old_x;
                    let rand_y = Math.random() * 20 - 10 + old_y;
                    if (rand_x < 2) {
                        rand_x = 2;
                    } else if (rand_x > 90) {
                        rand_x = 90;
                    }
                    if (rand_y < 2) {
                        rand_y = 2;
                    } else if (rand_y > 55) {
                        rand_y = 55;
                    }
                    new_d[i].x = old_x;
                    new_d[i].y = old_y;
                    if (opt === 'left') {
                        new_d[i].name = this.players.left[i].name;
                    } else {
                        new_d[i].name = this.players.right[i].name;
                    }
                }
                return new_d;
            }
        }
    }

    // Get Normal Ball Position
    getBallPos(time: any, data: any) {
        for (let w of data) {
            if (w.time === Number(time)) {
                return w;
            }
        }
    }

    getBarData(time: any, data: any, option: any) {
        for (let w of data) {
            if (w.time === Number(time)) {
                if (option === 0) {
                    return w.value * this.ratio_w;
                } else if (option === 1) {
                    return 800 - (w.value * this.ratio_w);
                } else if (option === 2) {
                    return w.value;
                } else if (option === 3) {
                    return 100 - w.value;
                }
            }
        }
    }

    getTxtData(time: any, data: any, option: any) {
        for (let d of data) {
            if (d.time === Number(time)) {
                if (option === 0) {
                    return d.f1;
                } else if (option === 1) {
                    return d.f2;
                } else if (option === 2) {
                    return 100 - d.f1 - d.f2;
                }
            }
        }
    }

    onChangeSlider(ev: any) {
        if (Number(ev) === 0) {
            this.displayTime = 90;
        }
        if (!this.displayType) {
            this.displayGraph();
        }
    }

    onClick(option: any) {
        if (option === 0) {
            this.displayTime = 90;
        } else if (option === 1) {
            this.displayTime = 45;
        }
        if (!this.displayType) {
            this.displayGraph();
        }
    }

    sliderInit() {
        this.sliderFirstValue = 0;
        this.sliderFirstLeft = 0;
        this.sliderSecondValue = 0;
        this.sliderSecondLeft = 0;
        this.sliderSecondLeft = 0;
        this.temp.livetime = '00 : 00 : 00';
    }

    onSelectionChanged(et: any, type: any) {
        if (type === 0 && et === 'on') {
            this.sub.unsubscribe();
            this.sliderFirstExtra = 3;
            this.sliderSecondExtra = 6;
            this.sliderInit();
            this.displayType = false;
            this.playControl = 1;
        } else {
            this.sliderFirstExtra = 0;
            this.sliderSecondExtra = 0;
            this.displayType = true;
            this.sub = this.timer.subscribe(t => this.getRealTime(t));
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

    onChangeTeam(opt: any) {
        this.playControl = 0;
        this.sliderFirstValue = 0;
        this.sliderFirstLeft = 0;
        this.sliderSecondValue = 0;
        this.sliderSecondLeft = 0;
        let pk_l = this.teams[this.selected_team.left - 1].key;
        let pk_r = this.teams[this.selected_team.right - 1].key;
        this.players.left = this.playersData[pk_l];
        this.players.right = this.playersData[pk_r];
        this.displayGraph();
        if (this.displayType) {
            this.sub.unsubscribe();
        }
        this.temp.current = 0;
        this.temp.livetime = '00 : 00 : 00';
    }

    onChangeColor(opt: any) {

        for (let v of this.colors) {
            if (opt === 'left') {
                if (v.name === this.selected_color.left) {
                    this.selected_color.leftVal = v.value;
                }
            } else if (opt === 'right') {
                if (v.name === this.selected_color.right) {
                    this.selected_color.rightVal = v.value;
                }
            } else if (opt === 'leftFont') {
                if (v.name === this.selected_color.left_font) {
                    this.selected_color.leftVal_font = v.value;
                }
            } else if (opt === 'rightFont') {
                if (v.name === this.selected_color.right_font) {
                    this.selected_color.rightVal_font = v.value;
                }
            }
        }
        let d3 = this.d3;
        let d3parentElement: Selection<any, any, any, any>;

        if (this.parentNativeElement !== null) {
            d3parentElement = d3.select(this.parentNativeElement);
            d3parentElement.select('.players_left').selectAll('circle')
                .attr('fill', this.selected_color.leftVal);

            d3parentElement.select('.players_right').selectAll('circle')
                .attr('fill', this.selected_color.rightVal);

            d3parentElement.select('.players_left').selectAll('text')
                .attr('fill', this.selected_color.leftVal_font);

            d3parentElement.select('.players_right').selectAll('text')
                .attr('fill', this.selected_color.rightVal_font);
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
            this.sliderFirstLeft = this.sliderWidth;
            this.sliderFirstValue = 45 + this.sliderFirstExtra;
            this.sliderSecondLeft = Math.floor(((t - 2700) % 3600) / 60) * this.secondsliderRatio;
            this.sliderSecondValue = Math.floor(((t - 2700) % 3600) / 60);
        }

        if ((tick % 5) === 0) {
            this.displayTime = tick % 95;
            this.displayGraph();
        }
        if ((tick % 15) === 0) {
            this.displayTextChart();
        }
    }

    onSliderClick(ev: any, opt: any) {
        let startpoint = 20;

        if (opt === 'first') {
            if (this.mobWidth > 800) {
                startpoint = (this.mobWidth - 800) / 2 + 12;
            }

            this.sliderFirstDiff = startpoint;
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
            if (this.sliderFirstValue === 0) {
                this.displayTime = 0;
            } else {
                this.displayTime = (this.sliderFirstValue * 5) % 95;

                if (this.displayTime === 0) {
                    this.displayTime = 5;
                }
            }
            this.sliderSecondLeft = 0;
            this.sliderSecondValue = 0;
            this.makeTimeStr(this.sliderFirstValue * 60);
        } else {
            if (this.mobWidth > 800) {
                startpoint = (this.mobWidth - 800) / 2 + 12 + 400;
            }
            this.sliderSecondDiff = startpoint;
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
            this.displayTime = (this.sliderSecondValue * 5) % 95;
            if (this.displayTime === 0) {
                this.displayTime = 5;
            }
            this.sliderFirstValue = 45 + this.sliderFirstExtra;
            this.sliderFirstLeft = this.sliderWidth;
            this.makeTimeStr((this.sliderSecondValue + this.sliderFirstValue) * 60);
        }

        this.displayGraph();
        this.displayTextChart();
    }

    onmousedown(ev: any, opt: any) {
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

    onmouseup(ev: any, opt: any) {
        this.sliderStart = 0;
        if (opt === 'first') {
            if (this.sliderFirstValue === 0) {
                this.displayTime = 0;
            } else {
                this.displayTime = (this.sliderFirstValue * 5) % 95;

                if (this.displayTime === 0) {
                    this.displayTime = 5;
                }
            }

            this.sliderSecondLeft = 0;
            this.sliderSecondValue = 0;
            this.makeTimeStr(this.sliderFirstValue * 60);
        } else {
            this.displayTime = (this.sliderSecondValue * 5) % 95;
            if (this.displayTime === 0) {
                this.displayTime = 5;
            }
            this.sliderFirstValue = 45 + this.sliderFirstExtra;
            this.sliderFirstLeft = this.sliderWidth;
            this.makeTimeStr((this.sliderFirstValue + this.sliderSecondValue) * 60);
        }
        this.displayGraph();
        this.displayTextChart();
    }

    onmousemove(ev: any) {
        if (!this.displayType) {
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
        } else {
            if (this.sliderStart === 1 && this.temp.current < 2700) {
                this.sliderFirstLeft = ev.x - this.sliderFirstDiff;
                this.sliderFirstValue = Math.round(this.sliderFirstLeft / this.firstSliderRatio);
                if (this.sliderFirstLeft < 0) {
                    this.sliderFirstLeft = 0;
                    this.sliderStart = 0;
                    this.sliderFirstValue = 0;
                } else if (this.sliderFirstLeft > this.sliderFirstDiff) {
                    this.sliderFirstLeft = this.sliderFirstDiff;
                    this.sliderStart = 0;
                    this.sliderFirstValue = Math.round(this.sliderFirstLeft / this.firstSliderRatio);
                }
            } else if (this.sliderStart === 2 && this.temp.current > 2700) {
                this.sliderSecondLeft = ev.x - this.sliderSecondDiff;
                this.sliderSecondValue = Math.round(this.sliderSecondLeft / this.secondsliderRatio);
                if (this.sliderSecondLeft < 0) {
                    this.sliderSecondLeft = 0;
                    this.sliderStart = 0;
                    this.sliderSecondValue = 0;
                } else if (this.sliderSecondLeft > (this.sliderSecondDiff - 420)) {
                    this.sliderSecondLeft = this.sliderSecondDiff - 420;
                    this.sliderStart = 0;
                    this.sliderSecondValue = Math.round(this.sliderSecondLeft / this.secondsliderRatio);
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
        } else if (opt === 'First') {
            this.displayTime = 45;
            this.sliderFirstLeft = 360;
            this.sliderFirstValue = 45;
            this.sliderSecondLeft = 0;
            this.sliderSecondValue = 0;
        } else {
            this.displayTime = 45;
            this.sliderFirstLeft = 0;
            this.sliderFirstValue = 0;
            this.sliderSecondLeft = 360;
            this.sliderSecondValue = 45;
        }
        this.displayGraph();
    }

    ngOnDestroy() {
        this.displayType = false; // switches your IntervalObservable off
    }
}
