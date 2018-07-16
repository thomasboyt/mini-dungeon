import { SpriteSheet, Component } from 'pearl';

interface TiledObject {
  gid: number;
  x: number;
  y: number;
}

interface TiledTileLayer {
  type: 'tilelayer';
  data: number[];
  name: string;
}

interface TiledObjectLayer {
  type: 'objectgroup';
  name: string;
  objects: TiledObject[];
}

export interface TiledLevelJSON {
  layers: (TiledTileLayer | TiledObjectLayer)[];
  width: number;
  height: number;
  tileheight: number;
  tilewidth: number;
}

interface TiledTilesetTile {
  type: string;
}

export interface TiledTilesetJSON {
  tileheight: number;
  tilewidth: number;
  tiles: { [id: string]: TiledTilesetTile };
}

interface Settings {
  level: TiledLevelJSON;
  tileset: TiledTilesetJSON;
  spriteSheet: SpriteSheet;
}

export default class TiledTileMap extends Component<Settings> {
  create(settings: Settings) {
    // 1. create tiles from layers
    // 2. create objects and add as children
  }

  render(ctx: CanvasRenderingContext2D) {}
}
