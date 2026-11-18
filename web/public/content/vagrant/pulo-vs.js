// Vagrant Story's jump as the game plays it: there is no jump clip. The engine blends five one-frame poses of the
// character's own SEQ while it moves the body on a gravity arc (BATTLE.PRG func_800AC690). See pulo-LEIAME.md.
import { AnimationClip, VectorKeyframeTrack, LoopRepeat } from './src/three.js';

// Pose slot per phase and take-off. impulso/topo/queda/pouso are the tables at BATTLE.PRG 0x80AE8, 0x80AF0, 0x80AF8
// and 0x80B00 (D_800E92E8..D_800E9300, columns 0 to 2 = standing, walking, running); agacha is slot 47, the crouch
// played before the take-off (3A1A0.c func_800A48CC) and when the floor drops away (38C1C.c func_800A25EC).
export const SLOTS = {
  parado: { agacha: 47, impulso: 44, topo: 49, queda: 45, pouso: 46 },
  andando: { agacha: 47, impulso: 48, topo: 49, queda: 50, pouso: 51 },
  correndo: { agacha: 47, impulso: 53, topo: 54, queda: 55, pouso: 56 },
};
// Blend into each pose in game frames: the 4th argument of func_800A0204 at each call; 'parado' is the return to idle.
export const MISTURA = { agacha: 4, impulso: 8, topo: 16, queda: 8, pouso: 8, parado: 8 };
// ponytail: one game frame taken as 1/30 s (the NTSC field rate halved); tune here if the blends feel slow or fast.
export const QUADRO = 1 / 30;
// The arc of func_800AC690: take-off speed -30 per frame, gravity +3 per frame, 'topo' while |speed| <= 9.
// In VS units (128 = one tile): about 10 frames up and 165 units (1.3 tiles) high.
export const VOO = { v0: 30, g: 3, topo: 9 };

// Builds the pose clips of one character: { agacha, impulso, topo, queda, pouso } (AnimationClip), or null when its SEQ
// lacks one of the poses. seq is the ZUD's z.bt || z.com after z.build(); modo is 'parado', 'andando' or 'correndo'.
// Each pose carries a root position track: SEQAnimation drops the SEQ's root translation, but these poses differ from
// idle mostly in hip height, so without it the crouch would lift the feet instead of lowering the hips.
export function posesDoPulo(seq, modo = 'parado') {
  const idle = seq.animations[seq.slots[1]] || seq.animations[0], poses = {};
  for (const [fase, slot] of Object.entries(SLOTS[modo])) {
    const a = seq.animations[seq.slots[slot]];
    if (seq.slots[slot] === 255 || !a) return null;
    const d = ['x', 'y', 'z'].map((k) => a.translation[k] - idle.translation[k]);
    const c = a.animationClip.clone(); c.name = 'pulo-' + fase;
    c.tracks.push(new VectorKeyframeTrack('.bones[0].position', [0], d));
    c.duration = Math.max(c.duration, QUADRO); poses[fase] = c;
  }
  return poses;
}

// Phase for a vertical speed while airborne (speed in the game's sense: up is positive here, units per game frame).
export function faseDoVoo(vy) {
  return Math.abs(vy) <= VOO.topo ? 'topo' : vy > 0 ? 'impulso' : 'queda';
}

// Cross-fades the unit to a pose with the game's blend time. u = { mixer, mesh, action }: the same fields the lab
// pages keep per character; u.action becomes the pose so the page's next toca()/proximo() stops it as usual.
export function poePose(u, poses, fase) {
  const nova = u.mixer.clipAction(poses[fase], u.mesh);
  if (u.action === nova) return nova;
  nova.reset().setLoop(LoopRepeat).play();
  if (u.action) nova.crossFadeFrom(u.action, MISTURA[fase] * QUADRO, false);
  u.action = nova;
  return nova;
}
