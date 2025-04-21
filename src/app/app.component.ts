import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderBookComponent } from './order-book/order-book.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  imports: [OrderBookComponent, CommonModule, MatProgressSpinnerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  orderBookData: any[] = [];
  isError = false;
  isLoading = true;

  private jsonUrl = `${window.location.origin}/sample.json`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(this.jsonUrl).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.orderBookData = res as any;
      },
      error: (_err) => {
        this.isLoading = false;
        this.isError = true;
      }
    });
  }
}
