let looping = false;

export function toggleLooping() {
  looping = !looping;
}

export const getLooping = () => looping;
