import {
  Component,
  Coordinates,
  Physical,
  PolygonRenderer,
  GameObject,
  SpriteRenderer,
  Sprite,
  PolygonCollider,
} from 'pearl';
import SpriteAsset from '../SpriteAsset';
import Pit from './Pit';

interface Settings {
  pitName: string;
}

export default class DropZoneSwitch extends Component<Settings> {
  pressed = false;
  pitName!: string;
  pit!: GameObject;

  pressedSprite!: Sprite;
  unpressedSprite!: Sprite;
  private closePitCoroutine?: IterableIterator<undefined>;

  init(settings: Settings) {
    this.pitName = settings.pitName;
    this.pressedSprite = this.pearl.assets.get(SpriteAsset, 'pressedSwitch');
    this.unpressedSprite = this.getComponent(SpriteRenderer).sprite!;
  }

  // XXX: This sucks!! Basically we can't look up the pit until after
  // initialization since this and pit are initialized on the same frame. This
  // really indicates that Pearl's lifecycle might need a further rethink. Maybe
  // all() should be able to return entities components? Or at least entities
  // that are going to be initialized on this frame?
  setPit() {
    const pit = this.pearl.entities
      .all('pit')
      .find((obj) => obj.name === this.pitName);

    if (!pit) {
      throw new Error(
        `error creating switch: could not find pit of name ${this.pitName}`
      );
    }

    this.pit = pit;
  }

  update(dt: number) {
    if (!this.pit) {
      this.setPit();
    }

    const player = this.pearl.entities.all('player')[0]!;

    if (
      player
        .getComponent(PolygonCollider)
        .isColliding(this.getComponent(PolygonCollider))
    ) {
      this.press();
    } else if (this.pressed) {
      this.unpress();
    }
  }

  press() {
    this.pressed = true;
    this.getComponent(SpriteRenderer).sprite = this.pressedSprite;

    this.pit.getComponent(Pit).activate();

    if (this.closePitCoroutine) {
      this.cancelCoroutine(this.closePitCoroutine);
    }
  }

  unpress() {
    this.pressed = false;

    this.closePitCoroutine = this.runCoroutine(function*(this: DropZoneSwitch) {
      this.pit!.getComponent(Pit).deactivate();
      yield this.pearl.async.waitMs(1000);
      this.getComponent(SpriteRenderer).sprite = this.unpressedSprite;
    });
  }
}
