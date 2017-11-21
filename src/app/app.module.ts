import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';

/* ===== Import Services ===== */
import { D3Service } from 'd3-ng2-service';
import { GetdataService } from './services/getdata.service';
import { AuthService } from './services/auth.service';

/* ===== Import components ===== */
import { MatchStComponent } from './match-st/match-st.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CompPlayerComponent } from './content/comp-player/comp-player.component';
import { PbMovementComponent } from './content/pb-movement/pb-movement.component';
import { Chart2Component } from './content/chart2/chart2.component';
import { HomeComponent } from './content/home/home.component';
import { Chart3Component } from './content/chart3/chart3.component';
import { Chart1Component } from './content/chart1/chart1.component';
import { PbClubComponent } from './content/pb-club/pb-club.component';
import { Chart2ClubComponent } from './content/chart2-club/chart2-club.component';
import { Chart1ClubComponent } from './content/chart1-club/chart1-club.component';
import { Chart3ClubComponent } from './content/chart3-club/chart3-club.component';
import { Chart5Component } from './content/chart5/chart5.component';
import { Chart5ClubComponent } from './content/chart5-club/chart5-club.component';
import { LoginComponent } from './login/login.component';
import { Chart6Component } from './content/chart6/chart6.component';
import { Chart6ClubComponent } from './content/chart6-club/chart6-club.component';
import { Chart7Component } from './content/chart7/chart7.component';
import { Chart7ClubComponent } from './content/chart7-club/chart7-club.component';
import { Chart8Component } from './content/chart8/chart8.component';
import { Chart8ClubComponent } from './content/chart8-club/chart8-club.component';

@NgModule({
  declarations: [
    AppComponent,
    MatchStComponent,
    HeaderComponent,
    FooterComponent,
    CompPlayerComponent,
    PbMovementComponent,
    Chart2Component,
    HomeComponent,
    Chart3Component,
    Chart1Component,
    PbClubComponent,
    Chart2ClubComponent,
    Chart1ClubComponent,
    Chart3ClubComponent,
    Chart5Component,
    Chart5ClubComponent,
    LoginComponent,
    Chart6Component,
    Chart6ClubComponent,
    Chart7Component,
    Chart7ClubComponent,
    Chart8Component,
    Chart8ClubComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule
  ],
  providers: [ D3Service, GetdataService, AuthService, {provide: LocationStrategy, useClass: HashLocationStrategy} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
