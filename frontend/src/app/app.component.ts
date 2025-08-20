import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend-app';
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    // Verify auth status on app startup if token exists
    if (this.authService.getAccessToken()) {
      this.authService.verifyAuthStatus();
    }
  }
}
