import {
  Component,
  Physical,
  AnimationManager,
  CollisionInformation,
  KinematicBody,
  PolygonShape,
  VectorMaths as V,
} from 'pearl';
import FallingRenderer from './FallingRenderer';
import TiledTileMap from './TiledTileMap';
import Player from './Player';
import TileMapCollider from './TileMapCollider';

export default class Enemy extends Component<void> {
  dead = false;
  moveSpeed = 0.01;

  update(dt: number) {
    if (this.dead) {
      return;
    }

    const player = this.pearl.entities.all('player')[0]!;

    if (player.getComponent(Player).dead) {
      return;
    }

    const phys = this.getComponent(Physical);
    const playerCenter = player.getComponent(Physical).center;

    // if the player is > a screen away, don't chase
    const xDiff = playerCenter.x - phys.center.x;
    const yDiff = playerCenter.y - phys.center.y;
    const viewSize = this.pearl.renderer.getViewSize();
    if (Math.abs(xDiff) > viewSize.x / 2 || Math.abs(yDiff) > viewSize.y / 2) {
      return;
    }

    const ray = new PolygonShape({
      points: [[0, 0], [xDiff, yDiff]],
    });

    const tileMapCollider = this.gameObject.parent!.getComponent(
      TileMapCollider
    );
    const canSeePlayer = !tileMapCollider.testShape(
      ray,
      this.getComponent(Physical)
    );

    let vel = { x: 0, y: 0 };
    if (canSeePlayer) {
      this.getComponent(AnimationManager).set('walking');

      // TODO: Instead of simply following the sightline ray, which could catch
      // on corners, use pathfinding.js with "allow diagonal" and "don't cross
      // corners" set
      // - see: https://i.imgur.com/A1Yxy1V.png
      const target = playerCenter;
      const current = phys.center;
      const step = this.moveSpeed * dt;
      vel = V.multiply(V.unit(V.subtract(target, current)), step);
    } else {
      this.getComponent(AnimationManager).set('idle');
    }

    const collisions = this.getComponent(KinematicBody).moveAndSlide(vel);
  }

  onCollision(collision: CollisionInformation) {
    if (collision.gameObject.hasTag('pit')) {
      if (collision.response.aInB) {
        this.dead = true;
        this.getComponent(AnimationManager).set('idle');
        this.getComponent(FallingRenderer).start();

        this.runCoroutine(function*(this: Enemy) {
          yield this.pearl.async.waitMs(1000);
          this.pearl.entities.destroy(this.gameObject);
        });
      }
    } else if (collision.gameObject.hasTag('arrow')) {
      this.dead = true;
      this.getComponent(AnimationManager).set('idle');
      this.pearl.entities.destroy(this.gameObject);
    }
  }
}
