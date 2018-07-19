import { Component, PolygonRenderer, BoxCollider } from 'pearl';
import Trap from './Trap';

export default class Pit extends Trap<void> {
  private deactivateCoroutine?: IterableIterator<undefined>;

  init() {
    this.getComponent(PolygonRenderer).isVisible = false;
    this.getComponent(BoxCollider).isEnabled = false;
  }

  activate() {
    if (this.deactivateCoroutine) {
      this.cancelCoroutine(this.deactivateCoroutine);
    }

    this.getComponent(BoxCollider).isTrigger = true;
    this.getComponent(PolygonRenderer).isVisible = true;
    this.getComponent(BoxCollider).isEnabled = true;
  }

  deactivate() {
    this.getComponent(BoxCollider).isTrigger = false;

    this.deactivateCoroutine = this.runCoroutine(function*(this: Pit) {
      yield this.pearl.async.waitMs(1000);
      this.getComponent(PolygonRenderer).isVisible = false;
      this.getComponent(BoxCollider).isEnabled = false;
      this.deactivateCoroutine = undefined;
    });
  }
}
