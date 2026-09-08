export type Facing =
  | 'up'
  | 'up-right'
  | 'right'
  | 'down-right'
  | 'down'
  | 'down-left'
  | 'left'
  | 'up-left';

export interface MovementInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface MovementVector {
  x: number;
  y: number;
  facing: Facing | null;
}

/** Resolve opposing keys, eight-way facing, and constant-speed diagonals. */
export function resolveMovement(input: MovementInput): MovementVector {
  let x = 0;
  let y = 0;

  if (input.left !== input.right) x = input.left ? -1 : 1;
  if (input.up !== input.down) y = input.up ? -1 : 1;

  let facing: Facing | null = null;
  if (x === 1 && y === -1) facing = 'up-right';
  else if (x === 1 && y === 1) facing = 'down-right';
  else if (x === -1 && y === 1) facing = 'down-left';
  else if (x === -1 && y === -1) facing = 'up-left';
  else if (x === 1) facing = 'right';
  else if (x === -1) facing = 'left';
  else if (y === -1) facing = 'up';
  else if (y === 1) facing = 'down';

  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }

  return { x, y, facing };
}
