import {
  SpriteSheet,
  Component,
  Sprite,
  GameObject,
  Vector2,
  SpriteRenderer,
  Physical,
  PearlInstance,
} from 'pearl';

import memoize from 'micro-memoize';
import { deepEqual } from 'fast-equals';

import {
  TiledLevelJSON,
  TiledTilesetJSON,
  TiledTileLayer,
  ObjectInfo,
  loadObject,
} from '../tiled';
import TileMapCollider, { ITileMap } from './TileMapCollider';

interface Settings {
  level: TiledLevelJSON;
  tileset: TiledTilesetJSON;
  spriteSheet: SpriteSheet;
  entityFactories: TiledEntityFactories;
}

export type TiledEntityFactory = (
  objectInfo: ObjectInfo,
  pearl: PearlInstance
) => GameObject;

export type TiledEntityFactories = {
  [type: string]: TiledEntityFactory | undefined;
};

export default class TiledTileMap extends Component<Settings>
  implements ITileMap {
  width!: number;
  height!: number;
  tileWidth!: number;
  tileHeight!: number;

  spriteSheet!: SpriteSheet;
  tileSprites: { [id: string]: Sprite } = {};

  tileLayers: TiledTileLayer[] = [];

  create(settings: Settings) {
    const { level, tileset, spriteSheet, entityFactories } = settings;
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

          const factory = entityFactories[resolvedType];

          if (!factory) {
            throw new Error(
              `no entity factory for object type ${resolvedType}`
            );
          }

          const entity = factory(objectInfo, this.pearl);

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

    const collisionMap = wallLayer.data.map((item) => {
      if (item === 0) {
        return false;
      }

      const gid = item - 1;

      if (tileset.tiles[gid].type === 'wall') {
        return true;
      } else {
        return false;
      }
    });

    this.getComponent(TileMapCollider).initializeCollisions(this, collisionMap);
  }

  idxToTileCoordinates(idx: number): Vector2 {
    const tx = idx % this.width;
    const ty = Math.floor(idx / this.width);
    return { x: tx, y: ty };
  }

  tileCoordinatesToIdx(tilePos: Vector2): number {
    return tilePos.y * this.width + tilePos.x;
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

  private _drawTiles(tileLayers: TiledTileLayer[]): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.tileWidth * this.width;
    canvas.height = this.tileHeight * this.height;
    const ctx = canvas.getContext('2d')!;

    for (let layer of tileLayers) {
      for (let i = 0; i < layer.data.length; i += 1) {
        const id = layer.data[i];
        const { x, y } = this.idxToTileCoordinates(i);
        this.renderTile(ctx, id, x, y);
      }
    }

    return canvas;
  }

  private drawTiles = memoize(this._drawTiles, { isEqual: deepEqual });

  // TODO: allow TiledTileMap to be positioned
  render(ctx: CanvasRenderingContext2D) {
    const canvas = this.drawTiles(this.tileLayers);
    ctx.drawImage(canvas, 0, 0);
  }
}
