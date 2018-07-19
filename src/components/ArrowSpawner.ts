import {
  Component,
  PolygonRenderer,
  GameObject,
  Physical,
  KinematicBody,
  BoxCollider,
} from 'pearl';
import Arrow from './Arrow';
import Trap from './Trap';

interface ArrowSpawnerSettings {
  angle: number;
}

export default class ArrowSpawner extends Trap<ArrowSpawnerSettings> {
  private spawnCoroutine?: IterableIterator<undefined>;
  private angle!: number;

  create(settings: ArrowSpawnerSettings) {
    this.angle = settings.angle;
  }

  activate() {
    if (this.spawnCoroutine) {
      return;
    }

    this.spawnCoroutine = this.runCoroutine(function*(this: ArrowSpawner) {
      while (true) {
        this.createArrow();
        yield this.pearl.async.waitMs(1000);
      }
    });
  }

  deactivate() {
    this.cancelCoroutine(this.spawnCoroutine!);
    delete this.spawnCoroutine;
  }

  private createArrow() {
    const phys = this.getComponent(Physical);
    const angle = this.angle * (Math.PI / 180);
    const arrow = this.pearl.entities.add(
      new GameObject({
        name: 'arrow',
        tags: ['arrow'],
        components: [
          new Physical({
            center: {
              x: phys.center.x,
              y: phys.center.y,
            },
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
      })
    );

    arrow.getComponent(BoxCollider).isTrigger = true;
  }
}
