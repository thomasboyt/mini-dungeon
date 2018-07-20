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
import { arrowFactory } from '../entityFactories';

interface ArrowSpawnerSettings {
  angle: number;
}

export default class ArrowSpawner extends Trap<ArrowSpawnerSettings> {
  fireDelayMs = 1000;
  private spawnCoroutine?: IterableIterator<undefined>;
  private angle!: number;
  private lastFireTime: number = 0;

  create(settings: ArrowSpawnerSettings) {
    this.angle = settings.angle;
  }

  activate() {
    if (this.spawnCoroutine) {
      return;
    }

    this.spawnCoroutine = this.runCoroutine(function*(this: ArrowSpawner) {
      while (true) {
        // Prevent firing more than fireDelayMs by walking off and stepping on
        // the switch over and over again
        if (Date.now() - this.lastFireTime < this.fireDelayMs) {
          yield this.pearl.async.waitMs(
            this.fireDelayMs - (Date.now() - this.lastFireTime)
          );
        }

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
      arrowFactory({ center: phys.center, angle })
    );

    arrow.getComponent(BoxCollider).isTrigger = true;
  }
}
