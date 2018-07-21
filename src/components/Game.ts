import { Component, createPearl, GameObject, SpriteSheetAsset } from 'pearl';

import { tiledEntityFactories } from '../entityFactories';
import { TiledLevelJSON, TiledTilesetJSON } from '../tiled';
import { ZIndex } from '../types';

import TiledTileMap from './TiledTileMap';
import TileMapCollider from './TileMapCollider';

const level: TiledLevelJSON = require('../../assets/level.json');
const tileset: TiledTilesetJSON = require('../../assets/micro-dungeon.json');

export default class Game extends Component<null> {
  init() {
    const sheet = this.pearl.assets.get(SpriteSheetAsset, 'sheet');

    this.pearl.entities.add(
      new GameObject({
        name: 'level',
        zIndex: ZIndex.World,
        components: [
          new TiledTileMap({
            level,
            tileset,
            spriteSheet: sheet,
            entityFactories: tiledEntityFactories,
          }),
          new TileMapCollider(),
        ],
      })
    );
  }
}
