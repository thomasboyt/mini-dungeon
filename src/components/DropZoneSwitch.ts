import {
  Component,
  Coordinates,
  Physical,
  PolygonCollider,
  PolygonRenderer,
  GameObject,
  SpriteRenderer,
  Sprite,
} from 'pearl';
import SpriteAsset from '../SpriteAsset';

interface DropZoneConfig {
  center: Coordinates;
  width: number;
  height: number;
}

interface Settings {
  dropZoneConfig: DropZoneConfig;
}

export default class DropZoneSwitch extends Component<Settings> {
  dropZoneConfig!: DropZoneConfig;
  dropZone?: GameObject;
  pressed = false;

  pressedSprite!: Sprite;
  unpressedSprite!: Sprite;

  init(settings: Settings) {
    this.dropZoneConfig = settings.dropZoneConfig;

    this.pressedSprite = this.pearl.assets.get(SpriteAsset, 'pressedSwitch');
    this.unpressedSprite = this.getComponent(SpriteRenderer).sprite!;
  }

  update(dt: number) {
    const player = this.pearl.entities.all('player')[0]!;

    if (
      player
        .getComponent(PolygonCollider)
        .isColliding(this.getComponent(PolygonCollider))
    ) {
      this.press();
    } else {
      this.unpress();
    }
  }

  press() {
    this.pressed = true;
    this.getComponent(SpriteRenderer).sprite = this.pressedSprite;
    if (!this.dropZone) {
      this.dropZone = this.createDropZone();
    }
  }

  unpress() {
    this.pressed = false;
    this.getComponent(SpriteRenderer).sprite = this.unpressedSprite;
    if (this.dropZone) {
      this.pearl.entities.destroy(this.dropZone);
      delete this.dropZone;
    }
  }

  createDropZone() {
    const config = this.dropZoneConfig;

    return this.pearl.entities.add(
      new GameObject({
        name: 'dropZone',
        tags: ['dropZone'],
        components: [
          new Physical({
            center: config.center,
          }),
          PolygonCollider.createBox({
            width: config.width,
            height: config.height,
          }),
          new PolygonRenderer({
            fillStyle: 'black',
          }),
        ],
      })
    );
  }
}
