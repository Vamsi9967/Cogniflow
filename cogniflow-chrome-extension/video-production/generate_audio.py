import wave
import struct
import math
import random

SAMPLE_RATE = 44100
DURATION = 35.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

left_channel = [0.0] * TOTAL_SAMPLES
right_channel = [0.0] * TOTAL_SAMPLES

def clamp(val, min_v=-1.0, max_v=1.0):
    return max(min_v, min(max_v, val))

def add_tone(freq, start_sec, dur_sec, amp=0.1, pan=0.0, wave_type='sine', attack=0.05, decay=0.05):
    start_idx = int(start_sec * SAMPLE_RATE)
    num_samples = int(dur_sec * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    
    pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
    pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
    
    for i in range(start_idx, end_idx):
        t = (i - start_idx) / SAMPLE_RATE
        # Envelope
        env = 1.0
        if t < attack:
            env = t / attack
        elif t > (dur_sec - decay):
            env = max(0.0, (dur_sec - t) / decay)
            
        phase = 2.0 * math.pi * freq * t
        if wave_type == 'sine':
            val = math.sin(phase)
        elif wave_type == 'soft_saw':
            val = math.sin(phase) + 0.35 * math.sin(2 * phase) + 0.15 * math.sin(3 * phase)
        elif wave_type == 'bell':
            # Bell with harmonic overtones and detuned chime
            val = (math.sin(phase) * math.exp(-2.5 * t) + 
                   0.6 * math.sin(2.76 * phase) * math.exp(-3.5 * t) + 
                   0.4 * math.sin(5.4 * phase) * math.exp(-4.5 * t) +
                   0.25 * math.sin(8.9 * phase) * math.exp(-6.0 * t))
            env = min(1.0, t / 0.005) # rapid attack
        elif wave_type == 'warm_pad':
            val = math.sin(phase) + 0.4 * math.sin(2 * phase + 0.3) + 0.2 * math.sin(3 * phase + 0.7)
            # Add subtle chorus / vibrato
            vibrato = math.sin(2.0 * math.pi * 4.5 * t) * 0.02
            val += 0.3 * math.sin(phase * (1.003 + vibrato))
        else:
            val = math.sin(phase)
            
        sample = val * env * amp
        left_channel[i] += sample * pan_l
        right_channel[i] += sample * pan_r

def add_noise_whoosh(start_sec, dur_sec, amp=0.08, center_freq=600, pan=0.0):
    start_idx = int(start_sec * SAMPLE_RATE)
    num_samples = int(dur_sec * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    
    pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
    pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
    
    random.seed(int(start_sec * 1000))
    # Simple resonant bandpass noise simulation
    band_w = 2.0 * math.pi * center_freq / SAMPLE_RATE
    y1, y2 = 0.0, 0.0
    r = 0.96
    
    for i in range(start_idx, end_idx):
        t = (i - start_idx) / SAMPLE_RATE
        # Envelope: parabolic bell
        env = math.sin(math.pi * (t / dur_sec)) ** 2
        
        # White noise input
        x = (random.random() * 2.0 - 1.0) * env * amp
        # 2-pole filter
        y0 = x + 2.0 * r * math.cos(band_w) * y1 - (r * r) * y2
        y2, y1 = y1, y0
        
        left_channel[i] += y0 * pan_l
        right_channel[i] += y0 * pan_r

def add_click(start_sec, amp=0.12, pan=0.0):
    start_idx = int(start_sec * SAMPLE_RATE)
    dur = 0.02
    num_samples = int(dur * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    
    pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
    pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
    
    for i in range(start_idx, end_idx):
        t = (i - start_idx) / SAMPLE_RATE
        val = math.sin(2.0 * math.pi * 1800 * t) * math.exp(-350.0 * t)
        val += 0.5 * math.sin(2.0 * math.pi * 800 * t) * math.exp(-200.0 * t)
        left_channel[i] += val * amp * pan_l
        right_channel[i] += val * amp * pan_r

def add_notification_ping(start_sec, pitch=880, amp=0.15, pan=0.2):
    start_idx = int(start_sec * SAMPLE_RATE)
    dur = 0.25
    num_samples = int(dur * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    
    pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
    pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
    
    for i in range(start_idx, end_idx):
        t = (i - start_idx) / SAMPLE_RATE
        val = (math.sin(2.0 * math.pi * pitch * t) * 0.7 +
               math.sin(2.0 * math.pi * (pitch * 1.5) * t) * 0.3) * math.exp(-18.0 * t)
        left_channel[i] += val * amp * pan_l
        right_channel[i] += val * amp * pan_r

print("Synthesizing CogniFlow soundtrack...")

# --- SECTION 1 (00 - 04s): THE OVERLOAD ---
# Low rhythmic bass pulse
for beat in [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]:
    add_tone(73.4, beat, 0.35, amp=0.14, wave_type='sine', attack=0.01, decay=0.2)
    # subtle tick
    add_tone(2400, beat + 0.25, 0.03, amp=0.03, wave_type='sine', attack=0.002, decay=0.02)

# Notification pings
add_notification_ping(0.8, pitch=987.77, amp=0.13, pan=0.4) # Slack
add_notification_ping(1.6, pitch=1174.66, amp=0.14, pan=-0.3) # Jira
add_notification_ping(2.4, pitch=1318.51, amp=0.15, pan=0.5) # Gmail
add_notification_ping(3.1, pitch=1046.50, amp=0.14, pan=-0.4) # Notion

# --- SECTION 2 (04 - 08s): LOST CONTEXT ---
# Slowing pulses, hesitation
for beat in [4.0, 4.6, 5.3, 6.2]:
    add_tone(65.4, beat, 0.5, amp=0.12, wave_type='sine', attack=0.02, decay=0.35)
    add_click(beat, amp=0.04)

# Sub-bass hesitation throb at 6.0s
add_tone(55.0, 6.0, 1.8, amp=0.18, wave_type='sine', attack=0.2, decay=0.8)

# --- SECTION 3 (08 - 12s): THE AI REVEAL ---
# Brief pause (7.8 - 8.2s), then rising ambient synth sweep
for t_offset in range(0, 15):
    t_sec = 8.3 + t_offset * 0.25
    progress = t_offset / 15.0
    f = 220.0 + progress * 220.0 # 220Hz to 440Hz
    add_tone(f, t_sec, 0.6, amp=0.08 * (0.4 + 0.6 * progress), pan=progress * 0.4 - 0.2, wave_type='warm_pad', attack=0.1, decay=0.3)

# Glowing memory shimmer at 9.5s
add_tone(1760.0, 9.5, 2.2, amp=0.09, pan=0.0, wave_type='bell', attack=0.01, decay=1.5)
add_tone(1318.5, 9.7, 2.0, amp=0.07, pan=0.2, wave_type='bell', attack=0.01, decay=1.4)
add_tone(2093.0, 10.0, 1.8, amp=0.06, pan=-0.2, wave_type='bell', attack=0.01, decay=1.2)

# --- SECTION 4 (12 - 18s): MEET COGNIFLOW ---
# Whoosh for extension sliding in
add_noise_whoosh(12.0, 0.8, amp=0.11, center_freq=750, pan=0.4)
add_click(12.8, amp=0.10, pan=0.4) # dock click

# Warm synth chords: Dm7 -> G7 -> Cmaj7 -> Fmaj7
chords = [
    (12.5, 2.5, [293.66, 349.23, 440.0, 523.25]), # Dm7
    (15.0, 3.0, [261.63, 329.63, 392.0, 493.88])  # Cmaj7
]
for start_c, dur_c, freqs in chords:
    for fr in freqs:
        add_tone(fr, start_c, dur_c, amp=0.06, wave_type='warm_pad', attack=0.2, decay=0.4)

# Gentle beat under chords (kick + snare taps)
for beat_idx in range(12):
    b_time = 13.0 + beat_idx * 0.45
    if beat_idx % 2 == 0:
        add_tone(60.0, b_time, 0.18, amp=0.13, wave_type='sine', attack=0.005, decay=0.15)
    else:
        add_noise_whoosh(b_time, 0.08, amp=0.04, center_freq=1800)

# --- SECTION 5 (18 - 25s): HOW IT WORKS ---
# Step 1: 18.0 - 20.3s: Context organized
add_click(18.2, amp=0.09, pan=0.3)
add_tone(880.0, 18.3, 0.8, amp=0.08, wave_type='bell', pan=0.2)
add_tone(1174.66, 18.5, 0.8, amp=0.08, wave_type='bell', pan=0.3)

# Step 2: 20.3 - 22.6s: AI Summary expansion + checkmarks
add_click(20.4, amp=0.08)
add_tone(1046.50, 20.8, 0.4, amp=0.09, wave_type='bell', pan=-0.2) # tick 1
add_tone(1174.66, 21.3, 0.4, amp=0.10, wave_type='bell', pan=0.0)  # tick 2
add_tone(1318.51, 21.8, 0.5, amp=0.11, wave_type='bell', pan=0.2)  # tick 3

# Step 3: 22.6 - 25.0s: Button click & green restoration
add_click(22.8, amp=0.16) # Tactile button click thock
add_tone(120.0, 22.8, 0.08, amp=0.15, wave_type='sine', decay=0.06)
# Flow green confirmation chord (C - E - G - B - D)
add_tone(523.25, 23.0, 2.0, amp=0.10, wave_type='bell', attack=0.01, decay=1.8)
add_tone(659.25, 23.05, 2.0, amp=0.10, wave_type='bell', attack=0.01, decay=1.8)
add_tone(783.99, 23.1, 2.0, amp=0.09, wave_type='bell', attack=0.01, decay=1.8)
add_tone(987.77, 23.15, 2.2, amp=0.08, wave_type='bell', attack=0.01, decay=2.0)
add_tone(1174.66, 23.2, 2.2, amp=0.07, wave_type='bell', attack=0.01, decay=2.0)

# --- SECTION 6 (25 - 30s): BACK IN FLOW ---
# Uplifting sweep & expansive chords
add_noise_whoosh(25.0, 1.2, amp=0.09, center_freq=900)
# Flow progression: Fmaj9 -> G6 -> Am7 -> C/E
flow_chords = [
    (25.2, 2.4, [349.23, 440.0, 523.25, 659.25]), # Fmaj9
    (27.6, 2.4, [392.0, 493.88, 587.33, 659.25])  # G6 / uplifting
]
for start_c, dur_c, freqs in flow_chords:
    for fr in freqs:
        add_tone(fr, start_c, dur_c, amp=0.08, wave_type='warm_pad', attack=0.15, decay=0.4)

# Calm bass anchor
add_tone(87.31, 25.2, 2.4, amp=0.14, wave_type='sine', attack=0.1, decay=0.4)
add_tone(98.00, 27.6, 2.4, amp=0.14, wave_type='sine', attack=0.1, decay=0.4)

# --- SECTION 7 (30 - 35s): BRAND ENDING ---
# Calm resolution pad (Cmaj9)
final_pad = [261.63, 329.63, 392.0, 493.88, 587.33]
for fr in final_pad:
    add_tone(fr, 30.0, 4.5, amp=0.07, wave_type='warm_pad', attack=0.3, decay=1.2)

# Pristine Logo Chime at 31.0s (C6 - E6 - G6 harmonic triad)
add_tone(1046.50, 31.0, 3.2, amp=0.15, wave_type='bell', attack=0.003, decay=3.0)
add_tone(1318.51, 31.08, 3.2, amp=0.13, wave_type='bell', attack=0.003, decay=3.0)
add_tone(1567.98, 31.16, 3.2, amp=0.11, wave_type='bell', attack=0.003, decay=3.0)
add_tone(2093.00, 31.25, 3.0, amp=0.07, wave_type='bell', attack=0.003, decay=2.8)

# Natural master fade-out after 34.0s
for i in range(int(34.0 * SAMPLE_RATE), TOTAL_SAMPLES):
    t_fade = (i - int(34.0 * SAMPLE_RATE)) / (1.0 * SAMPLE_RATE)
    fade_mult = max(0.0, 1.0 - t_fade)
    left_channel[i] *= fade_mult
    right_channel[i] *= fade_mult

print("Mastering audio to 16-bit PCM WAV...")
out_path = r"c:\Users\User\Documents\Codex\2026-10-22\referenced-chatgpt-conversation-this-is-an-2\outputs\cogniflow-chrome-extension\video-production\assets\soundtrack.wav"

with wave.open(out_path, 'wb') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    
    # Simple limiter to avoid clipping
    max_peak = max(max(abs(s) for s in left_channel), max(abs(s) for s in right_channel))
    print(f"Peak level: {max_peak:.3f}")
    gain = 0.88 / max_peak if max_peak > 0.88 else 0.95
    
    frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l_val = int(clamp(left_channel[i] * gain) * 32767.0)
        r_val = int(clamp(right_channel[i] * gain) * 32767.0)
        frames.extend(struct.pack('<hh', l_val, r_val))
        
    wav_file.writeframes(frames)

print(f"Successfully created CogniFlow master soundtrack: {out_path} ({len(frames)} bytes)")
