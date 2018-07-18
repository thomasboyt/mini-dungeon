import {
  Component,
  Coordinates,
  Physical,
  PolygonCollider,
  GameObject,
  CollisionResponse,
} from 'pearl';

import TiledTileMap from './TiledTileMap';

export interface CollisionInformation {
  object: GameObject;
  response: CollisionResponse;
  isTrigger: boolean;
}

export default class Character extends Component<null> {
  moveAndCollide(vec: Coordinates): CollisionInformation[] {
    const xCollisions = this.moveAndCollideAxis('x', vec.x);
    const yCollisions = this.moveAndCollideAxis('y', vec.y);
    // remove duplicates
    const collisions = new Set([...xCollisions, ...yCollisions]);
    return [...collisions];
  }

  private moveAndCollideAxis(
    axis: 'x' | 'y',
    vec: number
  ): CollisionInformation[] {
    const phys = this.getComponent(Physical);
    const tileMap = this.gameObject.parent!.getComponent(TiledTileMap);

    const prevCenter = { ...phys.center };

    const translateVec = axis === 'x' ? { x: vec, y: 0 } : { x: 0, y: vec };
    phys.translate(translateVec);

    const collisions = this.getCollisions();

    const solidCollisions = collisions.filter(
      (collision) => !collision.isTrigger
    );

    if (solidCollisions.length > 0) {
      phys.center = prevCenter;
    }

    return collisions;
  }

  private getCollisions() {
    const thisCollider = this.getComponent(PolygonCollider);

    const tileMap = this.gameObject.parent!.getComponent(TiledTileMap);

    const colliders = this.pearl.entities
      .all()
      .filter((entity) => entity !== this.gameObject)
      .map((entity) => entity.maybeGetComponent(PolygonCollider))
      .filter((collider) => collider !== null) as PolygonCollider[];

    const collidables = [...colliders, tileMap];

    return collidables
      .map((collidable) => {
        let response: CollisionResponse | null;
        let isTrigger = false;

        if (collidable instanceof PolygonCollider) {
          response = collidable.getCollision(thisCollider);
          isTrigger = collidable.isTrigger;
        } else {
          response = collidable.getCollision(thisCollider);
        }

        if (!response) {
          return null;
        }

        const collisionInformation: CollisionInformation = {
          object: collidable.gameObject,
          isTrigger,
          response,
        };

        return collisionInformation;
      })
      .filter((collision) => collision !== null) as CollisionInformation[];
  }
}
