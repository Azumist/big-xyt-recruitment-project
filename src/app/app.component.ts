import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderBookComponent } from './order-book/order-book.component';
import { data } from './data';

@Component({
  selector: 'app-root',
  imports: [OrderBookComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'big-xyt-recruitment-project';

  orderBookData: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // TODO: http service functionality for loading data from json
    this.orderBookData = data;
  }
}
