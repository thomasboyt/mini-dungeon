- [ ] Load level & tileset
- [ ] Render ground & wall tiles
- [ ] Create collision map from wall tiles (lives in TileMap)
  - [ ] Seam flagging
    - https://github.com/thomasboyt/blorp/blob/9666bcf09c2c21b42255ad1a648c7240391e9f50/src/entities/World.js#L138
- [ ] Create objects from object layer

game:

- run into room with enemy
- trigger enemy pathfinding by getting close
- run back to switch and pull
- floor drops out
  - render black rectangle over floor tiles
- if enemy is within floor-drop-out zone, falls down and dies
  - do a goofy decreasing scale over time to indicate falling :)
