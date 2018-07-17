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
import Sign from './components/Sign';

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
            // slightly smaller
            PolygonCollider.createBox({
              width: 3.8,
              height: 3.8,
            }),
            new Player(),
          ],
        });
      } else if (type === 'key') {
        return new GameObject({
          name: 'key',
          tags: ['key'],
          components: [
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
          ],
        });
      } else if (type === 'door') {
        return new GameObject({
          name: 'door',
          tags: ['door'],
          components: [
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
          ],
        });
      } else if (type === 'sign') {
        return new GameObject({
          name: 'sign',
          tags: ['sign'],
          components: [
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
            new Sign({
              text: objectInfo.properties['text'],
            }),
          ],
        });
      } else {
        throw new Error(`unrecognized object type ${type}`);
      }
    };

    this.pearl.entities.add(
      new GameObject({
        name: 'level',
        zIndex: -1,
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

async function main() {
  const pearl = await createPearl({
    rootComponents: [new Game()],
    width: 32,
    height: 32,
    backgroundColor: 'black',
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    assets: {
      sheet: new SpriteSheetAsset(require('../assets/sheet.png'), 4, 4),
    },
  });

  pearl.renderer.scale(16); // 512 x 512
}

main();
