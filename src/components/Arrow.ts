import {
  Component,
  CollisionInformation,
  KinematicBody,
  Physical,
  VectorMaths as V,
} from 'pearl';

export default class Arrow extends Component<void> {
  arrowSpeed = 0.02;

  update(dt: number) {
    const angle = this.getComponent(Physical).angle;
    const vel = V.multiply(V.fromAngle(angle), this.arrowSpeed * dt);
    this.getComponent(KinematicBody).moveAndCollide(vel);
  }

  onCollision(collision: CollisionInformation) {
    if (!collision.collider.isTrigger) {
      this.pearl.entities.destroy(this.gameObject);
    }
  }
}
