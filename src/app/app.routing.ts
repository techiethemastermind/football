import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { HomeComponent } from './content/home/home.component';
import { PbMovementComponent } from './content/pb-movement/pb-movement.component';
import { Chart1Component } from './content/chart1/chart1.component';
import { Chart2Component } from './content/chart2/chart2.component';
import { Chart3Component } from  './content/chart3/chart3.component';
import { Chart5Component } from  './content/chart5/chart5.component';
import { Chart6Component } from './content/chart6/chart6.component';
import { Chart7Component } from './content/chart7/chart7.component';
import { Chart8Component } from './content/chart8/chart8.component';

import { PbClubComponent } from './content/pb-club/pb-club.component';
import { Chart2ClubComponent } from './content/chart2-club/chart2-club.component';
import { Chart1ClubComponent } from './content/chart1-club/chart1-club.component';
import { Chart3ClubComponent } from './content/chart3-club/chart3-club.component';
import { Chart5ClubComponent } from './content/chart5-club/chart5-club.component';
import { Chart6ClubComponent } from './content/chart6-club/chart6-club.component';
import { Chart7ClubComponent } from './content/chart7-club/chart7-club.component';
import { Chart8ClubComponent } from './content/chart8-club/chart8-club.component';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'pb_movement/:mode', component: PbMovementComponent },
    { path: 'pb_club/:mode', component: PbClubComponent },
    { path: 'chart1/:mode', component: Chart1Component },
    { path: 'chart1_club/:mode', component: Chart1ClubComponent },
    { path: 'chart2/:mode', component: Chart2Component },
    { path: 'chart2_club/:mode', component: Chart2ClubComponent },
    { path: 'chart3/:mode', component: Chart3Component },
    { path: 'chart3_club/:mode', component: Chart3ClubComponent },
    { path: 'chart5/:mode', component: Chart5Component },
    { path: 'chart5_club/:mode', component: Chart5ClubComponent },
    { path: 'chart6/:mode', component: Chart6Component },
    { path: 'chart6_club/:mode', component: Chart6ClubComponent },
    { path: 'chart7/:mode', component: Chart7Component },
    { path: 'chart7_club/:mode', component: Chart7ClubComponent },
    { path: 'chart8/:mode', component: Chart8Component },
    { path: 'chart8_club/:mode', component: Chart8ClubComponent },
    { path: '',   redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' },
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})

export class AppRoutingModule {}
