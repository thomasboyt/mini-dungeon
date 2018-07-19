import {
  Component,
  CollisionResponse,
  PolygonShape,
  Collider,
  CollisionShape,
  Position,
} from 'pearl';
import TiledTileMap from './TiledTileMap';

interface TileCollisionInformation {
  polygon: PolygonShape;
  position: Position;
  activeEdges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

export default class TileMapCollider extends Collider {
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

        const polygon = PolygonShape.createBox({
          width: tileMap.tileWidth,
          height: tileMap.tileHeight,
        });

        return {
          polygon,
          position: {
            center: {
              x: worldX + tileMap.tileWidth / 2,
              y: worldY + tileMap.tileHeight / 2,
            },
          },
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

  // TODO: Allow non-rectangular tiles
  // TODO: Support colliders other than PolygonCollider
  testShape(shape: CollisionShape, otherPosition: Position) {
    const tileMap = this.getComponent(TiledTileMap);

    for (let idx = 0; idx < this.collisionMap.length; idx += 1) {
      const collisionInfo = this.collisionMap[idx];
      if (!collisionInfo) {
        continue;
      }

      const tilePolygonShape = collisionInfo.polygon;

      // TODO: should this be inverted?
      const resp = tilePolygonShape.testShape(
        shape,
        collisionInfo.position,
        otherPosition
      );

      if (resp && resp.overlap > 0) {
        const overlapVector: [number, number] = [
          resp.overlapVector[0],
          resp.overlapVector[1],
        ];
        const overlap = resp.overlap;
        const aInB = resp.aInB;
        const bInA = resp.bInA;
        return { overlapVector, overlap, aInB, bInA };
      }
    }
  }
}
