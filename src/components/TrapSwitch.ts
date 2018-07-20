import {
  Component,
  Physical,
  PolygonRenderer,
  GameObject,
  SpriteRenderer,
  Sprite,
  BoxCollider,
} from 'pearl';
import SpriteAsset from '../SpriteAsset';
import Trap from './Trap';

interface Settings {
  trapName: string;
}

export default class TrapSwitch extends Component<Settings> {
  pressed = false;
  trapName!: string;
  trap!: GameObject;
  player!: GameObject;

  pressedSprite!: Sprite;
  unpressedSprite!: Sprite;
  private deactivateCoroutine?: IterableIterator<undefined>;

  init(settings: Settings) {
    this.trapName = settings.trapName;
    this.pressedSprite = this.pearl.assets.get(SpriteAsset, 'pressedSwitch');
    this.unpressedSprite = this.getComponent(SpriteRenderer).sprite!;

    const player = this.pearl.entities.all('player')[0]!;
    this.player = player;
  }

  // XXX: This sucks!! Basically we can't look up the pit until after
  // initialization since this and pit are initialized on the same frame. This
  // really indicates that Pearl's lifecycle might need a further rethink. Maybe
  // all() should be able to return uninitialized entities? Or at least entities
  // that are going to be initialized on this frame?
  setTrap() {
    const trap = this.pearl.entities
      .all('trap')
      .find((obj) => obj.name === this.trapName);

    if (!trap) {
      throw new Error(
        `error creating switch: could not find trap of name ${this.trapName}`
      );
    }

    this.trap = trap;
  }

  update(dt: number) {
    if (!this.trap) {
      this.setTrap();
    }

    const playerColliding = this.player
      .getComponent(BoxCollider)
      .isColliding(this.getComponent(BoxCollider));

    if (playerColliding) {
      this.press();
    } else if (this.pressed) {
      this.unpress();
    }
  }

  press() {
    this.pressed = true;
    this.trap.getComponent(Trap).activate();
    this.getComponent(SpriteRenderer).sprite = this.pressedSprite;
  }

  unpress() {
    this.pressed = false;

    if (this.deactivateCoroutine) {
      this.cancelCoroutine(this.deactivateCoroutine);
    }

    this.deactivateCoroutine = this.runCoroutine(function*(this: TrapSwitch) {
      this.trap!.getComponent(Trap).deactivate();
      yield this.pearl.async.waitMs(1000);
      delete this.deactivateCoroutine;
      if (!this.pressed) {
        this.getComponent(SpriteRenderer).sprite = this.unpressedSprite;
      }
    });
  }
}
