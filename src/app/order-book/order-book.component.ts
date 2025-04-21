import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import { OrderBookData } from '@interfaces/order-book-data.interface';
import { OrderEntry } from '@interfaces/order-entry.interface';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-order-book',
  imports: [CommonModule, FormsModule, MatSliderModule, MatButtonModule],
  templateUrl: './order-book.component.html',
  styleUrl: './order-book.component.css'
})
export class OrderBookComponent implements OnInit, OnChanges {
  @ViewChild('chartContainer', { static: true }) 
  private chartContainer!: ElementRef;
  @Input() rawData: any[] = [];
  
  dataPoints: OrderBookData[] = [];
  currentIndex = 0;
  currentTime = '';
  isAnimating = false;

  private orderCountPerFrame = 10;
  private svgMargin = { top: 20, right: 30, bottom: 40, left: 80 };
  private svgFontFamily = 'Roboto, "Helvetica Neue", sans-serif';
  private svgFontWeight = 'lighter';
  private svgAxisTickFontSize = '12px';
  private svgSizeLabelsFontSize = '12px';
  private svgBarLabelCenterOffset = 10;
  private svgBidColor = '#83b27d';
  private svgAskColor = '#c76e5b';
  
  private animationInterval: number | undefined;
  private width = 0;
  private height = 0;
  private svg: any;
  private xScale: any;
  private yScale: any;
  private colorScale: any;
  
