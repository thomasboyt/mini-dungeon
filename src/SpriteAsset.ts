import { AssetBase, Sprite } from '../../pearl/dist';

export default class SpriteAsset extends AssetBase<Sprite> {
  constructor(path: string) {
    super(path);
  }

  load(path: string) {
    return new Promise<Sprite>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(this.createSprite(img));
      img.onerror = (evt) => reject(evt.error);
      img.src = path;
    });
  }

  private createSprite(img: HTMLImageElement): Sprite {
    return new Sprite(img, 0, 0, img.width, img.height);
  }
}
