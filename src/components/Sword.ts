import {
  Component,
  Coordinates,
  Physical,
  SpriteRenderer,
  PolygonCollider,
} from 'pearl';

interface Settings {
  direction: Coordinates;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class Sword extends Component<Settings> {
  // direction: Coordinates;

  length = 4;
  stabTimeMs = 100;
  elapsedMs = 0;

  init(settings: Settings) {
    this.getComponent(Physical).localCenter = { x: 4, y: 0 };
    const { direction } = settings;

    // this.getComponent(SpriteRenderer).isVisible = false;

    // this.getComponent(PolygonCollider).points = [[0, 0], [0, 0], [0, 0]];
    // this.getComponent(PolygonCollider).points = [[0, 0], [20, 0]];
    this.getComponent(PolygonCollider).setBoxSize({
      width: 4,
      height: 1,
    });

    this.getComponent(Physical).localCenter = {
      x: 4 * direction.x,
      y: 4 * direction.y,
    };

    if (direction.x) {
      this.getComponent(SpriteRenderer).scaleX *= direction.x;
    }

    if (direction.y) {
      if (direction.x) {
        this.getComponent(Physical).angle += (45 * direction.y * Math.PI) / 180;
      } else {
        this.getComponent(Physical).angle += (90 * direction.y * Math.PI) / 180;
      }
    }
  }

  update(dt: number) {
    // continue growing projection
    // this.getComponent(PolygonCollider).points = [[0, 0], [0, 0], [5, 0]];
    // let width = lerp(0, this.length, this.elapsedMs / this.stabTimeMs);
    // if (width > this.length) {
    //   width = this.length;
    // }
    // this.getComponent(Physical).localCenter = {
    //   x: 2 + width / 2,
    //   y: 0,
    // };
    // this.getComponent(PolygonCollider).setBoxSize({
    //   width: this.length,
    //   height: 1,
    // });
    // this.elapsedMs += dt;
  }

  render(ctx: CanvasRenderingContext2D) {
    // debug projection rendering
  }
}
