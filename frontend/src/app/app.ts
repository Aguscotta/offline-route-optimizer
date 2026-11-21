import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteMapComponent } from './features/route-map/route-map.component';

@Component({
  imports: [RouteMapComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
