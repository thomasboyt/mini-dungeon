import {
  Component,
  Keys,
  Physical,
  AnimationManager,
  PolygonCollider,
  Coordinates,
  GameObject,
  SpriteRenderer,
  CollisionResponse,
} from 'pearl';
import Sign from './Sign';
import SpriteAsset from '../SpriteAsset';
import Sword from './Sword';
import FallingRenderer from './FallingRenderer';
import Character, { CollisionInformation } from './Character';

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class Player extends Component<null> {
  playerSpeed = 0.01;
  hasKey: boolean = false;
  sword?: GameObject;
  facing: Coordinates = { x: 1, y: 0 };
  dead = false;

  init() {
    this.pearl.renderer.setViewCenter(this.getComponent(Physical).center);
  }

  update(dt: number) {
    if (this.dead) {
      return;
    }

    let xVec = 0;
    let yVec = 0;

    if (this.pearl.inputter.isKeyDown(Keys.rightArrow)) {
      xVec = 1;
    } else if (this.pearl.inputter.isKeyDown(Keys.leftArrow)) {
      xVec = -1;
    }

    if (this.pearl.inputter.isKeyDown(Keys.downArrow)) {
      yVec = 1;
    } else if (this.pearl.inputter.isKeyDown(Keys.upArrow)) {
      yVec = -1;
    }

    if (xVec || yVec) {
      this.facing = { x: xVec, y: yVec };
    }

    if (this.pearl.inputter.isKeyPressed(Keys.space)) {
      this.stab();
    }

    this.updateMove(dt, xVec, yVec);
  }

  private stab() {
    if (this.sword) {
      return;
    }

    this.sword = this.pearl.entities.add(
      new GameObject({
        name: 'sword',
        tags: ['sword'],
        components: [
          new Physical({
            angle: (45 + 90) * (Math.PI / 180),
          }),
          new PolygonCollider(),
          new SpriteRenderer({
            sprite: this.pearl.assets.get(SpriteAsset, 'sword'),
            scaleX: 1 / 4,
            scaleY: 1 / 4,
          }),
          new Sword({
            direction: this.facing,
          }),
        ],
      })
    );

    this.gameObject.appendChild(this.sword);

    this.runCoroutine(function*(this: Player) {
      yield this.pearl.async.waitMs(300);
      this.pearl.entities.destroy(this.sword!);
      delete this.sword;
    });
  }

  private updateMove(dt: number, xVec: number, yVec: number) {
    this.setAnimation(xVec, yVec);

    const collisions = this.getComponent(Character).moveAndCollide({
      x: xVec * dt * this.playerSpeed,
      y: yVec * dt * this.playerSpeed,
    });

    this.moveCamera(dt);

    this.handleCollisions(collisions);
  }

  private setAnimation(xVec: number, yVec: number) {
    const anim = this.getComponent(AnimationManager);
    const spriteRenderer = this.getComponent(SpriteRenderer);

    if (xVec !== 0 || yVec !== 0) {
      anim.set('walking');

      if (xVec < 0) {
        spriteRenderer.scaleX = -1;
      } else if (xVec > 0) {
        spriteRenderer.scaleX = 1;
      }
    } else {
      anim.set('idle');
    }
  }

  private moveCamera(dt: number) {
    // distance from center of the screen the player has to be at for the camera
    // to move
    const offset = 2;

    const interp = 6 * (dt / 1000);
    const viewBounds = this.pearl.renderer.getViewSize();
    const viewCenter = this.pearl.renderer.getViewCenter();
    const center = this.getComponent(Physical).center;

    const newViewCenter = { x: viewCenter.x, y: viewCenter.y };

    if (center.x - viewCenter.x > offset) {
      newViewCenter.x = lerp(viewCenter.x, center.x - offset, interp);
    } else if (viewCenter.x - center.x > offset) {
      newViewCenter.x = lerp(viewCenter.x, center.x + offset, interp);
    }
    if (center.y - viewCenter.y > offset) {
      newViewCenter.y = lerp(viewCenter.y, center.y - offset, interp);
    } else if (viewCenter.y - center.y > offset) {
      newViewCenter.y = lerp(viewCenter.y, center.y + offset, interp);
    }

    this.pearl.renderer.setViewCenter(newViewCenter);
  }

  private handleCollisions(collisions: CollisionInformation[]) {
    for (let collision of collisions) {
      if (collision.object.hasTag('key')) {
        this.pearl.entities.destroy(collision.object);
        this.hasKey = true;
      } else if (collision.object.hasTag('door')) {
        if (this.hasKey) {
          this.pearl.entities.destroy(collision.object);
          this.hasKey = false;
        }
      } else if (collision.object.hasTag('sign')) {
        collision.object.getComponent(Sign).showText();
      } else if (collision.object.hasTag('dropZone')) {
        if (collision.response.aInB) {
          this.dead = true;
          this.getComponent(AnimationManager).set('idle');
          this.getComponent(FallingRenderer).start();
        }
      } else if (collision.object.hasTag('enemy')) {
        this.dead = true;
        this.getComponent(AnimationManager).set('idle');
        this.getComponent(Physical).angle = -90 * (Math.PI / 180);
      }
    }
  }
}
