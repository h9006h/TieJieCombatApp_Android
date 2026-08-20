"""Generate an original, sample-free battle music preview for TieJieCombat.

The renderer intentionally uses only mathematical synthesis and deterministic
noise.  It does not import recordings, loops, melodies, or third-party assets.
"""

from __future__ import annotations

import json
import math
import wave
from hashlib import sha256
from pathlib import Path

import numpy as np


SAMPLE_RATE = 44_100
BPM = 148
BEAT = 60.0 / BPM
BAR = BEAT * 4
BARS = 32
TAIL_SECONDS = 2.2
DURATION = BARS * BAR + TAIL_SECONDS
TOTAL_SAMPLES = int(DURATION * SAMPLE_RATE)
RNG = np.random.default_rng(0x1A0B_2026)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "previews" / "audio"
OUTPUT_WAV = OUTPUT_DIR / "iron-blood-uprising-v4-majestic-suona.wav"
OUTPUT_META = OUTPUT_DIR / "iron-blood-uprising-v4-majestic-suona.json"

master = np.zeros((2, TOTAL_SAMPLES), dtype=np.float32)
music_bus = np.zeros_like(master)


def midi(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def adsr(length: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    attack_n = min(length, max(1, int(attack * SAMPLE_RATE)))
    decay_n = min(length - attack_n, max(1, int(decay * SAMPLE_RATE)))
    release_n = min(length - attack_n - decay_n, max(1, int(release * SAMPLE_RATE)))
    sustain_n = max(0, length - attack_n - decay_n - release_n)
    parts = [
        np.linspace(0.0, 1.0, attack_n, endpoint=False, dtype=np.float32),
        np.linspace(1.0, sustain, decay_n, endpoint=False, dtype=np.float32),
        np.full(sustain_n, sustain, dtype=np.float32),
        np.linspace(sustain, 0.0, release_n, dtype=np.float32),
    ]
    env = np.concatenate(parts)
    if len(env) < length:
        env = np.pad(env, (0, length - len(env)))
    return env[:length]


def harmonic_tone(
    frequency: float,
    seconds: float,
    harmonics: list[tuple[int, float]],
    attack: float,
    decay: float,
    sustain: float,
    release: float,
    vibrato: float = 0.0,
) -> np.ndarray:
    length = max(1, int(seconds * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    phase = 2 * np.pi * frequency * t
    if vibrato:
        phase += vibrato * np.sin(2 * np.pi * 5.4 * t)
    sound = np.zeros(length, dtype=np.float32)
    phase_seed = RNG.uniform(-0.08, 0.08)
    for multiple, amplitude in harmonics:
        sound += amplitude * np.sin(phase * multiple + phase_seed * multiple)
    sound /= max(1.0, sum(abs(amplitude) for _, amplitude in harmonics))
    return sound * adsr(length, attack, decay, sustain, release)


def add(sound: np.ndarray, start: float, gain: float = 1.0, pan: float = 0.0, bus=master) -> None:
    begin = max(0, int(start * SAMPLE_RATE))
    end = min(TOTAL_SAMPLES, begin + len(sound))
    if end <= begin:
        return
    sound = sound[: end - begin] * gain
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    bus[0, begin:end] += sound * math.cos(angle)
    bus[1, begin:end] += sound * math.sin(angle)


def filtered_noise(seconds: float, brightness: float = 0.72) -> np.ndarray:
    length = max(2, int(seconds * SAMPLE_RATE))
    raw = RNG.normal(0.0, 1.0, length).astype(np.float32)
    # Difference filtering removes the muddy DC/low-frequency part of noise.
    high = np.empty_like(raw)
    high[0] = raw[0]
    high[1:] = raw[1:] - raw[:-1] * brightness
    return high


def kick(start: float, strength: float = 1.0) -> None:
    seconds = 0.34
    length = int(seconds * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    frequency = 42.0 + 118.0 * np.exp(-t * 25.0)
    phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
    body = np.sin(phase) * np.exp(-t * 12.0)
    click = filtered_noise(seconds, 0.35) * np.exp(-t * 65.0)
    add((body * 0.94 + click * 0.08).astype(np.float32), start, 0.78 * strength)


def taiko(start: float, strength: float = 1.0, pan: float = 0.0) -> None:
    seconds = 0.68
    length = int(seconds * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    frequency = 48.0 + 52.0 * np.exp(-t * 13.0)
    phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
    skin = np.sin(phase) + 0.34 * np.sin(phase * 1.91 + 0.4) + 0.14 * np.sin(phase * 3.07)
    noise = filtered_noise(seconds, 0.52) * np.exp(-t * 18.0)
    sound = (skin * np.exp(-t * 5.8) * 0.62 + noise * 0.11).astype(np.float32)
    add(sound, start, 0.66 * strength, pan)


def snare(start: float, strength: float = 1.0) -> None:
    seconds = 0.25
    length = int(seconds * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = filtered_noise(seconds, 0.84) * np.exp(-t * 17.0)
    body = np.sin(2 * np.pi * 184 * t) * np.exp(-t * 23.0)
    add((noise * 0.5 + body * 0.3).astype(np.float32), start, 0.43 * strength, -0.05)


def hat(start: float, strength: float = 1.0, pan: float = 0.0) -> None:
    seconds = 0.075
    length = int(seconds * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = filtered_noise(seconds, 0.96) * np.exp(-t * 54.0)
    add(noise.astype(np.float32), start, 0.10 * strength, pan)


def crash(start: float, strength: float = 1.0) -> None:
    seconds = 1.7
    length = int(seconds * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = filtered_noise(seconds, 0.975)
    shimmer = sum(np.sin(2 * np.pi * f * t + RNG.uniform(0, 6.28)) for f in (1730, 2240, 3010, 4210))
    sound = (noise * 0.48 + shimmer * 0.14) * np.exp(-t * 2.6)
    add(sound.astype(np.float32), start, 0.17 * strength, 0.16)


def bass_note(note: int, start: float, seconds: float, gain: float = 1.0) -> None:
    sound = harmonic_tone(
        midi(note), seconds, [(1, 1.0), (2, 0.38), (3, 0.17)],
        0.006, 0.07, 0.68, min(0.12, seconds * 0.3),
    )
    add(np.tanh(sound * 1.5), start, 0.31 * gain, -0.03, music_bus)


def string_stab(note: int, start: float, gain: float = 1.0, pan: float = 0.0) -> None:
    sound = harmonic_tone(
        midi(note), BEAT * 0.42, [(1, 1.0), (2, 0.52), (3, 0.3), (4, 0.16), (5, 0.1)],
        0.008, 0.055, 0.34, 0.085, 0.025,
    )
    add(sound, start, 0.17 * gain, pan, music_bus)


def brass(note: int, start: float, seconds: float, gain: float = 1.0, pan: float = 0.0) -> None:
    sound = harmonic_tone(
        midi(note), seconds, [(1, 1.0), (2, 0.8), (3, 0.5), (4, 0.24), (5, 0.14)],
        0.035, 0.12, 0.68, min(0.18, seconds * 0.3), 0.018,
    )
    add(np.tanh(sound * 1.2), start, 0.16 * gain, pan, music_bus)


def lead(note: int, start: float, seconds: float, gain: float = 1.0) -> None:
    sound = harmonic_tone(
        midi(note), seconds, [(1, 1.0), (2, 0.34), (3, 0.27), (5, 0.09)],
        0.018, 0.08, 0.72, min(0.15, seconds * 0.3), 0.055,
    )
    add(sound, start, 0.19 * gain, 0.08, music_bus)


def legato_lead(note: int, start: float, beats: float, gain: float = 1.0, pan: float = 0.08) -> None:
    """Long, overlapping violin-like notes used for the continuous main melody."""
    seconds = beats * BEAT + 0.16
    sound = harmonic_tone(
        midi(note), seconds, [(1, 1.0), (2, 0.31), (3, 0.23), (4, 0.08), (5, 0.07)],
        0.055, 0.14, 0.84, min(0.24, seconds * 0.34), 0.085,
    )
    # A quiet octave reinforces the melodic contour without turning it into a synth lead.
    octave = harmonic_tone(
        midi(note + 12), seconds, [(1, 1.0), (2, 0.12), (3, 0.06)],
        0.07, 0.16, 0.72, min(0.22, seconds * 0.32), 0.06,
    )
    add(sound + octave * 0.17, start, 0.205 * gain, pan, music_bus)


def suona_lead(note: int, start: float, beats: float, gain: float = 1.0, pan: float = 0.04) -> None:
    """Synthetic double-reed voice with scoop, breath, and progressive vibrato."""
    seconds = beats * BEAT + 0.13
    length = max(1, int(seconds * SAMPLE_RATE))
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    base = midi(note)
    # A short upward scoop imitates the pressured attack of a suona reed.
    scoop_semitones = -0.72 * np.exp(-t * 17.0)
    vibrato_depth = 0.20 * np.minimum(1.0, t / 0.24)
    vibrato_semitones = vibrato_depth * np.sin(2 * np.pi * 6.15 * t + 0.2)
    frequency = base * np.power(2.0, (scoop_semitones + vibrato_semitones) / 12.0)
    phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
    # Strong upper partials produce the bright, nasal, penetrating double-reed colour.
    partials = [(1, 1.0), (2, 0.88), (3, 0.72), (4, 0.56), (5, 0.44), (6, 0.31), (7, 0.2), (8, 0.12)]
    tone = np.zeros(length, dtype=np.float32)
    for harmonic, amplitude in partials:
        tone += amplitude * np.sin(phase * harmonic + harmonic * 0.035)
    tone /= sum(amplitude for _, amplitude in partials)
    breath = filtered_noise(seconds, 0.8) * 0.026
    envelope = adsr(length, 0.028, 0.09, 0.91, min(0.16, seconds * 0.3))
    reed = np.tanh((tone + breath) * 1.62) * envelope
    add(reed.astype(np.float32), start, 0.245 * gain, pan, music_bus)


def cello_line(note: int, start: float, beats: float, gain: float = 1.0, pan: float = -0.18) -> None:
    seconds = beats * BEAT + 0.2
    sound = harmonic_tone(
        midi(note), seconds, [(1, 1.0), (2, 0.4), (3, 0.2), (4, 0.08)],
        0.07, 0.16, 0.78, min(0.28, seconds * 0.35), 0.055,
    )
    add(sound, start, 0.115 * gain, pan, music_bus)


def choir_chord(notes: tuple[int, ...], start: float, seconds: float, gain: float = 1.0) -> None:
    for index, note in enumerate(notes):
        sound = harmonic_tone(
            midi(note), seconds, [(1, 1.0), (2, 0.14), (3, 0.09)],
            0.32, 0.35, 0.72, 0.55, 0.075,
        )
        add(sound, start, 0.055 * gain, -0.45 + index * 0.3, music_bus)


progression = [
    (38, (50, 53, 57)), (34, (46, 50, 53)), (41, (53, 57, 60)), (36, (48, 52, 55)),
    (31, (43, 46, 50)), (38, (50, 53, 57)), (33, (45, 49, 52)), (33, (45, 49, 52)),
    (38, (50, 53, 57)), (36, (48, 52, 55)), (34, (46, 50, 53)), (33, (45, 49, 52)),
    (31, (43, 46, 50)), (34, (46, 50, 53)), (36, (48, 52, 55)), (33, (45, 49, 52)),
    (38, (50, 53, 57)), (41, (53, 57, 60)), (36, (48, 52, 55)), (31, (43, 46, 50)),
    (34, (46, 50, 53)), (38, (50, 53, 57)), (40, (52, 55, 58)), (33, (45, 49, 52)),
    (31, (43, 46, 50)), (34, (46, 50, 53)), (38, (50, 53, 57)), (36, (48, 52, 55)),
    (34, (46, 50, 53)), (36, (48, 52, 55)), (33, (45, 49, 52)), (38, (50, 53, 57)),
]
ostinatos = [
    [50, 57, 53, 57, 50, 58, 53, 57, 50, 57, 53, 60, 58, 57, 53, 49],
    [50, 53, 57, 53, 58, 53, 57, 53, 60, 58, 57, 53, 52, 53, 57, 49],
    [50, 57, 60, 57, 53, 57, 58, 57, 50, 53, 57, 58, 60, 58, 57, 53],
]
root_offsets = {31: -7, 33: -5, 34: -4, 36: -2, 38: 0, 40: 2, 41: 3}


for bar in range(BARS):
    bar_start = bar * BAR
    root_note, chord = progression[bar]
    if bar < 2:
        energy = 0.78 + bar * 0.08
    elif bar < 12:
        energy = 0.96
    elif bar < 20:
        energy = 1.04
    elif bar < 24:
        energy = 0.84
    elif bar < 28:
        energy = 1.08
    else:
        energy = 1.22

    # Relentless martial rhythm: four floor drums plus syncopated taiko answers.
    for beat in range(4):
        beat_start = bar_start + beat * BEAT
        kick(beat_start, energy * (1.15 if beat == 0 else 0.9))
        taiko(beat_start, energy * (1.16 if beat == 0 else 0.82), -0.28 if beat % 2 == 0 else 0.28)
        if beat in (1, 3):
            snare(beat_start, energy)
        if bar >= 2:
            taiko(beat_start + BEAT * 0.75, energy * 0.52, 0.34 if beat % 2 == 0 else -0.34)
        if bar >= 28:
            kick(beat_start + BEAT * 0.5, energy * (0.52 if beat % 2 == 0 else 0.42))
            if beat in (1, 3):
                taiko(beat_start + BEAT * 0.5, energy * 0.62, -0.42 if beat == 1 else 0.42)
        for eighth in (0.0, 0.5):
            hat(beat_start + BEAT * eighth, energy * (0.75 if eighth else 1.0), (-0.55 if (beat * 2 + int(eighth * 2)) % 2 else 0.55))
    if bar >= 24:
        for sixteenth in range(16):
            if sixteenth % 2:
                hat(bar_start + sixteenth * BEAT / 4, energy * 0.52, -0.65 if sixteenth % 4 == 1 else 0.65)
    if bar in (0, 4, 12, 20, 24, 28, 30):
        crash(bar_start, energy)
    if bar in (27, 31):
        for roll in range(8):
            snare(bar_start + (3 + roll / 8) * BEAT, energy * (0.42 + roll * 0.09))

    # Bass is short and rhythmic so it drives instead of becoming a soft pad.
    bass_pattern = [0.0, 0.75, 1.5, 2.0, 2.75, 3.5]
    for position in bass_pattern:
        note = root_note if position not in (1.5, 3.5) else root_note + 7
        bass_note(note, bar_start + position * BEAT, BEAT * 0.5, energy)

    # The accompaniment changes shape every two bars so it drives without looping mechanically.
    if bar >= 1:
        offsets = root_offsets[root_note]
        pattern = ostinatos[(bar // 2) % len(ostinatos)]
        for step, note in enumerate(pattern):
            if 20 <= bar < 24 and step % 2:
                continue
            event_start = bar_start + step * BEAT / 4
            string_stab(note + offsets, event_start, energy * 0.82, -0.36 if step % 2 == 0 else 0.36)
            if bar >= 28 and step % 2 == 0:
                string_stab(note + offsets + 12, event_start, energy * 0.54, 0.48)

    # Brass punctuation is deliberately sparse; this makes each accent feel huge.
    for beat in (0, 2):
        for index, note in enumerate(chord):
            brass(note, bar_start + beat * BEAT, BEAT * (0.68 if bar < 24 else 0.9), energy, -0.32 + index * 0.32)
            if bar >= 28:
                brass(note + 12, bar_start + beat * BEAT, BEAT * 0.76, energy * 0.58, 0.32 - index * 0.3)
    if bar >= 12 and bar % 2 == 1:
        for index, note in enumerate(chord):
            brass(note + 12, bar_start + 3.25 * BEAT, BEAT * 0.62, energy * 0.7, -0.3 + index * 0.3)

    choir_chord(chord, bar_start, BAR + 0.65, energy * (0.86 if bar < 20 else 1.08))

    # A cello counter-line connects chord changes underneath the main melody.
    cello_line(root_note + 12, bar_start, 2.15, energy)
    cello_line(root_note + (19 if bar % 2 == 0 else 15), bar_start + 2 * BEAT, 2.1, energy * 0.88)


def render_phrase(start_bar: int, events: list[tuple[float, int, float]], gain: float = 1.0, transpose: int = 0) -> None:
    base = start_bar * BAR
    for beat_offset, note, beats in events:
        legato_lead(note + transpose, base + beat_offset * BEAT, beats, gain)


def render_suona_phrase(start_bar: int, events: list[tuple[float, int, float]], gain: float = 1.0) -> None:
    base = start_bar * BAR
    for beat_offset, note, beats in events:
        suona_lead(note, base + beat_offset * BEAT, beats, gain)


# Long-form melodic writing: phrases span 6–8 bars, overlap at cadences, and do not restart each bar.
phrase_a = [
    (0, 62, 1.5), (1.5, 65, .5), (2, 67, 1), (3, 69, 2), (5, 67, .75), (5.75, 65, .75), (6.5, 64, .5), (7, 62, 1.25),
    (8, 65, 1), (9, 69, 1), (10, 70, 1.5), (11.5, 69, .5), (12, 67, 2), (14, 65, 1), (15, 64, 1.2),
    (16, 62, 1), (17, 60, 1), (18, 58, 2), (20, 60, 1), (21, 62, 1), (22, 65, 2.2),
    (24, 64, .75), (24.75, 65, .75), (25.5, 67, .5), (26, 69, 2), (28, 67, 1), (29, 65, 1), (30, 64, .75), (30.75, 61, .25), (31, 62, 1.5),
]
phrase_b = [
    (0, 69, 1), (1, 70, 1), (2, 72, 2.25), (4, 70, .75), (4.75, 69, .75), (5.5, 67, 1.5), (7, 65, 1.25),
    (8, 67, .75), (8.75, 69, .75), (9.5, 70, .5), (10, 74, 2), (12, 72, 1), (13, 70, 1), (14, 69, 2.1),
    (16, 65, 1.5), (17.5, 67, .5), (18, 69, 1), (19, 65, 2), (21, 64, 1), (22, 62, 2.2),
    (24, 62, .75), (24.75, 65, .75), (25.5, 69, .5), (26, 70, 1), (27, 72, 2), (29, 70, 1), (30, 69, 1), (31, 67, 1.4),
]
bridge = [
    (0, 58, 2), (2, 60, 2), (4, 62, 3), (7, 65, 1.2),
    (8, 64, 1), (9, 62, 1), (10, 60, 2), (12, 58, 1), (13, 60, 1), (14, 62, 2.2),
    (16, 65, 1), (17, 67, 1), (18, 69, 1), (19, 70, 1), (20, 72, 2), (22, 73, 1), (23, 74, 1.4),
]
climax = [
    (0, 74, 2), (2, 72, 1), (3, 70, 1), (4, 69, 1.5), (5.5, 70, .5), (6, 72, 2.2),
    (8, 77, 1), (9, 76, 1), (10, 74, 2), (12, 72, 1), (13, 70, 1), (14, 69, 2.1),
    (16, 70, .75), (16.75, 72, .75), (17.5, 74, .5), (18, 77, 2), (20, 76, 1), (21, 74, 1), (22, 72, 2.2),
    (24, 69, 1), (25, 70, 1), (26, 72, 1), (27, 74, 1), (28, 77, 1.5), (29.5, 76, .5), (30, 74, .75), (30.75, 73, .25), (31, 74, 1.7),
]
suona_climax = [
    # Broad calls and sustained fifths replace the previous agile, ornamental line.
    (0, 74, 2), (2, 77, 1), (3, 79, 1), (4, 81, 3), (7, 79, 1.15),
    (8, 82, 2), (10, 81, 2), (12, 79, 1), (13, 77, 1), (14, 76, 2.15),
    (16, 74, 1), (17, 77, 1), (18, 81, 2), (20, 84, 2), (22, 82, 2.15),
    (24, 81, 1), (25, 82, 1), (26, 84, 2), (28, 86, 2.5), (30.5, 85, .5), (31, 86, 1.8),
]
render_phrase(2, phrase_a, 0.94)
render_phrase(10, phrase_b, 1.0)
render_phrase(18, bridge, 0.9)
render_phrase(24, climax, 0.82)
render_suona_phrase(24, suona_climax, 1.04)


# Add short stereo ambience only to pitched instruments, keeping drums punchy.
for delay_seconds, gain in ((0.085, 0.18), (0.17, 0.11), (0.31, 0.065)):
    delay = int(delay_seconds * SAMPLE_RATE)
    master[0, delay:] += music_bus[1, :-delay] * gain
    master[1, delay:] += music_bus[0, :-delay] * gain
master += music_bus

# Mastering: remove DC, soft-limit peaks, then apply clean headroom and fades.
master -= np.mean(master, axis=1, keepdims=True)
master = np.tanh(master * 1.22)
peak = float(np.max(np.abs(master)))
if peak > 0:
    master *= 0.965 / peak
fade_in = int(0.18 * SAMPLE_RATE)
fade_out = int(1.8 * SAMPLE_RATE)
master[:, :fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)
master[:, -fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
pcm = np.clip(master.T * 32767.0, -32768, 32767).astype("<i2")
with wave.open(str(OUTPUT_WAV), "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SAMPLE_RATE)
    output.writeframes(pcm.tobytes())

digest = sha256(OUTPUT_WAV.read_bytes()).hexdigest()
metadata = {
    "title": "铁血沸腾",
    "file": OUTPUT_WAV.name,
    "sampleRate": SAMPLE_RATE,
    "channels": 2,
    "seconds": round(DURATION, 3),
    "bpm": BPM,
    "key": "D minor / Phrygian inflection",
    "direction": "激情、热血、战斗、东方工业史诗",
    "copyright": "Original deterministic synthesis; no recordings, samples, loops, or prior game melodies used.",
    "sha256": digest,
}
OUTPUT_META.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Generated {OUTPUT_WAV} ({DURATION:.1f}s, {BPM} BPM, sha256={digest[:12]})")
