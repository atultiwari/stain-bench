// World layout of the linear stainer. Units are about 1 px of the real thing:
// x runs along the bench (station 1 → 17), y toward the viewer, z up.
// Shared by the build (static art) and the page (live parts), so they always agree.

export const WIDTH = 940;
export const HEIGHT = 400;
export const VIEW_AZIMUTH = 72; // shows the long side; later stations sit nearer the viewer
export const VIEW_ELEVATION = 30;

export const PITCH = 42; // jar to jar
export const JAR = { w: 34, d: 40, h: 30, wall: 1.6, level: 24 };
export const jarX = (i) => i * PITCH; // centre of jar i (0-based)
export const JARS = 15;

export const BENCH = { x: -168, y: -54, w: 918, d: 108, r: 7 };
export const BENCH_H = 10;
export const TRAY = { x: -22, y: -25, w: jarX(JARS - 1) + 44, d: 50, r: 3 };

export const BOX = { x: -158, y: -24, w: 50, d: 44, r: 3 }; // control box at the left end
export const START_X = -PITCH; // station 1: the start tray, one pitch before jar 1
export const TRAY_START = { x: START_X - 19, y: -23, w: 38, d: 46, r: 3 };
export const TRAY_START_H = 3;
export const RACK_REST = TRAY_START_H + 0.4; // the rack sits in the start tray
export const BOX_H = 42;

export const TILE = { x: jarX(JARS - 1) + 40, y: -26, w: 82, d: 52, r: 3 }; // mounting tile
export const TILE_H = 4;
export const SLIDE_FLAT = { x: TILE.x + 14, y: 0 }; // where the picked slide lies, its pivot edge
export const DPX = [TILE.x + 66, -12];
export const COVERBOX = { x: TILE.x + 52, y: 6, w: 22, d: 14, r: 1 };

export const POST_Y = -46;
export const POSTS = [-94, jarX(JARS - 1) + 44];
export const BEAM = { x: POSTS[0] - 6, y: POST_Y - 6, w: POSTS[1] - POSTS[0] + 12, d: 12, r: 2 };
export const BEAM_Z = 122;
export const BEAM_H = 12;
export const ARM_Z = 124;
export const ARM_H = 6;
export const SLEEVE_Z = 98;

export const RACK = { w: 26, d: 34, plate: 18, hook: 30 };
export const RACK_DOWN = 3;
export const RACK_UP = 46;
export const ROD = 104; // rod length above the rack hook
export const SLIDES = 9;
export const slideX = (j) => -10 + j * 2.5; // slide j in rack-local x
export const SLIDE = { len: 30, tall: 12, t: 0.8 };

export const RUNNING = [5, 7, 9, 11]; // jars fed by running tap water (stations 7, 9, 11, 13)
export const PIPE_Y = -36;
export const PIPE_Z = 5;
export const PIPE_R = 2.4;
