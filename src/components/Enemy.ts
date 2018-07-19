import {
  Component,
  Physical,
  Coordinates,
  AnimationManager,
  CollisionInformation,
  KinematicBody,
  PolygonShape,
} from 'pearl';
import * as SAT from 'sat';
import FallingRenderer from './FallingRenderer';
import TiledTileMap from './TiledTileMap';
import Player from './Player';
import TileMapCollider from './TileMapCollider';

// hm https://docs.unity3d.com/ScriptReference/Vector3.MoveTowards.html
const moveTowards = (
  current: Coordinates,
  target: Coordinates,
  step: number
): Coordinates => {
  const rad = Math.atan2(target.y - current.y, target.x - current.x);
  const x = step * Math.cos(rad);
  const y = step * Math.sin(rad);
  return { x: current.x + x, y: current.y + y };
};

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

    let xVec = 0;
    let yVec = 0;
    if (canSeePlayer) {
      this.getComponent(AnimationManager).set('walking');

      // TODO: Instead of simply following the sightline ray, which could catch
      // on corners, use pathfinding.js with "allow diagonal" and "don't cross
      // corners" set
      // - see: https://i.imgur.com/A1Yxy1V.png
      const target = playerCenter;
      const current = phys.center;
      const step = this.moveSpeed * dt;
      const rad = Math.atan2(target.y - current.y, target.x - current.x);
      xVec = step * Math.cos(rad);
      yVec = step * Math.sin(rad);
    } else {
      this.getComponent(AnimationManager).set('idle');
    }

    const collisions = this.getComponent(KinematicBody).moveAndSlide({
      x: xVec,
      y: yVec,
    });
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
    }
  }
}
