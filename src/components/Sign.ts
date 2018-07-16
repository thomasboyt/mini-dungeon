import { Component, Physical } from 'pearl';

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

interface Settings {
  text: string;
}

export default class Sign extends Component<Settings> {
  text!: string;
  wobbleMs = 1000;
  timeBeforeHideMs = 1500;

  private isShowingText = false;
  private elapsedMs = 0;
  private hideAtMs = 0;

  hideCoroutine?: IterableIterator<undefined>;

  create(settings: Settings) {
    this.text = settings.text;
  }

  showText() {
    this.isShowingText = true;

    this.hideAtMs = this.elapsedMs + this.timeBeforeHideMs;
  }

  update(dt: number) {
    this.elapsedMs += dt;

    if (this.elapsedMs > this.hideAtMs) {
      this.isShowingText = false;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.isShowingText) {
      const center = this.getComponent(Physical).center;
      ctx.translate(center.x, center.y - 2);

      const endDegrees = 15;
      const f = (this.elapsedMs % this.wobbleMs) / this.wobbleMs;

      let degrees: number;
      if (this.elapsedMs % (this.wobbleMs * 2) > this.wobbleMs) {
        degrees = lerp(endDegrees, -endDegrees, f);
      } else {
        degrees = lerp(-endDegrees, endDegrees, f);
      }
      ctx.rotate(degrees * (Math.PI / 180));

      ctx.font = 'bold 2px monospace';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 0.125;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, 0, 0);
      ctx.strokeText(this.text, 0, 0);
    }
  }
}
