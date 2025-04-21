import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderBookComponent } from './order-book/order-book.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [OrderBookComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  orderBookData: any[] = [];
  isError = false;
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:4200/sample.json').subscribe({
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
