import {
  Component,
  Coordinates,
  Physical,
  SpriteRenderer,
  BoxCollider,
} from 'pearl';

interface Settings {
  direction: Coordinates;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class Sword extends Component<Settings> {
  length = 4;
  stabTimeMs = 100;
  elapsedMs = 0;

  init(settings: Settings) {
    this.getComponent(Physical).localCenter = { x: 4, y: 0 };
    const { direction } = settings;

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
}
