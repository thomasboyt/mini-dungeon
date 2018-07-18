import { Component } from 'pearl';
import KinematicBody from './KinematicBody';

export default class Arrow extends Component<void> {
  update(dt: number) {
    const vel = { x: dt * 0.01, y: 0 };
    const collisions = this.getComponent(KinematicBody).moveAndCollide(vel);

    for (let collision of collisions) {
      if (collision.object.hasTag('player')) {
        // player died!!
      }
      this.pearl.entities.destroy(this.gameObject);
    }
  }
}
