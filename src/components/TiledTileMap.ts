import {
  SpriteSheet,
  Component,
  Sprite,
  GameObject,
  Coordinates,
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
import TileMapCollider from './TileMapCollider';

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
          const objectInfo = loadObject(object);

          const resolvedType =
            objectInfo.objectType === 'tile'
              ? objectInfo.type || tileset.tiles[objectInfo.gid].type
              : objectInfo.type;

          if (!resolvedType) {
            throw new Error(`can't parse object without a type: ${objectInfo}`);
          }

          const entity = entityFactory(resolvedType, objectInfo);

          if (objectInfo.objectType === 'tile') {
            entity.addComponent(
              new SpriteRenderer({
                sprite: this.tileSprites[objectInfo.gid + 1],
                scaleX: objectInfo.scaleX,
                scaleY: objectInfo.scaleY,
              })
            );
          }

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

    this.getComponent(TileMapCollider).collisionMap = wallLayer.data
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
