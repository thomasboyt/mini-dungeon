import {
  Component,
  createPearl,
  Sprite,
  GameObject,
  AnimationManager,
  Physical,
} from 'pearl';
import SpriteSheetAsset from './SpriteSheetAsset';

import TiledTileMap, { TiledLevelJSON, TiledTilesetJSON } from './TiledTileMap';

const level: TiledLevelJSON = require('../assets/level.json');
const tileset: TiledTilesetJSON = require('../assets/micro-dungeon.json');

class Game extends Component<null> {
  init() {
    this.pearl.entities.add(
      new GameObject({
        name: 'level',
        components: [
          new TiledTileMap({
            level,
            tileset,
            spriteSheet: this.pearl.assets.get(SpriteSheetAsset, 'sheet'),
          }),
        ],
      })
    );

    // const player = this.pearl.entities.add(new GameObject({
    //   name: 'player',
    //   components: [
    //     new AnimationManager({
    //       sheet: this.pearl.assets.get(SpriteSheetAsset, 'sheet'),
    //       initialState: 'idle',
    //       animations: {
    //         idle: {
    //           frames: [40],
    //           frameLengthMs: 0,
    //         },
    //       }
    //     }),
    //     new Physical({
    //       center:  {
    //         x: 6,
    //         y: 6,
    //       }
    //     }),
    //   ],
    // }));
  }
}

createPearl({
  rootComponents: [new Game()],
  width: 32,
  height: 32,
  backgroundColor: '#ccc',
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  assets: {
    sheet: new SpriteSheetAsset(require('../assets/sheet.png'), 4, 4),
  },
});
