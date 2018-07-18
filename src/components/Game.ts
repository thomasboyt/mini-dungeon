import {
  Component,
  createPearl,
  Sprite,
  GameObject,
  AnimationManager,
  PolygonCollider,
  PolygonRenderer,
} from 'pearl';
import SpriteSheetAsset from '../SpriteSheetAsset';

import { TiledLevelJSON, TiledTilesetJSON, ObjectInfo } from '../tiled';
import TiledTileMap from './TiledTileMap';
import Player from './Player';
import Sign from './Sign';
import FallingRenderer from './FallingRenderer';
import DropZoneSwitch from './DropZoneSwitch';

const level: TiledLevelJSON = require('../../assets/level.json');
const tileset: TiledTilesetJSON = require('../../assets/micro-dungeon.json');

export default class Game extends Component<null> {
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
          tags: ['player'],
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
            new FallingRenderer(),
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
      } else if (type === 'switch') {
        return new GameObject({
          name: 'switch',
          tags: ['switch'],
          components: [
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
            new DropZoneSwitch({
              dropZoneConfig: {
                center: {
                  x: 11 * 4,
                  y: 7 * 4,
                },
                width: 8 * 4,
                height: 6 * 4,
              },
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
