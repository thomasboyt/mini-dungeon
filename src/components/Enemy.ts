import {
  Component,
  Physical,
  AnimationManager,
  CollisionInformation,
  KinematicBody,
  PolygonShape,
  VectorMaths as V,
  Vector2,
  GameObject,
} from 'pearl';
import FallingRenderer from './FallingRenderer';
import TiledTileMap from './TiledTileMap';
import Player from './Player';
import TileMapCollider from './TileMapCollider';

export default class Enemy extends Component<void> {
  dead = false;
  moveSpeed = 0.01;
  startingPosition!: Vector2;
  player!: GameObject;

  init() {
    this.startingPosition = this.getComponent(Physical).center;
    this.player = this.pearl.entities.all('player')[0]!;
  }

  update(dt: number) {
    if (this.dead) {
      return;
    }

    const canSeePlayer = this.canSeePlayer();

    if (canSeePlayer) {
      this.moveTowards(dt, this.player.getComponent(Physical).center);
    } else {
      // revert to  starting position
      const atStart = V.equals(
        this.getComponent(Physical).center,
        this.startingPosition
      );
      if (atStart) {
        this.getComponent(AnimationManager).set('idle');
      } else {
        this.moveTowards(dt, this.startingPosition);
      }
    }
  }

  private canSeePlayer(): boolean {
    const phys = this.getComponent(Physical);
    const playerCenter = this.player.getComponent(Physical).center;

    // if the player is > a screen away, don't chase
    const xDiff = playerCenter.x - phys.center.x;
    const yDiff = playerCenter.y - phys.center.y;
    const viewSize = this.pearl.renderer.getViewSize();
    if (Math.abs(xDiff) > viewSize.x / 2 || Math.abs(yDiff) > viewSize.y / 2) {
      return false;
    }

    const ray = new PolygonShape({
      points: [[0, 0], [xDiff, yDiff]],
    });

    const tileMapCollider = this.gameObject.parent!.getComponent(
      TileMapCollider
    );

    return !tileMapCollider.testShape(ray, this.getComponent(Physical));
  }

  // TODO: Instead of simply following the sightline ray, which could catch
  // on corners, use pathfinding.js with "allow diagonal" and "don't cross
  // corners" set
  // - see: https://i.imgur.com/A1Yxy1V.png
  private moveTowards(dt: number, target: Vector2) {
    this.getComponent(AnimationManager).set('walking');
    const current = this.getComponent(Physical).center;
    const step = this.moveSpeed * dt;

    // If the distance to be moved to is greater than the distance between the
    // target and the current position, cap movement distance so it go exactly
    // to the point
    const between = V.subtract(target, current);
    let vel = V.multiply(V.unit(between), step);
    if (V.length(vel) > V.length(between)) {
      vel = between;
    }

    this.getComponent(KinematicBody).moveAndSlide(vel);
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
