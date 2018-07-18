import {
  Component,
  PolygonRenderer,
  PolygonCollider,
  GameObject,
  Physical,
} from 'pearl';
import KinematicBody from './KinematicBody';
import Arrow from './Arrow';

export default class ArrowSpawner extends Component<void> {
  init() {
    this.runCoroutine(function*(this: ArrowSpawner) {
      while (true) {
        this.createArrow();
        yield this.pearl.async.waitMs(1000);
      }
    });
  }

  createArrow() {
    const phys = this.getComponent(Physical);
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
          }),
          PolygonCollider.createBox({
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

    arrow.getComponent(PolygonCollider).isTrigger = true;
  }
}
