import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiBarChartComponent, BarChartData } from './kpi-bar-chart';
import { SimpleChange } from '@angular/core';
import { Chart } from 'chart.js';

jest.mock('chart.js', () => ({
  Chart: Object.assign(
    jest.fn().mockImplementation(() => ({
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: '', label: '' }]
      },
      update: jest.fn(),
      destroy: jest.fn()
    })),
    {
      register: jest.fn()
    }
  ),
  registerables: []
}));

describe('KpiBarChartComponent', () => {
  let component: KpiBarChartComponent;
  let fixture: ComponentFixture<KpiBarChartComponent>;

  const mockData: BarChartData[] = [
    { name: 'Alice', value: 10 },
    { name: 'Bob', value: 20 },
    { name: 'Charlie', value: 15 }
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [KpiBarChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KpiBarChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('input defaults', () => {
    it('should have default empty data array', () => {
      expect(component.data).toEqual([]);
    });

    it('should have default selectedKpi as absenteeism', () => {
      expect(component.selectedKpi).toBe('absenteeism');
    });

    it('should have empty title initially', () => {
      expect(component.title).toBe('');
    });

    it('should have undefined chart initially', () => {
      expect(component.chart).toBeUndefined();
    });
  });

  describe('updateTitle', () => {
    it('should set title for absenteeism', () => {
      component.selectedKpi = 'absenteeism';
      component.updateTitle();
      expect(component.title).toBe('Absences by Person');
    });

    it('should set title for attendance', () => {
      component.selectedKpi = 'attendance';
      component.updateTitle();
      expect(component.title).toBe('Attendance by Person');
    });

    it('should set title for productivity', () => {
      component.selectedKpi = 'productivity';
      component.updateTitle();
      expect(component.title).toBe('Work Hours by Person');
    });
  });

  describe('getBarColor', () => {
    it('should return red (#ef4444) for absenteeism', () => {
      component.selectedKpi = 'absenteeism';
      expect(component.getBarColor()).toBe('#ef4444');
    });

    it('should return green (#22c55e) for attendance', () => {
      component.selectedKpi = 'attendance';
      expect(component.getBarColor()).toBe('#22c55e');
    });

    it('should return pink (#f472b6) for productivity', () => {
      component.selectedKpi = 'productivity';
      expect(component.getBarColor()).toBe('#f472b6');
    });

    it('should return default purple (#a78bfa) for unknown kpi', () => {
      component.selectedKpi = 'unknown' as unknown as any;
      expect(component.getBarColor()).toBe('#a78bfa');
    });
  });

  describe('ngOnChanges', () => {
    it('should call updateTitle when selectedKpi changes', () => {
      const updateTitleSpy = jest.spyOn(component, 'updateTitle');

      component.ngOnChanges({
        selectedKpi: new SimpleChange('absenteeism', 'attendance', false)
      });

      expect(updateTitleSpy).toHaveBeenCalled();
    });

    it('should call updateChart when data changes and chart exists', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;

      const updateChartSpy = jest.spyOn(component, 'updateChart');

      component.ngOnChanges({
        data: new SimpleChange([], mockData, false)
      });

      expect(updateChartSpy).toHaveBeenCalled();
    });

    it('should call updateChart when selectedKpi changes and chart exists', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;

      const updateChartSpy = jest.spyOn(component, 'updateChart');

      component.ngOnChanges({
        selectedKpi: new SimpleChange('absenteeism', 'productivity', false)
      });

      expect(updateChartSpy).toHaveBeenCalled();
    });

    it('should not call updateChart when chart does not exist', () => {
      component.chart = undefined;
      const updateChartSpy = jest.spyOn(component, 'updateChart');

      component.ngOnChanges({
        data: new SimpleChange([], mockData, false)
      });

      expect(updateChartSpy).not.toHaveBeenCalled();
    });

    it('should not call updateTitle when selectedKpi is not in changes', () => {
      const updateTitleSpy = jest.spyOn(component, 'updateTitle');

      component.ngOnChanges({
        data: new SimpleChange([], mockData, false)
      });

      expect(updateTitleSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateChart', () => {
    it('should return early if chart is undefined', () => {
      component.chart = undefined;
      component.data = mockData;

      expect(() => component.updateChart()).not.toThrow();
    });

    it('should update chart labels with data names', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;
      component.data = mockData;
      component.selectedKpi = 'absenteeism';

      component.updateChart();

      expect(component.chart!.data.labels).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should update chart datasets with data values', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;
      component.data = mockData;

      component.updateChart();

      expect(component.chart!.data.datasets[0].data).toEqual([10, 20, 15]);
    });

    it('should update chart backgroundColor based on selectedKpi', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;
      component.data = mockData;
      component.selectedKpi = 'attendance';

      component.updateChart();

      expect(component.chart!.data.datasets[0].backgroundColor).toBe('#22c55e');
    });

    it('should call chart.update()', () => {
      const mockUpdate = jest.fn();
      component.chart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: '' }] },
        update: mockUpdate
      } as unknown as Chart;
      component.data = mockData;

      component.updateChart();

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('renderChart', () => {
    it('should create a new Chart instance when called with valid context', () => {
      component.chartRef = {
        nativeElement: {
          getContext: jest.fn().mockReturnValue({})
        }
      } as unknown as typeof component.chartRef;

      component.data = mockData;
      component.selectedKpi = 'absenteeism';

      component.renderChart();

      expect(Chart).toHaveBeenCalled();
    });

    it('should not create chart if context is null', () => {
      component.chartRef = {
        nativeElement: {
          getContext: jest.fn().mockReturnValue(null)
        }
      } as unknown as typeof component.chartRef;

      component.renderChart();

      expect(component.chart).toBeUndefined();
    });

    it('tooltip label callback returns "0" when parsed.y is null', () => {
      component.chartRef = { nativeElement: { getContext: jest.fn().mockReturnValue({}) } } as unknown as typeof component.chartRef;
      component.data = mockData;
      component.selectedKpi = 'attendance';

      component.renderChart();

      const chartMock = Chart as unknown as jest.Mock;
      const config = chartMock.mock.calls.at(-1)[1];
      const labelCb = config.options.plugins.tooltip.callbacks.label;

      expect(labelCb({ parsed: { y: null } })).toBe('0');
    });

    it('tooltip label callback formats productivity with one decimal and "h"', () => {
      component.chartRef = { nativeElement: { getContext: jest.fn().mockReturnValue({}) } } as unknown as typeof component.chartRef;
      component.data = mockData;
      component.selectedKpi = 'productivity';

      component.renderChart();

      const chartMock = Chart as unknown as jest.Mock;
      const config = chartMock.mock.calls.at(-1)[1];
      const labelCb = config.options.plugins.tooltip.callbacks.label;

      expect(labelCb({ parsed: { y: 3.14159 } })).toBe('3.1h');
    });

    it('tooltip label callback returns plain string for non-productivity numeric values', () => {
      component.chartRef = { nativeElement: { getContext: jest.fn().mockReturnValue({}) } } as unknown as typeof component.chartRef;
      component.data = mockData;
      component.selectedKpi = 'attendance';

      component.renderChart();

      const chartMock = Chart as unknown as jest.Mock;
      const config = chartMock.mock.calls.at(-1)[1];
      const labelCb = config.options.plugins.tooltip.callbacks.label;

      expect(labelCb({ parsed: { y: 7 } })).toBe('7');
    });

    it('y-axis tick callback appends "h" for productivity', () => {
      component.chartRef = { nativeElement: { getContext: jest.fn().mockReturnValue({}) } } as unknown as typeof component.chartRef;
      component.data = mockData;
      component.selectedKpi = 'productivity';

      component.renderChart();

      const chartMock = Chart as unknown as jest.Mock;
      const config = chartMock.mock.calls.at(-1)[1];
      const tickCb = config.options.scales.y.ticks.callback;

      expect(tickCb(8)).toBe('8h');
    });

    it('y-axis tick callback returns value for non-productivity', () => {
      component.chartRef = { nativeElement: { getContext: jest.fn().mockReturnValue({}) } } as unknown as typeof component.chartRef;
      component.data = mockData;
      component.selectedKpi = 'attendance';

      component.renderChart();

      const chartMock = Chart as unknown as jest.Mock;
      const config = chartMock.mock.calls.at(-1)[1];
      const tickCb = config.options.scales.y.ticks.callback;

      expect(tickCb(8)).toBe(8);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call updateTitle', () => {
      component.chartRef = {
        nativeElement: {
          getContext: jest.fn().mockReturnValue({})
        }
      } as unknown as typeof component.chartRef;

      const updateTitleSpy = jest.spyOn(component, 'updateTitle');

      component.ngAfterViewInit();

      expect(updateTitleSpy).toHaveBeenCalled();
    });

    it('should call renderChart', () => {
      component.chartRef = {
        nativeElement: {
          getContext: jest.fn().mockReturnValue({})
        }
      } as unknown as typeof component.chartRef;

      const renderChartSpy = jest.spyOn(component, 'renderChart');

      component.ngAfterViewInit();

      expect(renderChartSpy).toHaveBeenCalled();
    });
  });
});
