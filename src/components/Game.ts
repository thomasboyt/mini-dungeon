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
import PitSwitch from './PitSwitch';
import Enemy from './Enemy';
import KinematicBody from './KinematicBody';
import Pit from './Pit';
import ArrowSpawner from './ArrowSpawner';
import TileMapCollider from './TileMapCollider';

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
            new KinematicBody(),
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
        const switchObj = new GameObject({
          name: 'switch',
          tags: ['switch'],
          components: [
            PolygonCollider.createBox({
              width: 4,
              height: 4,
            }),
            new PitSwitch({
              pitName: objectInfo.properties.pitName,
            }),
          ],
        });

        switchObj.getComponent(PolygonCollider).isTrigger = true;

        return switchObj;
      } else if (type === 'enemyRed') {
        return new GameObject({
          name: 'enemyRed',
          tags: ['enemy'],
          components: [
            new AnimationManager({
              sheet: this.pearl.assets.get(SpriteSheetAsset, 'sheet'),
              initialState: 'idle',
              animations: {
                idle: {
                  frames: [32],
                  frameLengthMs: 0,
                },
                walking: {
                  frames: [32, 33],
                  frameLengthMs: 200,
                },
              },
            }),
            PolygonCollider.createBox({
              width: 3.8,
              height: 3.8,
            }),
            new Enemy(),
            new KinematicBody(),
            new FallingRenderer(),
          ],
        });
      } else if (type === 'pit') {
        if (!objectInfo.name) {
          console.log(objectInfo);
          throw new Error('cannot create pit without name');
        }

        return new GameObject({
          name: objectInfo.name,
          tags: ['pit'],
          components: [
            PolygonCollider.createBox({
              width: objectInfo.width,
              height: objectInfo.height,
            }),
            new PolygonRenderer({
              fillStyle: 'black',
            }),
            new Pit(),
          ],
        });
      } else if (type === 'arrowSpawner') {
        if (!objectInfo.name) {
          console.log(objectInfo);
          throw new Error('cannot create arrowSpawner without name');
        }

        return new GameObject({
          name: objectInfo.name,
          tags: ['arrowSpawner'],
          components: [new ArrowSpawner()],
        });
      } else {
        console.log(objectInfo);
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
          new TileMapCollider(),
        ],
      })
    );
  }
}
