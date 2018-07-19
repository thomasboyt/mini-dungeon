import { Component, CollisionInformation, KinematicBody } from 'pearl';

export default class Arrow extends Component<void> {
  update(dt: number) {
    const vel = { x: dt * 0.01, y: 0 };
    this.getComponent(KinematicBody).moveAndCollide(vel);
  }

  onCollision(collision: CollisionInformation) {
    if (!collision.collider.isTrigger) {
      this.pearl.entities.destroy(this.gameObject);
    }
  }
}
