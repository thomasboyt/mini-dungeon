import {
  Component,
  Keys,
  Physical,
  AnimationManager,
  PolygonCollider,
  Coordinates,
  GameObject,
  SpriteRenderer,
} from 'pearl';
import TiledTileMap from './TiledTileMap';
import Sign from './Sign';

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export default class Player extends Component<null> {
  playerSpeed = 0.01;

  hasKey: boolean = false;

  init() {
    this.pearl.renderer.setViewCenter(this.getComponent(Physical).center);
  }

  update(dt: number) {
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

    this.setAnimation(xVec, yVec);

    this.moveAndCollide({
      x: xVec * dt * this.playerSpeed,
      y: yVec * dt * this.playerSpeed,
    });

    this.moveCamera(dt);

    this.checkCollisions();
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

  private moveAndCollide(vec: Coordinates) {
    this.moveAndCollideAxis('x', vec.x);
    this.moveAndCollideAxis('y', vec.y);
  }

  private moveAndCollideAxis(axis: 'x' | 'y', vec: number) {
    const phys = this.getComponent(Physical);
    const tileMap = this.gameObject.parent!.getComponent(TiledTileMap);

    const prevCenter = { ...phys.center };

    const translateVec = axis === 'x' ? { x: vec, y: 0 } : { x: 0, y: vec };
    phys.translate(translateVec);

    const tileMapCollision = tileMap.getCollision(
      this.getComponent(PolygonCollider)
    );

    if (tileMapCollision) {
      phys.center = prevCenter;
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

  private checkCollisions() {
    const collider = this.getComponent(PolygonCollider);

    const keys = this.pearl.entities.all('key');
    const doors = this.pearl.entities.all('door');
    const signs = this.pearl.entities.all('sign');

    for (let key of keys) {
      if (collider.isColliding(key.getComponent(PolygonCollider))) {
        this.pearl.entities.destroy(key);
        this.hasKey = true;
      }
    }

    for (let door of doors) {
      if (collider.isColliding(door.getComponent(PolygonCollider))) {
        if (this.hasKey) {
          this.pearl.entities.destroy(door);
          this.hasKey = false;
        } else {
          // TODO: I think this should actually happen as part of
          // moveAndCollide(), but I'm not sure how to structure that yet.
          //
          // In a lot of systems moveAndCollide() only covers moving into static
          // objects, and then you need to check dynamic objects elsewhere, I
          // think?
          //
          // This might be something to punt on until collisions are overhauled,
          // tbh?
          const collision = collider.getCollision(
            door.getComponent(PolygonCollider)
          )!;

          this.getComponent(Physical).translate({
            x: -collision.overlapVector[0],
            y: -collision.overlapVector[1],
          });
        }
      }
    }
    for (let sign of signs) {
      if (collider.isColliding(sign.getComponent(PolygonCollider))) {
        // ... see above
        const collision = collider.getCollision(
          sign.getComponent(PolygonCollider)
        )!;

        this.getComponent(Physical).translate({
          x: -collision.overlapVector[0],
          y: -collision.overlapVector[1],
        });

        sign.getComponent(Sign).showText();
      }
    }
  }
}
