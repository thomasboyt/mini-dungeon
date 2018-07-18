import { Component, SpriteRenderer } from 'pearl';

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class FallingRenderer extends Component<void> {
  elapsedMs = 0;
  lengthMs = 1000;

  falling = false;
  initialScaleX!: number;
  initialScaleY!: number;

  start() {
    this.falling = true;
    const renderer = this.getComponent(SpriteRenderer);
    this.initialScaleX = renderer.scaleX;
    this.initialScaleY = renderer.scaleY;
  }

  update(dt: number) {
    if (!this.falling) {
      return;
    }

    const renderer = this.getComponent(SpriteRenderer);
    const f = this.elapsedMs / this.lengthMs;
    const cappedF = f > 1 ? 1 : f;
    renderer.scaleX = lerp(this.initialScaleX, 0, cappedF);
    renderer.scaleY = lerp(this.initialScaleY, 0, cappedF);
    this.elapsedMs += dt;
  }
}
