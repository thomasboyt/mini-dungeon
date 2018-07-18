export enum ZIndex {
  // tiles, walls
  World = -2,
  // switch, pit.
  GroundObject,
  // keys, signs. this is the default zIndex!
  WorldObject,
  // players, enemies
  Character,
}
