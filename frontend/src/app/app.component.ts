import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { SocketService } from './shared/services/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend-app';
  
  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}
  
  ngOnInit(): void {
    // Verify auth status on app startup if token exists
    if (this.authService.getAccessToken()) {
      this.authService.verifyAuthStatus();
    }

    // Connect to WebSocket when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('User authenticated, connecting to WebSocket');
        this.socketService.connect();
      } else {
        console.log('User not authenticated, disconnecting WebSocket');
        this.socketService.disconnect();
      }
    });
  }
}
