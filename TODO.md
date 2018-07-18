Bugs

- [ ] Fix pit being destroyed before entities have finished falling in
  - Maybe some kind of check like if (this.fallingEntities.length > 0) { /* wait  */}
  - Some kind of animation when pit opens/closes to help? Two trap doors swing out/in. If entities falling when swinging back shut, close over entity?
    - zIndex will be tricky... pit should be under entity, but doors should be over
    - doors should be child entities of pit, I guess, with higher zIndex