  ngOnInit(): void {
    this.processData();
    this.initChart();
    this.updateChart();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData'] && !changes['rawData'].firstChange) {
      this.processData();
      this.updateChart();
    }
  }
  
  processData(): void {
    this.dataPoints = this.rawData.map(entry => {
      const orders: OrderEntry[] = [];
      for (let i = 1; i <= this.orderCountPerFrame; i++) {
        orders.push({
          price: entry[`Bid${i}`],
          size: entry[`Bid${i}Size`],
          type: 'bid',
          level: i
        });
        
        orders.push({
          price: entry[`Ask${i}`],
          size: entry[`Ask${i}Size`],
          type: 'ask',
          level: i
        });
      }
      
      return {
        time: entry.Time,
        orders: orders
      };
    });
    
    if (this.dataPoints.length > 0) {
      this.currentTime = this.dataPoints[this.currentIndex].time;
    }
  }
  
  initChart(): void {
    const element = this.chartContainer.nativeElement;
    this.width = element.clientWidth - this.svgMargin.left - this.svgMargin.right;
    this.height = element.clientHeight - this.svgMargin.top - this.svgMargin.bottom;

    d3.select(element).select('svg').remove();
    
    this.svg = d3.select(element)
      .append('svg')
        .attr('width', element.clientWidth)
        .attr('height', element.clientHeight)
      .append('g')
        .attr('transform', `translate(${this.svgMargin.left},${this.svgMargin.top})`);
    
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleBand().range([0, this.height]).padding(0.1);
    this.colorScale = d3.scaleOrdinal().domain(['bid', 'ask']).range([this.svgBidColor, this.svgAskColor]);
    
    // axes
    {
      this.svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${this.height})`)
        .call(d3.axisBottom(this.xScale));
      
      this.svg.append('g')
        .attr('class', 'y-axis');
      
      this.svg.append('line')
        .attr('class', 'center-line')
        .style('stroke', '#333')
        .style('stroke-width', 1);
    }
      
    // labels
    {
      this.svg.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('font-weight', this.svgFontWeight)
        .attr('font-family', this.svgFontFamily)
        .attr('x', this.width / 2)
        .attr('y', this.height + this.svgMargin.bottom - 5)
        .text('Size');
  
      this.svg.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('font-weight', this.svgFontWeight)
        .attr('font-family', this.svgFontFamily)
        .attr('transform', `rotate(-90)`)
        .attr('x', -this.height / 2)
        .attr('y', -(this.width / 18))
        .text('Price');

      this.svg.append('text')
        .attr('class', 'top-label')
        .attr('text-anchor', 'middle')
        .attr('font-weight', this.svgFontWeight)
        .attr('font-family', this.svgFontFamily)
        .attr('x', this.width / 4)
        .attr('y', -5)
        .text('Bids');

      this.svg.append('text')
        .attr('class', 'top-label')
        .attr('text-anchor', 'middle')
        .attr('font-weight', this.svgFontWeight)
        .attr('font-family', this.svgFontFamily)
        .attr('x', this.width - (this.width / 4))
        .attr('y', -5)
        .text('Asks');
    }
  }
  
  updateChart(): void {
    if (this.dataPoints.length === 0) return;
    
    const currentData = this.dataPoints[this.currentIndex];
    this.currentTime = currentData.time;

    const orders = currentData.orders;
    const maxSize = d3.max(orders, d => d.size) || 0;
    this.xScale.domain([-maxSize, maxSize]);
    
    const levels = Array.from(new Set(orders.map(d => `${d.type}-${d.level}`)))
      .sort((a, b) => {
        // split by type then sort by initial raw data push order (level)
        const [typeA, levelA] = a.split('-');
        const [typeB, levelB] = b.split('-');
        
        if (typeA === typeB) return parseInt(levelA) - parseInt(levelB);
        return typeA === 'ask' ? -1 : 1;
      });
      
    this.yScale.domain(levels);
    
    // axis labels
    {
      // y
      this.svg.select('.y-axis')
        .call(d3.axisLeft(this.yScale).tickFormat((d: d3.AxisDomain) => {
          const domainValue = d as string;
          const [type, level] = domainValue.split('-');
          const orderEntry = currentData.orders.find(o => 
            o.type === type && o.level === parseInt(level)
          );
          return orderEntry ? orderEntry.price.toFixed(4) : '';
        }))
        .selectAll('text')
        .attr('font-family', this.svgFontFamily)
        .attr('font-weight', this.svgFontWeight)
        .attr('font-size', this.svgAxisTickFontSize);
      
      // x
      this.svg.select('.x-axis')
        .call(d3.axisBottom(this.xScale).tickFormat((d) => Math.abs(d as number).toString()))
        .selectAll('text')
        .attr('font-family', this.svgFontFamily)
        .attr('font-weight', this.svgFontWeight)
        .attr('font-size', this.svgAxisTickFontSize);
      
      // center
      this.svg.select('.center-line')
        .attr('x1', this.xScale(0))
        .attr('y1', 0)
        .attr('x2', this.xScale(0))
        .attr('y2', this.height);
    }
      
    // size bars
    {
      const bars = this.svg.selectAll('.bar')
        .data(orders, (d: OrderEntry) => `${d.type}-${d.level}`);
      
      // remove old
      bars.exit().remove();
      
      // update existing
      bars.transition()
        .duration(300)
        .attr('y', (d: OrderEntry) => this.yScale(`${d.type}-${d.level}`))
        .attr('height', this.yScale.bandwidth())
        .attr('x', (d: OrderEntry) => d.type === 'bid' ? this.xScale(-d.size) : this.xScale(0))
        .attr('width', (d: OrderEntry) => d.type === 'bid' 
          ? this.xScale(0) - this.xScale(-d.size) 
          : this.xScale(d.size) - this.xScale(0));
      
      // add new
      bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', (d: OrderEntry) => this.yScale(`${d.type}-${d.level}`))
        .attr('height', this.yScale.bandwidth())
        .attr('x', (d: OrderEntry) => d.type === 'bid' ? this.xScale(-d.size) : this.xScale(0))
        .attr('width', 0)
        .attr('fill', (d: OrderEntry) => this.colorScale(d.type))
        .transition()
        .duration(300)
        .attr('width', (d: OrderEntry) => d.type === 'bid' 
          ? this.xScale(0) - this.xScale(-d.size) 
          : this.xScale(d.size) - this.xScale(0));
    }
    
    // order size labels
    {
      const textLabels = this.svg.selectAll('.bar-label')
        .data(orders, (d: OrderEntry) => `${d.type}-${d.level}`);
      textLabels.exit().remove();
  
      const sizeLabelFormatter = d3.format(',');
      textLabels
        .attr('x', (d: OrderEntry) => (this.width / 2) + this.svgBarLabelCenterOffset * (d.type === 'bid' ? -1 : 1))
        .attr('y', (d: OrderEntry) => this.yScale(`${d.type}-${d.level}`) + this.yScale.bandwidth() / 2)
        .text((d: OrderEntry) => sizeLabelFormatter(d.size));
  
      textLabels.enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('text-anchor', (d: OrderEntry) => d.type === 'bid' ? 'end' : 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'black')
        .attr('font-size', this.svgSizeLabelsFontSize)
        .attr('font-weight', this.svgFontWeight)
        .attr('font-family', this.svgFontFamily)
        .attr('x', (d: OrderEntry) => (this.width / 2) + this.svgBarLabelCenterOffset * (d.type === 'bid' ? -1 : 1))
        .attr('y', (d: OrderEntry) => this.yScale(`${d.type}-${d.level}`) + this.yScale.bandwidth() / 2)
        .text((d: OrderEntry) => sizeLabelFormatter(d.size));
    }
  }
  
  startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animationInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.dataPoints.length;
      this.updateChart();
    }, 1000) as unknown as number;
  }
  
  stopAnimation(): void {
    if (!this.isAnimating) return;
    
    this.isAnimating = false;
    clearInterval(this.animationInterval);
  }
  
  onSliderChange(): void {
    this.stopAnimation();
    this.updateChart();
  }
}
