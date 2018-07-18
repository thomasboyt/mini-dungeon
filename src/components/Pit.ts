import { Component, PolygonRenderer, PolygonCollider } from 'pearl';

export default class Pit extends Component<void> {
  private deactivateCoroutine?: IterableIterator<undefined>;

  init() {
    this.getComponent(PolygonRenderer).isVisible = false;
    this.getComponent(PolygonCollider).isEnabled = false;
  }

  activate() {
    if (this.deactivateCoroutine) {
      this.cancelCoroutine(this.deactivateCoroutine);
    }

    this.getComponent(PolygonCollider).isTrigger = true;
    this.getComponent(PolygonRenderer).isVisible = true;
    this.getComponent(PolygonCollider).isEnabled = true;
  }

  deactivate() {
    this.getComponent(PolygonCollider).isTrigger = false;

    this.deactivateCoroutine = this.runCoroutine(function*(this: Pit) {
      yield this.pearl.async.waitMs(1000);
      this.getComponent(PolygonRenderer).isVisible = false;
      this.getComponent(PolygonCollider).isEnabled = false;
      this.deactivateCoroutine = undefined;
    });
  }
}
