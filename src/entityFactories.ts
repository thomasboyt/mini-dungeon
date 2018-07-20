import {
  GameObject,
  BoxCollider,
  KinematicBody,
  AnimationManager,
  PolygonRenderer,
  Physical,
  Vector2,
  PearlInstance,
  SpriteRenderer,
} from 'pearl';

import { ZIndex } from './types';
import SpriteSheetAsset from './SpriteSheetAsset';

import {
  TiledEntityFactory,
  TiledEntityFactories,
} from './components/TiledTileMap';

import Player from './components/Player';
import FallingRenderer from './components/FallingRenderer';
import ArrowSpawner from './components/ArrowSpawner';
import Pit from './components/Pit';
import Sign from './components/Sign';
import TrapSwitch from './components/TrapSwitch';
import Enemy from './components/Enemy';
import Arrow from './components/Arrow';
import SpriteAsset from './SpriteAsset';
import Sword from './components/Sword';

const player: TiledEntityFactory = (objectInfo, pearl) => {
  return new GameObject({
    name: 'player',
    tags: ['player'],
    zIndex: ZIndex.Character,
    components: [
      new AnimationManager({
        sheet: pearl.assets.get(SpriteSheetAsset, 'sheet'),
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
      new BoxCollider({
        width: 3.8,
        height: 3.8,
      }),
      new Player(),
      new KinematicBody(),
      new FallingRenderer(),
    ],
  });
};
const key: TiledEntityFactory = (objectInfo) => {
  return new GameObject({
    name: 'key',
    tags: ['key'],
    zIndex: ZIndex.WorldObject,
    components: [
      new BoxCollider({
        width: 4,
        height: 4,
      }),
    ],
  });
};

const door: TiledEntityFactory = (objectInfo) => {
  return new GameObject({
    name: 'door',
    tags: ['door'],
    zIndex: ZIndex.WorldObject,
    components: [
      new BoxCollider({
        width: 4,
        height: 4,
      }),
    ],
  });
};

const sign: TiledEntityFactory = (objectInfo) => {
  return new GameObject({
    name: 'sign',
    tags: ['sign'],
    zIndex: ZIndex.WorldObject,
    components: [
      new BoxCollider({
        width: 4,
        height: 4,
      }),
      new Sign({
        text: objectInfo.properties['text'],
      }),
    ],
  });
};

const trapSwitch: TiledEntityFactory = (objectInfo, pearl) => {
  const switchObj = new GameObject({
    name: 'switch',
    tags: ['switch'],
    zIndex: ZIndex.GroundObject,
    components: [
      new BoxCollider({
        width: 4,
        height: 4,
      }),
      new TrapSwitch({
        trapName: objectInfo.properties.trapName,
      }),
    ],
  });

  switchObj.getComponent(BoxCollider).isTrigger = true;

  return switchObj;
};

const enemyRed: TiledEntityFactory = (objectInfo, pearl) => {
  return new GameObject({
    name: 'enemyRed',
    tags: ['enemy'],
    zIndex: ZIndex.Character,
    components: [
      new AnimationManager({
        sheet: pearl.assets.get(SpriteSheetAsset, 'sheet'),
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
      new BoxCollider({
        width: 3.8,
        height: 3.8,
      }),
      new Enemy(),
      new KinematicBody(),
      new FallingRenderer(),
    ],
  });
};

const pit: TiledEntityFactory = (objectInfo, pearl) => {
  if (!objectInfo.name) {
    console.log(objectInfo);
    throw new Error('cannot create pit without name');
  }

  return new GameObject({
    name: objectInfo.name,
    tags: ['pit', 'trap'],
    zIndex: ZIndex.GroundObject,
    components: [
      new BoxCollider({
        width: objectInfo.width,
        height: objectInfo.height,
      }),
      new PolygonRenderer({
        fillStyle: 'black',
      }),
      new Pit(),
    ],
  });
};

const arrowSpawner: TiledEntityFactory = (objectInfo, pearl) => {
  if (!objectInfo.name) {
    console.log(objectInfo);
    throw new Error('cannot create arrowSpawner without name');
  }

  return new GameObject({
    name: objectInfo.name,
    tags: ['arrowSpawner', 'trap'],
    components: [
      new ArrowSpawner({
        angle: objectInfo.properties.angle,
      }),
    ],
  });
};

export const tiledEntityFactories: TiledEntityFactories = {
  player,
  key,
  door,
  sign,
  switch: trapSwitch,
  enemyRed,
  pit,
  arrowSpawner,
};

interface ArrowSettings {
  center: Vector2;
  angle: number;
}

export const arrowFactory = (settings: ArrowSettings): GameObject => {
  const { center, angle } = settings;

  return new GameObject({
    name: 'arrow',
    tags: ['arrow'],
    components: [
      new Physical({
        center,
        angle,
      }),
      new BoxCollider({
        width: 2,
        height: 1,
      }),
      new PolygonRenderer({
        fillStyle: 'red',
      }),
      new Arrow(),
      new KinematicBody(),
    ],
  });
};

interface SwordSettings {
  direction: Vector2;
}

export const swordFactory = (
  pearl: PearlInstance,
  settings: SwordSettings
): GameObject => {
  return new GameObject({
    name: 'sword',
    tags: ['sword'],
    components: [
      new Physical({
        angle: (45 + 90) * (Math.PI / 180),
      }),
      new BoxCollider({
        width: 4,
        height: 1,
      }),
      new SpriteRenderer({
        sprite: pearl.assets.get(SpriteAsset, 'sword'),
        scaleX: 1 / 4,
        scaleY: 1 / 4,
      }),
      new Sword({
        direction: settings.direction,
      }),
    ],
  });
};
