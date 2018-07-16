import {
  Component,
  createPearl,
  Sprite,
  GameObject,
  AnimationManager,
  Physical,
  SpriteRenderer,
  PolygonCollider,
} from 'pearl';
import SpriteSheetAsset from './SpriteSheetAsset';

import { TiledLevelJSON, TiledTilesetJSON, ObjectInfo } from './tiled';
import TiledTileMap from './components/TiledTileMap';
import Player from './components/Player';

const level: TiledLevelJSON = require('../assets/level.json');
const tileset: TiledTilesetJSON = require('../assets/micro-dungeon.json');

class Game extends Component<null> {
  init() {
    const sheet = this.pearl.assets.get(SpriteSheetAsset, 'sheet');

    const entityFactory = (
      type: string,
      objectInfo: ObjectInfo
    ): GameObject => {
      const x = objectInfo.topLeftX + 2;
      const y = objectInfo.topLeftY + 2;

      if (type === 'player') {
        return new GameObject({
          name: 'player',
          components: [
            new AnimationManager({
              sheet: this.pearl.assets.get(SpriteSheetAsset, 'sheet'),
              initialState: 'idle',
              animations: {
                idle: {
                  frames: [40],
                  frameLengthMs: 0,
                },
                walking: {
                  frames: [41, 40],
                  frameLengthMs: 200,
                },
              },
            }),
            new Physical({
              center: {
                x,
                y,
              },
            }),
            // slightly smaller
            PolygonCollider.createBox({
              width: 3.9,
              height: 3.9,
            }),
            new Player(),
          ],
        });
      } else if (type === 'key') {
        return new GameObject({
          name: 'key',
          tags: ['key'],
          components: [
            new Physical({
              center: { x, y },
            }),
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
            new SpriteRenderer({
              sprite: sheet.createSprite(29),
            }),
          ],
        });
      } else if (type === 'door') {
        const obj = new GameObject({
          name: 'door',
          tags: ['door'],
          components: [
            new Physical({
              center: { x, y },
            }),
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
            new SpriteRenderer({
              sprite: sheet.createSprite(28),
            }),
          ],
        });

        obj.getComponent(SpriteRenderer).scaleX = objectInfo.scaleX;
        obj.getComponent(SpriteRenderer).scaleY = objectInfo.scaleY;
        return obj;
      } else {
        throw new Error(`unrecognized object type ${type}`);
      }
    };

    this.pearl.entities.add(
      new GameObject({
        name: 'level',
        components: [
          new TiledTileMap({
            level,
            tileset,
            spriteSheet: sheet,
            entityFactory: entityFactory,
          }),
        ],
      })
    );
  }
}

createPearl({
  rootComponents: [new Game()],
  width: 32,
  height: 32,
  backgroundColor: 'black',
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  assets: {
    sheet: new SpriteSheetAsset(require('../assets/sheet.png'), 4, 4),
  },
});
