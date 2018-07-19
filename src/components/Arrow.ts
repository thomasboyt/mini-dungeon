import {
  Component,
  CollisionInformation,
  KinematicBody,
  Physical,
  Coordinates,
} from 'pearl';

function getVectorComponents(magnitude: number, rad: number): Coordinates {
  const x = magnitude * Math.cos(rad);
  const y = magnitude * Math.sin(rad);
  return { x, y };
}

export default class Arrow extends Component<void> {
  update(dt: number) {
    const angle = this.getComponent(Physical).angle;
    const vel = getVectorComponents(0.01 * dt, angle);
    this.getComponent(KinematicBody).moveAndCollide(vel);
  }

  onCollision(collision: CollisionInformation) {
    if (!collision.collider.isTrigger) {
      this.pearl.entities.destroy(this.gameObject);
    }
  }
}
