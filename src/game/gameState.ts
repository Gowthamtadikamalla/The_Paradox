export interface World1State {
  mirrorFound: boolean;
  stairsFound: boolean;
  clockFound: boolean;
  chamberUnlocked: boolean;
  solved: boolean;
}

export interface World2State {
  dampenerPickedUp: boolean;
  puzzleSolved: boolean;
}

export class GameState {
  world1: World1State = {
    mirrorFound: false,
    stairsFound: false,
    clockFound: false,
    chamberUnlocked: false,
    solved: false,
  };

  world2: World2State = {
    dampenerPickedUp: false,
    puzzleSolved: false,
  };

  inventory: string[] = [];
  currentWorld = 'world1';

  checkAllCluesFound(): boolean {
    return (
      this.world1.mirrorFound &&
      this.world1.stairsFound &&
      this.world1.clockFound
    );
  }

  addToInventory(item: string): void {
    if (!this.inventory.includes(item)) {
      this.inventory.push(item);
    }
  }

  reset(): void {
    this.world1 = {
      mirrorFound: false,
      stairsFound: false,
      clockFound: false,
      chamberUnlocked: false,
      solved: false,
    };
    this.world2 = {
      dampenerPickedUp: false,
      puzzleSolved: false,
    };
    this.inventory = [];
    this.currentWorld = 'world1';
  }
}
