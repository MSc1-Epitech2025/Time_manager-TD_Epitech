import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimatedBubblesComponent } from '@shared/components/animated-bubbles/animated-bubbles';

describe('AnimatedBubblesComponent – Jest (100% coverage)', () => {
  let component: AnimatedBubblesComponent;
  let fixture: ComponentFixture<AnimatedBubblesComponent>;

  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;
  let rafCallCount = 0;

  beforeEach(async () => {
    rafCallCount = 0;

    rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallCount++;

        if (rafCallCount === 1) {
          cb(0);
        }

        return rafCallCount;
      });

    cafSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [AnimatedBubblesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimatedBubblesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('ngOnInit initializes bubbles and starts animation', () => {
    const initSpy = jest.spyOn(component, 'initBubbles');
    const animateSpy = jest.spyOn(component, 'animate');

    component.ngOnInit();

    expect(initSpy).toHaveBeenCalled();
    expect(animateSpy).toHaveBeenCalled();
  });

  it('ngOnDestroy cancels animation if animationId exists', () => {
    component['animationId'] = 123;
    component.ngOnDestroy();

    expect(cafSpy).toHaveBeenCalledWith(123);
  });

  it('ngOnDestroy does nothing if animationId is undefined', () => {
    component['animationId'] = undefined;
    component.ngOnDestroy();

    expect(cafSpy).not.toHaveBeenCalled();
  });

  it('initBubbles creates bubbles with expected properties', () => {
    component.widthFactor = 0.5;
    component.bubbleCount = 5;

    component.initBubbles();

    expect(component.bubbles.length).toBe(5);
    component.bubbles.forEach(b => {
      expect(b.r).toBeGreaterThanOrEqual(20);
      expect(b.m).toBe(b.r * 0.5);
    });
  });

  it('onMouseMove updates mouse position when enabled', () => {
    component.enableMouseInteraction = true;

    const target = {
      getBoundingClientRect: () => ({ left: 10, top: 20 }),
    } as any;

    const event = {
      clientX: 50,
      clientY: 70,
      target,
    } as MouseEvent;

    component.onMouseMove(event);

    expect(component.mouse.x).toBe(40);
    expect(component.mouse.y).toBe(50);
    expect(component.mouse.active).toBe(true);
  });

  it('onMouseMove does nothing when interaction disabled', () => {
    component.enableMouseInteraction = false;

    const event = {} as MouseEvent;
    component.onMouseMove(event);

    expect(component.mouse.active).toBe(false);
  });

  it('onMouseLeave deactivates mouse', () => {
    component.mouse.active = true;

    component.onMouseLeave();

    expect(component.mouse.active).toBe(false);
  });

  it('animate updates bubbles and clamps velocity and bounds', () => {
    component.widthFactor = 1;
    component.bubbles = [
      {
        x: -10,
        y: -10,
        vx: 10,
        vy: -10,
        r: 20,
        m: 10,
      },
    ];

    component.animate();

    const b = component.bubbles[0];

    expect(b.vx).toBeLessThanOrEqual(3);
    expect(b.vy).toBeGreaterThanOrEqual(-3);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
  });

  it('animate applies mouse force when mouse is active', () => {
    component.enableMouseInteraction = true;
    component.mouse = { x: 50, y: 50, active: true };

    component.bubbles = [
      {
        x: 40,
        y: 40,
        vx: 0,
        vy: 0,
        r: 20,
        m: 10,
      },
    ];

    component.animate();

    expect(component.bubbles[0].vx).not.toBe(0);
    expect(component.bubbles[0].vy).not.toBe(0);
  });

  it('handleCollision updates velocities and positions on collision', () => {
    const a = { x: 0, y: 0, vx: 1, vy: 0, r: 20, m: 10 };
    const b = { x: 30, y: 0, vx: -1, vy: 0, r: 20, m: 10 };

    component.handleCollision(a, b);

    expect(a.vx).not.toBe(1);
    expect(b.vx).not.toBe(-1);
  });

  it('handleCollision does nothing when no collision', () => {
    const a = { x: 0, y: 0, vx: 1, vy: 0, r: 10, m: 5 };
    const b = { x: 200, y: 200, vx: -1, vy: 0, r: 10, m: 5 };

    component.handleCollision(a, b);

    expect(a.vx).toBe(1);
    expect(b.vx).toBe(-1);
  });

  it('getBubbleStyle returns correct style object', () => {
    component.bubbles = [
      { x: 10, y: 20, vx: 0, vy: 0, r: 15, m: 7.5 },
    ];

    const style = component.getBubbleStyle(0);

    expect(style).toEqual({
      transform: 'translate(10px, 20px)',
      width: '30px',
      height: '30px',
    });
  });

  it('animate handles right boundary collision (x + diameter > width)', () => {
    component.widthFactor = 1;

    const width = window.innerWidth;

    component.bubbles = [
      {
        r: 20,
        m: 10,
        x: width - 20,
        y: 100,
        vx: 2,
        vy: 0,
      },
    ];

    component.animate();

    const b = component.bubbles[0];

    expect(b.x).toBe(width - b.r * 2);
    expect(b.vx).toBeLessThan(0);
  });

  it('animate handles bottom boundary collision (y + diameter > height)', () => {
    const height = window.innerHeight;

    component.bubbles = [
      {
        r: 20,
        m: 10,
        x: 100,
        y: height - 20,
        vx: 0,
        vy: 2,
      },
    ];

    component.animate();

    const b = component.bubbles[0];

    expect(b.y).toBe(height - b.r * 2);
    expect(b.vy).toBeLessThan(0);
  });

});
