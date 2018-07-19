import {
  Component,
  ICollider,
  PolygonCollider,
  CollisionResponse,
} from 'pearl';
import * as SAT from 'sat';
import TiledTileMap from './TiledTileMap';

interface TileCollisionInformation {
  polygon: SAT.Polygon;
  activeEdges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

export default class TileMapCollider extends Component<void>
  implements ICollider {
  isEnabled = true;
  isTrigger = false;

  collisionMap: (TileCollisionInformation | null)[] = [];

  create() {
    this.gameObject.registerCollider(this);
  }

  initializeCollisions(collisionMap: boolean[]) {
    const tileMap = this.getComponent(TiledTileMap);

    this.collisionMap = collisionMap.map((isCollision, idx, arr) => {
      if (isCollision) {
        // check siblings
        const { x, y } = tileMap.idxToCoordinates(idx);
        const north = arr[tileMap.coordinatesToIdx(x, y - 1)];
        const south = arr[tileMap.coordinatesToIdx(x, y + 1)];
        const west = arr[tileMap.coordinatesToIdx(x - 1, y)];
        const east = arr[tileMap.coordinatesToIdx(x + 1, y)];

        const worldX = x * tileMap.tileWidth;
        const worldY = y * tileMap.tileHeight;

        const polygon = new SAT.Box(
          new SAT.Vector(worldX, worldY),
          tileMap.tileWidth,
          tileMap.tileHeight
        ).toPolygon();

        return {
          polygon,
          activeEdges: {
            top: !north,
            left: !west,
            right: !east,
            bottom: !south,
          },
        };
      } else {
        return null;
      }
    });
  }

  isColliding(other: ICollider): boolean {
    return this.getCollision(other) !== null;
  }

  // TODO: Allow non-rectangular tiles
  // TODO: Support colliders other than PolygonCollider
  getCollision(collider: ICollider | SAT.Polygon): CollisionResponse | null {
    if (!this.isEnabled) {
      return null;
    }

    if (!(collider instanceof SAT.Polygon)) {
      if (!(collider instanceof PolygonCollider)) {
        throw new Error('non-PolygonColliders not supported yet');
      } else {
        if (!collider.isEnabled) {
          return null;
        }
      }
    }

    const poly =
      collider instanceof SAT.Polygon ? collider : collider.getSATPolygon();

    const tileMap = this.getComponent(TiledTileMap);

    for (let idx = 0; idx < this.collisionMap.length; idx += 1) {
      const collisionInfo = this.collisionMap[idx];
      if (!collisionInfo) {
        continue;
      }

      const tilePoly = collisionInfo.polygon;

      const resp = new SAT.Response();
      const collided = SAT.testPolygonPolygon(poly, tilePoly, resp);

      if (collided && resp.overlap > 0) {
        const overlapVector: [number, number] = [
          resp.overlapV.x,
          resp.overlapV.y,
        ];
        const overlap = resp.overlap;
        const aInB = resp.aInB;
        const bInA = resp.bInA;
        return { overlapVector, overlap, aInB, bInA };
      }
    }

    return null;
  }
}
