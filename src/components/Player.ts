import {
  Component,
  Keys,
  Physical,
  AnimationManager,
  GameObject,
  SpriteRenderer,
  CollisionInformation,
  MouseButton,
  KinematicBody,
  BoxCollider,
  Vector2,
  VectorMaths as V,
} from 'pearl';
import Sign from './Sign';
import SpriteAsset from '../SpriteAsset';
import Sword from './Sword';
import FallingRenderer from './FallingRenderer';
import { swordFactory } from '../entityFactories';

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class Player extends Component<null> {
  playerSpeed = 0.01;
  hasKey: boolean = false;
  sword?: GameObject;
  facing: Vector2 = { x: 1, y: 0 };
  dead = false;

  init() {
    this.pearl.renderer.setViewCenter(this.getComponent(Physical).center);
  }

  update(dt: number) {
    if (this.dead) {
      return;
    }

    const movementVec = this.getMovementVector();

    if (V.length(movementVec) !== 0) {
      this.facing = movementVec;

      this.getComponent(KinematicBody).moveAndSlide(
        V.multiply(movementVec, dt * this.playerSpeed)
      );
    }

    this.moveCamera(dt);

    this.setAnimation(movementVec);

    if (this.pearl.inputter.isKeyPressed(Keys.space)) {
      this.stab();
    }
  }

  private getMovementVector(): Vector2 {
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

    return uVelocity;
  }

  private getPointerMovement(viewPos: Vector2): Vector2 {
    const scaledViewPos = V.divide(
      viewPos,
      this.pearl.renderer.logicalScaleFactor
    );

    // translate mouse position relative to view center
    const viewCenter = this.pearl.renderer.getViewCenter();
    const viewSize = this.pearl.renderer.getViewSize();

    const worldPos = V.add(
      viewCenter,
      V.subtract(scaledViewPos, V.divide(viewSize, 2))
    );

    // get vector relative to player
    const phys = this.getComponent(Physical);
    const vector = V.subtract(worldPos, phys.center);

    return V.unit(vector);
  }

  private stab() {
    if (this.sword) {
      return;
    }

    this.sword = this.pearl.entities.add(
      swordFactory(this.pearl, { direction: this.facing })
    );

    this.gameObject.appendChild(this.sword);

    this.runCoroutine(function*(this: Player) {
      yield this.pearl.async.waitMs(300);
      this.pearl.entities.destroy(this.sword!);
      delete this.sword;
    });
  }

  private setAnimation(movementVec: Vector2) {
    const anim = this.getComponent(AnimationManager);
    const spriteRenderer = this.getComponent(SpriteRenderer);

    if (movementVec.x !== 0 || movementVec.y !== 0) {
      anim.set('walking');

      if (movementVec.x < 0) {
        spriteRenderer.scaleX = -1;
      } else if (movementVec.y > 0) {
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
