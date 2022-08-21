# js13k
- Norman tries to defend himself from the local villagers
- Make magic feel like magic
  - Glyphs, cooldowns, screenshake
- Villager just runs at norman
- Brute walks, takes more hits
- Archer walks then shoots and repeats
- Priest buries corpses before norman can resurrect them
- Healer heals those around them
- Noble causes those around to speed up
- Paladin kills skeletons in one hit
- Green Fire (1 damage to targets)
- Skullerang (1 damage but boomerangs)
- Timed bomb
- Air strike
- Zap
- Claws from below
- Wave
- Ectocannon (slowing slime)
- Bloodwell
- Miasma
- Homing soulmass
- Mines
- Skull bowling
- Ghosts that go through people
- Bouncing causes projectiles to do less damage
- Better to have fewer weapons and more upgrades?
- Passives
  - At the end of the round, player can choose 1/3 scrolls to read which grant passive benefits during the next level.

## Diary
### Day 1
Ok. The base idea is very fun. Getting enough game logic in might be a challenge though.

The spells will be what makes this game. Particle effects are going to be a critical part of that.

- Projectile launch should be based on angle and speed, not a vector.
- Think about how to make sprites stick to the floor
- Collisions should be rects/AABBs.
- Glyphs circling around norman when ready to cast
- Need to think more about necromancy and less about wizard spells
- People are too floaty without animations
  - Try sprite bobbing
  - Maybe they should hop instead of continuous moving?
- People should gradually speed up and increase in frequency

Todo:
- [x] Render loop with dt
- [x] Decide on object format
- [x] Particle system
- [x] View system from tickles
- [x] Font rendering

### Day 2
Getting towards having a game. Spent a stupid amount of time trying to get collision working correctly because of issues with the coordinate system. There's a rough architecture coming together but not super happy with all of it. Suspect there will be at least one big rewrite during this project.

Missing mechanics:
- Villagers attacking norman and lose state.
- Secondary spell for resurrections
- Skeletons that attack villagers
- Souls as currency
- Defined rounds/waves with rewards

Particles are looking good and the hopping style seems to work ok. Behavioural extraction for unit types and spell types is good.

- Wider range of spell types
- Primary/secondary spells

### Day 3
Nice progress already. Sorted out the internal systems for abilities and got resurrection working. Getting close to having the core loop done.

- Round ending mechanics
- Upgrades/mutations
  - Hades model where boons can be applied then the boons themselves levelled up?
- Consumables
  - Restore health
  - Souls buff

Restart mechanics. "Norman did what any self respecting necromancer would do. He brought himself back..."

### Day 4
Only did 40 mins on the game today, busy with work and interviews. Added the priest class with the "healing" behaviour.

Might be more sensible to implement behaviours in terms of "turns" rather than ms cooldown. Then behaviours don't need to know about the object's game speed. Split behaviours out from the GameObject class so that its easy to have actions that are taken every N turns. Not sure that behaviours is the best terminology though.

Turned "march" into a behaviour which feels good. Now skeletons/villagers share the movement logic.

- Resurrect is way too powerful. Needs to start by only resurrecting the nearest skeleton to you I think. Upgrades would increase that number.
- Need to fix the bug with jumping bones
- Later waves should have regular villagers with higher base health
- Villagers should start to drop stuff already

### Day 5
- Figure out the wave structures
- Award different soul amounts for different enemies

### Day 6
Nothing.

### Day 7
Reworking the engine to focus on single spell/ability depth.
- [ ] Need to figure out how to get mouse input relative to the scene.

### Day 8
- [ ] Should behaviour be an interface `unit.addBehaviour({ onCollision: ... })`
