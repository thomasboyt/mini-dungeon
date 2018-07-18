import { createPearl } from 'pearl';
import Game from './components/Game';
import SpriteSheetAsset from './SpriteSheetAsset';
import SpriteAsset from './SpriteAsset';

async function main() {
  const pearl = await createPearl({
    rootComponents: [new Game()],
    width: 64,
    height: 48,
    backgroundColor: 'black',
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    assets: {
      sheet: new SpriteSheetAsset(require('../assets/sheet.png'), 4, 4),
      sword: new SpriteAsset(require('../assets/sword2.png')),
      pressedSwitch: new SpriteAsset(require('../assets/pressed.png')),
    },
  });

  pearl.renderer.scale(5); // 320 x 240
}

main();
