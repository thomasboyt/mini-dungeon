import {
  SpriteSheet,
  Component,
  Sprite,
  GameObject,
  PolygonCollider,
  Coordinates,
  CollisionResponse,
  SpriteRenderer,
  Physical,
} from 'pearl';

import * as SAT from 'sat';

import {
  TiledLevelJSON,
  TiledTilesetJSON,
  TiledTileLayer,
  ObjectInfo,
  loadObject,
} from '../tiled';

interface TileCollisionInformation {
  activeEdges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

interface Settings {
  level: TiledLevelJSON;
  tileset: TiledTilesetJSON;
  spriteSheet: SpriteSheet;
  entityFactory: (type: string, objectInfo: ObjectInfo) => GameObject;
}

export default class TiledTileMap extends Component<Settings> {
  width!: number;
  height!: number;
  tileWidth!: number;
  tileHeight!: number;

  spriteSheet!: SpriteSheet;
  tileSprites: { [id: string]: Sprite } = {};

  tileLayers: TiledTileLayer[] = [];
  collisionMap: (TileCollisionInformation | null)[] = [];

  create(settings: Settings) {
    const { level, tileset, spriteSheet, entityFactory } = settings;
    this.spriteSheet = spriteSheet;

    this.width = level.width;
    this.height = level.height;
    this.tileWidth = level.tilewidth;
    this.tileHeight = level.tileheight;

    // NOTE: tilesets are 1-indexed. when multiple tilesets are supported, use
    // firstgid here
    for (let i = 0; i < tileset.tilecount; i += 1) {
      this.tileSprites[i + 1] = this.spriteSheet.createSprite(i);
    }

    for (let layer of level.layers) {
      if (layer.type === 'tilelayer') {
        this.tileLayers.push(layer);
      } else if (layer.type === 'objectgroup') {
        for (let object of layer.objects) {
          // TODO: handle flipping here
          const objectInfo = loadObject(object);
          const type = tileset.tiles[objectInfo.gid].type;
          const entity = entityFactory(type, objectInfo);

          entity.addComponent(
            new SpriteRenderer({
              sprite: this.tileSprites[objectInfo.gid + 1],
              scaleX: objectInfo.scaleX,
              scaleY: objectInfo.scaleY,
            })
          );

          entity.addComponent(
            new Physical({
              center: {
                x: objectInfo.topLeftX + objectInfo.width / 2,
                y: objectInfo.topLeftY + objectInfo.height / 2,
              },
            })
          );

          this.pearl.entities.add(entity);
          this.gameObject.appendChild(entity);
        }
      }
    }

    // create collision map
    const wallLayer = this.tileLayers.find((layer) => layer.name === 'Walls');

    if (!wallLayer) {
      throw new Error('missing layer for walls (should be called "Walls"');
    }

    this.collisionMap = wallLayer.data
      .map((item) => {
        if (item === 0) {
          return false;
        }

        const gid = item - 1;

        if (tileset.tiles[gid].type === 'wall') {
          return true;
        } else {
          return false;
        }
      })
      .map((isCollision, idx, arr) => {
        if (isCollision) {
          // check siblings
          const { x, y } = this.idxToCoordinates(idx);
          const north = arr[this.coordinatesToIdx(x, y - 1)];
          const south = arr[this.coordinatesToIdx(x, y + 1)];
          const west = arr[this.coordinatesToIdx(x - 1, y)];
          const east = arr[this.coordinatesToIdx(x + 1, y)];
          return {
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

  idxToCoordinates(idx: number): Coordinates {
    const tx = idx % this.width;
    const ty = Math.floor(idx / this.width);
    return { x: tx, y: ty };
  }

  coordinatesToIdx(x: number, y: number): number {
    return y * this.width + x;
  }

  // TODO: Allow non-rectangular tiles and don't use AABB collision, duh
  getCollision(collider: PolygonCollider): CollisionResponse | undefined {
    const aabb = collider.getBounds();

    for (let idx = 0; idx < this.collisionMap.length; idx += 1) {
      const collisionInfo = this.collisionMap[idx];
      if (!collisionInfo) {
        continue;
      }
      const tileCoordinates = this.idxToCoordinates(idx);

      const x = tileCoordinates.x * this.tileWidth;
      const y = tileCoordinates.y * this.tileHeight;

      const tilePoly = new SAT.Box(
        new SAT.Vector(x, y),
        this.tileWidth,
        this.tileHeight
      ).toPolygon();

      const resp = new SAT.Response();
      const collided = SAT.testPolygonPolygon(
        collider.getSATPolygon(),
        tilePoly,
        resp
      );

      if (collided && resp.overlap > 0) {
        const overlapVector: [number, number] = [
          resp.overlapV.x,
          resp.overlapV.y,
        ];
        const overlap = resp.overlap;
        return { overlapVector, overlap };
      }
    }
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    id: number,
    tx: number,
    ty: number
  ) {
    if (id === 0) {
      return;
    }

    return this.tileSprites[id].draw(
      ctx,
      tx * this.tileWidth,
      ty * this.tileHeight
    );
  }

  render(ctx: CanvasRenderingContext2D) {
    for (let layer of this.tileLayers) {
      for (let i = 0; i < layer.data.length; i += 1) {
        const id = layer.data[i];
        const { x, y } = this.idxToCoordinates(i);
        this.renderTile(ctx, id, x, y);
      }
    }
  }
}
