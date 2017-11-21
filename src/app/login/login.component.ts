import { Component, OnInit } from '@angular/core';
import {AuthService, User} from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public user = new User('', '');
  public errorMsg = '';

  constructor(private _service: AuthService) {}

  ngOnInit() {
  }

  login() {
    if (!this._service.login(this.user)) {
      this.errorMsg = 'Failed to login';
    }
  }

}
