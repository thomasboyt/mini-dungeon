import {
  Component,
  Coordinates,
  Physical,
  PolygonCollider,
  GameObject,
  CollisionResponse,
  ICollider,
} from 'pearl';

import TiledTileMap from './TiledTileMap';

export interface CollisionInformation {
  object: GameObject;
  response: CollisionResponse;
  isTrigger: boolean;
}

export default class KinematicBody extends Component<null> {
  moveAndCollide(vec: Coordinates): CollisionInformation[] {
    const phys = this.getComponent(Physical);

    const prevCenter = { ...phys.center };
    phys.translate(vec);

    const collisions = this.getCollisions();

    const solidCollisions = collisions.filter(
      (collision) => !collision.isTrigger
    );

    if (solidCollisions.length > 0) {
      phys.center = prevCenter;
    }

    return collisions;
  }

  // TODO: This doesn't quite "slide" the way it probably should yet. A true
  // slide would be that, if e.g. you were going northeast and were blocked by a
  // wall on the west, you would then slide north with the _full magnitude of
  // your velocity_, rather than _just the x component_ as happens here.
  //
  // Godot does this by saying "if there's a collision, use
  // `velocity.slide(collision.normal)`", but I'm not sure how this works when
  // it's possible to have multiple collisions at once.
  //
  // Notably, fixing this would solve some bugs around moving around corners, I
  // think? Especially for AI.
  moveAndSlide(vec: Coordinates): CollisionInformation[] {
    const xCollisions = this.moveAndCollide({ x: vec.x, y: 0 });
    const yCollisions = this.moveAndCollide({ x: 0, y: vec.y });
    // remove duplicates
    const collisions = new Set([...xCollisions, ...yCollisions]);
    return [...collisions];
  }

  private getCollisions() {
    const thisCollider = this.getComponent(PolygonCollider);

    const colliders = this.pearl.entities
      .all()
      .filter((entity) => entity !== this.gameObject)
      .map((entity) => entity.collider)
      .filter((collider) => collider) as ICollider[];

    return colliders
      .map((collider) => {
        let response: CollisionResponse | null;
        let isTrigger = false;

        if (collider instanceof PolygonCollider) {
          response = collider.getCollision(thisCollider);
          isTrigger = collider.isTrigger;
        } else {
          response = collider.getCollision(thisCollider);
        }

        if (!response) {
          return null;
        }

        const collisionInformation: CollisionInformation = {
          object: collider.gameObject,
          isTrigger,
          response,
        };

        return collisionInformation;
      })
      .filter((collision) => collision !== null) as CollisionInformation[];
  }
}
