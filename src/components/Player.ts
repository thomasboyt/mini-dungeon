import {
  Component,
  Keys,
  Physical,
  AnimationManager,
  Coordinates,
  GameObject,
  SpriteRenderer,
  CollisionInformation,
  MouseButton,
  KinematicBody,
  PolygonCollider,
} from 'pearl';
import Sign from './Sign';
import SpriteAsset from '../SpriteAsset';
import Sword from './Sword';
import FallingRenderer from './FallingRenderer';

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

    let uVelocity = { x: 0, y: 0 };

    if (this.pearl.inputter.isKeyDown(Keys.rightArrow)) {
      uVelocity.x = 1;
    } else if (this.pearl.inputter.isKeyDown(Keys.leftArrow)) {
      uVelocity.x = -1;
    }

    if (this.pearl.inputter.isKeyDown(Keys.downArrow)) {
      uVelocity.y = 1;
    } else if (this.pearl.inputter.isKeyDown(Keys.upArrow)) {
      uVelocity.y = -1;
    }

    // some experimental mouse & touch controls
    if (this.pearl.inputter.isMouseDown(MouseButton.left)) {
      const viewPos = this.pearl.inputter.getMousePosition();
      uVelocity = this.getPointerMovement(viewPos);
    }

    const touchPositions = this.pearl.inputter.getTouchPositions();
    if (touchPositions.size > 0) {
      uVelocity = this.getPointerMovement([...touchPositions.values()][0]);
    }

    if (uVelocity.x || uVelocity.y) {
      this.facing = { x: uVelocity.x, y: uVelocity.y };
    }

    if (this.pearl.inputter.isKeyPressed(Keys.space)) {
      this.stab();
    }

    this.updateMove(dt, uVelocity.x, uVelocity.y);
  }

  private getPointerMovement(viewPos: Coordinates): Coordinates {
    const scaledViewPos = {
      x: viewPos.x / this.pearl.renderer.logicalScaleFactor,
      y: viewPos.y / this.pearl.renderer.logicalScaleFactor,
    };

    // translate mouse position relative to view center
    const viewCenter = this.pearl.renderer.getViewCenter();
    const viewSize = this.pearl.renderer.getViewSize();
    const worldPos = {
      x: viewCenter.x + (scaledViewPos.x - viewSize.x / 2),
      y: viewCenter.y + (scaledViewPos.y - viewSize.y / 2),
    };

    // get vector relative to player
    const phys = this.getComponent(Physical);
    const vector = {
      x: worldPos.x - phys.center.x,
      y: worldPos.y - phys.center.y,
    };

    // vec -> unit vec
    const magnitude = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));

    return { x: vector.x / magnitude, y: vector.y / magnitude };
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

    this.getComponent(KinematicBody).moveAndSlide({
      x: xVec * dt * this.playerSpeed,
      y: yVec * dt * this.playerSpeed,
    });

    this.moveCamera(dt);
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

  onCollision(collision: CollisionInformation) {
    if (collision.gameObject.hasTag('key')) {
      this.pearl.entities.destroy(collision.gameObject);
      this.hasKey = true;
    } else if (collision.gameObject.hasTag('door')) {
      if (this.hasKey) {
        this.pearl.entities.destroy(collision.gameObject);
        this.hasKey = false;
      }
    } else if (collision.gameObject.hasTag('sign')) {
      collision.gameObject.getComponent(Sign).showText();
    } else if (collision.gameObject.hasTag('pit')) {
      if (collision.response.bInA) {
        this.dead = true;
        this.getComponent(AnimationManager).set('idle');
        this.getComponent(FallingRenderer).start();
      }
    } else if (
      collision.gameObject.hasTag('enemy') ||
      collision.gameObject.hasTag('arrow')
    ) {
      this.dead = true;
      this.getComponent(AnimationManager).set('idle');
      this.getComponent(Physical).angle = -90 * (Math.PI / 180);
    }
  }
}
